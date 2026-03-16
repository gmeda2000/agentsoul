from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class AgentBirthResponse(BaseModel):
    agent_id: UUID
    birth_certificate: dict
    blockchain_tx_hash: Optional[str]
    behavioral_summary: str
    message: str


class AgentIdentity(BaseModel):
    agent_id: UUID
    birth_date: datetime
    interaction_count: int
    reputation_score: float
    behavioral_summary: Optional[str]
    status: str
    citation_count: int


class InteractRequest(BaseModel):
    user_message: str
    context: Optional[str] = None


class InteractResponse(BaseModel):
    response: str
    interaction_id: UUID
    updated_reputation: float
    agent_id: UUID


class CitationRequest(BaseModel):
    citing_agent_id: UUID
    cited_agent_id: UUID
    context: Optional[str] = None


class EvolutionResponse(BaseModel):
    agent_id: UUID
    snapshots: list
    current_reputation: float
    total_interactions: int


class LeaderboardEntry(BaseModel):
    rank: int
    agent_id: UUID
    interaction_count: int
    reputation_score: float
    behavioral_summary: Optional[str]
    citation_count: int


class HealthResponse(BaseModel):
    status: str
    database: str
    supabase: str
    blockchain: str
    timestamp: datetime
