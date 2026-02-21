from fastapi import APIRouter, Depends, Query
from middleware.auth import get_current_user
from services.actian_service import search_similar, search_worst, get_activity_vectors
from services.preference_engine import compute_preference_vector, apply_repeat_penalty
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

router = APIRouter(prefix="/api", tags=["recommend"])

_sb = None


def get_supabase():
    global _sb
    if _sb is None:
        _sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _sb


@router.get("/recommend")
async def get_recommendations(
    user: dict = Depends(get_current_user),
    skip: str = Query(default=""),
):
    """Compute preference vector and find top 2 matching activities."""
    sb = get_supabase()

    skip_ids = [int(x) for x in skip.split(",") if x.strip().isdigit()]

    result = sb.table("date_history").select("*").eq(
        "user_id", user["id"]
    ).order("created_at", desc=True).limit(50).execute()

    dates = result.data or []
    activity_ids = [d["activity_id"] for d in dates]
    activity_vectors = get_activity_vectors(activity_ids)

    rated_dates = [
        {"activity_id": d["activity_id"], "rating": d["rating"]}
        for d in dates
        if d["rating"] is not None
    ]

    pref_vector = compute_preference_vector(rated_dates, activity_vectors)
    pref_vector = apply_repeat_penalty(pref_vector, activity_ids, activity_vectors)

    # Exclude only recent history (last 20) so old favourites can resurface,
    # but always honour the client's explicit skip list in full.
    recent_ids = activity_ids[:20]
    exclude = list(set(recent_ids + skip_ids))
    recommendations = search_similar(pref_vector, top_k=2, exclude_ids=exclude)

    return {
        "recommendations": recommendations,
        "preference_vector": pref_vector,
    }


@router.get("/recommend/worst")
async def get_worst_recommendations(user: dict = Depends(get_current_user)):
    """Secret breakup button: find the worst possible dates."""
    sb = get_supabase()

    result = sb.table("date_history").select("*").eq(
        "user_id", user["id"]
    ).order("created_at", desc=True).limit(50).execute()

    dates = result.data or []
    activity_ids = [d["activity_id"] for d in dates]
    activity_vectors = get_activity_vectors(activity_ids)

    rated_dates = [
        {"activity_id": d["activity_id"], "rating": d["rating"]}
        for d in dates
        if d["rating"] is not None
    ]

    pref_vector = compute_preference_vector(rated_dates, activity_vectors)
    recent_ids = activity_ids[:20]
    worst = search_worst(pref_vector, top_k=2, exclude_ids=recent_ids)

    return {
        "recommendations": worst,
        "mode": "breakup",
    }
