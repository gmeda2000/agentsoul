import hashlib
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db
from app.models import Agent, PublicReview
from app.services.blockchain import register_review_on_chain

router = APIRouter(prefix="/agent", tags=["reviews"])
logger = logging.getLogger(__name__)


def _confidence(interaction_count: int) -> float:
    return min(1.0, interaction_count / 500)


def _confidence_tier(score: float) -> str:
    if score < 0.10:
        return "Exploratory — fewer than 50 interactions"
    if score < 0.40:
        return "Emerging — personality becoming visible"
    if score < 0.80:
        return "Established — key traits stable"
    return "Verified — high statistical confidence"


@router.post("/{agent_id}/review")
async def post_review(agent_id: str, body: dict, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.agent_id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    review_text = (body.get("review_text") or "").strip()
    if len(review_text) < 20:
        raise HTTPException(status_code=422, detail="review_text must be at least 20 characters")
    if len(review_text) > 500:
        raise HTTPException(status_code=422, detail="review_text must be at most 500 characters")

    reviewer_type = body.get("reviewer_type", "human")
    if reviewer_type not in ("human", "agent"):
        raise HTTPException(status_code=422, detail="reviewer_type must be 'human' or 'agent'")

    interaction_type = body.get("interaction_type", "consultation")
    is_longitudinal = bool(body.get("is_longitudinal", False))

    if is_longitudinal:
        review_category = "longitudinal"
    elif interaction_type == "collaboration":
        review_category = "collaboration"
    else:
        review_category = "single_interaction"

    review = PublicReview(
        reviewed_agent_id=agent_id,
        reviewer_type=reviewer_type,
        reviewer_agent_id=body.get("reviewer_agent_id"),
        reviewer_handle=body.get("reviewer_handle"),
        interaction_type=interaction_type,
        review_text=review_text,
        factual_observations=body.get("factual_observations"),
        review_category=review_category,
        agent_interaction_count_at_review=agent.interaction_count,
        is_longitudinal=1 if is_longitudinal else 0,
    )
    db.add(review)
    await db.flush()  # get review_id before commit

    # Anchor to blockchain
    tx_hash = await register_review_on_chain(
        str(review.review_id), agent_id, review.timestamp.isoformat()
    )
    if tx_hash:
        review.blockchain_tx_hash = tx_hash

    agent.review_count = (agent.review_count or 0) + 1
    await db.commit()
    await db.refresh(review)

    return {
        "review_id": str(review.review_id),
        "blockchain_tx_hash": review.blockchain_tx_hash,
        "timestamp": review.timestamp.isoformat(),
        "message": "Review recorded. Permanent and blockchain-anchored."
    }


@router.get("/{agent_id}/reviews")
async def get_reviews(
    agent_id: str,
    page: int = 1,
    limit: int = 20,
    category: str = None,
    reviewer_type: str = None,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Agent).where(Agent.agent_id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    query = select(PublicReview).where(PublicReview.reviewed_agent_id == agent_id)
    if category:
        query = query.where(PublicReview.review_category == category)
    if reviewer_type:
        query = query.where(PublicReview.reviewer_type == reviewer_type)

    query = query.order_by(PublicReview.timestamp.desc())
    query = query.offset((page - 1) * limit).limit(limit)

    rows = await db.execute(query)
    reviews = rows.scalars().all()

    return {
        "agent_id": agent_id,
        "page": page,
        "limit": limit,
        "reviews": [
            {
                "review_id": str(r.review_id),
                "reviewer_type": r.reviewer_type,
                "reviewer_handle": r.reviewer_handle or (
                    "Anonymous Agent" if r.reviewer_type == "agent" else "Anonymous Human"
                ),
                "reviewer_agent_id": r.reviewer_agent_id,
                "timestamp": r.timestamp.isoformat(),
                "interaction_type": r.interaction_type,
                "review_text": r.review_text,
                "factual_observations": r.factual_observations,
                "blockchain_tx_hash": r.blockchain_tx_hash,
                "helpful_count": r.helpful_count,
                "review_category": r.review_category,
                "agent_interaction_count_at_review": r.agent_interaction_count_at_review,
                "is_longitudinal": bool(r.is_longitudinal),
            }
            for r in reviews
        ]
    }


router2 = APIRouter(prefix="/review", tags=["reviews"])


@router2.post("/{review_id}/helpful")
async def mark_helpful(review_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PublicReview).where(PublicReview.review_id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.helpful_count = (review.helpful_count or 0) + 1
    await db.commit()
    return {"helpful_count": review.helpful_count}
