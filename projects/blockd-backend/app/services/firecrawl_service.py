import httpx
import logging
import asyncio
from typing import Optional
from ..config import settings

logger = logging.getLogger(__name__)

class FirecrawlService:
    """
    Bridge to the Firecrawl AI Scraper/Crawler.
    Requires FIRECRAWL_API_KEY in .env.
    """
    
    def __init__(self):
        self.api_key = getattr(settings, "FIRECRAWL_API_KEY", "")
        self.base_url = "https://api.firecrawl.dev/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def scrape_url(self, url: str) -> Optional[str]:
        """
        Scrapes a specific URL and returns the markdown content.
        """
        if not self.api_key:
            logger.warning("Firecrawl API Key is missing. Skipping fallback.")
            return None

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                data = {
                    "url": url,
                    "formats": ["markdown"]
                }
                
                logger.info(f"Firecrawl Stage: Scraping {url}...")
                response = await client.post(f"{self.base_url}/scrape", json=data, headers=self.headers)
                
                if response.status_code == 200:
                    json_res = response.json()
                    markdown = json_res.get("data", {}).get("markdown", "")
                    return markdown if len(markdown) > 500 else None
                
                logger.warning(f"Firecrawl API Error: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            logger.error(f"Firecrawl Service Crash: {e}")
            return None

    async def crawl_for_policy(self, base_url: str) -> Optional[str]:
        """
        Autonomously crawls a domain to find the privacy policy.
        This is the 'Nuclear Option' for discovery.
        """
        if not self.api_key:
            return None

        # Implementation note: For now we use the map/crawl API to find the policy link
        # and then scrape it. 
        # Simplified: We use Firecrawl's 'crawl' with a low limit to find legal docs.
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                # 1. Ask Firecrawl to find links containing 'privacy'
                map_data = {
                     "url": base_url,
                     "search": "privacy policy, dpdp policy, data protection, legal"
                 }
                logger.info(f"Firecrawl Stage: Mapping {base_url} for legal docs...")
                map_res = await client.post(f"{self.base_url}/map", json=map_data, headers=self.headers)
                
                if map_res.status_code == 200:
                    links = map_res.json().get("links", [])
                    if links:
                        # Take the first linked policy and scrape it
                        policy_url = links[0]
                        return await self.scrape_url(policy_url)
                
                return None
        except Exception as e:
            logger.error(f"Firecrawl Crawl Error: {e}")
            return None
