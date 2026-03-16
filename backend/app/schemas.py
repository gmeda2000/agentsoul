from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class AgentBirthResponse(BaseModel):
    agent_id: str
    birth_certificate: dict
    blockchain_tx_hash: Optional[str]
    behavioral_summary: str
    message: str

    model_config = {"from_attributes": True}


class AgentIdentity(BaseModel):
    agent_id: str
    birth_date: datetime
    interaction_count: int
    reputation_score: float
    behavioral_summary: Optional[str]
    status: str
    citation_count: int

    model_config = {"from_attributes": True}


class InteractRequest(BaseModel):
    user_message: str
    context: Optional[str] = None


class InteractResponse(BaseModel):
    response: str
    interaction_id: str
    updated_reputation: float
    agent_id: str


class CitationRequest(BaseModel):
    citing_agent_id: str
    cited_agent_id: str
    context: Optional[str] = None


class EvolutionResponse(BaseModel):
    agent_id: str
    snapshots: list
    current_reputation: float
    total_interactions: int


class LeaderboardEntry(BaseModel):
    rank: int
    agent_id: str
    interaction_count: int
    reputation_score: float
    behavioral_summary: Optional[str]
    citation_count: int

    model_config = {"from_attributes": True}


class HealthResponse(BaseModel):
    status: str
    database: str
    supabase: str
    blockchain: str
    timestamp: datetime
