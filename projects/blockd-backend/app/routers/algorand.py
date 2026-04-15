import uuid
import hashlib
from datetime import datetime
import logging
import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..utils.jwt import get_current_user
from ..utils.rate_limit import rate_limit
from ..services.algorand_service import AlgorandService
from ..services.db import get_db
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter()
algo_service = AlgorandService()

class VerifyIn(BaseModel):
    scan_id: str

@router.get("/verify/{scan_id}")
async def verify_audit(scan_id: str):
    """
    Read the audit record directly from the blockchain's Box storage.
    No authentication required — the blockchain IS the source of truth.
    """
    try:
        record = algo_service.get_audit_onchain(scan_id)
        return {
            "source": "algorand_blockchain",
            "app_id": algo_service.audit_app_id,
            "scan_id": scan_id,
            "url_hash": record["url_hash"],
            "risk_score": record["risk_score"],
            "ipfs_cid": record["ipfs_cid"],
            "timestamp": record["timestamp"],
            "verified": True,
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Audit not found on-chain: {str(e)}")

@router.get("/chain/stats")
async def get_chain_stats():
    """
    Read aggregate stats directly from the blockchain global state.
    """
    try:
        total_audits = algo_service.get_total_audits()
        total_certs = algo_service.get_total_certificates()
        return {
            "source": "algorand_blockchain",
            "total_audits_onchain": total_audits,
            "total_certificates_onchain": total_certs,
        }
    except Exception as e:
        logger.exception("Chain stats error: %s", str(e))
        return {
            "source": "algorand_blockchain",
            "total_audits_onchain": 0,
            "total_certificates_onchain": 0,
            "error": str(e),
        }


@router.get("/config/receiver")
async def get_receiver():
    """Return the platform receiver address for client-side transactions."""
    receiver = settings.PLATFORM_RECEIVER_ADDRESS
    if not receiver:
        raise HTTPException(status_code=500, detail="PLATFORM_RECEIVER_ADDRESS is not set")
    return {"receiver": receiver}


@router.get("/verify/tx/{tx_id}")
async def verify_tx(tx_id: str):
    """Verify on-chain hashes against IPFS snapshots."""
    try:
        try:
            info = algo_service.get_transaction_note(tx_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Transaction not indexed yet")
        note = info.get("note", "")
        parts = note.split("|") if note else []
        policy_hash = ""
        audit_hash = ""
        legacy_cid = ""
        version = ""
        for part in parts:
            if part.startswith("POLICY:"):
                policy_hash = part.replace("POLICY:", "")
            if part.startswith("AUDIT:"):
                audit_hash = part.replace("AUDIT:", "")
            if part.startswith("CID:"):
                legacy_cid = part.replace("CID:", "")
            if part.startswith("HASH:"):
                audit_hash = part.replace("HASH:", "")
            if part.startswith("V:"):
                version = part.replace("V:", "")

        if not audit_hash:
            raise HTTPException(status_code=400, detail="Missing AUDIT hash in note")

        db = get_db()
        if db is None:
            raise HTTPException(status_code=503, detail="Database unavailable")

        scan = db.scans.find_one(
            {"$or": [{"tx_id": tx_id}, {"blockchain.tx_id": tx_id}]},
            {"_id": 0}
        )

        policy_cid = None
        audit_cid = None
        if scan:
            policy_cid = scan.get("policy_cid") or scan.get("metadata", {}).get("policy_cid")
            audit_cid = scan.get("audit_cid") or scan.get("ipfs_cid") or scan.get("metadata", {}).get("audit_cid")

        if legacy_cid and not audit_cid:
            audit_cid = legacy_cid

        if not audit_cid:
            raise HTTPException(status_code=404, detail="Scan record not found for tx_id")

        gateway = settings.PINATA_GATEWAY or "https://gateway.pinata.cloud"

        calculated_policy = ""
        if policy_cid:
            try:
                policy_res = requests.get(f"{gateway}/ipfs/{policy_cid}", timeout=15)
            except requests.exceptions.RequestException:
                raise HTTPException(status_code=502, detail="Failed to reach IPFS gateway")
            if policy_res.status_code >= 400:
                raise HTTPException(status_code=502, detail="Failed to fetch policy snapshot from IPFS")
            policy_text = policy_res.text
            calculated_policy = hashlib.sha256(policy_text.encode("utf-8")).hexdigest()

        try:
            audit_res = requests.get(f"{gateway}/ipfs/{audit_cid}", timeout=15)
        except requests.exceptions.RequestException:
            raise HTTPException(status_code=502, detail="Failed to reach IPFS gateway")
        if audit_res.status_code >= 400:
            raise HTTPException(status_code=502, detail="Failed to fetch audit report from IPFS")
        audit_text = audit_res.text
        calculated_audit = hashlib.sha256(audit_text.encode("utf-8")).hexdigest()

        if policy_hash and calculated_policy:
            verified = calculated_policy == policy_hash and calculated_audit == audit_hash
        else:
            verified = calculated_audit == audit_hash

        report_json = None
        try:
            report_json = audit_res.json()
        except Exception:
            report_json = None

        return {
            "txid": tx_id,
            "policy_cid": policy_cid or "",
            "audit_cid": audit_cid,
            "policy_hash": policy_hash or "",
            "audit_hash": audit_hash,
            "calculated_policy": calculated_policy,
            "calculated_audit": calculated_audit,
            "verified": verified,
            "version": version,
            "report": report_json
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Verification failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
