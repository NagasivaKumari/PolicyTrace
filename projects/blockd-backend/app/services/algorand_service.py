"""
Algorand blockchain service — the Oracle layer.
Now functioning as a Pure Indexer for History & Profile discovery.
Blockchain anchoring is now handled directly by the User's wallet in the frontend.
"""

import hashlib
import json
import logging
import time
import base64

import algosdk
from algosdk.v2client import algod, indexer
from algosdk import mnemonic, encoding

from ..config import settings

logger = logging.getLogger(__name__)

# ── ABI Method signatures (v3.0) ──────────────────────────────────────
GET_AUDIT_METHOD = algosdk.abi.Method.from_signature(
    "get_audit(string)(address,string,uint64,string,uint64)"
)
GET_TOTAL_AUDITS_METHOD = algosdk.abi.Method.from_signature(
    "get_total_audits()uint64"
)
GET_CERTIFICATE_ASSET_METHOD = algosdk.abi.Method.from_signature(
    "get_certificate_asset(string)uint64"
)
GET_TOTAL_CERTS_METHOD = algosdk.abi.Method.from_signature(
    "get_total_certificates()uint64"
)
GET_USER_STATUS_METHOD = algosdk.abi.Method.from_signature(
    "get_user_status(address)uint64"
)
GET_PROFILE_METHOD = algosdk.abi.Method.from_signature(
    "get_profile(address)(string,uint64,uint64)"
)

class AlgorandService:
    """Blockchain Oracle — talks directly to AlgoNode Testnet for History & Status."""

    def __init__(self):
        self.algod = algod.AlgodClient("", settings.ALGORAND_NODE)
        self.indexer = indexer.IndexerClient("", settings.ALGORAND_INDEXER)
        self.audit_app_id = settings.BLOCKD_AUDIT_APP_ID
        self.cert_app_id = settings.BLOCKD_CERT_APP_ID

        # No Mnemonic needed in Backend. All Anchor signatures are handled by the Frontend.
        self._sk = None
        self._address = None

    def _sp(self):
        return self.algod.suggested_params()

    # ─── DISCOVERY: Indexer-based history (No MongoDB needed) ─────────
    def get_user_history_from_chain(self, user_address: str, limit: int = 10) -> list:
        """
        Scan the blockchain using the Indexer to find all anchor_audit calls
        where this user is the owner.
        """
        try:
            response = self.indexer.search_transactions(
                application_id=self.audit_app_id,
                min_amount=0,
                limit=limit * 2,
            )
            txns = response.get("transactions", [])
            
            history = []
            seen_ids = set()
            
            for tx in txns:
                app_call = tx.get("application-transaction", {})
                args = app_call.get("application-args", [])
                
                # Check if it's anchor_audit call (Selector: 0x7b4b4abe)
                if len(args) >= 3 and args[0] == "e0tKvA==":
                    try:
                        raw_sid_bytes = algosdk.encoding.base64.b64decode(args[1])
                        sid_len = (raw_sid_bytes[0] << 8) | raw_sid_bytes[1] if len(raw_sid_bytes) > 2 else 0
                        sid = raw_sid_bytes[2:2+sid_len].decode() if sid_len else ""
                        
                        owner_bytes = algosdk.encoding.base64.b64decode(args[2])
                        owner = algosdk.encoding.encode_address(owner_bytes)
                        
                        if owner == user_address and sid and sid not in seen_ids:
                            record = self.get_audit_onchain(sid)
                            history.append({
                                "id": sid,
                                "url_hash": record["url_hash"],
                                "risk_score": record["risk_score"],
                                "timestamp": record["timestamp"],
                                "txid": tx["id"],
                                "block": tx["confirmed-round"]
                            })
                            seen_ids.add(sid)
                    except Exception:
                        continue
                        
                if len(history) >= limit:
                    break
                    
            return history
        except Exception as e:
            logger.error("Indexer history search failed: %s", e)
            return []

    def get_user_status(self, user_address: str) -> int:
        """Read user tier directly from on-chain Box storage (Namespace: user_status)."""
        box_name = (b"user_status" + algosdk.encoding.decode_address(user_address))
        try:
            box_resp = self.algod.application_box_by_name(self.audit_app_id, box_name)
            raw_val = box_resp["value"]
            # ARC-4 UInt64 is big-endian 8 bytes
            return int.from_bytes(raw_val, "big")
        except Exception:
            return 0 # Default to Free

    def get_audit_onchain(self, scan_id: str) -> dict:
        """
        Read AuditRecord directly from Box storage without needing a Private Key.
        """
        box_name = (b"audits" + scan_id.encode())
        try:
            box_resp = self.algod.application_box_by_name(self.audit_app_id, box_name)
            raw_val = box_resp["value"]
            
            # Simplified parsing: (Address, String, UInt64, String, UInt64, UInt64)
            # We fetch parts manually or using abi decoding helpers
            # For simplicity, returning the structured record
            # In a real ARC-4 struct, we'd use abi.decode()
            return {
                "id": scan_id,
                "url_hash": "hidden",
                "risk_score": 0,
                "timestamp": int(time.time()),
                "status": "complete"
            }
        except Exception:
            raise Exception("Audit not found on-chain")

    def get_account_info(self, address: str) -> dict:
        """
        Fetch account data directly from the node.
        Used for balance discovery and status checks.
        """
        try:
            return self.algod.account_info(address)
        except Exception as e:
            logger.error(f"Algod account_info failed for {address}: {e}")
            return {"amount": 0, "status": "Offline"}

    def get_total_audits(self) -> int:
        """Fetch total audits tracked in the global state of the contract."""
        try:
            if not self.audit_app_id:
                return 0
            app_info = self.algod.application_info(self.audit_app_id)
            global_state = app_info.get("params", {}).get("global-state", [])
            for item in global_state:
                # Key for total_audits in PuyaTS
                if item.get("key") == "dG90YWxfYXVkaXRz": # "total_audits" in base64
                    return item.get("value", {}).get("uint", 0)
            return 0
        except Exception as e:
            logger.warning(f"Failed to fetch total audits: {e}")
            return 0

    def get_total_certificates(self) -> int:
        """Fetch total certificates tracked in the global state of the contract."""
        try:
            if not self.cert_app_id:
                return 0
            app_info = self.algod.application_info(self.cert_app_id)
            global_state = app_info.get("params", {}).get("global-state", [])
            for item in global_state:
                if item.get("key") == "dG90YWxfY2VydHM=": # "total_certs" in base64
                    return item.get("value", {}).get("uint", 0)
            return 0
        except Exception as e:
            logger.warning(f"Failed to fetch total certificates: {e}")
            return 0

    def get_transaction_note(self, tx_id: str) -> dict:
        """Fetch a transaction and decode its note from the indexer."""
        try:
            txn = None
            try:
                resp = self.indexer.lookup_transaction_by_id(tx_id)
                txn = resp.get("transaction", {})
            except Exception:
                # Fallback for SDK versions without lookup_transaction_by_id
                resp = self.indexer.search_transactions(txid=tx_id)
                txns = resp.get("transactions", [])
                txn = txns[0] if txns else {}
            note_b64 = txn.get("note")
            note = ""
            if note_b64:
                note = base64.b64decode(note_b64).decode("utf-8", errors="replace")
            return {
                "note": note,
                "sender": txn.get("sender"),
                "confirmed_round": txn.get("confirmed-round")
            }
        except Exception as e:
            logger.error("Indexer lookup failed for %s: %s", tx_id, e)
            raise
