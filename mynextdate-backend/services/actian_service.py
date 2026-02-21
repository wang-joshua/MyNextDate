import json
import os
import numpy as np
from cortex import CortexClient, DistanceMetric
from cortex.transport.pool import PoolConfig
from config import ACTIAN_HOST, COLLECTION_NAME, VECTOR_DIMENSION, VECTOR_LABELS

_LABEL_DISPLAY = {
    "cost": "Budget",
    "indoor_outdoor": "Setting",
    "energy": "Energy",
    "social_density": "Social",
    "time_of_day": "Time of Day",
    "duration": "Duration",
    "surprise": "Novelty",
    "romance_intensity": "Romance",
    "conversation_depth": "Conversation",
}

# Reduce keepalive ping frequency to avoid ENHANCE_YOUR_CALM from server
PoolConfig.keepalive_time_ms = 300000  # 5 minutes

# Persistent client — reused across all requests
_client: CortexClient | None = None

# In-memory cache: activity_id -> vector (loaded once at startup)
_vector_cache: dict[int, list[float]] = {}
_payload_cache: dict[int, dict] = {}


def get_client() -> CortexClient:
    """Get or create a persistent Actian connection."""
    global _client
    if _client is None:
        c = CortexClient(ACTIAN_HOST)
        c.connect()
        _client = c  # only cache after a successful connect
    return _client


def _warm_cache():
    """Load all activity vectors into memory. Called once."""
    global _vector_cache, _payload_cache
    if _vector_cache:
        return
    client = get_client()
    init_collection(client)
    records, _ = client.scroll(COLLECTION_NAME, limit=400, with_vectors=True)
    if not records:
        activities_path = os.path.join(os.path.dirname(__file__), "..", "data", "activities.json")
        if os.path.exists(activities_path):
            print("Collection empty — auto-seeding from activities.json...")
            seed_activities(client, activities_path)
            records, _ = client.scroll(COLLECTION_NAME, limit=400, with_vectors=True)
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


def search_similar(query_vector: list[float], top_k: int = 2, exclude_ids: list[int] | None = None) -> list[dict]:
    """Search for activities most similar to the query vector."""
    client = get_client()
    exclude_set = set(exclude_ids) if exclude_ids else set()
    # Fetch enough candidates to cover exclusions, capped at total collection size
    fetch_k = min(top_k + len(exclude_set), 300)
    results = client.search(
        COLLECTION_NAME,
        query=query_vector,
        top_k=fetch_k,
        with_payload=True,
    )

    output = []
    for r in results:
        if r.id in exclude_set:
            continue

        # Compute top 3 dimensions where this activity best matches the query
        act_vec = _vector_cache.get(r.id)
        match_reasons = []
        if act_vec and query_vector:
            dim_scores = [
                (1.0 - abs(query_vector[i] - act_vec[i]), VECTOR_LABELS[i])
                for i in range(len(VECTOR_LABELS))
            ]
            dim_scores.sort(reverse=True)
            match_reasons = [_LABEL_DISPLAY.get(lbl, lbl) for _, lbl in dim_scores[:3]]

        output.append({
            "id": r.id,
            "name": r.payload.get("name", ""),
            "description": r.payload.get("description", ""),
            "score": round(r.score, 4),
            "match_reasons": match_reasons,
        })
        if len(output) >= top_k:
            break

    return output


def search_worst(preference_vector: list[float], top_k: int = 2, exclude_ids: list[int] | None = None) -> list[dict]:
    """Find the worst matching activities (breakup button). Invert the preference vector."""
    inverse = [round(1.0 - v, 4) for v in preference_vector]
    return search_similar(inverse, top_k, exclude_ids=exclude_ids)


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
