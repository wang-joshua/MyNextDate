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

    # Compute weighted dimension averages from RATED dates only
    # Positive dates (rating >= 3) pull toward, negative push away, unrated are excluded
    all_vecs = []
    all_weights = []
    for d in rated_dates:
        aid = d["activity_id"]
        if aid not in activity_vectors:
            continue
        vec = np.array(activity_vectors[aid])
        rating = d["rating"]
        if rating >= 3:
            # Positive: higher rating = stronger pull toward this vector
            weight = rating / 5.0
            all_vecs.append(vec * weight)
        else:
            # Negative: lower rating = stronger push AWAY
            weight = (3.0 - rating) / 5.0
            all_vecs.append((1.0 - vec) * weight)
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

    # Trend: compare last 2 dates vs previous 2 dates (rated only)
    trend = "neutral"
    if len(ratings) >= 4:
        recent_2_avg = sum(ratings[:2]) / 2
        previous_2_avg = sum(ratings[2:4]) / 2
        diff = recent_2_avg - previous_2_avg
        if diff >= 0.5:
            trend = "improving"
        elif diff <= -0.5:
            trend = "declining"

    return {
        "total_dates": total,
        "avg_last_five": avg_last_five,
        "success_rate": success_rate,
        "preference_summary": summary,
        "dimension_averages": dim_averages,
        "trend": trend,
    }


def _intensity_word(deviation: float) -> str:
    """Return an intensity modifier based on how far a dimension leans from neutral."""
    d = abs(deviation)
    if d >= 0.25:
        return "strongly"
    if d >= 0.15:
        return "clearly"
    if d >= 0.08:
        return "somewhat"
    return "slightly"


def _generate_summary(dim_avgs: dict, success_rate: float, avg_rating: float) -> str:
    """Generate a human-readable preference summary based on strongest dimensions."""
    dimension_labels = {
        "cost": ("budget-friendly", "upscale"),
        "indoor_outdoor": ("indoor", "outdoor"),
        "energy": ("relaxed", "active and energetic"),
        "social_density": ("private and intimate", "social and lively"),
        "time_of_day": ("morning", "evening"),
        "duration": ("quick and spontaneous", "long and immersive"),
        "surprise": ("familiar and comfortable", "adventurous"),
        "romance_intensity": ("casual and lighthearted", "deeply romantic"),
        "conversation_depth": ("activity-focused", "deep-conversation"),
    }

    # Rank dimensions by deviation from neutral (0.5)
    deviations = []
    for dim, (low_label, high_label) in dimension_labels.items():
        val = dim_avgs.get(dim, 0.5)
        deviation = val - 0.5
        label = high_label if deviation > 0 else low_label
        deviations.append((deviation, label, dim))

    deviations.sort(key=lambda x: abs(x[0]), reverse=True)

    # Pick top 3 with meaningful deviation
    top = [(dev, label, dim) for dev, label, dim in deviations[:3] if abs(dev) > 0.03]

    if not top:
        return "You enjoy a well-balanced mix of date types. Keep exploring!"

    # Build trait descriptions with intensity words
    traits = [f"{_intensity_word(dev)} {label}" for dev, label, _ in top]

    if len(traits) > 1:
        pref_str = ", ".join(traits[:-1]) + f" and {traits[-1]}"
    else:
        pref_str = traits[0]

    # Granular prefix based on avg rating (0.5 increments)
    if avg_rating >= 4.5:
        prefix = "You're absolutely loving your dates! Your vibe is"
    elif avg_rating >= 4.0:
        prefix = "Your dates are going great! You clearly gravitate toward"
    elif avg_rating >= 3.5:
        prefix = "You're having solid dates! You tend to enjoy"
    elif avg_rating >= 3.0:
        prefix = "Your dates are decent — you seem to prefer"
    elif avg_rating >= 2.5:
        prefix = "Your dates have been hit or miss. You lean toward"
    elif avg_rating >= 2.0:
        prefix = "Looks like recent dates haven't clicked. You might want to try more"
    elif avg_rating >= 1.5:
        prefix = "Your dates haven't been great lately. Consider shifting toward"
    elif avg_rating >= 1.0:
        prefix = "Time for a change! Your history suggests you'd prefer"
    elif avg_rating >= 0.5:
        prefix = "Most dates haven't landed well. You might enjoy something more"
    elif avg_rating > 0:
        prefix = "Let's turn things around — your patterns suggest"
    else:
        prefix = "Based on your dates so far, your profile leans"

    # Add success rate context for extra flavor
    suffix = ""
    if success_rate >= 80:
        suffix = " You're on a great streak!"
    elif success_rate >= 60:
        suffix = " Your hit rate is solid — keep it up."
    elif success_rate <= 20 and avg_rating > 0:
        suffix = " Try switching things up for better results."

    return f"{prefix} {pref_str}.{suffix}"
