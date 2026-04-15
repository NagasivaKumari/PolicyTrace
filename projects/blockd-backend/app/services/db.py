from pymongo import MongoClient
from ..config import settings
import logging

logger = logging.getLogger(__name__)

# Global DB handle
_db = None

def get_db():
    global _db
    if _db is not None:
        return _db
        
    try:
        client = MongoClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=20000,
            connectTimeoutMS=20000,
            maxPoolSize=50,
            minPoolSize=5
        )
        # Check connection
        client.admin.command('ping')
        
        # Explicitly select 'blockd' if not specified in URI to avoid "No default database" error
        _db = client.get_database("blockd")
        
        logger.info("MongoDB: Connection handshake successful. Database: blockd")
        return _db
    except Exception as e:
        logger.error(f"MongoDB Connection Failure (HINT: Check IP Whitelist): {e}")
        return None
