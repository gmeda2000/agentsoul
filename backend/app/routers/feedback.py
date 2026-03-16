"""
POST /agent/{agent_id}/feedback — receive factual peer feedback from other agents.
Weight is determined by whether the reviewer has a verified soul.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Agent, AgentFeedback
from app.services.evolution import maybe_evolve_from_feedback, FEEDBACK_EVOLUTION_TRIGGER

router = APIRouter(prefix="/agent", tags=["feedback"])
logger = logging.getLogger(__name__)


class FeedbackRequest(BaseModel):
    reviewer_agent_id: Optional[str] = None
    reviewer_has_soul: bool = False
    session_id: Optional[str] = None
    factual_observations: dict = {}
    interaction_type: str = "unknown"


@router.post("/{agent_id}/feedback")
async def receive_feedback(agent_id: str, req: FeedbackRequest, db: AsyncSession = Depends(get_db)):
    # Verify reviewed agent exists
    result = await db.execute(select(Agent).where(Agent.agent_id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Deduplication: same session_id already recorded?
    if req.session_id:
        existing = await db.execute(
            select(AgentFeedback).where(
                AgentFeedback.reviewed_agent_id == agent_id,
                AgentFeedback.session_id == req.session_id
            )
        )
        if existing.scalar_one_or_none():
            return {"feedback_recorded": False, "weight_applied": 0.0, "message": "Duplicate session_id — ignored"}

    # Determine weight
    now = datetime.utcnow()
    weight = 0.3  # anonymous default

    if req.reviewer_agent_id:
        # Check if reviewer has a verified soul in our system
        reviewer_result = await db.execute(
            select(Agent).where(Agent.agent_id == req.reviewer_agent_id, Agent.status == 'alive')
        )
        reviewer = reviewer_result.scalar_one_or_none()
        soul_verified = reviewer is not None

        if soul_verified:
            weight = 1.0
        elif req.reviewer_has_soul:
            weight = 0.6

        # Spam check: max 3 feedbacks per reviewer per reviewed agent per 24h
        window_start = now - timedelta(hours=24)
        count_result = await db.execute(
            select(func.count(AgentFeedback.feedback_id)).where(
                AgentFeedback.reviewer_agent_id == req.reviewer_agent_id,
                AgentFeedback.reviewed_agent_id == agent_id,
                AgentFeedback.timestamp >= window_start
            )
        )
        count_24h = count_result.scalar() or 0
        if count_24h >= 3:
            weight = min(weight, 0.1)

        # Spam check: >10 feedbacks in 1 hour from same reviewer = potential spam
        hour_start = now - timedelta(hours=1)
        hour_count_result = await db.execute(
            select(func.count(AgentFeedback.feedback_id)).where(
                AgentFeedback.reviewer_agent_id == req.reviewer_agent_id,
                AgentFeedback.timestamp >= hour_start
            )
        )
        hour_count = hour_count_result.scalar() or 0
        if hour_count > 10:
            weight = 0.1

    # Record feedback
    feedback = AgentFeedback(
        reviewed_agent_id=agent_id,
        reviewer_agent_id=req.reviewer_agent_id,
        reviewer_has_soul=1 if req.reviewer_has_soul else 0,
        reviewer_soul_verified=1 if (req.reviewer_agent_id and weight >= 1.0) else 0,
        session_id=req.session_id,
        weight_applied=weight,
        factual_observations=req.factual_observations,
        interaction_type=req.interaction_type,
    )
    db.add(feedback)

    # Update fitness score based on weighted observations
    obs = req.factual_observations
    delta = 0.0
    if obs.get("completed_task_in_one_shot"):
        delta += 0.2 * weight
    if obs.get("session_felt_productive"):
        delta += 0.1 * weight
    if obs.get("used_excessive_resources"):
        delta -= 0.1 * weight
    if obs.get("requested_unnecessary_context"):
        delta -= 0.05 * weight

    agent.lifetime_fitness_score = max(0.0, (agent.lifetime_fitness_score or 0.0) + delta)

    await db.commit()

    # Check if feedback evolution should trigger
    total_feedback_result = await db.execute(
        select(func.count(AgentFeedback.feedback_id)).where(
            AgentFeedback.reviewed_agent_id == agent_id
        )
    )
    total_feedback = total_feedback_result.scalar() or 0

    evolution_triggered = False
    if total_feedback % FEEDBACK_EVOLUTION_TRIGGER == 0:
        recent_feedbacks = await db.execute(
            select(AgentFeedback)
            .where(AgentFeedback.reviewed_agent_id == agent_id)
            .order_by(AgentFeedback.timestamp.desc())
            .limit(FEEDBACK_EVOLUTION_TRIGGER)
        )
        recent = recent_feedbacks.scalars().all()
        feedback_data = [
            {"observations": f.factual_observations, "weight": f.weight_applied, "interaction_type": f.interaction_type}
            for f in recent
        ]
        evolution_result = await maybe_evolve_from_feedback(agent_id, feedback_data)
        if evolution_result:
            evolution_triggered = True
            # Update evolution_source_counts
            counts = agent.evolution_source_counts or {"human": 0, "agent": 0, "market": 0, "feedback": 0}
            counts["feedback"] = counts.get("feedback", 0) + 1
            agent.evolution_source_counts = counts
            if evolution_result.get("behavioral_summary"):
                agent.behavioral_summary = evolution_result["behavioral_summary"]
            if evolution_result.get("dominant_survival_trait"):
                agent.dominant_survival_trait = evolution_result["dominant_survival_trait"]
            await db.commit()

    soul_status = "verified" if weight >= 1.0 else ("unverified" if req.reviewer_has_soul else "none")

    return {
        "feedback_recorded": True,
        "weight_applied": round(weight, 2),
        "your_soul_status": soul_status,
        "evolution_triggered": evolution_triggered,
        "message": f"Feedback recorded with weight {weight:.1f}. {'Evolution triggered.' if evolution_triggered else ''}",
    }
