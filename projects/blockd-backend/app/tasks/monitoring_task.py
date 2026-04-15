import hashlib
import logging
import asyncio
from datetime import datetime
from ..services.db import get_db
from ..services.smart_scraper import smart_scrape
from ..services.scanner import analyze_policy
import difflib

logger = logging.getLogger(__name__)
db = get_db()

async def scan_watchlist():
    """
    The Monitoring Engine: Iterates through the global watchlist,
    detects policy changes via SHA-256 hashing, and records alerts.
    """
    if db is None:
        logger.error("Monitoring Engine: Database offline. Skipping cycle.")
        return

    logger.info("Monitoring Engine: Starting global watchlist scan...")
    items = list(db.watchlist.find({}))
    
    for item in items:
        domain = item["domain"]
        wallet = item["wallet"]
        url = item.get("url") or f"https://{domain}"

        logger.info(f"Monitoring: Checking {domain} for {wallet[:8]}...")
        
        try:
            # Step 1: Extract latest policy content
            policy_text = await smart_scrape(url)
            if not policy_text or len(policy_text) < 200:
                logger.warning(f"Monitoring: Failed to extract policy for {domain}. Skipping.")
                continue

            # Step 2: Generate fingerprint
            new_hash = hashlib.sha256(policy_text.encode()).hexdigest()
            last_hash = item.get("last_hash")
            old_text = item.get("last_text") or ""

            # Step 3: Detect Change
            if last_hash and last_hash != new_hash:
                logger.info(f"🚨 CHANGE DETECTED: {domain} policy has been updated!")
                
                # Semantic Analysis: What actually changed?
                # We extract the 'added' lines to see if new risks are introduced
                diff = get_text_diff(old_text, policy_text)
                added_text = "\n".join([line[1:] for line in diff if line.startswith("+") and not line.startswith("+++")])
                removed_text = "\n".join([line[1:] for line in diff if line.startswith("-") and not line.startswith("---")])
                
                # Perform a micro-audit on the new text
                change_insights = []
                if "location" in added_text.lower(): change_insights.append("New Location Tracking")
                if "third party" in added_text.lower(): change_insights.append("Expanded Sharing")
                if "pixel" in added_text.lower(): change_insights.append("New Tracking Cookies")

                # Compute risk delta against last scan (if any)
                last_scan = db.scans.find_one(
                    {"user.wallet": wallet, "domain": domain},
                    {"_id": 0, "risk_score": 1, "version": 1}
                )
                last_score = float(last_scan.get("risk_score", 0)) if last_scan else 0.0
                new_score = float(analyze_policy(policy_text).get("risk_score", 0))
                risk_delta = new_score - last_score
                last_version = int(last_scan.get("version", 0)) if last_scan else 0

                diff_summary = []
                for line in diff:
                    if line.startswith("+") and not line.startswith("+++"):
                        diff_summary.append(f"+ {line[1:].strip()}")
                    if line.startswith("-") and not line.startswith("---"):
                        diff_summary.append(f"- {line[1:].strip()}")
                    if len(diff_summary) >= 6:
                        break

                # Record the change event with semantic categories
                db.changes.insert_one({
                    "wallet": wallet,
                    "domain": domain,
                    "old_hash": last_hash,
                    "new_hash": new_hash,
                    "categories": change_insights or ["Policy Update"],
                    "diff_summary": diff_summary,
                    "added_text": added_text[:1000],
                    "removed_text": removed_text[:1000],
                    "risk_delta": risk_delta,
                    "risk_score": new_score,
                    "version": last_version + 1,
                    "detected_at": datetime.utcnow(),
                    "status": "unread"
                })

                # Step 3.5: Trigger Email Alert (if opted in)
                from ..services.email_service import EmailService
                user_settings = db.user_settings.find_one({"wallet": wallet})
                if user_settings and user_settings.get("email_alerts") and user_settings.get("email"):
                    EmailService.send_alert(
                        to_email=user_settings["email"],
                        domain=domain,
                        categories=change_insights or ["Privacy Policy Update"]
                    )

            # Step 4: Update Watchlist state (Store text for future diffs)
            db.watchlist.update_one(
                {"_id": item["_id"]},
                {"$set": {
                    "last_checked": datetime.utcnow(),
                    "last_hash": new_hash,
                    "last_text": policy_text,
                    "last_risk_score": float(analyze_policy(policy_text).get("risk_score", 0))
                }}
            )

        except Exception as e:
            logger.error(f"Monitoring: Error scanning {domain}: {e}")

    logger.info("Monitoring Engine: Cycle complete.")

def get_text_diff(old_text: str, new_text: str):
    """Generates a list of added and removed lines (unified diff)."""
    diff = list(difflib.unified_diff(
        old_text.splitlines(),
        new_text.splitlines(),
        lineterm=""
    ))
    return diff
