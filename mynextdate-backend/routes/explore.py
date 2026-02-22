"""Public explore endpoints — no authentication required."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.city_service import get_cities_summary, search_city, get_city_dimension_averages, get_city_vibe_distribution
from services.text_to_vector import text_to_vector

router = APIRouter(prefix="/api/explore", tags=["explore"])


class SearchCityRequest(BaseModel):
    city: str
    description: str | None = None
    price_tier: int | None = None
    indoor: bool | None = None
    vibes: list[str] | None = None
    top_k: int = 20


@router.get("/cities")
async def get_cities():
    """Return list of available cities with activity counts."""
    return {"cities": get_cities_summary()}


@router.post("/search")
async def search_city_activities(body: SearchCityRequest):
    """Search city activities with optional vector ranking. No auth required."""
    query_vector = None
    if body.description and body.description.strip():
        try:
            query_vector = await text_to_vector(body.description.strip())
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to analyze description: {str(e)}")

    results = search_city(
        city=body.city,
        query_vector=query_vector,
        top_k=body.top_k,
        price_tier=body.price_tier,
        indoor=body.indoor,
        vibes=body.vibes,
    )

    return {"results": results, "city": body.city, "count": len(results)}


@router.get("/city-dimensions")
async def get_city_dimensions():
    """Return average 9D dimension vector per city."""
    return {"cities": get_city_dimension_averages()}


@router.get("/city-vibes")
async def get_city_vibes():
    """Return vibe tag distribution per city."""
    return {"cities": get_city_vibe_distribution()}
