import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from ..utils.jwt import get_current_user
from ..utils.security import get_password_hash, verify_password
from ..utils.password_validator import validate_password
from ..services.algorand_service import AlgorandService
from ..utils.validators import is_valid_algorand_address

router = APIRouter()
algo_service = AlgorandService()


class WalletUpdate(BaseModel):
    wallet_address: str


class ProfileUpdate(BaseModel):
    username: str | None = None
    is_working: bool | None = None


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    """
    Get current user profile directly from the blockchain.
    Zero MongoDB used.
    """
    address = current_user.wallet_address
    if not address:
        raise HTTPException(status_code=400, detail="Wallet not connected")
    
    profile = algo_service.get_profile_onchain(address)
    
    return {
        "id": address,
        "username": profile["username"],
        "wallet_address": address,
        "is_working": profile["is_working"],
        "joined_at": profile["joined_at"],
        "plan": "free", # In a full dApp, this could also be on-chain
        "is_verified": True
    }


@router.get("/settings")
async def get_settings(current_user=Depends(get_current_user)):
    """Retrieve privacy notification settings from MongoDB."""
    from ..services.db import get_db
    db = get_db()
    if db is None: return {"email_alerts": False, "email": ""}
    
    settings = db.user_settings.find_one({"wallet": current_user.wallet_address}, {"_id": 0})
    return settings or {"email_alerts": False, "email": ""}

@router.post("/settings")
async def update_settings(data: dict, current_user=Depends(get_current_user)):
    """Update privacy notification settings in MongoDB."""
    from ..services.db import get_db
    db = get_db()
    if db is None: raise HTTPException(status_code=503, detail="Database offline")
    
    email = data.get("email", "").strip()
    enabled = data.get("email_alerts", False)
    
    db.user_settings.update_one(
        {"wallet": current_user.wallet_address},
        {"$set": {
            "email": email,
            "email_alerts": enabled,
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    return {"status": "success"}

@router.patch("/me")


@router.get("/wallet-balance")
async def get_balance(address: str):
    if not is_valid_algorand_address(address):
        raise HTTPException(status_code=400, detail="Invalid Algorand wallet address")
    try:
        info = algo_service.get_account_info(address)
        micro = int(info.get("amount", 0))
        return {
            "balance_microalgo": micro,
            "balance_algo": round(micro / 1_000_000, 6),
            "balance": f"{micro / 1_000_000:.4f}",
        }
    except Exception:
        return {"balance_microalgo": 0, "balance_algo": 0.0, "balance": "0.0000"}
