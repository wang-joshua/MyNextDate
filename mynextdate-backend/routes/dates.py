from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from middleware.auth import get_current_user
from services.actian_service import get_client, search_similar, ensure_cache
from services.text_to_vector import text_to_vector
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY, COLLECTION_NAME

router = APIRouter(prefix="/api", tags=["dates"])

_sb = None


def get_supabase():
    global _sb
    if _sb is None:
        _sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _sb


class AddDateByTextRequest(BaseModel):
    description: str
    rating: float | None = None


class AddDateRequest(BaseModel):
    activity_id: int
    rating: float | None = None

    @field_validator("rating")
    @classmethod
    def rating_must_be_valid(cls, v):
        if v is not None and not (0 <= v <= 5):
            raise ValueError("Rating must be between 0 and 5")
        return v


class RateDateRequest(BaseModel):
    rating: float  # 0-5


@router.get("/dates")
async def get_date_history(user: dict = Depends(get_current_user)):
    """Get all dates for the current user."""
    sb = get_supabase()
    result = sb.table("date_history").select("*").eq(
        "user_id", user["id"]
    ).order("created_at", desc=True).execute()

    return {"dates": result.data or []}


@router.post("/dates/describe")
async def add_date_by_description(body: AddDateByTextRequest, user: dict = Depends(get_current_user)):
    """Add a date by describing it in text. Uses Groq to extract a 9D vector, then matches to closest activity in Actian."""
    if not body.description.strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty")
    if len(body.description.strip()) < 20:
        raise HTTPException(status_code=400, detail="Please describe your date in at least 20 characters for a better match")

    try:
        query_vector = await text_to_vector(body.description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze description: {str(e)}")

    # Search Actian for closest matching activity
    results = search_similar(query_vector, top_k=3)

    if not results:
        raise HTTPException(status_code=500, detail="No matching activity found")

    best = results[0]
    activity_id = best["id"]
    activity_name = best["name"]
    match_score = best["score"]

    # Store in Supabase
    sb = get_supabase()
    data = {
        "user_id": user["id"],
        "activity_id": activity_id,
        "activity_name": activity_name,
        "rating": body.rating,
    }
    result = sb.table("date_history").insert(data).execute()

    return {
        "date": result.data[0] if result.data else data,
        "matched_activity": activity_name,
        "match_score": match_score,
        "top_matches": results,
        "extracted_vector": query_vector,
    }


@router.post("/dates")
async def add_date(body: AddDateRequest, user: dict = Depends(get_current_user)):
    """Add a date by activity ID (used when selecting from recommendations)."""
    from services.actian_service import _payload_cache
    ensure_cache()

    payload = _payload_cache.get(body.activity_id, {})
    activity_name = payload.get("name", "Unknown Activity")

    sb = get_supabase()
    data = {
        "user_id": user["id"],
        "activity_id": body.activity_id,
        "activity_name": activity_name,
        "rating": body.rating,
    }

    result = sb.table("date_history").insert(data).execute()
    return {"date": result.data[0] if result.data else data}


@router.patch("/dates/{date_id}")
async def rate_date(
    date_id: str, body: RateDateRequest, user: dict = Depends(get_current_user)
):
    """Rate or update rating for a date."""
    if body.rating < 0 or body.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be 0-5")

    sb = get_supabase()
    result = sb.table("date_history").update(
        {"rating": body.rating}
    ).eq("id", date_id).eq("user_id", user["id"]).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Date not found")

    return {"date": result.data[0]}


@router.delete("/dates/{date_id}")
async def delete_date(date_id: str, user: dict = Depends(get_current_user)):
    """Delete a date from history."""
    sb = get_supabase()
    result = sb.table("date_history").delete().eq(
        "id", date_id
    ).eq("user_id", user["id"]).execute()

    return {"deleted": True}
