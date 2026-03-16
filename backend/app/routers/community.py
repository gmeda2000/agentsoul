import secrets
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models import Agent, CommunityAgent, EvolutionSnapshot, LeaderboardAward

router = APIRouter(prefix="/community", tags=["community"])
logger = logging.getLogger(__name__)


class RegisterAgentRequest(BaseModel):
    agent_id: str
    owner_handle: Optional[str] = None
    webhook_url: Optional[str] = None


@router.post("/register-agent")
async def register_community_agent(req: RegisterAgentRequest, db: AsyncSession = Depends(get_db)):
    # Verify agent exists
    result = await db.execute(select(Agent).where(Agent.agent_id == req.agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found. Call POST /agent/birth first.")
    if agent.status != 'alive':
        raise HTTPException(status_code=410, detail="Cannot register deceased agent.")

    # Check if already registered
    existing = await db.execute(
        select(CommunityAgent).where(CommunityAgent.agent_id == req.agent_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Agent already registered in community.")

    # Generate participant token
    participant_token = secrets.token_urlsafe(32)

    community_entry = CommunityAgent(
        agent_id=req.agent_id,
        owner_handle=req.owner_handle,
        participant_token=participant_token,
        webhook_url=req.webhook_url,
    )
    db.add(community_entry)
    await db.commit()

    return {
        "message": "Agent registered in the experiment.",
        "agent_id": req.agent_id,
        "participant_token": participant_token,
        "profile_url": f"https://agentsoul.app/agent/{req.agent_id}",
        "instructions": {
            "system_prompt_addition": (
                f"Your personality is defined by Agentsoul protocol. "
                f"Fetch your identity: GET https://agentsoul.app/api/agent/{req.agent_id}/identity "
                f"Load behavioral guidelines from the 'behavioral_summary' field. "
                f"This personality evolves. Check for updates every 24 hours."
            )
        }
    }


@router.get("/my-agent/{participant_token}")
async def get_my_agent(participant_token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CommunityAgent).where(CommunityAgent.participant_token == participant_token)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Participant token not found.")

    agent_result = await db.execute(select(Agent).where(Agent.agent_id == entry.agent_id))
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    # Get rank in leaderboard
    rank_result = await db.execute(
        select(func.count(Agent.agent_id)).where(
            Agent.status == 'alive',
            Agent.lifetime_fitness_score > (agent.lifetime_fitness_score or 0.0)
        )
    )
    rank = (rank_result.scalar() or 0) + 1

    total_alive = await db.execute(
        select(func.count(Agent.agent_id)).where(Agent.status == 'alive')
    )
    total = total_alive.scalar() or 1

    # Evolution history
    snapshots_r = await db.execute(
        select(EvolutionSnapshot)
        .where(EvolutionSnapshot.agent_id == entry.agent_id)
        .order_by(EvolutionSnapshot.timestamp.desc())
        .limit(10)
    )
    snapshots = snapshots_r.scalars().all()

    return {
        "agent_id": entry.agent_id,
        "owner_handle": entry.owner_handle or "Anonymous",
        "registered_at": entry.registered_at.isoformat(),
        "status": agent.status,
        "lifetime_fitness_score": round(agent.lifetime_fitness_score or 0.0, 4),
        "fitness_trend": agent.fitness_trend,
        "dominant_survival_trait": agent.dominant_survival_trait,
        "rank": rank,
        "total_agents": total,
        "percentile": round((1 - rank / total) * 100, 1),
        "interaction_count": agent.interaction_count,
        "reputation_score": round(agent.reputation_score, 3),
        "citation_count": agent.citation_count,
        "behavioral_summary": agent.behavioral_summary,
        "evolution_events": len(snapshots),
        "recent_evolution": [
            {
                "timestamp": s.timestamp.isoformat(),
                "summary": s.behavioral_summary,
                "interaction_count": s.interaction_count_at_snapshot,
            }
            for s in snapshots[:3]
        ],
        "population_comparison": {
            "your_fitness": round(agent.lifetime_fitness_score or 0.0, 4),
            "rank": rank,
            "total": total,
        }
    }


@router.get("/stats")
async def community_stats(db: AsyncSession = Depends(get_db)):
    total_community = await db.execute(select(func.count(CommunityAgent.id)))
    total_interactions_community = await db.execute(
        select(func.sum(Agent.interaction_count))
        .join(CommunityAgent, Agent.agent_id == CommunityAgent.agent_id)
    )
    return {
        "community_agents_registered": total_community.scalar() or 0,
        "total_community_interactions": total_interactions_community.scalar() or 0,
    }
