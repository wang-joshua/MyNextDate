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
    """Warm the vector cache on boot so requests are instant."""
    from services.actian_service import ensure_cache
    try:
        ensure_cache()
    except Exception as e:
        print(f"Warning: Could not warm cache: {e}")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "mynextdate"}
