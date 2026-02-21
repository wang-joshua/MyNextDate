import numpy as np
from config import VECTOR_DIMENSION


def compute_preference_vector(
    rated_dates: list[dict],
    activity_vectors: dict[int, list[float]],
) -> list[float]:
    """
    Compute user preference vector from rated date history.

    rated_dates: list of {"activity_id": int, "rating": float}
    activity_vectors: {activity_id: [9D vector]}

    Strategy:
    - Dates rated >= 3 are "successful" and pull the preference toward them
    - Dates rated < 3 are "unsuccessful" and push preference away
    - Recent dates weighted slightly more (recency bias)
    - New users (no history) get neutral vector [0.5] * 9
    """
    if not rated_dates or not activity_vectors:
        return [0.5] * VECTOR_DIMENSION

    pref = np.zeros(VECTOR_DIMENSION)
    total_weight = 0.0

    # Sort by recency (newest first) - assume ordered by created_at
    for i, date in enumerate(rated_dates):
        aid = date["activity_id"]
        rating = date["rating"]

        if aid not in activity_vectors:
            continue

        vec = np.array(activity_vectors[aid])

        # Recency weight: more recent dates matter more
        recency = 1.0 / (1.0 + i * 0.1)

        if rating >= 3:
            # Positive: weight by normalized rating
            weight = (rating / 5.0) * recency
            pref += vec * weight
        else:
            # Negative: push AWAY from this vector
            weight = ((5.0 - rating) / 5.0) * recency * 0.5
            pref += (1.0 - vec) * weight

        total_weight += weight

    if total_weight == 0:
        # All rated activities were missing from cache — fall back to neutral
        return [0.5] * VECTOR_DIMENSION

    pref /= total_weight

    # Clamp to [0, 1]
    pref = np.clip(pref, 0.0, 1.0)
    return [round(float(v), 4) for v in pref]


def apply_repeat_penalty(
    preference_vector: list[float],
    past_activity_ids: list[int],
    activity_vectors: dict[int, list[float]],
    penalty_strength: float = 0.15,
) -> list[float]:
    """
    Slightly shift the preference vector away from recently done activities
    to encourage variety.
    """
    if not past_activity_ids or not activity_vectors:
        return preference_vector

    pref = np.array(preference_vector)

    # Average vector of recent activities (last 5)
    recent_ids = past_activity_ids[:5]
    recent_vecs = [
        np.array(activity_vectors[aid])
        for aid in recent_ids
        if aid in activity_vectors
    ]

    if not recent_vecs:
        return preference_vector

    avg_recent = np.mean(recent_vecs, axis=0)

    # Nudge away from what was recently done
    nudge = pref - avg_recent
    pref = pref + nudge * penalty_strength

    pref = np.clip(pref, 0.0, 1.0)
    return [round(float(v), 4) for v in pref]
