from pymongo import MongoClient
import sys
import os

# Add the project root to path so we can import config
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from app.config import settings
    print(f"Connecting to MongoDB: {settings.MONGODB_URI}")
    
    client = MongoClient(settings.MONGODB_URI)
    
    # THE NUCLEAR COMMAND
    print("WARNING: Dropping the 'blockd' database...")
    client.drop_database("blockd")
    print("SUCCESS: Database 'blockd' has been completely deleted.")
    
    # Check if anything remains
    dbs = client.list_database_names()
    if "blockd" not in dbs:
        print("VERIFIED: Database is gone. Ready for a fresh start.")
    else:
        print("ERROR: Database still exists. Please check permissions.")

except Exception as e:
    print(f"CRITICAL FAILURE: Could not reset database: {e}")
