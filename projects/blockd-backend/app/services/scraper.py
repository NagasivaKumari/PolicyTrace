import re
import hashlib
import logging
import httpx
from playwright.async_api import async_playwright

logger = logging.getLogger(__name__)

LEGAL_KEYWORDS = {
    "privacy": re.compile(r"privacy|data", re.I),
    "terms": re.compile(r"terms|conditions|tos|agreement", re.I),
    "cookies": re.compile(r"cookie", re.I),
    "refund": re.compile(r"refund|return|cancellation", re.I),
}

COMMON_PATHS = [
    "/privacy",
    "/privacy-policy",
    "/terms",
    "/terms-of-service",
    "/cookies",
    "/refund-policy"
]

async def auto_scroll(page):
    """SAFE LIMIT: Scroll 5 times to reveal footer links without hanging."""
    for _ in range(5):
        await page.evaluate("window.scrollBy(0, 1000)")
        await page.wait_for_timeout(500)

async def handle_cookies(page):
    selectors = [
        "button:has-text('Accept')",
        "button:has-text('Agree')",
        "button:has-text('Allow')",
        "button:has-text('Consent')",
        "[aria-label*=accept i]"
    ]
    for sel in selectors:
        try:
            if await page.locator(sel).count() > 0:
                await page.locator(sel).first.click(timeout=1500)
                break
        except:
            continue

async def find_links(page, base_url):
    results = {}
    anchors = page.locator("a")
    count = await anchors.count()
    for i in range(count):
        el = anchors.nth(i)
        try:
            href = await el.get_attribute("href")
            text = (await el.inner_text() or "").lower()
            if not href or "#" in href or "javascript" in href:
                continue
            combined = (href + text).lower()
            for key, pattern in LEGAL_KEYWORDS.items():
                if key not in results and pattern.search(combined):
                    if href.startswith("/"):
                        href = base_url.rstrip("/") + href
                    elif not href.startswith("http"):
                        href = base_url.rstrip("/") + "/" + href.lstrip("/")
                    results[key] = href
        except:
            continue
    return results

async def probe_common_paths(base_url):
    found = {}
    async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
        for path in COMMON_PATHS:
            url = base_url.rstrip("/") + path
            try:
                res = await client.get(url)
                if res.status_code == 200 and len(res.text) > 500:
                    text_sample = res.text[:2000].lower()
                    for key, pattern in LEGAL_KEYWORDS.items():
                        if key not in found and (key in path or pattern.search(text_sample)):
                            found[key] = url
            except:
                continue
    return found

async def extract_text(page):
    await page.evaluate("""
        () => {
            document.querySelectorAll(
                'nav, footer, header, script, style, aside, iframe, noscript'
            ).forEach(e => e.remove());
        }
    """)
    for sel in ["main", "article", "[role=main]", ".content", "#content"]:
        if await page.locator(sel).count() > 0:
            return await page.locator(sel).inner_text()
    return await page.locator("body").inner_text()

def hash_text(text):
    return hashlib.sha256(text.encode()).hexdigest()

async def find_policy_robust(page, base_url):
    """3-Layer Discovery: Links -> Probing -> Content Fallback"""
    # 1. Try normal link detection
    links = await find_links(page, base_url)
    if links:
        print(f"STEP 2: Links found: {list(links.keys())}")
        return links

    # 2. Try direct URL probing
    logger.warning("No links found on page -> Layer 2: Probing common paths")
    probed = await probe_common_paths(base_url)
    if probed:
        print(f"STEP 2: Probing found: {list(probed.keys())}")
        return probed

    # 3. Final Fallback: Treat current page as the payload
    print("STEP 2: No links found -> Falling back to homepage content")
    return {"fallback": base_url}

async def extract_privacy_policy(url: str) -> str:
    """
    Ironclad Crawler v4: No infinite loops, no hard failures.
    """
    data = {}
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"]
        )
        context = await browser.new_context()
        page = await context.new_page()
        try:
            print("STEP 1: Landing on website...")
            await page.goto(url, timeout=20000, wait_until="domcontentloaded")
            await handle_cookies(page)
            await auto_scroll(page)

            # Robust Discovery (Never returns empty results)
            links = await find_policy_robust(page, url)

            # Step 2: Extraction (Limit to top 3 documents to avoid timeout)
            print("STEP 3: Extracting legal content...")
            for i, (category, link) in enumerate(links.items()):
                if i >= 3:
                     break
                try:
                    if link != url:
                        await page.goto(link, wait_until="domcontentloaded", timeout=15000)
                        await auto_scroll(page)
                    
                    content = await extract_text(page)
                    if len(content) > 300:
                        data[category] = content
                except Exception as e:
                    logger.warning(f"Failed to extract {category} from {link}: {e}")
                    continue

            await browser.close()
        except Exception as e:
            logger.error(f"Scraper core failure: {e}")
            await browser.close()

    # Synthesize the Dossier for the AI Auditor
    dossier = ""
    for category, text in data.items():
        dossier += f"\n\n### [DOCUMENT_TYPE: {category.upper()}] ###\n\n"
        dossier += text
        
    return dossier.strip()