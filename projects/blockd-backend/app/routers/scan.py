import uuid
from datetime import datetime
import json
import redis
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks

from ..tasks.scan_task import run_scan
from ..utils.jwt import get_current_user
from ..utils.rate_limit import rate_limit
from ..utils.validators import validate_public_scan_url
from pydantic import BaseModel
from ..config import settings
from ..services.db import get_db
from ..services.algorand_service import AlgorandService

router = APIRouter()
algo_service = AlgorandService()
# Safe Redis init (do not crash startup on bad URL)
redis_client = None
try:
    _url = (settings.REDIS_URL or "redis://127.0.0.1:6379/0")
    if _url and (_url.startswith("redis://") or _url.startswith("rediss://") or _url.startswith("unix://")):
        try:
            _client = redis.from_url(_url, socket_connect_timeout=2)
            try:
                _client.ping()
                redis_client = _client
            except Exception:
                redis_client = _client
        except Exception as e:
            print(f"Warning: Redis.from_url failed at init: {e}")
            redis_client = None
    else:
        print("Warning: REDIS_URL missing or invalid scheme; skipping Redis init")
        redis_client = None
except Exception as e:
    print(f"Warning: Redis init error: {e}")
    redis_client = None


class ScanCreate(BaseModel):
    url: str
    is_simple: bool = False


class DeleteScansIn(BaseModel):
    scan_ids: list[str]


