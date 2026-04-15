import httpx
import logging
from typing import Optional, List
from ..config import settings

logger = logging.getLogger(__name__)

class MemoryService:
    """
    Bridge to Mem0 AI Memory Layer.
    Stores and retrieves historical audit context for resilient compliance tracking.
    """
    
    def __init__(self):
        self.api_key = getattr(settings, "MEM0_API_KEY", "")
        self.base_url = "https://api.mem0.ai/v1/memories"
        self.headers = {
            "Authorization": f"Token {self.api_key}",
            "Content-Type": "application/json"
        }

    async def add_audit_memory(self, url: str, summary: str, user_id: str = "system"):
        """
        Store a summary of an audit in Mem0.
        Formatted as a user interaction to help the AI 'remember' the site.
        """
        if not self.api_key:
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                payload = {
                    "messages": [
                        {"role": "user", "content": f"Audit result for {url}: {summary}"}
                    ],
                    "user_id": user_id,
                    "metadata": {"url": url, "type": "audit_summary"}
                }
                
                logger.info(f"Mem0 Stage: Saving audit context for {url}...")
                response = await client.post(self.base_url, json=payload, headers=self.headers)
                
                if response.status_code != 200:
                   logger.warning(f"Mem0 Save Error: {response.status_code} - {response.text}")
                
                return response.json() if response.status_code == 200 else None
        except Exception as e:
            logger.error(f"Memory Service Save Crash: {e}")
            return None

    async def get_historical_context(self, url: str, user_id: str = "system") -> str:
        """
        Search Mem0 for any past records regarding this specific URL.
        """
        if not self.api_key:
            return ""

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Search for memories related to this URL
                search_url = f"{self.base_url}/search"
                payload = {
                    "query": f"What do we remember about the privacy policy of {url}?",
                    "user_id": user_id
                }
                
                logger.info(f"Mem0 Stage: Retrieving historical context for {url}...")
                response = await client.post(search_url, json=payload, headers=self.headers)
                
                if response.status_code == 200:
                    memories = response.json()
                    # Mem0 search returns a list of memory strings
                    if isinstance(memories, list) and len(memories) > 0:
                        context = "\n".join([m.get("memory", "") for m in memories if m.get("memory")])
                        return context
                
                return ""
        except Exception as e:
            logger.error(f"Memory Service Search Crash: {e}")
            return ""
