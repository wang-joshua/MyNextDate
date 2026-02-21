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
    """Seed the Actian DB (if needed) and warm the vector cache on boot."""
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


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "mynextdate"}
