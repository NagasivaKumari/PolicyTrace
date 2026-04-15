import os
import json
import base64
import hashlib
from algosdk import account, mnemonic
from algosdk.v2client import algod
from algosdk.atomic_transaction_composer import (
    AtomicTransactionComposer,
    AccountTransactionSigner,
    TransactionWithSigner,
)
from algosdk import transaction
from algosdk import abi
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
ALGOD_ADDRESS = os.getenv("ALGORAND_NODE", "https://testnet-api.algonode.cloud")
ALGOD_TOKEN = ""
APP_ID = int(os.getenv("BLOCKD_AUDIT_APP_ID", 758712507))
RECEIVER = os.getenv("PLATFORM_RECEIVER_ADDRESS", "OLRA32YCZ2BZ5Z7QIKSALXSHLKEABXHDOP2ATUTUORTCLKW725AIOQ542M")
MNEMONIC = os.getenv("ALGORAND_MNEMONIC")

if not MNEMONIC:
    print("❌ ERROR: ALGORAND_MNEMONIC not found in .env")
    exit(1)

# Initialize Client
client = algod.AlgodClient(ALGOD_TOKEN, ALGOD_ADDRESS)

# Define ABI Method
METHOD_JSON = {
    "name": "anchor_audit",
    "args": [
        { "type": "string", "name": "scan_id" },
        { "type": "address", "name": "owner" },
        { "type": "string", "name": "url_hash" },
        { "type": "uint64", "name": "risk_score" },
        { "type": "string", "name": "ipfs_cid" }
    ],
    "returns": { "type": "void" }
}
anchor_method = abi.Method.undictify(METHOD_JSON)

def diagnose():
    try:
        # 1. Setup Signer
        private_key = mnemonic.to_private_key(MNEMONIC)
        sender = account.address_from_private_key(private_key)
        signer = AccountTransactionSigner(private_key)
        
        print(f"🕵️‍♂️ DIAGNOSTIC START")
        print(f"   SENDER:   {sender}")
        print(f"   RECEIVER: {RECEIVER}")
        print(f"   APP ID:   {APP_ID}")
        
        # 2. Mock Audit Data
        scan_id = "DIAGNOSTIC_" + os.urandom(4).hex()
        url_hash = hashlib.sha256(b"diagnostic.test").hexdigest()
        risk_score = 85
        ipfs_cid = "QmQDKyq877VnCz9LWPDAir2if9Ny4TvshqE5QYAzztBfng"
        
        print(f"   SCAN ID:  {scan_id}")
        
        # 3. Construct ATC
        atc = AtomicTransactionComposer()
        params = client.suggested_params()
        
        # --- Transaction 1: Payment ---
        pay_txn = transaction.PaymentTxn(
            sender=sender,
            sp=params,
            receiver=RECEIVER,
            amt=200000,
            note=b"BlockD Diagnostic Fee"
        )
        atc.add_transaction(TransactionWithSigner(pay_txn, signer))
        
        # --- Transaction 2: App Call ---
        # Construct boxes exactly like frontend
        audit_box = (APP_ID, b"audits" + scan_id.encode())
        
        # User Status Box: "user_status" + public key
        user_status_prefix = b"user_status"
        owner_pk = algosdk.encoding.decode_address(sender)
        user_box = (APP_ID, user_status_prefix + owner_pk)
        
        atc.add_method_call(
            app_id=APP_ID,
            method=anchor_method,
            sender=sender,
            sp=params,
            signer=signer,
            method_args=[
                scan_id,
                sender,
                url_hash,
                risk_score,
                ipfs_cid
            ],
            boxes=[audit_box, user_box]
        )
        
        print(f"🚀 STEP 1: Submitting ATC Group...")
        result = atc.execute(client, 4)
        
        print(f"✅ SUCCESS: Audit Anchored!")
        print(f"   Round: {result.confirmed_round}")
        print(f"   TxIDs: {result.tx_ids}")
        
    except Exception as e:
        print(f"❌ DIAGNOSTIC FAILED")
        print(f"   ERROR: {str(e)}")
        if "box" in str(e).lower():
            print("   💡 TIP: This looks like a Box Storage error. Check Smart Contract limits.")
        elif "overspend" in str(e).lower():
            print("   💡 TIP: SENDER account needs more TestNet ALGO.")

if __name__ == "__main__":
    import algosdk
    diagnose()
