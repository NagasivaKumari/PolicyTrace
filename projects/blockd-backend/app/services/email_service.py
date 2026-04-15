import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import settings

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_alert(to_email: str, domain: str, categories: list):
        """Sends a high-priority privacy alert email to the user."""
        if not settings.SMTP_HOST or not settings.SMTP_USER:
            logger.warning(f"EmailService: SMTP not configured. Log-only alert for {to_email}: {domain}")
            return False

        try:
            msg = MIMEMultipart()
            msg['From'] = settings.SMTP_FROM or settings.SMTP_USER
            msg['To'] = to_email
            msg['Subject'] = f"🚨 Privacy Alert: Policy Change Detected for {domain}"

            category_list = "\n".join([f"- {c}" for c in categories])
            body = f"""
            Hello,

            This is an automated alert from BlockD Compliance Monitor.

            We have detected a silent update to the privacy policy of: {domain}

            AI-Detected Changes:
            {category_list}

            Evidence has been recorded and an audit dossier is waiting for your review.
            Please visit your BlockD Dashboard to sign the new audit and anchor it to the ledger.

            Stay Protected,
            The BlockD Engine
            """
            msg.attach(MIMEText(body, 'plain'))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT or 587) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASS)
                server.send_message(msg)
            
            logger.info(f"EmailService: Alert sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"EmailService: Failed to send alert to {to_email}: {e}")
            return False
