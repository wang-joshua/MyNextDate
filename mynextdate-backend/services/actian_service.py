import json
import numpy as np
from cortex import CortexClient, DistanceMetric
from cortex.transport.pool import PoolConfig
from config import ACTIAN_HOST, COLLECTION_NAME, VECTOR_DIMENSION

# Reduce keepalive ping frequency to avoid ENHANCE_YOUR_CALM from server
PoolConfig.keepalive_time_ms = 300000  # 5 minutes

# Persistent client — reused across all requests
_client: CortexClient | None = None

# In-memory cache: activity_id -> vector (loaded once at startup)
_vector_cache: dict[int, list[float]] = {}
_payload_cache: dict[int, dict] = {}

# Custom date vectors: date_history record UUID -> vector (user-specific, not in global pool)
_custom_date_vectors: dict[str, list[float]] = {}


def get_client() -> CortexClient:
    """Get or create a persistent Actian connection. Reconnects if dead."""
    global _client
    if _client is None:
        _client = CortexClient(ACTIAN_HOST)
        _client.connect()
    return _client


def _reconnect():
    """Force a fresh connection (called after gRPC errors)."""
    global _client
    try:
        if _client:
            _client.close()
    except Exception:
        pass
    _client = None
    return get_client()


def _warm_cache():
    """Load all 200 activity vectors into memory. Called once."""
    global _vector_cache, _payload_cache
    if _vector_cache:
        return
    client = get_client()
    records, _ = client.scroll(COLLECTION_NAME, limit=250, with_vectors=True)
    for record in records:
        rid = record.id
        vec = record.vector
        payload = record.payload or {}
        if vec is not None:
            _vector_cache[rid] = [float(v) for v in vec]
        _payload_cache[rid] = dict(payload)
    print(f"Cached {len(_vector_cache)} activity vectors in memory.")


def ensure_cache():
    """Public function to warm the cache if needed."""
    _warm_cache()


def init_collection(client: CortexClient):
    """Create the activities collection if it doesn't exist."""
    client.get_or_create_collection(
        name=COLLECTION_NAME,
        dimension=VECTOR_DIMENSION,
        distance_metric=DistanceMetric.COSINE,
        hnsw_m=16,
        hnsw_ef_construct=200,
        hnsw_ef_search=100,
    )


def seed_activities(client: CortexClient, activities_path: str):
    """Load activities from JSON and insert into Actian."""
    with open(activities_path) as f:
        activities = json.load(f)

    ids = [a["id"] for a in activities]
    vectors = [a["vector"] for a in activities]
    payloads = [
        {"name": a["name"], "description": a.get("description", "")}
        for a in activities
    ]

    client.batch_upsert(COLLECTION_NAME, ids, vectors, payloads)
    print(f"Seeded {len(activities)} activities into Actian.")


def _keyword_boost(text_query: str, name: str, description: str) -> float:
    """Compute a keyword overlap boost between user query and activity name/description."""
    if not text_query:
        return 0.0
    # Extract meaningful words (3+ chars) from query
    query_words = {w.lower() for w in text_query.split() if len(w) >= 3}
    if not query_words:
        return 0.0
    target = (name + " " + description).lower()
    hits = sum(1 for w in query_words if w in target)
    # Boost: 0.05 per keyword match, max 0.15
    return min(hits * 0.05, 0.15)


def search_similar(query_vector: list[float], top_k: int = 2, exclude_ids: list[int] | None = None, text_query: str | None = None) -> list[dict]:
    """Search using in-memory cache with cosine similarity + optional keyword boost."""
    _warm_cache()
    exclude_set = set(exclude_ids) if exclude_ids else set()
    query = np.array(query_vector)
    query_norm = np.linalg.norm(query)
    if query_norm == 0:
        query_norm = 1.0

    scored = []
    for aid, vec in _vector_cache.items():
        if aid in exclude_set:
            continue
        v = np.array(vec)
        v_norm = np.linalg.norm(v)
        if v_norm == 0:
            continue
        similarity = float(np.dot(query, v) / (query_norm * v_norm))
        # Boost score if user's text has keyword overlap with activity name/description
        if text_query:
            payload = _payload_cache.get(aid, {})
            boost = _keyword_boost(text_query, payload.get("name", ""), payload.get("description", ""))
            similarity += boost
        scored.append((aid, similarity))

    scored.sort(key=lambda x: x[1], reverse=True)

    output = []
    for aid, score in scored[:top_k]:
        payload = _payload_cache.get(aid, {})
        output.append({
            "id": aid,
            "name": payload.get("name", ""),
            "description": payload.get("description", ""),
            "score": round(min(score, 1.0), 4),
        })
    return output


def search_worst(preference_vector: list[float], top_k: int = 2) -> list[dict]:
    """Find the worst matching activities (breakup button). Invert the preference vector."""
    inverse = [round(1.0 - v, 4) for v in preference_vector]
    return search_similar(inverse, top_k)


def get_activity_vectors(activity_ids: list[int]) -> dict[int, list[float]]:
    """Get activity vectors from in-memory cache (instant)."""
    _warm_cache()
    return {aid: _vector_cache[aid] for aid in activity_ids if aid in _vector_cache}


def get_all_activities() -> list[dict]:
    """Get all activities from cache."""
    _warm_cache()
    return [
        {"id": rid, "name": _payload_cache[rid].get("name", ""), "description": _payload_cache[rid].get("description", "")}
        for rid in _payload_cache
    ]


def seed_single_activity(name: str, description: str, vector: list[float]) -> int:
    """Append a new activity to activities.json, update caches, and upsert to Actian."""
    import os
    _warm_cache()

    activities_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "data", "activities.json"
    )

    with open(activities_path) as f:
        activities = json.load(f)

    new_id = max(a["id"] for a in activities) + 1 if activities else 200

    new_entry = {"id": new_id, "name": name, "description": description, "vector": vector}
    activities.append(new_entry)

    with open(activities_path, "w") as f:
        json.dump(activities, f, indent=2)

    # Update in-memory caches immediately
    _vector_cache[new_id] = vector
    _payload_cache[new_id] = {"name": name, "description": description}

    # Upsert to Actian
    try:
        client = get_client()
        client.batch_upsert(
            COLLECTION_NAME,
            [new_id],
            [vector],
            [{"name": name, "description": description}]
        )
    except Exception as e:
        print(f"Warning: Actian upsert for new activity failed: {e}")

    print(f"Seeded new activity id={new_id}: {name}")
    return new_id


def store_custom_date_vector(date_record_id: str, vector: list[float]):
    """Store a Groq-generated vector for a custom date (activity_id=0)."""
    _custom_date_vectors[date_record_id] = vector


def get_custom_date_vectors(date_record_ids: list[str]) -> dict[str, list[float]]:
    """Get stored vectors for custom dates by their Supabase record IDs."""
    return {rid: _custom_date_vectors[rid] for rid in date_record_ids if rid in _custom_date_vectors}
