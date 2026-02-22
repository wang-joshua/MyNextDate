"""Convert free-text date descriptions to 9D vectors using Groq (Llama 3.3 70B)."""
import json
from groq import Groq
from config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

PROMPT_TEMPLATE = """You are a date activity analyzer. Given a description of a date, output exactly 9 scores between 0.0 and 1.0. Be PRECISE — avoid defaulting to 0.5 unless truly ambiguous. Use the full range of values.

Dimensions with detailed anchors:
1. cost: 0.0=free, 0.1=nearly free, 0.2=cheap ($5-15), 0.35=budget ($15-35), 0.5=mid ($35-60), 0.7=pricey ($60-120), 0.85=expensive ($120-250), 1.0=luxury ($250+)
2. indoor_outdoor: 0.0=fully indoor, 0.25=mostly indoor, 0.5=equal mix, 0.75=mostly outdoor, 1.0=fully outdoor. Restaurants/homes/cinemas=0.0. Parks/beaches/hikes=1.0.
3. energy: 0.0=seated/passive (watching/dining), 0.15=very calm, 0.3=light effort (strolling/cooking), 0.5=moderate (dancing/bowling), 0.7=active (hiking/cycling), 0.9=intense (climbing/sports), 1.0=extreme
4. social_density: 0.0=totally alone, 0.15=just the two of you at home, 0.3=quiet venue, 0.5=normal crowd, 0.7=busy/popular spot, 0.9=packed event, 1.0=massive crowd
5. time_of_day: 0.0=sunrise, 0.2=morning, 0.35=late morning, 0.45=lunch, 0.55=afternoon, 0.7=evening, 0.8=dinner, 0.9=late night, 1.0=midnight+
6. duration: 0.0=under 30min, 0.15=30-60min, 0.25=1-2hrs, 0.4=2-3hrs, 0.55=3-4hrs, 0.7=4-6hrs, 0.85=6-10hrs, 1.0=overnight
7. surprise: 0.0=very routine/familiar, 0.2=comfort zone, 0.4=mildly new, 0.6=novel, 0.8=adventurous, 1.0=wildly unexpected
8. romance_intensity: 0.0=platonic, 0.2=friendly, 0.35=light date vibe, 0.5=playful, 0.65=flirty, 0.75=romantic, 0.85=deeply romantic, 1.0=intensely intimate
9. conversation_depth: 0.0=silent, 0.15=minimal talk, 0.3=light banter, 0.5=casual chat, 0.65=engaged conversation, 0.8=meaningful sharing, 1.0=deep/vulnerable

CRITICAL: Analyze EACH dimension independently based on the specific details. A seated indoor dinner has very low energy (~0.05-0.1), always indoor (0.0), and high conversation (0.65+). A hiking date has high energy (~0.7), fully outdoor (1.0), and moderate conversation (~0.5). Do NOT use similar values for all dimensions.

Examples:
- "Candlelit Italian restaurant with wine" → [0.7, 0.0, 0.08, 0.4, 0.8, 0.45, 0.25, 0.8, 0.7]
- "Made sushi together at home" → [0.2, 0.0, 0.3, 0.15, 0.7, 0.55, 0.45, 0.65, 0.55]
- "Hiked to a waterfall then had a picnic" → [0.1, 1.0, 0.75, 0.05, 0.3, 0.75, 0.65, 0.6, 0.6]
- "Jazz bar with cocktails" → [0.55, 0.0, 0.15, 0.5, 0.85, 0.35, 0.35, 0.6, 0.4]
- "Rock climbing gym then smoothies" → [0.35, 0.0, 0.85, 0.5, 0.5, 0.4, 0.5, 0.35, 0.35]
- "Stargazing on a rooftop with blankets" → [0.05, 1.0, 0.05, 0.05, 0.95, 0.4, 0.6, 0.85, 0.8]
- "Amusement park all day" → [0.5, 0.75, 0.8, 0.85, 0.5, 0.8, 0.7, 0.45, 0.3]
- "Painting class together" → [0.35, 0.0, 0.25, 0.4, 0.55, 0.35, 0.5, 0.5, 0.45]

Respond with ONLY a JSON array of 9 numbers. No text.

Description: "{description}"
"""


ACTIVITY_ENTRY_PROMPT = """Given a raw date activity description from a user, generate a canonical entry for a date activity database.

Return ONLY valid JSON with these exact fields:
- "name": a 3-5 word title (title case, like a proper venue/activity name)
- "description": one romantic sentence describing the experience (15-25 words)

User input: "{user_text}"

Example:
Input: "axe throwing at urban axes downtown"
Output: {{"name": "Axe Throwing Night Out", "description": "Bond over friendly competition and laughter at a vibrant urban axe throwing venue."}}

Respond with ONLY the JSON object. No markdown, no extra text."""


async def generate_activity_entry(user_text: str) -> dict:
    """Generate canonical activity name and description from user-provided text."""
    prompt = ACTIVITY_ENTRY_PROMPT.format(user_text=user_text)
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
    )
    text = response.choices[0].message.content.strip()
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
    result = json.loads(text)
    return result


async def text_to_vector(description: str) -> list[float]:
    """Convert a text description to a 9D vector using Groq."""
    prompt = PROMPT_TEMPLATE.format(description=description)

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
    )
    text = response.choices[0].message.content.strip()

    # Parse the JSON array from response
    # Handle cases where LLM might wrap in markdown code blocks
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    vector = json.loads(text)

    if len(vector) != 9:
        raise ValueError(f"Expected 9 dimensions, got {len(vector)}")

    # Clamp values to [0, 1]
    vector = [max(0.0, min(1.0, float(v))) for v in vector]
    return vector
