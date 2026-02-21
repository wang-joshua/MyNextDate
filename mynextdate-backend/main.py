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
    """Wait for Actian DB, seed if needed, and warm the vector cache."""
    import os
    import json
    import asyncio
    from services.actian_service import get_client, init_collection, seed_activities, ensure_cache
    from config import COLLECTION_NAME

    activities_path = os.path.join(os.path.dirname(__file__), "data", "activities.json")
    with open(activities_path) as f:
        expected = len(json.load(f))

    for attempt in range(1, 13):
        try:
            client = get_client()
            init_collection(client)
            count = client.get_vector_count(COLLECTION_NAME)
            if count < expected:
                print(f"DB has {count} activities, JSON has {expected} — seeding...")
                seed_activities(client, activities_path)
            ensure_cache()
            print("Startup complete.")
            return
        except Exception as e:
            print(f"Startup attempt {attempt}/12 failed: {e}")
            if attempt < 12:
                await asyncio.sleep(5)

    print("Warning: Could not connect to Actian DB after 12 attempts. Requests will fail until DB is available.")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "mynextdate"}
