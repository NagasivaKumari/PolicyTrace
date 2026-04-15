from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from ..database import Base
import uuid
from datetime import datetime

class Scan(Base):
    __tablename__ = "scans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    url = Column(Text, nullable=False)
    status = Column(String, default="pending") # pending, scraping, analyzing, scoring, complete, failed
    current_step = Column(Integer, default=0)
    risk_score = Column(Float, nullable=True)
    risk_level = Column(String, nullable=True)
    total_violations = Column(Integer, default=0)
    section_scores = Column(JSONB, nullable=True)
    flagged_clauses = Column(JSONB, nullable=True)
    policy_text = Column(Text, nullable=True)
    sha256 = Column(String, nullable=True)
    ipfs_cid = Column(String, nullable=True)
    anchored = Column(Boolean, default=False)
    anchored_txid = Column(String, nullable=True)
    is_public = Column(Boolean, default=True) # Default to public for "Viral Growth"
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
