import requests, json, hashlib
from ..config import settings

def upload_report(report: dict) -> tuple[str, str]:
    """
    Upload report JSON to Pinata IPFS.
    Returns (cid, sha256_hash)
    """
    report_json = json.dumps(report, indent=2)
    sha256 = hashlib.sha256(report_json.encode()).hexdigest()
    
    if not settings.PINATA_API_KEY:
        # Fallback for demo if no keys
        return f"demo_cid_{sha256[:10]}", sha256
        
    headers = {
        "pinata_api_key": settings.PINATA_API_KEY,
        "pinata_secret_api_key": settings.PINATA_SECRET_KEY,
    }
    files = {"file": ("blockd_report.json", report_json, "application/json")}
    
    try:
        res = requests.post("https://api.pinata.cloud/pinning/pinFileToIPFS", files=files, headers=headers)
        res.raise_for_status()
        cid = res.json()["IpfsHash"]
        return cid, sha256
    except Exception as e:
        print(f"IPFS Upload Error: {e}")
        return f"error_cid_{sha256[:10]}", sha256


def upload_text(content: str, filename: str = "blockd_policy.txt") -> tuple[str, str]:
    """
    Upload raw text to Pinata IPFS.
    Returns (cid, sha256_hash)
    """
    normalized = content or ""
    sha256 = hashlib.sha256(normalized.encode()).hexdigest()

    if not settings.PINATA_API_KEY:
        return f"demo_cid_{sha256[:10]}", sha256

    headers = {
        "pinata_api_key": settings.PINATA_API_KEY,
        "pinata_secret_api_key": settings.PINATA_SECRET_KEY,
    }
    files = {"file": (filename, normalized, "text/plain")}

    try:
        res = requests.post("https://api.pinata.cloud/pinning/pinFileToIPFS", files=files, headers=headers)
        res.raise_for_status()
        cid = res.json()["IpfsHash"]
        return cid, sha256
    except Exception as e:
        print(f"IPFS Upload Error: {e}")
        return f"error_cid_{sha256[:10]}", sha256
