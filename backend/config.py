import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

ACTIAN_HOST = os.getenv("ACTIAN_HOST", "localhost:50051")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

COLLECTION_NAME = "date_activities"
VECTOR_DIMENSION = 9

VECTOR_LABELS = [
    "cost",
    "indoor_outdoor",
    "energy",
    "social_density",
    "time_of_day",
    "duration",
    "surprise",
    "romance_intensity",
    "conversation_depth",
]
