"""Generate 200 date activities with 9D vectors for Actian Vector DB."""
import json
import os

# Vector dimensions (in order):
# 0: cost        - 0=free, 0.3=low, 0.5=mid, 1.0=luxury
# 1: indoor_outdoor - 0=indoor, 0.5=flexible, 1.0=outdoor
# 2: energy      - 0.2=low, 0.5=medium, 0.8=high
# 3: social_density - 0.2=private, 0.5=moderate, 0.8=public
# 4: time_of_day - 0.25=morning, 0.5=afternoon, 0.75=evening, 0.9=night
# 5: duration    - 0.15=1h, 0.25=1.5h, 0.35=2h, 0.45=2-3h, 0.55=3h, 0.65=3-4h, 0.8=4-6h, 1.0=overnight
# 6: surprise    - 0.2=low, 0.5=moderate, 0.8=high
# 7: romance     - 0.2=light, 0.4=playful, 0.45=intellectual, 0.65=romantic, 0.75=sensual, 0.8=deep, 0.95=intense
# 8: conversation - 0.25=light, 0.5=medium, 0.8=deep

BUDGET_MAP = {"free": 0.0, "low": 0.3, "mid-range": 0.5, "luxury": 1.0}
ENV_MAP = {"indoor": 0.0, "flexible": 0.5, "outdoor": 1.0}
ENERGY_MAP = {"low": 0.2, "medium": 0.5, "high": 0.8}
PERSONALITY_MAP = {"introvert": 0.2, "mixed": 0.5, "extrovert": 0.8}
TIME_MAP = {"morning": 0.25, "afternoon": 0.5, "evening": 0.75, "night": 0.9}
SURPRISE_MAP = {"low": 0.2, "moderate": 0.5, "high": 0.8}
ROMANCE_MAP = {"light": 0.2, "playful": 0.4, "intellectual": 0.45, "romantic": 0.65, "sensual": 0.75, "deep": 0.8, "intense": 0.95}
CONVO_MAP = {"light": 0.25, "medium": 0.5, "deep": 0.8}

def parse_duration(s):
    s = s.lower().strip()
    if "overnight" in s:
        return 1.0
    if "4-6" in s or "5" in s:
        return 0.8
    if "3-4" in s:
        return 0.65
    if "3" in s:
        return 0.55
    if "2.5" in s:
        return 0.45
    if "2-3" in s:
        return 0.45
    if "2" in s:
        return 0.35
    if "1.5" in s:
        return 0.25
    if "1" in s:
        return 0.15
    return 0.35

def convert_existing(activity):
    cost = BUDGET_MAP.get(activity["budget_level"], 0.5)
    indoor = ENV_MAP.get(activity["environment"], 0.5)
    energy = ENERGY_MAP.get(activity["energy_level"], 0.5)
    social = PERSONALITY_MAP.get(activity["personality_fit"][0], 0.5)
    time = TIME_MAP.get(activity["best_time_of_day"][0], 0.5)
    duration = parse_duration(activity["estimated_duration"])
    surprise = SURPRISE_MAP.get(activity["surprise_factor"], 0.5)
    romance = ROMANCE_MAP.get(activity["romance_intensity"], 0.5)
    convo = CONVO_MAP.get(activity["conversation_depth_level"], 0.5)
    return [cost, indoor, energy, social, time, duration, surprise, romance, convo]

# Load existing activities
with open(os.path.join(os.path.dirname(__file__), "..", "dating.json")) as f:
    existing = json.load(f)

activities = []
for i, a in enumerate(existing):
    vec = convert_existing(a)
    activities.append({
        "id": i,
        "name": a["activity_name"],
        "description": a["detailed_description"],
        "vector": [round(v, 3) for v in vec],
    })

