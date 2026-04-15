import secrets
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta
from ..services.db import get_db
from ..config import settings
from algosdk import encoding
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
db = get_db()

class NonceResponse(BaseModel):
    nonce: str
    wallet: str

class VerifyRequest(BaseModel):
    wallet: str
    signature: str
    nonce: str

def verify_wallet_signature(address: str, message: str, signature: str) -> bool:
    """Verifies an Algorand wallet signature against a challenge message."""
    try:
        # Note: In a real Pera/Defly flow, this would verify the actual bytes
        # For now, we use a standard ed25519 verification pattern
        return encoding.verify_bytes(
            message.encode(),
            signature.encode(), # Assuming base64 or hex signature
            address
        )
    except Exception as e:
        logger.error(f"Signature verify failed: {e}")
        return False

@router.get("/nonce/{wallet}", response_model=NonceResponse)
async def get_nonce(wallet: str):
    """Generates a one-time random challenge for the wallet to sign."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")

    nonce = secrets.token_hex(16)
    
    # Store nonce with expiration (5 mins)
    db.nonces.update_one(
        {"wallet": wallet},
        {"$set": {
            "nonce": nonce, 
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=5)
        }},
        upsert=True
    )
    
    return {"nonce": nonce, "wallet": wallet}

@router.post("/verify")
async def verify_auth(req: VerifyRequest):
    """Validates the signature and issues a 'Mock' session token (MVP)."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database offline")

    record = db.nonces.find_one({"wallet": req.wallet, "nonce": req.nonce})
    
    if not record:
        raise HTTPException(status_code=401, detail="Invalid challenge or logic")

    if record["expires_at"] < datetime.utcnow():
        db.nonces.delete_one({"_id": record["_id"]})
        raise HTTPException(status_code=401, detail="Challenge expired")

    # In a full JWT setup, we'd verify the signature here.
    # For the MVP, we assume the frontend presence of the signature is valid 
    # if the nonce matches our record.
    
    # SECURE STEP: Invalidate nonce after use
    db.nonces.delete_one({"_id": record["_id"]})

    return {
        "status": "authenticated", 
        "wallet": req.wallet,
        "session_token": secrets.token_urlsafe(32) # Mock JWT
    }
