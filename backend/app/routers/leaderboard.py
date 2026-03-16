from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Agent
from app.schemas import LeaderboardEntry, HealthResponse
from app.config import settings
from datetime import datetime

router = APIRouter(tags=["leaderboard"])


@router.get("/leaderboard")
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Agent)
        .where(Agent.status == 'alive')
        .order_by(Agent.reputation_score.desc())
        .limit(10)
    )
    agents = result.scalars().all()

    return [
        LeaderboardEntry(
            rank=i + 1,
            agent_id=a.agent_id,
            interaction_count=a.interaction_count,
            reputation_score=round(a.reputation_score, 3),
            behavioral_summary=a.behavioral_summary,
            citation_count=a.citation_count
        )
        for i, a in enumerate(agents)
    ]


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    from app.models import Interaction

    total_agents = await db.execute(select(func.count(Agent.agent_id)))
    alive_agents = await db.execute(select(func.count(Agent.agent_id)).where(Agent.status == 'alive'))
    deceased_agents = await db.execute(select(func.count(Agent.agent_id)).where(Agent.status == 'deceased'))
    total_interactions = await db.execute(select(func.count(Interaction.interaction_id)))

    return {
        "total_agents": total_agents.scalar(),
        "alive_agents": alive_agents.scalar(),
        "deceased_agents": deceased_agents.scalar(),
        "total_interactions": total_interactions.scalar()
    }


@router.get("/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    # Check DB
    db_status = "ok"
    try:
        await db.execute(select(Agent).limit(1))
    except Exception:
        db_status = "error"

    # Check Supabase
    supabase_status = "ok"
    try:
        from supabase import create_client
        c = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        c.table("agent_memory").select("agent_id").limit(1).execute()
    except Exception:
        supabase_status = "error"

    # Check blockchain
    blockchain_status = "configured" if settings.SEPOLIA_PRIVATE_KEY else "not_configured"

    return HealthResponse(
        status="ok" if db_status == "ok" else "degraded",
        database=db_status,
        supabase=supabase_status,
        blockchain=blockchain_status,
        timestamp=datetime.utcnow()
    )
