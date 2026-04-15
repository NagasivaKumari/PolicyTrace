from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from ..services.db import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
db = get_db()

class WatchlistAdd(BaseModel):
    wallet: str
    url: str

class WatchlistRemove(BaseModel):
    wallet: str
    domain: str

@router.post("/add")
async def add_to_watchlist(req: WatchlistAdd):
    """Adds a domain to the user's continuous monitoring list."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")

    # Clean the URL to extract domain
    domain = req.url.split("//")[-1].split("/")[0].strip().lower()
    if not domain:
        raise HTTPException(status_code=400, detail="Invalid URL format")

    existing = db.watchlist.find_one({
        "wallet": req.wallet,
        "domain": domain
    })

    if existing:
        return {"message": "Domain already in watchlist", "domain": domain}

    db.watchlist.insert_one({
        "wallet": req.wallet,
        "domain": domain,
        "url": f"https://{domain}",
        "last_checked": None,
        "last_hash": None,
        "created_at": datetime.utcnow()
    })

    return {"status": "added", "domain": domain}

@router.get("/{wallet}")
async def get_watchlist(wallet: str):
    """Retrieves all domains currently being monitored for a specific wallet."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")

    items = list(db.watchlist.find(
        {"wallet": wallet},
        {"_id": 0}
    ).sort("created_at", -1))
    
    return items

@router.post("/remove")
async def remove_from_watchlist(req: WatchlistRemove):
    """Stops monitoring a domain for the user."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")

    db.watchlist.delete_one({
        "wallet": req.wallet,
        "domain": req.domain.lower()
    })

    return {"status": "removed", "domain": req.domain}
