from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db
from app.routers import (
    signals,
    checkins,
    capacity,
    loop,
    insights,
    privacy,
    demo
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLModel SQLite tables on startup
    init_db()
    yield

app = FastAPI(
    title="MaxxLoop API",
    description="Closed-Loop AI Wellness Companion Engine (ASYNC 2026)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration for local frontend PWA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all domain routers
app.include_router(signals.router)
app.include_router(checkins.router)
app.include_router(capacity.router)
app.include_router(loop.router)
app.include_router(insights.router)
app.include_router(privacy.router)
app.include_router(demo.router)

@app.get("/health", tags=["system"])
def health_check():
    return {
        "status": "healthy",
        "service": "maxxloop-api",
        "version": "1.0.0",
        "llm_provider": settings.LLM_PROVIDER,
        "demo_mode": settings.DEMO_MODE
    }
