from playwright.async_api import async_playwright
import logging
from typing import Optional
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class SearchService:
    """
    Direct Google Search Discovery via Playwright + Chromium.
    Replaces SerpApi to eliminate external API costs.
    """
    
    def __init__(self):
        # SerpApi is now deprecated in favor of direct scraping
        self.use_serp = False 

    async def find_policy_url_via_serp(self, domain_url: str) -> Optional[str]:
        """
        Legacy name maintained for scraper compatibility.
        Now uses Playwright + Chromium to find the site's privacy policy via Google.
        """
        # Extract domain (e.g., https://swiggy.com -> swiggy.com)
        parsed = urlparse(domain_url)
        domain = parsed.netloc or domain_url.split('/')[0]
        if "://" in domain:
            domain = domain.split("://")[1]

        query = f'site:{domain} "privacy policy"'
        logger.info(f"Playwright Search Stage: Scraping Google for {query}...")

        async with async_playwright() as p:
            try:
                # Launch with a realistic viewport and stealth-like headers
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    viewport={'width': 1280, 'height': 800},
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
                )
                page = await context.new_page()
                
                # Navigate to Google with a delay to seem natural
                google_url = f"https://www.google.com/search?q={query}"
                await page.goto(google_url, wait_until="domcontentloaded", timeout=30000)
                
                # 1. HANDLE GOOGLE CONSENT POP-UP (Crucial for EU/Clean profiles)
                # Look for 'Accept all' or 'Agree' buttons
                buttons = await page.query_selector_all("button")
                for btn in buttons:
                    text = await btn.inner_text()
                    if any(kw in text.lower() for kw in ["accept", "agree", "allow", "i agree"]):
                        logger.info("Playwright Search: Bypassing Google Consent Screen...")
                        await btn.click()
                        await page.wait_for_timeout(2000) # Wait for results to load
                        break

                # 2. EXTRACT ORGANIC RESULTS
                # Google organic results usually have an <h3> inside the <a> tag
                results = await page.query_selector_all("a h3")
                
                found_url = None
                for res in results:
                    # Get the parent <a> tag's href
                    link_handle = await page.evaluate_handle('el => el.closest("a")', res)
                    href = await page.evaluate('el => el ? el.href : null', link_handle)
                    
                    if href and href.startswith("http") and "google.com" not in href:
                        # Found a likely organic result
                        found_url = href
                        break
                
                await browser.close()
                
                if found_url:
                    logger.info(f"Playwright Discovery Success: {found_url}")
                    return found_url
                
                # --- PLAN C: RECURSIVE HOME PAGE SCAN (With Root Escalation) ---
                logger.info("Plan B (Google) Failed. Triggering Plan C: Deep Home-Page Scan...")
                
                # Identify root domain to escalate if needed
                parsed_node = urlparse(domain_url)
                targets = [domain_url]
                root_url = f"{parsed_node.scheme}://{parsed_node.netloc}"
                if root_url != domain_url and root_url != f"{domain_url}/":
                    targets.append(root_url)

                for target in targets:
                    logger.info(f"Plan C: Scanning target {target}...")
                    try:
                        await page.goto(target, wait_until="domcontentloaded", timeout=20000)
                        
                        all_links = await page.query_selector_all("a")
                        keywords = ["privacy", "policy", "legal", "terms", "condition", "compliance", "dpdp", "gdpr"]
                        
                        for link in all_links:
                            href = await link.get_attribute("href")
                            text = await link.inner_text()
                            
                            if href and any(kw in (text.lower() + href.lower()) for kw in keywords):
                                # Construct absolute URL
                                if href.startswith("/"):
                                    parsed_base = urlparse(target)
                                    href = f"{parsed_base.scheme}://{parsed_base.netloc}{href}"
                                elif not href.startswith("http"):
                                    href = f"{target.rstrip('/')}/{href.lstrip('/')}"
                                    
                                logger.info(f"Plan C Discovery Success: {href}")
                                await browser.close()
                                return href
                    except Exception as e:
                        logger.warning(f"Plan C scan on {target} encountered an issue: {e}")
                        continue

                await browser.close()
                logger.warning("Sentinel Discovery completed but no policy found.")
                return None

            except Exception as e:
                logger.error(f"Playwright Search Service Failure: {e}")
                return None
