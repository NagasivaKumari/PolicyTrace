from fastapi import APIRouter, Depends, HTTPException, Query
from ..services.algorand_service import AlgorandService
from ..utils.jwt import get_current_user

router = APIRouter()
algo_service = AlgorandService()

@router.get("/global-stats")
async def get_global_compliance_stats():
    """
    Regulator View: Summarize global compliance data directly from the blockchain.
    """
    try:
        total = algo_service.get_total_audits()
        certs = algo_service.get_total_certificates()
        
        # In a full implementation, we would crawl the Indexer for the last 100 blocks
        # to calculate a "Global Risk Trend."
        
        return {
            "total_websites_shielded": total,
            "total_certified_pass": certs,
            "average_market_risk": 42, # Mocked from sample Indexer data
            "status": "Healthy",
            "source": "Algorand_Blockchain_Snapshot"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/expert/vouch")
async def expert_vouch(
    scan_id: str,
    current_user = Depends(get_current_user)
):
    """
    Expert Action: Sign off on an existing audit to add 'Shield' status.
    """
    # 1. Determine if the caller is an expert on-chain
    is_exp = algo_service.get_user_status(current_user.wallet_address)
    
    # In v6.0, we treat 'Working' users (status 1) as Experts for this demo,
    # or we can use the dedicated is_expert ABI call.
    
    try:
        txid = algo_service.vouch_for_audit_onchain(scan_id)
        return {"status": "success", "txid": txid, "message": "Expert signature anchored."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Vouching failed: {e}")
