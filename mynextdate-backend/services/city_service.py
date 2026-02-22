"""City-specific activity search service with separate Actian collection and in-memory cache."""
import json
import numpy as np
from cortex import CortexClient, DistanceMetric
from config import ACTIAN_HOST, VECTOR_DIMENSION

CITY_COLLECTION = "city_date_spots"

# Separate in-memory caches for city activities
_city_cache: dict[int, dict] = {}
_city_vector_cache: dict[int, list[float]] = {}


def _get_client() -> CortexClient:
    """Reuse the shared Actian client."""
    from services.actian_service import get_client
    return get_client()


def init_city_collection():
    """Create city_date_spots Actian collection if it doesn't exist."""
    client = _get_client()
    client.get_or_create_collection(
        name=CITY_COLLECTION,
        dimension=VECTOR_DIMENSION,
        distance_metric=DistanceMetric.COSINE,
        hnsw_m=16,
        hnsw_ef_construct=200,
        hnsw_ef_search=100,
    )


def load_city_cache(path: str):
    """Load city activities from JSON into in-memory cache only (no Actian upsert)."""
    global _city_cache, _city_vector_cache
    with open(path) as f:
        activities = json.load(f)
    for a in activities:
        _city_cache[a["id"]] = {k: v for k, v in a.items() if k != "vector"}
        _city_vector_cache[a["id"]] = a["vector"]
    print(f"Loaded {len(activities)} city activities into cache.")


def seed_city_activities(path: str):
    """Load city activities from JSON, seed into in-memory cache AND Actian."""
    global _city_cache, _city_vector_cache
    with open(path) as f:
        activities = json.load(f)

    client = _get_client()
    ids = [a["id"] for a in activities]
    vectors = [a["vector"] for a in activities]
    payloads = []

    for a in activities:
        _city_cache[a["id"]] = {k: v for k, v in a.items() if k != "vector"}
        _city_vector_cache[a["id"]] = a["vector"]
        payloads.append({
            "city": a["city"],
            "state": a.get("state", ""),
            "name": a["name"],
            "venue": a.get("venue", ""),
            "description": a.get("description", ""),
            "price_tier": a.get("price_tier", 1),
            "indoor": a.get("indoor", False),
            "vibe": a.get("vibe", []),
        })

    client.batch_upsert(CITY_COLLECTION, ids, vectors, payloads)
    print(f"Seeded {len(activities)} city activities into Actian.")


def get_cities_summary() -> list[dict]:
    """Return distinct cities with their activity counts."""
    from collections import Counter
    city_counts: Counter = Counter()
    city_state: dict[str, str] = {}
    for data in _city_cache.values():
        city = data.get("city", "")
        state = data.get("state", "")
        if city:
            city_counts[city] += 1
            city_state[city] = state
    return [
        {"city": city, "state": city_state.get(city, ""), "count": count}
        for city, count in sorted(city_counts.items())
    ]


def search_city(
    city: str,
    query_vector: list[float] | None,
    top_k: int = 20,
    price_tier: int | None = None,
    indoor: bool | None = None,
    vibes: list[str] | None = None,
) -> list[dict]:
    """Filter city activities and optionally rank by vector similarity."""
    # Filter candidates by city
    candidates = [
        (aid, data)
        for aid, data in _city_cache.items()
        if data.get("city", "").lower() == city.lower()
    ]

    # Apply filters
    if price_tier is not None:
        candidates = [(aid, d) for aid, d in candidates if d.get("price_tier") == price_tier]
    if indoor is not None:
        candidates = [(aid, d) for aid, d in candidates if d.get("indoor") == indoor]
    if vibes:
        vibe_set = {v.lower() for v in vibes}
        candidates = [
            (aid, d) for aid, d in candidates
            if any(v.lower() in vibe_set for v in d.get("vibe", []))
        ]

    if not candidates:
        return []

    # If no query vector, return candidates directly (no ranking)
    if not query_vector:
        results = []
        for aid, data in candidates[:top_k]:
            results.append(_build_result(aid, data, score=None))
        return results

    # Vector similarity ranking
    query = np.array(query_vector)
    query_norm = np.linalg.norm(query)
    if query_norm == 0:
        query_norm = 1.0

    scored = []
    for aid, data in candidates:
        vec = _city_vector_cache.get(aid)
        if not vec:
            continue
        v = np.array(vec)
        v_norm = np.linalg.norm(v)
        if v_norm == 0:
            continue
        similarity = float(np.dot(query, v) / (query_norm * v_norm))
        scored.append((aid, data, similarity))

    scored.sort(key=lambda x: x[2], reverse=True)

    return [_build_result(aid, data, round(min(score, 1.0), 4)) for aid, data, score in scored[:top_k]]


def _build_result(aid: int, data: dict, score: float | None) -> dict:
    return {
        "id": aid,
        "city": data.get("city", ""),
        "state": data.get("state", ""),
        "name": data.get("name", ""),
        "venue": data.get("venue", ""),
        "address": data.get("address", ""),
        "description": data.get("description", ""),
        "price_tier": data.get("price_tier", 1),
        "indoor": data.get("indoor", False),
        "vibe": data.get("vibe", []),
        "score": score,
    }
