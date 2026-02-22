"""
Synthetic couples social discovery service.

Uses pure in-memory numpy — NO Actian.
Rationale: 80 couples × 9D is ~0.05ms for a full batch cosine search.
Adding Actian gRPC overhead would be 100× slower for no benefit.
Actian is the right call at 10,000+ vectors or 128D+.
"""
import json
import numpy as np
from collections import Counter

_couples: list[dict] = []
_couple_matrix: np.ndarray | None = None   # shape (N, 9), pre-normalised


def load_couples(path: str):
    """Load synthetic couples JSON into memory and pre-normalise the vector matrix."""
    global _couples, _couple_matrix
    with open(path) as f:
        _couples = json.load(f)

    raw = np.array([c["vector"] for c in _couples], dtype=np.float32)
    norms = np.linalg.norm(raw, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    _couple_matrix = raw / norms   # unit vectors → cosine sim = dot product
    print(f"Loaded {len(_couples)} synthetic couples into memory.")


def find_similar_couples(user_vector: list[float], top_k: int = 5) -> list[dict]:
    """Return top-k similar couples ranked by cosine similarity. O(N) dot product."""
    if _couple_matrix is None or len(_couples) == 0:
        return []

    q = np.array(user_vector, dtype=np.float32)
    q_norm = np.linalg.norm(q)
    if q_norm == 0:
        return []

    q_unit = q / q_norm
    # Single matrix-vector multiply gives all cosine similarities at once
    sims = _couple_matrix @ q_unit                    # shape (N,)
    top_idx = np.argsort(sims)[::-1][:top_k]

    return [
        {
            "id": _couples[i]["id"],
            "persona": _couples[i]["persona"],
            "city": _couples[i]["city"],
            "bio": _couples[i]["bio"],
            "total_dates": _couples[i]["total_dates"],
            "match_score": round(float(sims[i]), 4),
        }
        for i in top_idx
    ]


def get_trending_for_similar(
    similar_couple_ids: list[str],
    exclude_ids: set[int],
    top_k: int = 5,
) -> list[dict]:
    """Aggregate activity popularity across a set of similar couples."""
    from services.actian_service import _payload_cache, ensure_cache
    ensure_cache()

    counts: Counter = Counter()
    for cid in similar_couple_ids:
        couple = next((c for c in _couples if c["id"] == cid), None)
        if couple:
            for act_id in couple.get("top_activities", []):
                if act_id not in exclude_ids and act_id in _payload_cache:
                    counts[act_id] += 1

    total = sum(counts.values()) or 1
    results = []
    for act_id, count in counts.most_common(top_k):
        if act_id not in _payload_cache:
            continue
        results.append({
            "activity_id": act_id,
            "activity_name": _payload_cache[act_id].get("name", ""),
            "count": count,
            "percentage": round(count / total * 100),
        })
    return results