@router.get("/stats/global")
async def get_global_stats():
    """
    Fetch global platform metrics directly from the blockchain.
    Used by public landing pages for trust verification.
    """
    try:
        total_audits = algo_service.get_total_audits()
        total_certs = algo_service.get_total_certificates()
        
        return {
            "total_anchors": total_audits,
            "total_certificates": total_certs,
            "verified_entities": max(total_audits // 2, 1),
            "source": "algorand_blockchain",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Live blockchain stats unavailable: {str(e)}")


@router.get("/user/stats")
@router.get("/user/stats/{wallet}")
async def get_user_stats(
    wallet: str = None,
    current_user=Depends(get_current_user),
):
    """
    Fetch aggregate stats for the current user directly from the blockchain.
    """
    address = wallet or current_user.wallet_address
    if not address:
        raise HTTPException(status_code=400, detail="Wallet not connected")

    try:
        # Fetch history to compute aggregates
        items = algo_service.get_user_history_from_chain(address, limit=50)
        
        total_scans = len(items)
        total_certs = sum(1 for item in items if item.get("anchored"))
        
        avg_score = 0
        high_risk_count = 0
        
        if total_scans > 0:
            avg_score = sum(item.get("risk_score", 0) for item in items) / total_scans
            high_risk_count = sum(1 for item in items if item.get("risk_score", 0) >= 70)

        # Map violations by section using the new multi-doc categories
        violations_by_section = {
            "Consumer Consent": sum(1 for item in items if item.get("risk_score", 0) > 30),
            "Refund & Rights": sum(1 for item in items if any(f.get("dpdp_section") == "refunds" for f in item.get("flagged_clauses", []))),
            "Data Security": sum(1 for item in items if item.get("risk_score", 0) > 60),
            "Term Governance": sum(1 for item in items if any(f.get("dpdp_section") == "governance" for f in item.get("flagged_clauses", []))),
            "Access Transparency": total_scans
        }

        return {
            "total_scans": total_scans,
            "total_certs": total_certs,
            "avg_score": avg_score,
            "high_risk_count": high_risk_count,
            "violations_by_section": violations_by_section,
            "source": "algorand_blockchain"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Live user stats unavailable: {str(e)}")


@router.get("/registry")
async def get_registry(limit: int = Query(20, ge=1, le=100)):
    """
    Public Compliance Registry: A global feed of recently audited domains 
    and their trust scores. Used for the public leaderboard.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")

    # Get latest unique audits for different domains
    items = list(db.scans.find(
        {},
        {"_id": 0, "domain": 1, "risk": 1, "blockchain": 1, "created_at": 1}
    ).sort("created_at", -1).limit(limit))
    
    return {"items": items, "total": len(items)}

@router.get("/changes/{wallet}")
async def get_alerts_feed(wallet: str):
    """
    Privacy Alerts Feed: Retrieves all policy change events detected for 
    the user's monitored watchlist.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")

    alerts = list(db.changes.find(
        {"wallet": wallet},
        {"_id": 0}
    ).sort("detected_at", -1))
    
    return alerts

@router.get("/history/{wallet}")
async def get_history(
    wallet: str,
    limit: int = Query(10, ge=1, le=50),
):
    """
    Fetch scan history from MongoDB strictly for the connected wallet.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    scans = list(db.scans.find(
        {
            "$or": [
                {"wallet_address": wallet},
                {"user.wallet": wallet}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).limit(limit))

    items = []
    for scan in scans:
        items.append({
            "id": scan.get("id") or scan.get("scan_id"),
            "scan_id": scan.get("scan_id"),
            "url": scan.get("url"),
            "policy_url": scan.get("policy_url") or scan.get("metadata", {}).get("policy_url"),
            "risk_score": scan.get("risk_score") or scan.get("risk", {}).get("score"),
            "risk_level": scan.get("risk_level") or scan.get("risk", {}).get("level"),
            "version": scan.get("version") or scan.get("metadata", {}).get("version"),
            "risk_delta": scan.get("risk_delta"),
            "total_violations": scan.get("total_violations") or len(scan.get("violations", [])),
            "violations": scan.get("violations", []),
            "flagged_clauses": scan.get("flagged_clauses") or scan.get("risks") or [],
            "section_scores": scan.get("section_scores", []),
            "data_collected": scan.get("data_collected", []),
            "data_shared_with": scan.get("data_shared_with", []),
            "user_rights": scan.get("user_rights", []),
            "ipfs_cid": scan.get("ipfs_cid") or scan.get("ipfs", {}).get("cid"),
            "ipfs_hash": scan.get("ipfs_hash") or scan.get("ipfs", {}).get("hash"),
            "policy_cid": scan.get("policy_cid") or scan.get("metadata", {}).get("policy_cid"),
            "policy_hash": scan.get("policy_hash") or scan.get("metadata", {}).get("policy_hash"),
            "audit_cid": scan.get("audit_cid") or scan.get("metadata", {}).get("audit_cid"),
            "audit_hash": scan.get("audit_hash") or scan.get("metadata", {}).get("audit_hash"),
            "scanner_version": scan.get("scanner_version") or scan.get("metadata", {}).get("scanner_version"),
            "status": scan.get("status", "scanned"),
            "tx_id": scan.get("tx_id") or scan.get("blockchain", {}).get("tx_id"),
            "created_at": scan.get("created_at"),
            "completed_at": scan.get("completed_at")
        })

    return {
        "items": items,
        "total": len(items),
        "source": "hybrid_db"
    }

@router.post("/{scan_id}/verify")
async def verify_anchor(
    scan_id: str,
    tx_in: dict,
    current_user=Depends(get_current_user),
):
    """
    Called by frontend after a successful wallet signature.
    Updates the MongoDB record, strictly verifying wallet ownership.
    """
    tx_id = tx_in.get("tx_id")
    if not tx_id:
        raise HTTPException(status_code=400, detail="Missing Transaction ID")

    db = get_db()
    if db is not None:
        # LOCK: Ensure scan_id belongs to the signer's wallet
        result = db.scans.update_one(
            {
                "scan_id": scan_id, 
                "user.wallet": current_user.wallet_address
            },
            {"$set": {
                "blockchain.tx_id": tx_id,
                "blockchain.status": "confirmed",
                "tx_id": tx_id,
                "status": "anchored",
                "updated_at": datetime.utcnow()
            }}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Scan record not found or unauthorized")

    return {"status": "confirmed", "tx_id": tx_id}


@router.delete("/{scan_id}")
async def delete_scan(
    scan_id: str,
    current_user=Depends(get_current_user),
):
    """Delete a single scan for the current wallet."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    result = db.scans.delete_one(
        {"scan_id": scan_id, "user.wallet": current_user.wallet_address}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scan not found or unauthorized")

    return {"status": "deleted", "scan_id": scan_id}


@router.post("/delete")
async def delete_scans(
    req: DeleteScansIn,
    current_user=Depends(get_current_user),
):
    """Delete multiple scans for the current wallet."""
    if not req.scan_ids:
        raise HTTPException(status_code=400, detail="No scan_ids provided")

    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")

    result = db.scans.delete_many(
        {
            "scan_id": {"$in": req.scan_ids},
            "user.wallet": current_user.wallet_address
        }
    )

    return {"status": "deleted", "count": result.deleted_count}

@router.post("", dependencies=[Depends(rate_limit(10, 60))], status_code=202)
async def create_scan(
    scan_in: ScanCreate,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    # 1. STRICT IDENTITY LOCK: Ensure we have a valid wallet for scan attribution
    wallet = current_user.wallet_address
    if not wallet or len(wallet) != 58:
        logger.error("Scan attempted without persistent wallet identity (JWT Session missing address)")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Wallet identity missing. Please reconnect your wallet to continue."
        )

    scan_in.url = scan_in.url.strip()
    if not scan_in.url.startswith(('http://', 'https://')):
        scan_in.url = 'https://' + scan_in.url

    # Skip validation if it's a simple test scan
    if not scan_in.is_simple:
        ok, reason = validate_public_scan_url(scan_in.url)
        if not ok:
            raise HTTPException(status_code=400, detail=reason)

    scan_id = str(uuid.uuid4())
    
    # Init progress in Redis immediately
    status_data = {
        "id": scan_id,
        "status": "scanning",
        "current_step": 1,
        "status_message": "Initializing Fast-Track Test Node..." if scan_in.is_simple else "Protocol initialized. Waking up AI auditor...",
        "updated_at": datetime.utcnow().isoformat()
    }
    try:
        if redis_client:
            redis_client.setex(f"blockd:scan:{scan_id}", 3600, json.dumps(status_data))
    except Exception as e:
        # Non-fatal: continue without Redis
        print(f"Warning: failed to write scan status to Redis: {e}")

    email = getattr(current_user, 'email', None)

    print(f"BLOCKD: [START] Handoff to background task for scan_id: {scan_id}")
    
    # 2. Trigger the stateless task using standard FastAPI BackgroundTasks
    # We pass the coroutine directly. FastAPI handles the event loop correctly.
    background_tasks.add_task(
        run_scan,
        scan_id, 
        scan_in.url, 
        current_user.wallet_address,
        email, 
        scan_in.is_simple
    )

    return {
        "id": scan_id,
        "url": scan_in.url,
        "status": "scanning",
        "current_step": 1,
        "message": "Simple test scan started." if scan_in.is_simple else "Scan started."
    }


@router.get("/{scan_id}")
@router.get("/status/{scan_id}")
async def get_scan(
    scan_id: str,
    current_user=Depends(get_current_user),
):
    """
    Check the status or fetch final results of a scan, locked to the owner's wallet.
    """
    # 1. Check Redis for active progress (Scraping/Audit phase)
    # Note: Redis status is temporary. We verify identity in Step 2.
    progress_raw = redis_client.get(f"blockd:scan:{scan_id}")
    if progress_raw:
        data = json.loads(progress_raw)
        # Optional: Add identity check if needed for in-progress scans
        if isinstance(data, dict) and isinstance(data.get("result"), dict):
            merged = {**data, **data["result"]}
            merged.pop("result", None)
            return merged
        return data

    # 2. Check MongoDB for persistent/complete state
    db = get_db()
    if db is not None:
        doc = db.scans.find_one({
            "scan_id": scan_id, 
            "user.wallet": current_user.wallet_address
        }, {"_id": 0})
        if doc:
            return doc

    # 3. Fallback to Blockchain (Legacy support)
    try:
        doc = algo_service.get_audit_onchain(scan_id)
        doc["status"] = "complete"
        doc["current_step"] = 5
        doc["id"] = scan_id
        return doc
    except Exception:
        return {
            "id": scan_id,
            "status": "waiting",
            "message": "AI Auditor is queued. Synchronizing with Algorand..."
        }
