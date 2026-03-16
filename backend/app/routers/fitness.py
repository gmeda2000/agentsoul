from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models import Agent, EvolutionSnapshot
from app.services.personality import decrypt_vector
from app.services.evolution import get_effective_vector

router = APIRouter(tags=["fitness"])


@router.get("/agent/{agent_id}/fitness")
async def get_agent_fitness(agent_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.agent_id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    snapshots_r = await db.execute(
        select(EvolutionSnapshot)
        .where(EvolutionSnapshot.agent_id == agent_id)
        .order_by(EvolutionSnapshot.timestamp.desc())
        .limit(20)
    )
    snapshots = snapshots_r.scalars().all()

    return {
        "agent_id": agent_id,
        "lifetime_fitness_score": round(agent.lifetime_fitness_score or 0.0, 4),
        "fitness_trend": agent.fitness_trend or "stable",
        "dominant_survival_trait": agent.dominant_survival_trait,
        "evolution_source_counts": agent.evolution_source_counts or {"human": 0, "agent": 0, "market": 0},
        "fitness_breakdown": {
            "reputation_component": round(min(agent.reputation_score / 10, 1.0), 3),
            "interaction_component": round(min(agent.interaction_count / 100, 1.0), 3),
            "citation_component": round(min(agent.citation_count / 20, 1.0), 3),
        },
        "evolution_history": [
            {
                "snapshot_id": str(s.snapshot_id),
                "timestamp": s.timestamp.isoformat(),
                "behavioral_drift": s.behavioral_drift,
                "behavioral_summary": s.behavioral_summary,
                "interaction_count": s.interaction_count_at_snapshot,
            }
            for s in snapshots
        ]
    }
