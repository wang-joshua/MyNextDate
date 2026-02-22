from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from middleware.auth import get_current_user
from services.actian_service import search_similar, search_worst, search_custom_activities, get_activity_vectors, get_custom_date_vectors
from services.preference_engine import compute_preference_vector, apply_repeat_penalty
from services.location_service import reverse_geocode_and_save, get_user_city, get_local_trends
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

router = APIRouter(prefix="/api", tags=["recommend"])

_sb = None


def get_supabase():
    global _sb
    if _sb is None:
        _sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _sb


class LocationRequest(BaseModel):
    lat: float
    lng: float


@router.post("/location")
async def save_location(body: LocationRequest, user: dict = Depends(get_current_user)):
    """Save user's location from browser geolocation (lat/lng → city via reverse geocoding)."""
    sb = get_supabase()
    city = await reverse_geocode_and_save(user["id"], body.lat, body.lng, sb)
    return {"city": city}


@router.get("/recommend")
async def get_recommendations(
    user: dict = Depends(get_current_user),
    skip: str = Query(default=""),
):
    """Compute preference vector and find top 3 matching activities."""
    sb = get_supabase()

    skip_ids = [int(x) for x in skip.split(",") if x.strip().isdigit()]

    result = sb.table("date_history").select("*").eq(
        "user_id", user["id"]
    ).order("created_at", desc=True).execute()

    dates = result.data or []
    activity_ids = [d["activity_id"] for d in dates]
    activity_vectors = get_activity_vectors(activity_ids)

    # Include custom date vectors (activity_id=0) in preference computation
    custom_date_ids = [d["id"] for d in dates if d["activity_id"] == 0]
    custom_vectors = get_custom_date_vectors(custom_date_ids)

    rated_dates = []
    for d in dates:
        if d["rating"] is None:
            continue
        if d["activity_id"] == 0 and d["id"] in custom_vectors:
            # Use date record ID as key for custom dates
            activity_vectors[d["id"]] = custom_vectors[d["id"]]
            rated_dates.append({"activity_id": d["id"], "rating": d["rating"]})
        else:
            rated_dates.append({"activity_id": d["activity_id"], "rating": d["rating"]})

    pref_vector = compute_preference_vector(rated_dates, activity_vectors)
    pref_vector = apply_repeat_penalty(pref_vector, activity_ids, activity_vectors)

    exclude = list(set(activity_ids + skip_ids))
    json_recs = search_similar(pref_vector, top_k=3, exclude_ids=exclude)
    custom_recs = search_custom_activities(pref_vector, sb, top_k=3)

    # Merge, deduplicate by name, sort by score, take top 3
    seen_names = set()
    recommendations = []
    for r in sorted(json_recs + custom_recs, key=lambda x: x["score"], reverse=True):
        name_lower = r["name"].strip().lower()
        if name_lower not in seen_names:
            seen_names.add(name_lower)
            recommendations.append(r)
        if len(recommendations) == 3:
            break

    return {
        "recommendations": recommendations,
        "preference_vector": pref_vector,
    }


@router.get("/recommend/local")
async def get_local_recommendations(
    user: dict = Depends(get_current_user),
):
    """Get popular dating activities among other users in the same city."""
    sb = get_supabase()

    city = await get_user_city(user["id"], sb)

    if not city:
        return {"city": None, "total_users": 0, "total_dates": 0, "trends": []}

    trends = await get_local_trends(city, user["id"], sb)
    return trends


@router.get("/recommend/worst")
async def get_worst_recommendations(user: dict = Depends(get_current_user)):
    """Secret breakup button: find the worst possible dates."""
    sb = get_supabase()

    result = sb.table("date_history").select("*").eq(
        "user_id", user["id"]
    ).order("created_at", desc=True).execute()

    dates = result.data or []
    activity_ids = [d["activity_id"] for d in dates]
    activity_vectors = get_activity_vectors(activity_ids)

    # Include custom date vectors (activity_id=0)
    custom_date_ids = [d["id"] for d in dates if d["activity_id"] == 0]
    custom_vectors = get_custom_date_vectors(custom_date_ids)

    rated_dates = []
    for d in dates:
        if d["rating"] is None:
            continue
        if d["activity_id"] == 0 and d["id"] in custom_vectors:
            activity_vectors[d["id"]] = custom_vectors[d["id"]]
            rated_dates.append({"activity_id": d["id"], "rating": d["rating"]})
        else:
            rated_dates.append({"activity_id": d["activity_id"], "rating": d["rating"]})

    pref_vector = compute_preference_vector(rated_dates, activity_vectors)
    json_worst = search_worst(pref_vector, top_k=3)

    # Also search custom activities with inverted preference
    inverse_pref = [round(1.0 - v, 4) for v in pref_vector]
    custom_worst = search_custom_activities(inverse_pref, sb, top_k=3)

    seen_names = set()
    worst = []
    for r in sorted(json_worst + custom_worst, key=lambda x: x["score"], reverse=True):
        name_lower = r["name"].strip().lower()
        if name_lower not in seen_names:
            seen_names.add(name_lower)
            worst.append(r)
        if len(worst) == 3:
            break

    return {
        "recommendations": worst,
        "mode": "breakup",
    }
