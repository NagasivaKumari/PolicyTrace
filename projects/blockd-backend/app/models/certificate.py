from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from ..database import Base
import uuid
from datetime import datetime

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(UUID(as_uuid=True), ForeignKey("scans.id"), unique=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    ipfs_cid = Column(String, nullable=False)
    asset_id = Column(Integer, nullable=True)
    txid = Column(String, nullable=False)
    
    metadata_json = Column(JSONB, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
