from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import init_db
from backend.app.api.health import router as health_router
from backend.app.api.issues import router as issues_router
from backend.app.api.repairs import router as repairs_router
from backend.app.api.demo import router as demo_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    await init_db()
    yield


app = FastAPI(
    title="OSS Quest + PHOENIX Recovery Engine API",
    description="Autonomous software recovery engine for BharatCode Build League. Finds issues, fixes code, and proves repairs with empirical test logs.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 routes
app.include_router(health_router, prefix="/api/v1")
app.include_router(issues_router, prefix="/api/v1")
app.include_router(repairs_router, prefix="/api/v1")
app.include_router(demo_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "product": "OSS Quest",
        "engine": "PHOENIX Autonomous Software Recovery Engine",
        "tagline": "Find the issue. Fix the code. Prove the repair.",
        "event": "BharatCode Build League",
        "docs_url": "/docs",
        "health_check": "/api/v1/health",
    }
