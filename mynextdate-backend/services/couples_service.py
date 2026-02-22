"""
Real-user social discovery service.

Finds other users with similar taste profiles based on their actual date history,
then surfaces activities those users love that the current user hasn't tried.
"""
import numpy as np
from collections import Counter


def load_couples(path: str):
    """Legacy stub — no longer loads from JSON. Real data comes from Supabase."""
    print("Social discovery uses live Supabase data (no synthetic couples).")


def _compute_user_vector(dates: list[dict], activity_vectors: dict) -> list[float] | None:
    """Compute a weighted preference vector from a user's rated dates."""
    from services.preference_engine import compute_preference_vector

    rated = []
    for d in dates:
        rating = d.get("rating")
        if not rating or d["activity_id"] not in activity_vectors:
            continue
        rated.append({"activity_id": d["activity_id"], "rating": rating})

    if len(rated) < 2:
        return None

    return compute_preference_vector(rated, activity_vectors)


def find_similar_users(user_id: str, user_vector: list[float], sb, top_k: int = 5) -> list[dict]:
    """
    Find top-k real users with the most similar taste to the current user.
    Computes preference vectors for all other users from their date history.
    """
    from services.actian_service import get_activity_vectors, ensure_cache
    ensure_cache()

    # Get all other users who have date history
    all_dates_result = sb.table("date_history").select(
        "user_id, activity_id, rating, activity_name"
    ).neq("user_id", user_id).execute()
    all_dates = all_dates_result.data or []

    if not all_dates:
        return []

    # Group dates by user
    user_dates: dict[str, list[dict]] = {}
    for d in all_dates:
        uid = d["user_id"]
        if uid not in user_dates:
            user_dates[uid] = []
        user_dates[uid].append(d)

    # Collect all activity IDs to fetch vectors
    all_activity_ids = list({d["activity_id"] for d in all_dates if d["activity_id"] != 0})
    activity_vectors = get_activity_vectors(all_activity_ids)

    # Compute preference vector for each user
    q = np.array(user_vector, dtype=np.float32)
    q_norm = np.linalg.norm(q)
    if q_norm == 0:
        return []
    q_unit = q / q_norm

    candidates = []
    for uid, dates in user_dates.items():
        vec = _compute_user_vector(dates, activity_vectors)
        if vec is None:
            continue

        v = np.array(vec, dtype=np.float32)
        v_norm = np.linalg.norm(v)
        if v_norm == 0:
            continue

        sim = float(np.dot(q_unit, v / v_norm))
        candidates.append({
            "user_id": uid,
            "match_score": round(sim, 4),
            "total_dates": len(dates),
            "dates": dates,
        })

    candidates.sort(key=lambda x: x["match_score"], reverse=True)

    # Enrich with display name and city
    top_users = candidates[:top_k]
    if not top_users:
        return top_users

    top_user_ids = [u["user_id"] for u in top_users]

    # Get display names from auth metadata
    try:
        auth_users = sb.auth.admin.list_users()
        name_map = {}
        for au in auth_users:
            meta = au.user_metadata or {}
            name_map[au.id] = meta.get("display_name", au.email.split("@")[0] if au.email else "Anonymous")
    except Exception:
        name_map = {}

    # Get cities
    try:
        loc_result = sb.table("user_locations").select(
            "user_id, city"
        ).in_("user_id", top_user_ids).execute()
        city_map = {r["user_id"]: r["city"] for r in (loc_result.data or [])}
    except Exception:
        city_map = {}

    for u in top_users:
        u["id"] = u["user_id"]
        u["persona"] = name_map.get(u["user_id"], "A Couple")
        u["city"] = city_map.get(u["user_id"], "")

    return top_users


# Keep the old function name so social.py doesn't break
find_similar_couples = None  # Replaced by find_similar_users


def get_trending_for_similar(
    similar_users: list[dict],
    exclude_ids: set[int],
    top_k: int = 5,
) -> list[dict]:
    """Aggregate activity popularity across similar users' actual date history."""
    from services.actian_service import _payload_cache, ensure_cache
    ensure_cache()

    counts: Counter = Counter()
    for user in similar_users:
        for d in user.get("dates", []):
            act_id = d["activity_id"]
            if act_id != 0 and act_id not in exclude_ids and act_id in _payload_cache:
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
