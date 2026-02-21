from fastapi import APIRouter, Depends
from middleware.auth import get_current_user
from services.actian_service import get_activity_vectors
from services.analytics_service import compute_analytics
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

router = APIRouter(prefix="/api", tags=["analytics"])

_sb = None


def get_supabase():
    global _sb
    if _sb is None:
        _sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _sb


@router.get("/analytics")
async def get_analytics(user: dict = Depends(get_current_user)):
    """Get user dating analytics."""
    sb = get_supabase()

    result = sb.table("date_history").select("*").eq(
        "user_id", user["id"]
    ).order("created_at", desc=True).execute()

    dates = result.data or []
    activity_ids = list(set(d["activity_id"] for d in dates))
    activity_vectors = get_activity_vectors(activity_ids)

    dates_with_names = [
        {
            "activity_id": d["activity_id"],
            "rating": d["rating"] or 0,
            "created_at": d.get("created_at", ""),
            "activity_name": d.get("activity_name", ""),
        }
        for d in dates
    ]

    analytics = compute_analytics(dates_with_names, activity_vectors)
    return analytics
