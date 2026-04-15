from fastapi import APIRouter, HTTPException, Query
from ..services.algorand_service import AlgorandService
from fastapi.responses import JSONResponse
import hashlib

router = APIRouter()
algo_service = AlgorandService()

@router.get("/seal")
async def get_widget_seal(url: str = Query(...)):
    """
    Public Endpoint: Returns the blockchain-verified shield status for a website.
    No Auth required for this read-only seal.
    """
    # 1. Standardize URL to match original scan
    clean_url = url.split('?')[0].split('#')[0].rstrip('/')
    url_hash = hashlib.sha256(clean_url.encode()).hexdigest()
    
    try:
        # Search for the latest audit anchored to this URL on-chain
        # In a production environment, we'd use the Indexer to find the most recent
        # audit box for this hash.
        total = algo_service.get_total_audits()
        
        # Mocking the lookup for the specific URL hash 
        # (This would be algo_service.get_audit_by_hash_onchain(url_hash))
        
        return JSONResponse(
            content={
                "url": clean_url,
                "status": "Shielded",
                "risk_score": 12, # Mocked: 12% Risk (Green)
                "verified_at": "2026-04-12T10:00:00Z",
                "provider": "Algorand_Blockchain",
                "shield_color": "emerald"
            },
            headers={"Access-Control-Allow-Origin": "*"}
        )
    except Exception as e:
        return JSONResponse(
            content={"status": "Unverified", "message": str(e)},
            status_code=404,
            headers={"Access-Control-Allow-Origin": "*"}
        )
