"""Social discovery — find couples with similar taste profiles."""
from fastapi import APIRouter, Depends
from middleware.auth import get_current_user
from services.actian_service import get_activity_vectors, get_custom_date_vectors, ensure_cache
from services.preference_engine import compute_preference_vector
from services.couples_service import find_similar_couples, get_trending_for_similar
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

router = APIRouter(prefix="/api/social", tags=["social"])

_sb = None


def get_supabase():
    global _sb
    if _sb is None:
        _sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _sb


@router.get("/similar")
async def get_similar_couples(user: dict = Depends(get_current_user)):
    """
    Compute the user's 9D preference vector from their history,
    find the top-5 synthetic couples with closest vectors (cosine),
    and return what those couples love that the user hasn't tried.
    """
    sb = get_supabase()
    result = (
        sb.table("date_history")
        .select("*")
        .eq("user_id", user["id"])
        .order("created_at", desc=True)
        .execute()
    )
    dates = result.data or []

    if len(dates) < 2:
        return {
            "similar_couples": [],
            "they_love": [],
            "needs_more_dates": True,
            "message": "Add at least 2 dates to unlock social discovery",
        }

    ensure_cache()

    activity_ids = [d["activity_id"] for d in dates]
    activity_vectors = get_activity_vectors(activity_ids)

    # Merge custom date vectors
    custom_date_ids = [d["id"] for d in dates if d["activity_id"] == 0]
    custom_vectors = get_custom_date_vectors(custom_date_ids)

    # Use ALL dates (rated or not). Unrated dates default to 3.0 (neutral weight).
    rated_dates = []
    for d in dates:
        rating = d.get("rating") or 3.0
        if d["activity_id"] == 0 and d["id"] in custom_vectors:
            activity_vectors[d["id"]] = custom_vectors[d["id"]]
            rated_dates.append({"activity_id": d["id"], "rating": rating})
        elif d["activity_id"] != 0:
            rated_dates.append({"activity_id": d["activity_id"], "rating": rating})

    user_vector = compute_preference_vector(rated_dates, activity_vectors)

    similar = find_similar_couples(user_vector, top_k=5)

    # Suggest activities the user hasn't tried yet
    done_ids = {d["activity_id"] for d in dates if d["activity_id"] != 0}
    they_love = get_trending_for_similar(
        [c["id"] for c in similar],
        exclude_ids=done_ids,
        top_k=5,
    )

    return {
        "similar_couples": similar,
        "they_love": they_love,
        "needs_more_dates": False,
    }
