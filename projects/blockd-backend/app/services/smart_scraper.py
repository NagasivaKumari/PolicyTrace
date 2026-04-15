import asyncio
import httpx
from urllib.parse import urlparse
from ..config import settings
import logging

logger = logging.getLogger(__name__)

# -----------------------------
# 1. SERPER → FIND POLICY URL
# -----------------------------
async def find_policy_with_serper(domain: str):
    """Layer 1: Use Google Search via Serper for URL discovery."""
    if not settings.SERPER_API_KEY:
        return None

    query = f"{domain} privacy policy legal terms"
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            res = await client.post(
                "https://google.serper.dev/search",
                headers={"X-API-KEY": settings.SERPER_API_KEY},
                json={"q": query}
            )
            data = res.json()
            for result in data.get("organic", []):
                link = result.get("link", "")
                if any(k in link.lower() for k in ["privacy", "policy", "legal"]):
                    return link
    except Exception:
        pass
    return None

# -----------------------------
# 2. FIRECRAWL → EXTRACT CONTENT
# -----------------------------
async def extract_with_firecrawl(url: str):
    """Layer 2: Use Firecrawl for clean extraction."""
    if not settings.FIRECRAWL_API_KEY:
        return None

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            res = await client.post(
                "https://api.firecrawl.dev/v0/scrape",
                headers={"Authorization": f"Bearer {settings.FIRECRAWL_API_KEY}"},
                json={"url": url, "formats": ["markdown"]}
            )
            data = res.json()
            return data.get("data", {}).get("markdown", "")
    except Exception:
        pass
    return None

# -----------------------------
# 3. NITRO DISCOVERY ENGINE (PARALLEL)
# -----------------------------
async def smart_scrape(url: str):
    """
    Nitro Parallel Engine:
    - No local fallbacks (Playwright removed)
    - Parallel Search & Direct Extract
    """
    domain = urlparse(url).netloc.replace("www.", "")
    logger.info(f"NITRO_ENGINE: Initiating strict parallel scan for {domain}")

    # Launch parallel discovery paths
    # 1. Search for a specific policy page
    # 2. Directly extract from the provided entry URL
    tasks = [
        find_policy_with_serper(domain),
        extract_with_firecrawl(url)
    ]
    
    results = await asyncio.gather(*tasks)
    policy_url, direct_content = results

    # Priority 1: If we found a specific policy URL, extract from it
    if policy_url and policy_url != url:
        logger.info(f"Nitro: Found deep policy link: {policy_url}. Extracting...")
        deep_content = await extract_with_firecrawl(policy_url)
        if deep_content and len(deep_content) > 600:
            return deep_content

    # Priority 2: Use the direct extraction if it looks like a legal doc
    if direct_content and any(k in direct_content.lower() for k in ["privacy", "policy", "data protection"]):
        logger.info("Nitro: Valid policy detected on entry page.")
        return direct_content

    logger.warning(f"NITRO_ENGINE: Strict scanning failed for {domain}")
    return ""


async def smart_scrape_with_source(url: str) -> tuple[str, str]:
    """Return (policy_text, source_url) for traceability."""
    domain = urlparse(url).netloc.replace("www.", "")

    tasks = [
        find_policy_with_serper(domain),
        extract_with_firecrawl(url)
    ]

    results = await asyncio.gather(*tasks)
    policy_url, direct_content = results

    if policy_url and policy_url != url:
        logger.info(f"Nitro: Found deep policy link: {policy_url}. Extracting...")
        deep_content = await extract_with_firecrawl(policy_url)
        if deep_content and len(deep_content) > 600:
            return deep_content, policy_url

    if direct_content and any(k in direct_content.lower() for k in ["privacy", "policy", "data protection"]):
        logger.info("Nitro: Valid policy detected on entry page.")
        return direct_content, url

    logger.warning(f"NITRO_ENGINE: Strict scanning failed for {domain}")
    return "", url
