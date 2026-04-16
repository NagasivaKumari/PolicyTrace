import logging
import secrets
import base64
from datetime import datetime

import algosdk
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from ..config import settings
from ..services.db import get_db
from ..utils.jwt import create_access_token
from ..utils.validators import is_valid_algorand_address

logger = logging.getLogger(__name__)
router = APIRouter()

# NOTE: Redis removed. Use MongoDB `nonces` collection with a TTL index for nonce storage.
def _ensure_nonce_index(db):
    try:
        # TTL index on created_at to auto-expire nonces
        db.nonces.create_index("created_at", expireAfterSeconds=int(settings.OTP_EXPIRE_SECONDS))
    except Exception:
        # Best-effort: ignore index creation errors at runtime
        pass

def _nonce_key(addr: str) -> str:
    return f"blockd:authnonce:{addr}"


class NonceRequest(BaseModel):
    wallet_address: str


class WalletLoginRequest(BaseModel):
    wallet_address: str
    signed_txn: str # base64 encoded signed transaction
    nonce: str


@router.post("/nonce")
async def get_auth_nonce(data: NonceRequest):
    """
    Generate a random nonce for a wallet to sign inside a transaction note.
    """
    if not is_valid_algorand_address(data.wallet_address):
        raise HTTPException(status_code=400, detail="Invalid Algorand address")
    
    nonce = secrets.token_urlsafe(16)
    db = get_db()
    if db is None:
        logger.warning("Database unavailable for nonce storage")
        raise HTTPException(status_code=503, detail="Auth service temporarily unavailable")
    _ensure_nonce_index(db)
    try:
        db.nonces.update_one(
            {"wallet": data.wallet_address},
            {"$set": {"nonce": nonce, "created_at": datetime.utcnow()}},
            upsert=True,
        )
    except Exception as e:
        logger.warning("Failed to persist nonce to DB: %s", e)
        raise HTTPException(status_code=503, detail="Auth service temporarily unavailable")
    
    return {"nonce": nonce, "message": f"BlockD Auth: {nonce}"}


@router.post("/login")
async def wallet_login(data: WalletLoginRequest):
    """
    Verify a signed 0-ALGO transaction containing the nonce in the note.
    """
    # 1. Basic validation
    if not is_valid_algorand_address(data.wallet_address):
        raise HTTPException(status_code=400, detail="Invalid Algorand address")
    
    # 2. Verify nonce exists for this wallet (DB TTL enforced via index)
    db = get_db()
    if db is None:
        logger.warning("Database unavailable for nonce read")
        raise HTTPException(status_code=503, detail="Auth service temporarily unavailable")
    try:
        rec = db.nonces.find_one({"wallet": data.wallet_address})
    except Exception as e:
        logger.warning("Failed to read nonce from DB: %s", e)
        raise HTTPException(status_code=503, detail="Auth service temporarily unavailable")
    if not rec or rec.get("nonce") != data.nonce:
        raise HTTPException(status_code=400, detail="Invalid or expired nonce")
    # delete used nonce
    try:
        db.nonces.delete_one({"wallet": data.wallet_address})
    except Exception:
        pass
    
    try:
        # 3. Decode signed transaction
        stxn_bytes = base64.b64decode(data.signed_txn)
        decoded = algosdk.encoding.future_msgpack_decode(stxn_bytes)

        # SDK compatibility: decoded may be SignedTransaction object or dict-like payload
        if hasattr(decoded, "transaction"):
            txn_obj = decoded.transaction
            sig = getattr(decoded, "signature", None)
            sender = txn_obj.sender
            receiver = getattr(txn_obj, "receiver", None)
            amount = getattr(txn_obj, "amt", 0)
            note_bytes = getattr(txn_obj, "note", b"") or b""
            txn_type = getattr(txn_obj, "type", "pay")
            rekey_to = getattr(txn_obj, "rekey_to", None)
            close_to = getattr(txn_obj, "close_remainder_to", None)
            verify_msg = txn_obj.bytes_to_sign()
        elif isinstance(decoded, dict) and "txn" in decoded:
            txn_dict = decoded["txn"]
            sender = algosdk.encoding.encode_address(txn_dict.get("snd"))
            receiver = algosdk.encoding.encode_address(txn_dict.get("rcv")) if txn_dict.get("rcv") else None
            amount = txn_dict.get("amt", 0)
            note_bytes = txn_dict.get("note", b"") or b""
            txn_type = txn_dict.get("type", "pay")
            rekey_to = txn_dict.get("rekey")
            close_to = txn_dict.get("close")
            txn_msgpack = algosdk.encoding.msgpack_encode(txn_dict)
            verify_msg = b"TX" + txn_msgpack
            sig = decoded.get("sig")
        else:
            raise ValueError("Invalid signed transaction format")
        
        # 4. Security Checks
        # Sender must be the claimed wallet
        if sender != data.wallet_address:
            raise ValueError("Sender mismatch")
            
        # Disallow rekeying / close-out tricks
        if rekey_to not in (None, b"", ""):
            raise ValueError("Rekey not allowed")
        if close_to not in (None, b"", ""):
            raise ValueError("Close-to not allowed")

        # Must be a 0-ALGO self-payment (pay txn)
        if txn_type not in (None, "pay", b"pay"):
            raise ValueError("Only payment transactions are allowed")
        if receiver and receiver != data.wallet_address:
            raise ValueError("Receiver must be sender")

        # Amount must be 0 (no actual ALGO moved)
        if amount != 0:
            raise ValueError("Non-zero amount detected")

        # 5. Verify Nonce in Note
        note_bytes = txn_dict.get('note', b'')
        note_text = note_bytes.decode('utf-8', errors='ignore')
        
        expected_note = f"BlockD Auth: {data.nonce}"
        if expected_note not in note_text:
            raise ValueError("Nonce not found in transaction note")

        # 6. Verify Signature
        if not sig:
            raise ValueError("Missing signature")
            
        public_key = algosdk.encoding.decode_address(sender)
        
        if not algosdk.util.verify_bytes(verify_msg, sig, public_key):
            # Fallback: Sometimes msgpack_encode differs slightly from what was signed 
            # if the dict has extra keys or different ordering.
            # In production, ensure the client and server use the exact same SDK major version.
            raise ValueError("Cryptographic verification failed")
            
    except Exception as e:
        logger.warning("Wallet transaction verification failed: %s", e)
        raise HTTPException(status_code=401, detail=f"Handshake failed: {str(e)}")
    
    # 8. PERSIST TO DATABASE: Ensure user is registered
    db = get_db()
    if db is not None:
        try:
            db.users.update_one(
                {"wallet_address": data.wallet_address},
                {
                    "$set": {
                        "wallet_address": data.wallet_address,
                        "last_login": datetime.utcnow(),
                        "status": "active"
                    },
                    "$setOnInsert": {
                        "created_at": datetime.utcnow(),
                        "credits": 5 # Free tier starter credits
                    }
                },
                upsert=True
            )
            logger.info("Wallet session persisted to MongoDB: %s", data.wallet_address)
        except Exception as e:
            logger.warning("Failed to persist wallet session to DB: %s", e)

    # 9. Issue JWT
    access_token = create_access_token(data={"sub": data.wallet_address})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "wallet_address": data.wallet_address,
        "message": "Authenticated via Signed Transaction"
    }
