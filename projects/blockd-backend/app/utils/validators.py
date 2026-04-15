from algosdk import encoding
import ipaddress
import socket
from urllib.parse import urlparse


def is_valid_algorand_address(address: str) -> bool:
    if not address or not isinstance(address, str):
        return False
    return encoding.is_valid_address(address)


def validate_public_scan_url(url: str) -> tuple[bool, str]:
    if not url or not isinstance(url, str):
        return False, "URL is required"
        
    url = url.strip()
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
        
    if len(url) > 2048:
        return False, "URL is too long"

    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return False, "Invalid URL. Must start with http:// or https://"
    if not parsed.netloc:
        return False, "Invalid URL host"
    if parsed.username or parsed.password:
        return False, "URLs with embedded credentials are not allowed"

    host = parsed.hostname
    if not host:
        return False, "Invalid URL host"

    lowered = host.lower()
    if lowered in {"localhost", "127.0.0.1", "::1"} or lowered.endswith(".local"):
        return False, "Localhost URLs are not allowed"

    try:
        answers = socket.getaddrinfo(host, None)
    except Exception:
        return False, "Host could not be resolved"

    for answer in answers:
        ip = answer[4][0]
        try:
            ip_obj = ipaddress.ip_address(ip)
            if (
                ip_obj.is_private
                or ip_obj.is_loopback
                or ip_obj.is_link_local
                or ip_obj.is_multicast
                or ip_obj.is_reserved
                or ip_obj.is_unspecified
            ):
                return False, "Private or non-routable hosts are not allowed"
        except ValueError:
            continue

    return True, ""
