"""Browser geolocation + reverse geocoding and local activity trend aggregation."""
import httpx
from supabase import Client


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
    Aggregate activity popularity among users in the same city.
    Excludes the current user's own dates from the trends.
    Returns top 5 activities with percentages.
    """
    try:
        # Get all user_ids in this city
        loc_result = sb.table("user_locations").select("user_id").eq("city", city).execute()
        local_user_ids = [row["user_id"] for row in (loc_result.data or [])]

        # Remove current user — we want to show what OTHER people are doing
        other_user_ids = [uid for uid in local_user_ids if uid != user_id]

        if not other_user_ids:
            return {"city": city, "total_users": 0, "total_dates": 0, "trends": []}

        # Get all date_history rows for other users in this city
        dates_result = sb.table("date_history").select(
            "activity_name"
        ).in_("user_id", other_user_ids).execute()

        dates = dates_result.data or []
        total_dates = len(dates)

        if total_dates == 0:
            return {"city": city, "total_users": len(other_user_ids), "total_dates": 0, "trends": []}

        # Count activity frequencies
        activity_counts: dict[str, int] = {}
        for d in dates:
            name = d.get("activity_name", "").strip()
            if name:
                activity_counts[name] = activity_counts.get(name, 0) + 1

        # Sort by count descending, take top 5
        sorted_activities = sorted(activity_counts.items(), key=lambda x: x[1], reverse=True)[:5]

        trends = [
            {
                "activity_name": name,
                "count": count,
                "percentage": round(count / total_dates * 100, 1),
            }
            for name, count in sorted_activities
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
