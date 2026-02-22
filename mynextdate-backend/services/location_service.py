"""Browser geolocation + reverse geocoding and local activity trend aggregation."""
import httpx
import numpy as np
from supabase import Client
from services.actian_service import get_activity_vectors, search_similar


# In-memory cache: user_id -> city
_location_cache: dict[str, str] = {}


async def reverse_geocode_and_save(user_id: str, lat: float, lng: float, sb: Client) -> str | None:
    """
    Reverse geocode lat/lng to city via OpenStreetMap Nominatim, save to Supabase.
    Never raises — returns None on failure.
    """
    try:
        if user_id in _location_cache:
            return _location_cache[user_id]

        city, region, country = await _reverse_geocode(lat, lng)
        if not city:
            return None

        sb.table("user_locations").upsert(
            {
                "user_id": user_id,
                "city": city,
                "region": region,
                "country": country,
            },
            on_conflict="user_id",
        ).execute()

        _location_cache[user_id] = city
        return city

    except Exception as e:
        print(f"Location save failed (non-fatal): {e}")
        return None


async def get_user_city(user_id: str, sb: Client) -> str | None:
    """Get user's cached city, or look it up from Supabase."""
    if user_id in _location_cache:
        return _location_cache[user_id]

    try:
        result = sb.table("user_locations").select("city").eq("user_id", user_id).limit(1).execute()
        if result.data:
            city = result.data[0]["city"]
            _location_cache[user_id] = city
            return city
    except Exception:
        pass
    return None


async def _reverse_geocode(lat: float, lng: float) -> tuple[str | None, str | None, str | None]:
    """Reverse geocode lat/lng to city using OpenStreetMap Nominatim (free, no key)."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"lat": lat, "lon": lng, "format": "json", "zoom": 10},
                headers={"User-Agent": "MyNextDate/1.0"},
            )
            data = resp.json()

        address = data.get("address", {})
        city = address.get("city") or address.get("town") or address.get("village") or address.get("county")
        region = address.get("state")
        country = address.get("country")
        return city, region, country

    except Exception:
        return None, None, None


async def get_local_trends(city: str, user_id: str, sb: Client) -> dict:
    """
    Aggregate activity taste for users in the same city via Actian Vector AI DB.

    Approach:
    1. Fetch activity_ids from date_history of local users (Supabase SQL)
    2. Look up their 9D vectors from the Actian in-memory cache
    3. Compute the centroid (city taste profile in vector space)
    4. Run search_similar(centroid) against Actian → top 5 by cosine similarity
    """
    try:
        # Get all user_ids in this city
        loc_result = sb.table("user_locations").select("user_id").eq("city", city).execute()
        local_user_ids = [row["user_id"] for row in (loc_result.data or [])]

        # Remove current user — we want to show what OTHER people are doing
        other_user_ids = [uid for uid in local_user_ids if uid != user_id]

        if not other_user_ids:
            return {"city": city, "total_users": 0, "total_dates": 0, "trends": []}

        # Get activity_id + activity_name for other users' date history
        dates_result = sb.table("date_history").select(
            "activity_id, activity_name"
        ).in_("user_id", other_user_ids).execute()

        dates = dates_result.data or []
        total_dates = len(dates)

        if total_dates == 0:
            return {"city": city, "total_users": len(other_user_ids), "total_dates": 0, "trends": []}

        # Collect valid activity_ids (exclude 0 = custom/unmatched dates)
        activity_ids = [d["activity_id"] for d in dates if d.get("activity_id") and d["activity_id"] != 0]

        if not activity_ids:
            return {"city": city, "total_users": len(other_user_ids), "total_dates": total_dates, "trends": []}

        # Look up vectors from Actian in-memory cache
        vectors_map = get_activity_vectors(activity_ids)

        if not vectors_map:
            return {"city": city, "total_users": len(other_user_ids), "total_dates": total_dates, "trends": []}

        # Compute city taste centroid
        vectors = np.array(list(vectors_map.values()))
        centroid = vectors.mean(axis=0).tolist()

        # Search Actian for top 5 activities matching the city's taste profile
        results = search_similar(centroid, top_k=5)

        trends = [
            {
                "activity_name": r["name"],
                "count": 0,           # not a raw count — vector-ranked
                "percentage": round(r["score"] * 100, 1),
            }
            for r in results
        ]

        return {
            "city": city,
            "total_users": len(other_user_ids),
            "total_dates": total_dates,
            "trends": trends,
        }

    except Exception as e:
        print(f"Local trends query failed: {e}")
        return {"city": city, "total_users": 0, "total_dates": 0, "trends": []}
