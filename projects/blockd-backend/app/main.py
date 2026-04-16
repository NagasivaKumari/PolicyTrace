import asyncio
import sys

# MANDATORY: Windows Stability Fix for Playwright/Subprocesses
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from .routers import scan, algorand, user, wallet_auth, regulator, widget, auth, watchlist
from .config import settings
from .services.db import get_db

app = FastAPI(title="BLOCKD API", version="1.0.0")

# Robust CORS Configuration for Web3 Native Handshake
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(watchlist.router, prefix="/api/watchlist", tags=["watchlist"])
app.include_router(scan.router, prefix="/api/scan", tags=["scan"])
app.include_router(algorand.router, prefix="/api", tags=["algorand"])
app.include_router(algorand.router, prefix="/api/algorand", tags=["algorand"])
app.include_router(user.router, prefix="/api/user", tags=["user"])
app.include_router(regulator.router, prefix="/api/regulator", tags=["regulator"])
app.include_router(widget.router, prefix="/api/widget", tags=["widget"])

@app.on_event("startup")
async def startup():
    from .services.db import get_db
    db = get_db()
    if db is not None:
        db.scans.create_index("wallet_address")

@app.get("/health")
async def health():
    """
    Live System Diagnostic: Probes Algorand, Redis, and Local Config.
    """
    from .services.algorand_service import AlgorandService
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "api": "ok",
            "algorand": "unknown",
            "redis": "removed"
        },
        "version": "1.0.0"
    }

    # 1. Probe Algorand
    try:
        algo = AlgorandService()
        status = algo.algod.status()
        health_status["services"]["algorand"] = "ok"
    except Exception as e:
        health_status["services"]["algorand"] = f"error: {str(e)}"
        health_status["status"] = "degraded"

    # Redis removed from runtime. If you relied on REDIS_URL, set up DB-backed alternatives.

    return health_status


@app.get("/debug/config")
async def debug_config():
    """
    Debug endpoint to inspect current CORS and Redis settings at runtime.
    Deploy this temporarily to verify Render env vars without digging into the infra.
    """
    return {
        "cors_origins_list": settings.cors_origins_list,
        "cors_origins_env": settings.CORS_ORIGINS,
        "redis_url": settings.REDIS_URL,
    }


@app.get("/debug/scan/{scan_id}")
async def debug_scan(scan_id: str, token: str | None = None):
    """Return the MongoDB scan document for a given `scan_id` when a valid DEBUG_TOKEN is provided.

    This endpoint is intentionally protected by a token to avoid exposing data publicly.
    Set `DEBUG_TOKEN` in your Render env to use it.
    """
    if not token or token != getattr(settings, "DEBUG_TOKEN", None):
        return {"error": "invalid debug token"}

    db = get_db()
    if db is None:
        return {"error": "database unavailable"}

    doc = db.scans.find_one({"scan_id": scan_id}, {"_id": 0})
    if not doc:
        return {"error": "scan not found"}
    return doc
