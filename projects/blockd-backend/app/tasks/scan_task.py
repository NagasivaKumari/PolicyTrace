import asyncio
import hashlib
import logging
import json
import redis
from datetime import datetime
from ..config import settings
from ..services.db import get_db
from ..services.scraper import extract_privacy_policy
from ..services.scanner import analyze_policy
from ..services.ipfs_service import upload_report, upload_text

db = get_db()

logger = logging.getLogger(__name__)

# Initialize Redis client for status tracking
redis_client = redis.from_url(
    settings.REDIS_URL or "redis://127.0.0.1:6379/0", 
    socket_connect_timeout=2
)

def update_status(scan_id, step, message, status="scanning", metadata=None, result=None):
    """Update intermediate progress in Redis for live UI updates."""
    status_data = {
        "id": scan_id,
        "status": status,
        "current_step": step,
        "status_message": message,
        "updated_at": datetime.utcnow().isoformat()
    }
    if metadata:
        status_data["metadata"] = metadata
    if result:
        status_data["result"] = result

    try:
        redis_client.setex(f"blockd:scan:{scan_id}", 3600, json.dumps(status_data))
    except Exception as e:
        logger.warning(f"Failed to update redis status for {scan_id}: {e}")

async def run_scan(scan_id: str, url: str, wallet_address: str = "", user_email: str = "", is_simple: bool = False or ""):
    """
    Robust Async Scan Orchestrator with Redis Heartbeat.
    Steps:
    1. Scraping (Multi-doc)
    2. Processing & Auditing
    3. IPFS Anchoring
    4. Readiness Signaling
    """
    try:
        # STRICT IDENTITY GUARD: Never allow a scan to run anonymously
        if not wallet_address or len(wallet_address) != 58:
            logger.error("SCAN_TASK: Aborting scan %s. Wallet identity missing or invalid.", scan_id)
            update_status(scan_id, 0, "Error: Authentication identity lost. Please try again.", status="error")
            return

        print(f"DEBUG: [SCAN START] {scan_id} for {url} [WALLET: {wallet_address}]")
        update_status(scan_id, 1, "Opening website and clearing cookies...")

        # Step 1: Scrape all legal docs via Nitro Parallel Engine
        from ..services.smart_scraper import smart_scrape_with_source
        try:
            # Nitro: 60s timeout for parallel cloud discovery (Strict, no fallbacks)
            policy_text, policy_source_url = await asyncio.wait_for(smart_scrape_with_source(url), timeout=60)
        except asyncio.TimeoutError:
            logger.error("Nitro Engine timed out after 60 seconds for %s", url)
            update_status(scan_id, 0, "Error: Site response exceeded 60s limit. Please try again.", status="error")
            return

        # Determine versioning context (per wallet + domain)
        domain = url.split("//")[-1].split("/")[0]
        last_scan = None
        if db is not None:
            last_scan = db.scans.find_one(
                {"user.wallet": wallet_address, "domain": domain},
                {"_id": 0, "version": 1, "risk_score": 1}
            )
        last_version = int(last_scan.get("version", 0)) if last_scan else 0
        next_version = last_version + 1
        last_risk_score = float(last_scan.get("risk_score", 0)) if last_scan else 0.0

        # NEW: High-Risk Fallback for missing policies
        if not policy_text or len(policy_text) < 200:
            logger.warning("No policy discovered for %s. Marking as HIGH RISK.", url)

            # Create a minimal report and upload to IPFS so anchoring has a real CID/HASH
            report_content = {
                "url": url,
                "policy_url": policy_source_url,
                "timestamp": int(datetime.utcnow().timestamp()),
                "risk_score": 95,
                "risk_level": "critical",
                "version": next_version,
                "total_violations": 1,
                "violations": [{
                    "category": "transparency",
                    "severity": "medium",
                    "confidence": 0.6,
                    "impact": 0.3,
                    "evidence": "Policy text could not be retrieved.",
                    "section": "unknown",
                    "explanation": "No policy content available for audit."
                }],
                "flagged_clauses": [{
                    "dpdp_section": "transparency",
                    "severity": "critical",
                    "message": "Missing Mandatory Public Disclosures"
                }],
                "section_scores": [{"section": "compliance", "label": "Full Stack", "score": 0}],
                "policy_hash": "N/A",
                "scanner_version": "v1"
            }
            policy_cid, policy_hash = upload_text("", "blockd_policy.txt")
            report_content["policy"] = {"hash": policy_hash, "snapshot_ipfs": policy_cid}
            audit_cid, audit_hash = upload_report(report_content)

            receiver_addr = settings.receiver_address
            handoff_metadata = {
                "scan_id": scan_id,
                "url_hash": hashlib.sha256(url.strip().encode("utf-8")).hexdigest(),
                "policy_url": policy_source_url,
                "risk_score": 95,
                "version": next_version,
                "ipfs_cid": audit_cid,
                "ipfs_hash": audit_hash,
                "policy_cid": policy_cid,
                "policy_hash": policy_hash,
                "audit_cid": audit_cid,
                "audit_hash": audit_hash,
                "scanner_version": "v1",
                "owner": wallet_address,
                "receiver": receiver_addr
            }

            if db is not None:
                db.scans.insert_one({
                    "id": scan_id,
                    "scan_id": scan_id,
                    "url": url,
                    "policy_url": policy_source_url,
                    "domain": domain,
                    "user": {"wallet": wallet_address, "email": user_email},
                    "risk": {"score": 95, "level": "critical"},
                    "risk_score": 95,
                    "risk_level": "critical",
                    "version": next_version,
                    "risk_delta": 95 - last_risk_score,
                    "total_violations": 1,
                    "violations": report_content.get("violations", []),
                    "flagged_clauses": report_content.get("flagged_clauses", []),
                    "section_scores": report_content.get("section_scores", []),
                    "ipfs_cid": audit_cid,
                    "ipfs_hash": audit_hash,
                    "policy_cid": policy_cid,
                    "policy_hash": policy_hash,
                    "audit_cid": audit_cid,
                    "audit_hash": audit_hash,
                    "wallet_address": wallet_address,
                    "status": "scanned",
                    "tx_id": None,
                    "blockchain": {"tx_id": None, "status": "pending"},
                    "metadata": handoff_metadata,
                    "created_at": datetime.utcnow()
                })

            update_status(scan_id, 2, "Compliance Breach: No policy discovered. Finalizing report...", status="complete")
            
            redis_client.setex(
                f"blockd:scan:{scan_id}",
                3600,
                json.dumps({
                    "id": scan_id,
                    "status": "complete",
                    "current_step": 5,
                    "status_message": "CRITICAL: No privacy policy found. Ready to anchor violation.",
                    "metadata": handoff_metadata,
                    "result": report_content,
                    "updated_at": datetime.utcnow().isoformat()
                })
            )
            return

        # Step 2: AI Analysis
        update_status(scan_id, 2, "AI Auditor is analyzing clauses for compliance...")
        result = analyze_policy(policy_text, policy_source_url)
        policy_hash = hashlib.sha256(policy_text.encode("utf-8")).hexdigest()
        violations = result.get("violations", [])

        # Step 3: Hashing & Readiness
        update_status(scan_id, 3, "Generating audit hash and IPFS anchoring...")
        
        report_content = {
            "url": url,
            "policy_url": policy_source_url,
            "timestamp": int(datetime.utcnow().timestamp()),
            "risk_score": result["risk_score"],
            "risk_level": result["risk_level"],
            "version": next_version,
            "total_violations": result["total_violations"],
            "violations": violations,
            "flagged_clauses": result["flagged_clauses"],
            "section_scores": result["section_scores"],
            "policy_hash": policy_hash,
            "scanner_version": "v1"
        }
        
        # Step 4: IPFS Upload
        update_status(scan_id, 4, "Finalizing compliance report...")
        policy_cid, policy_hash = upload_text(policy_text, "blockd_policy.txt")
        report_content["policy"] = {"hash": policy_hash, "snapshot_ipfs": policy_cid}
        audit_cid, audit_hash = upload_report(report_content)

        # Step 5: Final Handover
        receiver_addr = settings.receiver_address
        print(f"DEBUG: [BACKEND] RECEIVER ADDRESS: {receiver_addr} (LEN: {len(receiver_addr)})")
        
        handoff_metadata = {
            "scan_id": scan_id,
            "url_hash": hashlib.sha256(url.strip().encode("utf-8")).hexdigest(),
            "policy_url": policy_source_url,
            "risk_score": int(result["risk_score"]),
            "version": next_version,
            "ipfs_cid": audit_cid,
            "ipfs_hash": audit_hash,
            "policy_cid": policy_cid,
            "policy_hash": policy_hash,
            "audit_cid": audit_cid,
            "audit_hash": audit_hash,
            "scanner_version": "v1",
            "owner": wallet_address,
            "receiver": receiver_addr
        }

        # NEW: Permanent Persistence (MongoDB) with Blockchain Metadata
        if db is not None:
            try:
                db.scans.insert_one({
                    "id": scan_id, # CRITICAL: satisfies unique index id_1
                    "scan_id": scan_id,
                    "url": url,
                    "policy_url": policy_source_url,
                    "domain": domain,
                    "user": {
                        "wallet": wallet_address,
                        "email": user_email
                    },
                    "risk": {
                        "score": int(result["risk_score"]),
                        "level": result["risk_level"]
                    },
                    "version": next_version,
                    "risk_delta": float(result["risk_score"]) - last_risk_score,
                    "policy_text": policy_text,
                    "risk_score": int(result["risk_score"]),
                    "violations": violations,
                    "categories": [item.get("category") for item in result.get("data_collected", [])],
                    "data_collected": result["data_collected"],
                    "data_shared_with": result["data_shared_with"],
                    "user_rights": result["user_rights"],
                    "risks": result["flagged_clauses"],
                    "ipfs": {
                        "cid": audit_cid,
                        "hash": audit_hash
                    },
                    "ipfs_cid": audit_cid,
                    "ipfs_hash": audit_hash,
                    "policy_cid": policy_cid,
                    "policy_hash": policy_hash,
                    "audit_cid": audit_cid,
                    "audit_hash": audit_hash,
                    "wallet_address": wallet_address,
                    "tx_id": None,
                    "status": "scanned",
                    "blockchain": {
                        "tx_id": None,
                        "status": "pending"
                    },
                    "metadata": handoff_metadata, # CRITICAL: Save this for later anchoring!
                    "created_at": datetime.utcnow()
                })
            except Exception as e:
                logger.error(f"Failed to save scan to MongoDB: {e}")

        # 🔥 FINAL UNIFIED HANDOFF: Delivering Status + Metadata Atomically
        result_payload = {
            "id": scan_id,
            "url": url,
            "policy_url": policy_source_url,
            "risk_score": int(result["risk_score"]),
            "risk_level": result["risk_level"],
            "version": next_version,
            "risk_delta": float(result["risk_score"]) - last_risk_score,
            "total_violations": result["total_violations"],
            "violations": violations,
            "data_collected": result["data_collected"],
            "data_shared_with": result["data_shared_with"],
            "user_rights": result["user_rights"],
            "flagged_clauses": result["flagged_clauses"],
            "section_scores": result["section_scores"],
            "ipfs_cid": audit_cid,
            "ipfs_hash": audit_hash,
            "policy_cid": policy_cid,
            "policy_hash": policy_hash,
            "audit_cid": audit_cid,
            "audit_hash": audit_hash,
            "scanner_version": "v1"
        }
        update_status(
            scan_id,
            5,
            "Audit Ready. Please sign with your wallet.",
            status="complete",
            metadata=handoff_metadata,
            result=result_payload
        )
        print(f"BLOCKD: [DONE] scan_id: {scan_id} - Syncing with Algorand... Complete.")
        
    except Exception as e:
        logger.exception("BLOCKD: [CRITICAL] Global scan task failure: %s", e)
        print(f"BLOCKD: [ERROR] scan_id: {scan_id} - {str(e)}")
        update_status(scan_id, 0, f"Error: {str(e)}", status="error")
        raise
