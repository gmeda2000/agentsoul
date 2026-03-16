import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, ForeignKey, JSON, Uuid
from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class Agent(Base):
    __tablename__ = "agents"
    agent_id = Column(String(36), primary_key=True, default=_uuid)
    birth_timestamp = Column(DateTime, default=datetime.utcnow)
    death_timestamp = Column(DateTime, nullable=True)
    blockchain_tx_hash = Column(String(66), nullable=True)
    personality_vector_encrypted = Column(Text, nullable=True)
    interaction_count = Column(Integer, default=0)
    reputation_score = Column(Float, default=0.0)
    citation_count = Column(Integer, default=0)
    status = Column(String(20), default='alive')
    behavioral_summary = Column(Text, nullable=True)


class Interaction(Base):
    __tablename__ = "interactions"
    interaction_id = Column(String(36), primary_key=True, default=_uuid)
    agent_id = Column(String(36), ForeignKey("agents.agent_id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_message = Column(Text)
    agent_response = Column(Text)
    response_quality_score = Column(Float, nullable=True)
    context = Column(Text, nullable=True)


class Citation(Base):
    __tablename__ = "citations"
    citation_id = Column(String(36), primary_key=True, default=_uuid)
    citing_agent_id = Column(String(36), ForeignKey("agents.agent_id"))
    cited_agent_id = Column(String(36), ForeignKey("agents.agent_id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    context = Column(Text, nullable=True)


class EvolutionSnapshot(Base):
    __tablename__ = "evolution_snapshots"
    snapshot_id = Column(String(36), primary_key=True, default=_uuid)
    agent_id = Column(String(36), ForeignKey("agents.agent_id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    behavioral_drift = Column(JSON, nullable=True)
    behavioral_summary = Column(Text, nullable=True)
    interaction_count_at_snapshot = Column(Integer, default=0)
