"""
Email OTP utilities.

Flow:
  1. generate_and_send_otp(email) — creates a 6-digit OTP, stores it in Redis
     with a TTL of OTP_EXPIRE_SECONDS, and sends it by email.
  2. verify_otp(email, code) — checks Redis for the stored OTP; returns True
     and deletes the key on success, False otherwise.
"""

import random
import smtplib
import string
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from ..config import settings
from ..services.db import get_db


def _ensure_otp_index(db):
  try:
    db.otps.create_index("created_at", expireAfterSeconds=int(settings.OTP_EXPIRE_SECONDS))
  except Exception:
    pass


def _otp_key(email: str) -> str:
    return f"blockd:otp:{email.lower()}"


# ---------------------------------------------------------------------------
# OTP helpers
# ---------------------------------------------------------------------------

def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


_MOCK_REDIS = {}

def store_otp(email: str, otp: str) -> None:
  db = get_db()
  if db is None:
    print(f"DB offline, storing OTP in memory for {email}: {otp}")
    _MOCK_REDIS[_otp_key(email)] = otp
    return
  _ensure_otp_index(db)
  try:
    db.otps.update_one({"email": email.lower()}, {"$set": {"otp": otp, "created_at": datetime.utcnow()}}, upsert=True)
  except Exception as e:
    print(f"DB write failed, storing OTP in memory for {email}: {otp} - {e}")
    _MOCK_REDIS[_otp_key(email)] = otp

def verify_otp(email: str, code: str) -> bool:
    key = _otp_key(email)
  db = get_db()
  if db is not None:
    try:
      rec = db.otps.find_one({"email": email.lower()})
      if rec and rec.get("otp") == code.strip():
        try:
          db.otps.delete_one({"email": email.lower()})
        except Exception:
          pass
        return True
    except Exception:
      pass
  # fallback to in-memory mock (development)
  stored = _MOCK_REDIS.get(key)
  if stored and stored == code.strip():
    del _MOCK_REDIS[key]
    return True
    return False


# ---------------------------------------------------------------------------
# Email sending
# ---------------------------------------------------------------------------

