import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, ForeignKey, JSON, Boolean, Uuid
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
    lifetime_fitness_score = Column(Float, default=0.0)
    fitness_trend = Column(String(20), default='stable')
    dominant_survival_trait = Column(Text, nullable=True)
    evolution_source_counts = Column(JSON, default=lambda: {"human": 0, "agent": 0, "market": 0, "feedback": 0})
    acquisition_source = Column(String(50), default='human_api')


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


class CollaborationEvent(Base):
    __tablename__ = "collaboration_events"
    event_id = Column(String(36), primary_key=True, default=_uuid)
    initiating_agent_id = Column(String(36), ForeignKey("agents.agent_id"))
    responding_agent_id = Column(String(36), ForeignKey("agents.agent_id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    collaboration_token_ratio = Column(Float, nullable=True)
    task_completed = Column(Integer, default=0)  # boolean as int for SQLite
    steps_to_completion = Column(Integer, nullable=True)
    redundant_calls = Column(Integer, default=0)
    context_questions_asked = Column(Integer, default=0)
    outcome_score = Column(Float, nullable=True)


class EmergenceSnapshot(Base):
    __tablename__ = "emergence_snapshots"
    snapshot_id = Column(String(36), primary_key=True, default=_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow)
    data = Column(JSON, nullable=True)


class CommunityAgent(Base):
    __tablename__ = "community_agents"
    id = Column(String(36), primary_key=True, default=_uuid)
    agent_id = Column(String(36), ForeignKey("agents.agent_id"))
    owner_handle = Column(String(64), nullable=True)
    participant_token = Column(String(64), unique=True)
    webhook_url = Column(Text, nullable=True)
    registered_at = Column(DateTime, default=datetime.utcnow)
    community_agent = Column(Integer, default=1)  # boolean as int


class AgentFeedback(Base):
    __tablename__ = "agent_feedback"
    feedback_id = Column(String(36), primary_key=True, default=_uuid)
    reviewed_agent_id = Column(String(36), ForeignKey("agents.agent_id"))
    reviewer_agent_id = Column(String(36), nullable=True)  # nullable = anonymous
    reviewer_has_soul = Column(Integer, default=0)  # boolean as int
    reviewer_soul_verified = Column(Integer, default=0)  # boolean as int
    session_id = Column(String(64), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    weight_applied = Column(Float, default=0.3)
    factual_observations = Column(JSON, nullable=True)
    interaction_type = Column(String(50), default='unknown')


class LeaderboardAward(Base):
    __tablename__ = "leaderboard_awards"
    award_id = Column(String(36), primary_key=True, default=_uuid)
    generated_at = Column(DateTime, default=datetime.utcnow)
    award_name = Column(String(128))
    award_description = Column(Text, nullable=True)
    correlation_type = Column(String(20))  # 'positive', 'negative', 'neutral'
    assigned_agent_id = Column(String(36), ForeignKey("agents.agent_id"), nullable=True)
