import numpy as np
from config import VECTOR_DIMENSION, VECTOR_LABELS


def compute_analytics(
    dates: list[dict],
    activity_vectors: dict[int, list[float]],
) -> dict:
    """
    Compute user analytics from date history.

    dates: list of {"activity_id": int, "rating": float, "created_at": str, "activity_name": str}
    activity_vectors: {activity_id: [9D vector]}
    """
    if not dates:
        return {
            "total_dates": 0,
            "avg_last_five": 0.0,
            "success_rate": 0.0,
            "preference_summary": "No dating history yet. Add some dates to get started!",
            "dimension_averages": {label: 0.5 for label in VECTOR_LABELS},
            "trend": "neutral",
        }

    total = len(dates)

    # Separate rated vs unrated dates
    rated_dates = [d for d in dates if d["rating"] and d["rating"] > 0]
    ratings = [d["rating"] for d in rated_dates]

    # Average of last 5 rated dates
    last_five = ratings[:5] if ratings else []
    avg_last_five = round(sum(last_five) / len(last_five), 2) if last_five else 0.0

    # Success rate (>= 3 stars) — only from rated dates
    rated_count = len(rated_dates)
    successful = [r for r in ratings if r >= 3]
    success_rate = round(len(successful) / rated_count * 100, 1) if rated_count > 0 else 0.0

    # Compute weighted dimension averages from ALL dates with vectors
    # Rated dates are weighted by rating, unrated dates get neutral weight
    all_vecs = []
    all_weights = []
    for d in dates:
        aid = d["activity_id"]
        if aid not in activity_vectors:
            continue
        vec = activity_vectors[aid]
        rating = d["rating"]
        if rating and rating > 0:
            weight = rating / 5.0
        else:
            weight = 0.5  # neutral weight for unrated
        all_vecs.append(np.array(vec) * weight)
        all_weights.append(weight)

    dim_averages = {}
    if all_vecs and sum(all_weights) > 0:
        weighted_avg = np.sum(all_vecs, axis=0) / sum(all_weights)
        weighted_avg = np.clip(weighted_avg, 0.0, 1.0)
        for i, label in enumerate(VECTOR_LABELS):
            dim_averages[label] = round(float(weighted_avg[i]), 3)
    else:
        dim_averages = {label: 0.5 for label in VECTOR_LABELS}

    # Generate insight summary
    summary = _generate_summary(dim_averages, success_rate, avg_last_five)

    # Trend: compare last 3 vs previous 3 (rated only)
    trend = "neutral"
    if len(ratings) >= 6:
        recent_avg = sum(ratings[:3]) / 3
        older_avg = sum(ratings[3:6]) / 3
        if recent_avg > older_avg + 0.3:
            trend = "improving"
        elif recent_avg < older_avg - 0.3:
            trend = "declining"

    return {
        "total_dates": total,
        "avg_last_five": avg_last_five,
        "success_rate": success_rate,
        "preference_summary": summary,
        "dimension_averages": dim_averages,
        "trend": trend,
    }


def _generate_summary(dim_avgs: dict, success_rate: float, avg_rating: float) -> str:
    """Generate a human-readable preference summary."""
    insights = []

    cost = dim_avgs.get("cost", 0.5)
    if cost < 0.3:
        insights.append("budget-friendly")
    elif cost > 0.7:
        insights.append("upscale")

    indoor = dim_avgs.get("indoor_outdoor", 0.5)
    if indoor < 0.3:
        insights.append("indoor")
    elif indoor > 0.7:
        insights.append("outdoor")

    energy = dim_avgs.get("energy", 0.5)
    if energy < 0.3:
        insights.append("relaxed")
    elif energy > 0.7:
        insights.append("active and energetic")

    social = dim_avgs.get("social_density", 0.5)
    if social < 0.3:
        insights.append("private and intimate")
    elif social > 0.7:
        insights.append("social and lively")

    time = dim_avgs.get("time_of_day", 0.5)
    if time < 0.3:
        insights.append("morning")
    elif time > 0.7:
        insights.append("evening")

    romance = dim_avgs.get("romance_intensity", 0.5)
    if romance > 0.7:
        insights.append("deeply romantic")
    elif romance < 0.3:
        insights.append("casual and lighthearted")

    convo = dim_avgs.get("conversation_depth", 0.5)
    if convo > 0.7:
        insights.append("deep-conversation")
    elif convo < 0.3:
        insights.append("activity-focused (less talking)")

    if not insights:
        return "You enjoy a well-balanced mix of date types. Keep exploring!"

    pref_str = ", ".join(insights[:-1])
    if len(insights) > 1:
        pref_str += f" and {insights[-1]}"
    else:
        pref_str = insights[0]

    return f"You tend to prefer dates that are {pref_str}."
