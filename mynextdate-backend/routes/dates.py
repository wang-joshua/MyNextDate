import asyncio
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from middleware.auth import get_current_user
from services.actian_service import get_client, search_similar, ensure_cache, store_custom_date_vector, save_custom_activity, search_custom_activities
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


class AddCustomDateRequest(BaseModel):
    name: str
    rating: float | None = None


class AddDateRequest(BaseModel):
    activity_id: int
    rating: float | None = None


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


@router.post("/dates/preview")
async def preview_date_matches(body: AddDateByTextRequest, user: dict = Depends(get_current_user)):
    """Convert description to vector and return top 3 matches from JSON activities + community custom activities."""
    if not body.description.strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty")

    try:
        query_vector = await text_to_vector(body.description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze description: {str(e)}")

    sb = get_supabase()

    # Search both the 200 JSON activities and community custom activities
    json_results = search_similar(query_vector, top_k=3, text_query=body.description)
    custom_results = search_custom_activities(query_vector, sb, top_k=3, text_query=body.description)

    # Merge, deduplicate by name, sort by score, take top 3
    seen_names = set()
    merged = []
    for r in sorted(json_results + custom_results, key=lambda x: x["score"], reverse=True):
        name_lower = r["name"].strip().lower()
        if name_lower not in seen_names:
            seen_names.add(name_lower)
            merged.append(r)
        if len(merged) == 3:
            break

    if not merged:
        raise HTTPException(status_code=500, detail="No matching activity found")

    return {
        "top_matches": merged,
        "extracted_vector": query_vector,
    }


@router.post("/dates/custom")
async def add_custom_date(body: AddCustomDateRequest, user: dict = Depends(get_current_user)):
    """Add a custom date. Groq generates a vector that influences future recommendations."""
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Activity name cannot be empty")

    try:
        query_vector = await text_to_vector(body.name.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze activity: {str(e)}")

    sb = get_supabase()
    data = {
        "user_id": user["id"],
        "activity_id": 0,
        "activity_name": body.name.strip(),
        "rating": body.rating,
    }
    result = sb.table("date_history").insert(data).execute()
    record = result.data[0] if result.data else data

    # Store vector in memory so recommendations/analytics can use it
    if record.get("id"):
        store_custom_date_vector(record["id"], query_vector)

    # Save to shared custom_activities table so other users can find it
    save_custom_activity(body.name.strip(), query_vector, user["id"], sb)

    # Non-blocking: generate canonical entry and seed into global activity pool
    asyncio.create_task(_seed_activity_background(body.name.strip(), query_vector))

    return {
        "date": record,
        "matched_activity": body.name.strip(),
    }


async def _seed_activity_background(user_text: str, vector: list[float]):
    """Background task: canonicalize activity name and seed into global pool."""
    try:
        from services.text_to_vector import generate_activity_entry
        from services.actian_service import seed_single_activity
        entry = await generate_activity_entry(user_text)
        name = entry.get("name", user_text)
        description = entry.get("description", "")
        seed_single_activity(name, description, vector)
    except Exception as e:
        print(f"Background activity seed failed: {e}")


@router.post("/dates/describe")
async def add_date_by_description(body: AddDateByTextRequest, user: dict = Depends(get_current_user)):
    """Add a date by describing it in text. Uses Groq to extract a 9D vector, then matches to closest activity in Actian."""
    if not body.description.strip():
        raise HTTPException(status_code=400, detail="Description cannot be empty")

    try:
        query_vector = await text_to_vector(body.description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze description: {str(e)}")

    # Search both JSON activities and community custom activities
    sb = get_supabase()
    json_results = search_similar(query_vector, top_k=3, text_query=body.description)
    custom_results = search_custom_activities(query_vector, sb, top_k=3, text_query=body.description)

    seen_names = set()
    results = []
    for r in sorted(json_results + custom_results, key=lambda x: x["score"], reverse=True):
        name_lower = r["name"].strip().lower()
        if name_lower not in seen_names:
            seen_names.add(name_lower)
            results.append(r)
        if len(results) == 3:
            break

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
