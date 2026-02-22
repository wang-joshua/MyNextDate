from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.recommend import router as recommend_router
from routes.dates import router as dates_router
from routes.analytics import router as analytics_router

app = FastAPI(title="MyNextDate API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommend_router)
app.include_router(dates_router)
app.include_router(analytics_router)


@app.on_event("startup")
async def startup():
    """Seed the Actian DB (if needed), warm vector cache, and ensure location table exists."""
    import os
    from services.actian_service import get_client, init_collection, seed_activities, ensure_cache

    try:
        client = get_client()
        # Create collection + seed if it's empty
        init_collection(client)
        stats = client.describe_collection("date_activities")
        count = getattr(stats, "point_count", 0) or getattr(stats, "vectors_count", 0) or 0
        if count == 0:
            activities_path = os.path.join(os.path.dirname(__file__), "data", "activities.json")
            seed_activities(client, activities_path)
        ensure_cache()
    except Exception as e:
        print(f"Warning: Startup init failed: {e}")

    # Ensure user_locations table exists in Supabase
    await _ensure_location_table()


async def _ensure_location_table():
    """Create user_locations table if it doesn't exist."""
    import httpx
    from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

    # Extract project ref from URL (https://xxx.supabase.co -> xxx)
    project_ref = SUPABASE_URL.replace("https://", "").split(".")[0]

    sql = """
    CREATE TABLE IF NOT EXISTS user_locations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL UNIQUE,
        city TEXT NOT NULL,
        region TEXT,
        country TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_user_locations_city ON user_locations(city);
    """

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"https://{project_ref}.supabase.co/rest/v1/rpc/",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                },
                json={"query": sql},
            )
            if resp.status_code < 300:
                print("user_locations table ready.")
            else:
                # Table might already exist or RPC not available — try a test query
                from supabase import create_client
                sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
                sb.table("user_locations").select("id").limit(1).execute()
                print("user_locations table already exists.")
    except Exception as e:
        print(f"Note: Could not auto-create user_locations table: {e}")
        print("Please create it manually in Supabase SQL Editor:")
        print("  CREATE TABLE IF NOT EXISTS user_locations (")
        print("    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,")
        print("    user_id UUID NOT NULL UNIQUE,")
        print("    city TEXT NOT NULL,")
        print("    region TEXT,")
        print("    country TEXT,")
        print("    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()")
        print("  );")
        print("  CREATE INDEX IF NOT EXISTS idx_user_locations_city ON user_locations(city);")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "mynextdate"}