# 155 additional activities with hand-crafted vectors
# [cost, indoor_outdoor, energy, social, time_of_day, duration, surprise, romance, conversation]
new_activities = [
    ("Home Movie Marathon", "Binge-watch favorite movies with snacks and blankets.", [0.1, 0.0, 0.1, 0.1, 0.75, 0.65, 0.1, 0.5, 0.3]),
    ("Sunset Beach Walk", "Stroll barefoot along the shore as the sun sets.", [0.0, 1.0, 0.3, 0.2, 0.75, 0.35, 0.2, 0.7, 0.7]),
    ("Bowling Night", "Compete at bowling with friendly wagers.", [0.3, 0.0, 0.5, 0.6, 0.75, 0.35, 0.2, 0.35, 0.35]),
    ("Mini Golf Date", "Playful competition on a themed mini golf course.", [0.3, 1.0, 0.4, 0.5, 0.5, 0.35, 0.3, 0.4, 0.35]),
    ("Farmers Market Brunch", "Explore a morning market then cook brunch together.", [0.3, 1.0, 0.4, 0.5, 0.25, 0.45, 0.3, 0.45, 0.5]),
    ("Picnic in the Park", "Pack homemade food and enjoy a lazy afternoon in the park.", [0.15, 1.0, 0.2, 0.3, 0.5, 0.45, 0.2, 0.6, 0.6]),
    ("Arcade Game Night", "Play retro and modern arcade games together.", [0.3, 0.0, 0.6, 0.6, 0.75, 0.35, 0.3, 0.3, 0.25]),
    ("Sunrise Hike", "Early morning hike to catch the sunrise from a peak.", [0.0, 1.0, 0.8, 0.3, 0.15, 0.55, 0.4, 0.7, 0.7]),
    ("Baking Challenge", "Compete to bake the best dessert at home.", [0.2, 0.0, 0.5, 0.1, 0.5, 0.45, 0.4, 0.4, 0.4]),
    ("Local Concert", "Attend a live local band or singer performance.", [0.4, 0.0, 0.5, 0.7, 0.75, 0.45, 0.5, 0.5, 0.25]),
    ("Thrift Store Challenge", "Each pick an outfit for the other under a budget.", [0.2, 0.0, 0.5, 0.5, 0.5, 0.35, 0.7, 0.4, 0.4]),
    ("Planetarium Visit", "Explore the cosmos in a domed theater.", [0.3, 0.0, 0.15, 0.4, 0.5, 0.35, 0.3, 0.55, 0.5]),
    ("Couples Massage at Home", "Give each other massages with candles and music.", [0.1, 0.0, 0.1, 0.05, 0.75, 0.35, 0.3, 0.85, 0.4]),
    ("Go-Kart Racing", "Race each other at a go-kart track.", [0.4, 0.5, 0.8, 0.6, 0.5, 0.25, 0.5, 0.3, 0.2]),
    ("Sunset Sailing", "Sail a small boat during golden hour.", [0.6, 1.0, 0.3, 0.15, 0.75, 0.45, 0.6, 0.8, 0.6]),
    ("Open Mic Night", "Watch or perform at a local open mic event.", [0.2, 0.0, 0.4, 0.7, 0.75, 0.35, 0.5, 0.35, 0.3]),
    ("Dog Park Hangout", "Bring your dogs (or visit) and enjoy the outdoors.", [0.0, 1.0, 0.4, 0.5, 0.5, 0.35, 0.2, 0.3, 0.5]),
    ("Sushi Making at Home", "Learn to roll sushi together from scratch.", [0.3, 0.0, 0.5, 0.1, 0.75, 0.45, 0.4, 0.5, 0.5]),
    ("Bike Ride Along River", "Cycle along a scenic riverside path.", [0.1, 1.0, 0.7, 0.3, 0.5, 0.45, 0.2, 0.45, 0.5]),
    ("Jazz Club Evening", "Enjoy live jazz with cocktails in an intimate venue.", [0.5, 0.0, 0.2, 0.4, 0.75, 0.45, 0.4, 0.7, 0.5]),
    ("Laser Tag Battle", "Team up or compete in a laser tag arena.", [0.3, 0.0, 0.8, 0.7, 0.5, 0.25, 0.5, 0.25, 0.15]),
    ("Flea Market Treasure Hunt", "Search for unique finds at a flea market.", [0.2, 1.0, 0.4, 0.6, 0.25, 0.45, 0.5, 0.3, 0.5]),
    ("Cocktail Making Class", "Learn to mix craft cocktails together.", [0.5, 0.0, 0.4, 0.5, 0.75, 0.35, 0.5, 0.55, 0.4]),
    ("Trampoline Park", "Bounce around at an indoor trampoline park.", [0.3, 0.0, 0.9, 0.6, 0.5, 0.25, 0.4, 0.25, 0.15]),
    ("Botanical Garden Walk", "Wander through beautiful gardens in bloom.", [0.2, 1.0, 0.3, 0.3, 0.5, 0.35, 0.2, 0.6, 0.6]),
    ("Fondue Night", "Prepare a cheese or chocolate fondue at home.", [0.3, 0.0, 0.2, 0.1, 0.75, 0.35, 0.3, 0.7, 0.6]),
    ("Surfing Lesson", "Take a beginner surfing lesson at the beach.", [0.5, 1.0, 0.9, 0.5, 0.25, 0.55, 0.7, 0.35, 0.2]),
    ("Antique Shop Exploration", "Browse antique shops and share stories about finds.", [0.2, 0.0, 0.3, 0.3, 0.5, 0.35, 0.4, 0.35, 0.6]),
    ("Helicopter Tour", "See the city from above on a helicopter ride.", [1.0, 1.0, 0.3, 0.3, 0.5, 0.25, 0.9, 0.85, 0.3]),
    ("Board Game Night at Home", "Play strategy or party games at home.", [0.0, 0.0, 0.3, 0.1, 0.75, 0.55, 0.2, 0.35, 0.5]),
    ("Couples Cooking Competition", "Compete to make the best dish with secret ingredients.", [0.2, 0.0, 0.6, 0.1, 0.75, 0.45, 0.6, 0.4, 0.4]),
    ("Zip Lining Adventure", "Soar through treetops on a zip line course.", [0.6, 1.0, 0.8, 0.5, 0.5, 0.35, 0.8, 0.35, 0.15]),
    ("Night Market Food Tour", "Explore a vibrant night market sampling street food.", [0.3, 1.0, 0.5, 0.8, 0.8, 0.45, 0.6, 0.4, 0.4]),
    ("Puzzle Room at Home", "Work together on a complex jigsaw puzzle.", [0.1, 0.0, 0.2, 0.1, 0.5, 0.55, 0.15, 0.35, 0.5]),
    ("Scenic Train Ride", "Take a scenic railway through countryside.", [0.5, 0.5, 0.15, 0.4, 0.25, 0.65, 0.5, 0.65, 0.7]),
    ("Comedy Improv Show", "Watch an interactive improv comedy performance.", [0.4, 0.0, 0.5, 0.7, 0.75, 0.35, 0.6, 0.35, 0.25]),
    ("Candlelit Bath", "Share a relaxing bath with candles and music.", [0.1, 0.0, 0.05, 0.0, 0.8, 0.25, 0.3, 0.9, 0.5]),
    ("Apple Picking", "Visit an orchard to pick apples together.", [0.2, 1.0, 0.5, 0.4, 0.25, 0.45, 0.3, 0.45, 0.5]),
    ("Scuba Diving Experience", "Explore underwater life with a guided dive.", [0.8, 1.0, 0.8, 0.3, 0.25, 0.65, 0.9, 0.45, 0.1]),
    ("Pumpkin Patch Visit", "Pick pumpkins and enjoy fall activities.", [0.2, 1.0, 0.4, 0.5, 0.5, 0.35, 0.3, 0.4, 0.4]),
    ("Fine Dining Experience", "Enjoy a multi-course meal at a top restaurant.", [1.0, 0.0, 0.15, 0.4, 0.75, 0.55, 0.4, 0.8, 0.7]),
    ("Rooftop Bar Hopping", "Visit multiple rooftop bars for drinks and views.", [0.6, 0.5, 0.5, 0.7, 0.8, 0.55, 0.5, 0.55, 0.4]),
    ("Volunteer at Animal Shelter", "Spend time caring for shelter animals together.", [0.0, 0.5, 0.5, 0.4, 0.25, 0.45, 0.3, 0.5, 0.6]),
    ("Poetry Reading Night", "Attend or share poetry at a cozy venue.", [0.2, 0.0, 0.15, 0.4, 0.75, 0.35, 0.3, 0.6, 0.8]),
    ("Snowshoeing Adventure", "Hike through snowy trails on snowshoes.", [0.3, 1.0, 0.8, 0.2, 0.25, 0.55, 0.5, 0.5, 0.5]),
    ("Chocolate Tasting Tour", "Sample artisan chocolates at specialty shops.", [0.4, 0.0, 0.2, 0.4, 0.5, 0.35, 0.4, 0.6, 0.5]),
    ("Beach Volleyball", "Play casual beach volleyball together.", [0.0, 1.0, 0.8, 0.6, 0.5, 0.35, 0.3, 0.3, 0.2]),
    ("Spa Day Out", "Full spa treatment with pools, saunas, and relaxation.", [0.8, 0.0, 0.1, 0.3, 0.5, 0.65, 0.3, 0.7, 0.4]),
    ("Ghost Tour", "Walk a guided haunted history tour at night.", [0.3, 1.0, 0.4, 0.6, 0.85, 0.35, 0.7, 0.4, 0.3]),
    ("Breakfast in Bed", "Surprise with a homemade breakfast in bed.", [0.15, 0.0, 0.1, 0.0, 0.15, 0.25, 0.5, 0.8, 0.5]),
    ("Roller Skating", "Skate laps together at a roller rink.", [0.3, 0.0, 0.7, 0.5, 0.5, 0.35, 0.4, 0.4, 0.2]),
    ("Wine and Paint Night", "Paint canvases while sipping wine.", [0.4, 0.0, 0.3, 0.5, 0.75, 0.45, 0.3, 0.5, 0.4]),
    ("Camping Weekend", "Full weekend camping with hiking and campfire.", [0.3, 1.0, 0.7, 0.15, 0.5, 1.0, 0.5, 0.75, 0.8]),
    ("Paddleboarding", "Stand-up paddleboard on a calm lake.", [0.4, 1.0, 0.7, 0.3, 0.5, 0.35, 0.4, 0.4, 0.3]),
    ("Moonlit Picnic", "Late-night picnic under the moon.", [0.15, 1.0, 0.15, 0.1, 0.9, 0.35, 0.5, 0.85, 0.7]),
    ("Record Store Browsing", "Dig through vinyl records and share music tastes.", [0.2, 0.0, 0.25, 0.3, 0.5, 0.35, 0.3, 0.35, 0.6]),
    ("Couples Photoshoot", "Hire a photographer or take creative self-portraits.", [0.4, 0.5, 0.4, 0.3, 0.5, 0.35, 0.5, 0.7, 0.3]),
    ("Ferry Boat Ride", "Take a scenic ferry ride across the water.", [0.3, 1.0, 0.15, 0.4, 0.5, 0.35, 0.3, 0.55, 0.5]),
    ("Geocaching Adventure", "Use GPS to find hidden caches outdoors.", [0.0, 1.0, 0.6, 0.2, 0.5, 0.55, 0.7, 0.35, 0.4]),
    ("Tapas Bar Tour", "Hop between tapas restaurants trying small plates.", [0.5, 0.0, 0.4, 0.6, 0.75, 0.55, 0.5, 0.55, 0.5]),
    ("Hammock Hangout", "Lie in a hammock together reading or chatting.", [0.0, 1.0, 0.05, 0.05, 0.5, 0.45, 0.1, 0.6, 0.65]),
    ("Dance Party at Home", "Create a playlist and dance in the living room.", [0.0, 0.0, 0.7, 0.05, 0.8, 0.25, 0.4, 0.65, 0.15]),
    ("Museum Scavenger Hunt", "Create a scavenger hunt list inside a museum.", [0.3, 0.0, 0.5, 0.5, 0.5, 0.45, 0.6, 0.4, 0.4]),
    ("Hot Spring Visit", "Soak in natural hot springs together.", [0.4, 1.0, 0.1, 0.3, 0.5, 0.55, 0.4, 0.75, 0.6]),
    ("DIY Terrarium Making", "Build miniature garden terrariums together.", [0.3, 0.0, 0.3, 0.15, 0.5, 0.35, 0.4, 0.4, 0.5]),
    ("Rooftop Stargazing", "Watch stars from a building rooftop with drinks.", [0.1, 1.0, 0.1, 0.1, 0.9, 0.35, 0.4, 0.8, 0.7]),
    ("Fruit Picking Farm", "Pick strawberries, blueberries, or seasonal fruit.", [0.2, 1.0, 0.4, 0.4, 0.25, 0.35, 0.3, 0.4, 0.4]),
    ("Underground Comedy Club", "Watch standup in an intimate basement venue.", [0.4, 0.0, 0.4, 0.6, 0.8, 0.35, 0.5, 0.4, 0.25]),
    ("Sunset Rooftop Dinner", "Dine on a rooftop as the sun sets.", [0.8, 1.0, 0.15, 0.4, 0.75, 0.45, 0.5, 0.85, 0.65]),
    ("Origami Workshop", "Learn paper folding art together.", [0.2, 0.0, 0.2, 0.3, 0.5, 0.35, 0.4, 0.35, 0.4]),
    ("Biking Through Vineyards", "Cycle through wine country scenery.", [0.4, 1.0, 0.7, 0.2, 0.5, 0.55, 0.5, 0.55, 0.5]),
    ("Candle Making Class", "Create custom scented candles together.", [0.3, 0.0, 0.3, 0.3, 0.5, 0.35, 0.4, 0.45, 0.5]),
    ("Late Night Diner Date", "Hit a retro diner for milkshakes and fries.", [0.2, 0.0, 0.2, 0.4, 0.9, 0.25, 0.3, 0.45, 0.5]),
    ("Horseback Trail Ride", "Guided horseback ride through scenic trails.", [0.6, 1.0, 0.5, 0.3, 0.5, 0.45, 0.5, 0.6, 0.5]),
    ("Indoor Rock Wall", "Try indoor rock climbing at a gym.", [0.4, 0.0, 0.8, 0.5, 0.5, 0.35, 0.4, 0.3, 0.2]),
    ("Outdoor Yoga Session", "Practice yoga together in a park at sunrise.", [0.1, 1.0, 0.5, 0.3, 0.2, 0.25, 0.3, 0.6, 0.5]),
    ("Secret Bar Discovery", "Hunt for a hidden speakeasy bar.", [0.5, 0.0, 0.3, 0.4, 0.8, 0.45, 0.8, 0.65, 0.5]),
    ("Kite Flying", "Fly colorful kites at a windy beach or hill.", [0.1, 1.0, 0.4, 0.3, 0.5, 0.35, 0.3, 0.35, 0.4]),
    ("Casino Night Out", "Try your luck at a casino with a set budget.", [0.5, 0.0, 0.5, 0.8, 0.8, 0.55, 0.6, 0.45, 0.3]),
    ("Waterfall Hike", "Hike to a hidden waterfall in nature.", [0.0, 1.0, 0.8, 0.2, 0.25, 0.65, 0.6, 0.6, 0.6]),
    ("Ramen Shop Crawl", "Try ramen at multiple shops in one evening.", [0.3, 0.0, 0.3, 0.5, 0.75, 0.45, 0.4, 0.35, 0.4]),
    ("Bungee Jumping", "Take the leap together off a bridge or platform.", [0.7, 1.0, 0.9, 0.5, 0.5, 0.15, 0.95, 0.4, 0.1]),
    ("Greenhouse Cafe Visit", "Have coffee in a plant-filled greenhouse cafe.", [0.3, 0.0, 0.15, 0.3, 0.5, 0.35, 0.3, 0.5, 0.6]),
    ("Salsa Night at Club", "Dance salsa at a Latin dance club.", [0.3, 0.0, 0.8, 0.8, 0.8, 0.45, 0.5, 0.65, 0.15]),
    ("Outdoor Movie Blanket", "Set up a projector outdoors for a private screening.", [0.2, 1.0, 0.1, 0.1, 0.8, 0.45, 0.5, 0.7, 0.3]),
    ("Ceramic Painting Studio", "Paint pre-made ceramics at a studio.", [0.3, 0.0, 0.25, 0.3, 0.5, 0.35, 0.3, 0.4, 0.5]),
    ("Scenic Overlook Sunset", "Drive to a hilltop overlook to watch sunset.", [0.1, 1.0, 0.1, 0.1, 0.75, 0.25, 0.3, 0.75, 0.65]),
    ("Cooking a New Cuisine", "Pick a new cuisine and cook it together from recipes.", [0.3, 0.0, 0.5, 0.1, 0.75, 0.55, 0.5, 0.5, 0.5]),
    ("Fish Feeding at Pond", "Feed fish at a tranquil garden pond.", [0.0, 1.0, 0.1, 0.2, 0.5, 0.2, 0.15, 0.4, 0.5]),
    ("Drive-Through Light Show", "Drive through a holiday or art light installation.", [0.3, 0.5, 0.1, 0.3, 0.8, 0.25, 0.5, 0.6, 0.3]),
    ("Live Podcast Recording", "Attend a live taping of a favorite podcast.", [0.4, 0.0, 0.3, 0.6, 0.75, 0.35, 0.5, 0.3, 0.4]),
    ("Charity Gala", "Dress up and attend a charity event together.", [0.8, 0.0, 0.4, 0.8, 0.75, 0.55, 0.5, 0.6, 0.4]),
    ("Treehouse Stay", "Spend a night in a treehouse rental.", [0.7, 0.5, 0.3, 0.05, 0.75, 1.0, 0.8, 0.85, 0.7]),
    ("Sunrise Coffee Run", "Wake up early for the best coffee spot in town.", [0.2, 0.5, 0.3, 0.3, 0.15, 0.15, 0.2, 0.35, 0.5]),
    ("Couples Journal Session", "Write or draw in shared journals side by side.", [0.05, 0.0, 0.1, 0.05, 0.5, 0.35, 0.3, 0.6, 0.85]),
    ("Water Park Day", "Enjoy slides and wave pools at a water park.", [0.5, 1.0, 0.9, 0.8, 0.5, 0.65, 0.5, 0.25, 0.15]),
    ("Traditional Tea Ceremony", "Experience a guided tea ceremony.", [0.4, 0.0, 0.1, 0.2, 0.5, 0.35, 0.5, 0.55, 0.7]),
    ("Night Photography Walk", "Photograph city lights and architecture at night.", [0.1, 1.0, 0.35, 0.3, 0.85, 0.45, 0.4, 0.45, 0.5]),
    ("Parasailing", "Soar above the ocean attached to a parachute.", [0.7, 1.0, 0.7, 0.4, 0.5, 0.2, 0.85, 0.5, 0.1]),
    ("Indoor Picnic", "Set up a picnic blanket with fairy lights indoors.", [0.15, 0.0, 0.1, 0.05, 0.75, 0.35, 0.4, 0.75, 0.6]),
    ("Street Food Crawl", "Walk through a city tasting street food vendors.", [0.3, 1.0, 0.5, 0.7, 0.75, 0.45, 0.5, 0.35, 0.4]),
    ("Sunset Paddleboating", "Pedal a paddleboat on a lake at sunset.", [0.3, 1.0, 0.5, 0.2, 0.75, 0.35, 0.4, 0.65, 0.5]),
    ("Murder Mystery Dinner", "Attend a themed murder mystery dinner event.", [0.6, 0.0, 0.5, 0.6, 0.75, 0.55, 0.7, 0.4, 0.4]),
    ("Hot Chocolate & Bookshop", "Warm drinks and browsing books on a cold day.", [0.2, 0.0, 0.1, 0.2, 0.5, 0.35, 0.2, 0.5, 0.6]),
    ("Tandem Biking", "Ride a tandem bicycle through a scenic route.", [0.3, 1.0, 0.6, 0.3, 0.5, 0.35, 0.5, 0.45, 0.3]),
    ("Bonfire & S'mores", "Build a fire and make s'mores under the stars.", [0.1, 1.0, 0.2, 0.15, 0.85, 0.45, 0.3, 0.7, 0.65]),
    ("Glass Blowing Class", "Create glass art together with an instructor.", [0.5, 0.0, 0.4, 0.3, 0.5, 0.35, 0.6, 0.4, 0.3]),
    ("Scenic Gondola Ride", "Ride a gondola over mountains or cityscape.", [0.6, 1.0, 0.1, 0.3, 0.5, 0.25, 0.5, 0.7, 0.5]),
    ("DIY Tie-Dye Session", "Tie-dye matching shirts together at home.", [0.15, 0.5, 0.4, 0.1, 0.5, 0.35, 0.5, 0.35, 0.3]),
    ("Silent Disco", "Dance with wireless headphones at a silent disco event.", [0.4, 0.0, 0.8, 0.7, 0.8, 0.35, 0.7, 0.45, 0.1]),
    ("Plant Shopping Date", "Visit a nursery and pick plants for your space.", [0.2, 0.5, 0.25, 0.3, 0.25, 0.35, 0.2, 0.4, 0.5]),
    ("Rooftop Picnic", "Picnic on a rooftop with city views.", [0.2, 1.0, 0.15, 0.15, 0.75, 0.35, 0.5, 0.7, 0.6]),
    ("Escape the City Drive", "Spontaneous drive to a small town or vista.", [0.2, 1.0, 0.4, 0.15, 0.5, 0.65, 0.6, 0.55, 0.7]),
    ("Meditation Session Together", "Guided couples meditation at home or a studio.", [0.15, 0.0, 0.05, 0.1, 0.25, 0.25, 0.3, 0.6, 0.5]),
    ("Craft Beer Tasting", "Sample flights at a local craft brewery.", [0.4, 0.0, 0.3, 0.5, 0.75, 0.35, 0.4, 0.4, 0.45]),
    ("Sunrise Fishing", "Early morning fishing trip to a quiet lake.", [0.2, 1.0, 0.3, 0.1, 0.15, 0.55, 0.3, 0.45, 0.6]),
    ("Luxury Brunch", "Indulge in a high-end brunch at a top restaurant.", [0.8, 0.0, 0.2, 0.5, 0.3, 0.35, 0.3, 0.6, 0.5]),
    ("Bird Watching Walk", "Spot birds with binoculars in a nature reserve.", [0.1, 1.0, 0.3, 0.1, 0.25, 0.45, 0.2, 0.35, 0.6]),
    ("VR Gaming Session", "Play virtual reality games together at an arcade.", [0.4, 0.0, 0.6, 0.4, 0.5, 0.35, 0.7, 0.25, 0.2]),
    ("Sunset Yacht Watch", "Watch sunset from a dock or rented yacht.", [0.7, 1.0, 0.1, 0.2, 0.75, 0.35, 0.5, 0.85, 0.6]),
    ("Cooking Show Binge & Cook", "Watch a cooking show then recreate the recipes.", [0.2, 0.0, 0.4, 0.1, 0.75, 0.55, 0.4, 0.45, 0.4]),
    ("Snow Tubing", "Slide down snowy hills on inflatable tubes.", [0.3, 1.0, 0.7, 0.5, 0.5, 0.35, 0.5, 0.35, 0.2]),
    ("Lantern Festival", "Attend a lantern lighting festival or release lanterns.", [0.3, 1.0, 0.3, 0.6, 0.8, 0.35, 0.7, 0.75, 0.4]),
    ("Book Exchange Date", "Each bring a favorite book to swap and discuss.", [0.0, 0.0, 0.1, 0.15, 0.5, 0.35, 0.3, 0.4, 0.8]),
    ("Treetop Adventure Course", "Navigate rope bridges and obstacles in trees.", [0.5, 1.0, 0.85, 0.4, 0.5, 0.45, 0.7, 0.3, 0.15]),
    ("Sake Tasting Night", "Sample different sakes at a Japanese restaurant.", [0.5, 0.0, 0.2, 0.4, 0.75, 0.35, 0.5, 0.55, 0.5]),
    ("Build a Fort", "Construct a blanket fort and watch movies inside.", [0.0, 0.0, 0.2, 0.0, 0.8, 0.55, 0.4, 0.65, 0.4]),
    ("Private Chef Experience", "Hire a chef to cook a meal in your home.", [1.0, 0.0, 0.1, 0.1, 0.75, 0.55, 0.6, 0.9, 0.7]),
    ("Outdoor Sketching", "Sit outdoors and sketch the scenery together.", [0.05, 1.0, 0.15, 0.2, 0.5, 0.45, 0.3, 0.45, 0.5]),
    ("Cloud Watching", "Lie on grass and identify shapes in the clouds.", [0.0, 1.0, 0.05, 0.05, 0.5, 0.35, 0.1, 0.55, 0.6]),
    ("Outdoor Concert Festival", "Attend a multi-act outdoor music festival.", [0.6, 1.0, 0.7, 0.9, 0.5, 0.8, 0.6, 0.4, 0.2]),
    ("Cheese Tasting", "Sample artisan cheeses at a fromagerie.", [0.4, 0.0, 0.15, 0.3, 0.5, 0.35, 0.4, 0.55, 0.5]),
    ("Scenic Bridge Walk", "Walk across a famous bridge at golden hour.", [0.0, 1.0, 0.35, 0.4, 0.75, 0.25, 0.2, 0.6, 0.6]),
    ("Thai Cooking Class", "Learn to cook Thai dishes with a local chef.", [0.5, 0.0, 0.5, 0.4, 0.75, 0.55, 0.5, 0.45, 0.4]),
    ("Couples Bucket List Night", "Write your bucket list together over drinks.", [0.1, 0.0, 0.1, 0.05, 0.75, 0.35, 0.4, 0.7, 0.9]),
    ("Starlit Boat Ride", "Row a small boat on a lake under the stars.", [0.3, 1.0, 0.3, 0.05, 0.9, 0.35, 0.5, 0.9, 0.7]),
    ("Holiday Market Visit", "Browse a seasonal holiday market together.", [0.3, 1.0, 0.4, 0.7, 0.75, 0.35, 0.4, 0.45, 0.4]),
    ("DIY Gift Making", "Make handmade gifts for each other.", [0.15, 0.0, 0.35, 0.05, 0.5, 0.55, 0.5, 0.65, 0.4]),
    ("Astronomy Event", "Attend a public telescope night or meteor shower viewing.", [0.1, 1.0, 0.15, 0.4, 0.9, 0.45, 0.5, 0.6, 0.6]),
    ("Speed Boat Ride", "Take an exhilarating speedboat ride.", [0.6, 1.0, 0.7, 0.4, 0.5, 0.2, 0.7, 0.4, 0.1]),
    ("Mural Painting Together", "Paint a mural or large canvas as a team.", [0.2, 0.5, 0.5, 0.2, 0.5, 0.55, 0.5, 0.4, 0.4]),
    ("Japanese Garden Visit", "Walk through a peaceful Japanese garden.", [0.2, 1.0, 0.15, 0.3, 0.5, 0.35, 0.2, 0.6, 0.65]),
    ("Perfume Making Workshop", "Create custom fragrances together.", [0.5, 0.0, 0.25, 0.3, 0.5, 0.35, 0.6, 0.6, 0.4]),
    ("Pillow Fight", "Spontaneous playful pillow fight at home.", [0.0, 0.0, 0.6, 0.0, 0.8, 0.1, 0.5, 0.45, 0.1]),
    ("Scenic Cable Car Ride", "Ride a cable car with panoramic views.", [0.4, 1.0, 0.1, 0.4, 0.5, 0.25, 0.4, 0.55, 0.4]),
    ("Farmers Market Cooking", "Buy ingredients at the market, then cook together.", [0.3, 0.5, 0.5, 0.4, 0.25, 0.65, 0.4, 0.5, 0.5]),
    ("Haunted House Visit", "Brave a haunted house attraction together.", [0.3, 0.0, 0.7, 0.6, 0.8, 0.25, 0.8, 0.4, 0.15]),
    ("Lighthouse Visit", "Climb a coastal lighthouse and enjoy the view.", [0.1, 1.0, 0.4, 0.3, 0.5, 0.35, 0.3, 0.55, 0.55]),
    ("Karaoke Duet at Home", "Sing duets together with a karaoke app at home.", [0.0, 0.0, 0.6, 0.0, 0.8, 0.35, 0.3, 0.5, 0.2]),
    ("Dessert Bar Crawl", "Visit multiple dessert spots in one evening.", [0.4, 0.0, 0.3, 0.5, 0.75, 0.45, 0.5, 0.5, 0.4]),
    ("Sunrise Hot Air Balloon", "Float over landscapes at dawn in a balloon.", [1.0, 1.0, 0.2, 0.2, 0.15, 0.55, 0.9, 0.9, 0.6]),
    ("Couple's Trivia Night", "Host your own trivia night about each other.", [0.0, 0.0, 0.4, 0.0, 0.75, 0.35, 0.5, 0.55, 0.7]),
    ("Beach Sunrise Yoga", "Practice yoga on the beach at sunrise.", [0.0, 1.0, 0.5, 0.2, 0.15, 0.25, 0.3, 0.6, 0.4]),
    ("Scenic Waterfront Dinner", "Dine at a restaurant with waterfront views.", [0.7, 0.5, 0.15, 0.4, 0.75, 0.55, 0.3, 0.8, 0.65]),
    ("Treasure Map Adventure", "Create clues leading to a surprise gift or location.", [0.2, 0.5, 0.5, 0.1, 0.5, 0.55, 0.9, 0.7, 0.4]),
]

start_id = len(activities)
for i, (name, desc, vec) in enumerate(new_activities):
    activities.append({
        "id": start_id + i,
        "name": name,
        "description": desc,
        "vector": [round(v, 3) for v in vec],
    })

print(f"Total activities: {len(activities)}")

# Write output
output_path = os.path.join(os.path.dirname(__file__), "data", "activities.json")
with open(output_path, "w") as f:
    json.dump(activities, f, indent=2)

print(f"Written to {output_path}")
