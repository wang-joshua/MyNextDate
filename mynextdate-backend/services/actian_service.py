import json
import os
import numpy as np
from cortex import CortexClient, DistanceMetric
from config import ACTIAN_HOST, COLLECTION_NAME, VECTOR_DIMENSION

# Persistent client — reused across all requests
_client: CortexClient | None = None

# In-memory cache: activity_id -> vector (loaded once at startup)
_vector_cache: dict[int, list[float]] = {}
_payload_cache: dict[int, dict] = {}


def get_client() -> CortexClient:
    """Get or create a persistent Actian connection."""
    global _client
    if _client is None:
        _client = CortexClient(ACTIAN_HOST)
        _client.connect()
    return _client


def _warm_cache():
    """Load all 200 activity vectors into memory. Called once. Auto-seeds if empty."""
    global _vector_cache, _payload_cache
    if _vector_cache:
        return
    client = get_client()
    init_collection(client)
    records, _ = client.scroll(COLLECTION_NAME, limit=250)
    if not records:
        activities_path = os.path.join(os.path.dirname(__file__), "..", "data", "activities.json")
        if os.path.exists(activities_path):
            print("Collection empty — auto-seeding from activities.json...")
            seed_activities(client, activities_path)
            records, _ = client.scroll(COLLECTION_NAME, limit=250)
    for record in records:
        rid = record.id if hasattr(record, "id") else None
        if rid is None:
            continue
        vec = record.vector if hasattr(record, "vector") else None
        payload = record.payload if hasattr(record, "payload") else {}
        if vec is not None:
            _vector_cache[rid] = list(vec)
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
    results = client.search(
        COLLECTION_NAME,
        query=query_vector,
        top_k=top_k + (len(exclude_ids) if exclude_ids else 0),
        with_payload=True,
    )

    output = []
    for r in results:
        if exclude_ids and r.id in exclude_ids:
            continue
        output.append({
            "id": r.id,
            "name": r.payload.get("name", ""),
            "description": r.payload.get("description", ""),
            "score": round(r.score, 4),
        })
        if len(output) >= top_k:
            break

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