def _build_html(otp: str, full_name: str = "", username: str = "") -> str:
    display_name = full_name or username or "there"
    username_line = f'<p class="username">@{username}</p>' if username else ""
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your BLOCKD account</title>
  <style>
    body {{ font-family: 'Helvetica Neue', Arial, sans-serif; background: #0A0914;
             color: #F1F0FF; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }}
    .wrapper {{ max-width: 560px; margin: 40px auto; padding: 0 16px; }}
    .card {{ background: #12102A; border: 1px solid rgba(139,92,246,0.20);
              border-radius: 16px; overflow: hidden; }}
    /* ── Header ── */
    .header {{ background: #1C1A3A; padding: 32px 40px; border-bottom: 1px solid rgba(139,92,246,0.15); }}
    .logo  {{ font-size: 20px; font-weight: 800; color: #8B5CF6; letter-spacing: 0.08em;
               display: flex; align-items: center; gap: 8px; }}
    .logo-dot {{ width: 8px; height: 8px; background: #8B5CF6; border-radius: 50%;
                  display: inline-block; margin-right: 4px; }}
    /* ── Body ── */
    .body {{ padding: 40px; }}
    h1 {{ font-size: 22px; font-weight: 700; margin: 0 0 8px; color: #F1F0FF; }}
    .username {{ font-size: 13px; color: #A78BFA; font-weight: 600; margin: 0 0 20px;
                  letter-spacing: 0.04em; }}
    p {{ font-size: 14px; line-height: 1.7; color: #A09DC0; margin: 0 0 20px; }}
    /* ── OTP Box ── */
    .otp-label {{ font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
                   text-transform: uppercase; color: #6B6890; margin-bottom: 10px; }}
    .otp-box {{ background: #1C1A3A; border: 1px solid rgba(139,92,246,0.35);
                 border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }}
    .otp {{ font-size: 38px; font-weight: 800; letter-spacing: 0.35em;
             color: #A78BFA; font-family: 'Courier New', monospace; }}
    .otp-expiry {{ font-size: 11px; color: #6B6890; margin-top: 10px; }}
    /* ── Feature list ── */
    .features {{ margin: 28px 0; padding: 0; list-style: none; }}
    .features li {{ display: flex; align-items: flex-start; gap: 10px;
                     font-size: 13px; color: #A09DC0; margin-bottom: 12px; }}
    .check {{ color: #34D399; font-size: 15px; line-height: 1; margin-top: 1px; }}
    /* ── Divider ── */
    hr {{ border: none; border-top: 1px solid rgba(139,92,246,0.10); margin: 32px 0; }}
    /* ── Footer ── */
    .footer {{ padding: 0 40px 32px; }}
    .footer p {{ font-size: 11px; color: #6B6890; line-height: 1.6; margin: 0; }}
    .footer a {{ color: #8B5CF6; text-decoration: none; }}
    /* ── Warning ── */
    .warning {{ background: rgba(247,114,114,0.08); border: 1px solid rgba(247,114,114,0.2);
                 border-radius: 8px; padding: 12px 16px; margin-top: 20px; }}
    .warning p {{ font-size: 12px; color: #F87171; margin: 0; }}
  </style>
</head>
<body>
<div class="wrapper">
  <div class="card">

    <!-- HEADER -->
    <div class="header">
      <div class="logo">
        <span class="logo-dot"></span>
        BLOCKD
      </div>
    </div>

    <!-- BODY -->
    <div class="body">
      <h1>Welcome, {display_name} 👋</h1>
      {username_line}
      <p>Thanks for signing up for <strong style="color:#F1F0FF">BLOCKD</strong> — the AI-powered
         platform for DPDP Act compliance auditing, anchored permanently on the Algorand blockchain.</p>

      <p>To activate your account, enter the verification code below.
         This code is valid for <strong style="color:#F1F0FF">10 minutes</strong>.</p>

      <div class="otp-box">
        <div class="otp-label">Your verification code</div>
        <div class="otp">{otp}</div>
        <div class="otp-expiry">⏱ Expires in 10 minutes &nbsp;·&nbsp; Do not share this code</div>
      </div>

      <p>Once verified, you'll get instant access to:</p>
      <ul class="features">
        <li><span class="check">✓</span> <span><strong style="color:#F1F0FF">3 free AI scans/month</strong> — audit any website's privacy policy against DPDP Act sections</span></li>
        <li><span class="check">✓</span> <span><strong style="color:#F1F0FF">On-chain anchoring</strong> — immutable proof of every audit result stored on Algorand Testnet</span></li>
        <li><span class="check">✓</span> <span><strong style="color:#F1F0FF">Compliance certificates</strong> — mint ARC-19 NFT certificates for verified policies</span></li>
        <li><span class="check">✓</span> <span><strong style="color:#F1F0FF">Public explore</strong> — browse and verify any anchored audit via blockchain transaction ID</span></li>
      </ul>

      <div class="warning">
        <p>🔒 If you did not create a BLOCKD account, please ignore this email.
           Your email address will not be used without verification.</p>
      </div>

      <hr />
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <p>You're receiving this because someone registered with this email at
         <a href="https://blockd.app">blockd.app</a>.<br />
         BLOCKD &mdash; AI-Powered DPDP Compliance &amp; Blockchain Auditing.<br />
         This is an automated message &mdash; please do not reply.
      </p>
    </div>

  </div>
</div>
</body>
</html>
"""


def send_otp_email(email: str, otp: str, full_name: str = "", username: str = "") -> None:
    """Send the OTP via SMTP (TLS). Raises on SMTP errors."""
    display = full_name or username or "there"
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[BLOCKD] {otp} is your verification code"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = email

    plain = (
        f"Hi {display},\n\n"
        f"Welcome to BLOCKD! Here's your email verification code:\n\n"
        f"  {otp}\n\n"
        f"This code expires in 10 minutes. Do not share it with anyone.\n\n"
        f"What you get with BLOCKD:\n"
        f"  • 3 free AI privacy policy scans per month\n"
        f"  • On-chain audit anchoring on Algorand Testnet\n"
        f"  • ARC-19 compliance certificate NFTs\n\n"
        f"If you did not sign up, you can safely ignore this email.\n\n"
        f"— The BLOCKD Team"
    )
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(_build_html(otp, full_name=full_name, username=username), "html"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
        smtp.ehlo()
        smtp.starttls()
        smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        smtp.sendmail(settings.SMTP_FROM, [email], msg.as_string())


def generate_and_send_otp(email: str, full_name: str = "", username: str = "") -> None:
    """One-shot helper: generate OTP → store in Redis → send email."""
    otp = generate_otp()
    store_otp(email, otp)
    try:
        send_otp_email(email, otp, full_name=full_name, username=username)
    except Exception as e:
        print(f"WARNING: Could not send OTP email to {email}: {e}")
        print(f"USE THIS OTP TO VERIFY: {otp}")
