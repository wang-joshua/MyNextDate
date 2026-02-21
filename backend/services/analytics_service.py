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
    ratings = [d["rating"] for d in dates]

    # Average of last 5 ratings
    last_five = ratings[:5]
    avg_last_five = round(sum(last_five) / len(last_five), 2)

    # Success rate (>= 3 stars)
    successful = [r for r in ratings if r >= 3]
    success_rate = round(len(successful) / total * 100, 1)

    # Compute avg vector of successful vs failed dates
    success_vecs = []
    fail_vecs = []
    for d in dates:
        aid = d["activity_id"]
        if aid not in activity_vectors:
            continue
        vec = activity_vectors[aid]
        if d["rating"] >= 3:
            success_vecs.append(vec)
        else:
            fail_vecs.append(vec)

    dim_averages = {}
    if success_vecs:
        avg_success = np.mean(success_vecs, axis=0)
        for i, label in enumerate(VECTOR_LABELS):
            dim_averages[label] = round(float(avg_success[i]), 3)
    else:
        dim_averages = {label: 0.5 for label in VECTOR_LABELS}

    # Generate insight summary
    summary = _generate_summary(dim_averages, success_rate, avg_last_five)

    # Trend: compare last 3 vs previous 3
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
