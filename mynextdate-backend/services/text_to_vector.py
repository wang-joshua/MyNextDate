"""Convert free-text date descriptions to 9D vectors using Groq (Llama 3.3 70B)."""
import json
import re
from groq import Groq
from config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

PROMPT_TEMPLATE = """You are a date activity analyzer. Given a user's description of a date they went on (or want to go on), extract exactly 9 numerical scores between 0.0 and 1.0.

The 9 dimensions are:
1. cost: 0.0=free, 0.15=very cheap, 0.3=low budget, 0.5=mid-range, 0.75=expensive, 1.0=luxury
2. indoor_outdoor: 0.0=fully indoor, 0.5=mixed/flexible, 1.0=fully outdoor
3. energy: 0.0=very relaxed/passive, 0.5=moderate activity, 1.0=very high energy/athletic
4. social_density: 0.0=completely private (just the two of you), 0.5=some people around, 1.0=large crowd/very public
5. time_of_day: 0.0=early morning, 0.25=morning, 0.5=afternoon, 0.75=evening, 1.0=late night
6. duration: 0.0=very short (<1hr), 0.25=1-2hrs, 0.5=2-3hrs, 0.75=3-5hrs, 1.0=5hr+/overnight
7. surprise: 0.0=very routine/predictable, 0.5=moderate novelty, 1.0=highly surprising/adventurous
8. romance_intensity: 0.0=casual/friendly, 0.3=light, 0.5=playful, 0.7=romantic, 0.85=sensual, 1.0=intensely romantic
9. conversation_depth: 0.0=minimal talking, 0.3=light chat, 0.5=moderate, 0.7=meaningful, 1.0=deep/vulnerable conversations

Respond with ONLY a JSON array of 9 numbers, nothing else. Example: [0.3, 0.0, 0.2, 0.1, 0.75, 0.45, 0.3, 0.7, 0.6]

User's date description:
"{description}"
"""


async def text_to_vector(description: str) -> list[float]:
    """Convert a text description to a 9D vector using Groq."""
    prompt = PROMPT_TEMPLATE.format(description=description)

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
    )
    text = response.choices[0].message.content.strip()

    # Strip markdown code fences if present (e.g. ```json\n[...]\n```)
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    else:
        text = text.strip()

    try:
        vector = json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned non-JSON output: {text[:200]}") from e

    if not isinstance(vector, list) or len(vector) != 9:
        raise ValueError(f"Expected a JSON array of 9 numbers, got: {vector}")

    # Clamp values to [0, 1]
    vector = [max(0.0, min(1.0, float(v))) for v in vector]
    return vector
