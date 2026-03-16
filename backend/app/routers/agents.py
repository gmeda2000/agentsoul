import hashlib
import logging
from datetime import datetime
from typing import Optional
from uuid import UUID
import anthropic
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db
from app.models import Agent, Interaction, Citation, EvolutionSnapshot
from app.schemas import (
    AgentBirthResponse, AgentIdentity, InteractRequest, InteractResponse,
    CitationRequest, EvolutionResponse
)
from app.services.personality import (
    generate_seed, seed_to_personality_vector, vector_to_system_prompt,
    encrypt_vector, decrypt_vector, generate_behavioral_summary
)
from app.services.blockchain import register_birth_on_chain, register_death_on_chain
from app.services.supabase_service import save_agent_memory, load_agent_memory
from app.services.evolution import (
    create_default_memory, maybe_evolve, add_interaction_to_memory, get_effective_vector
)
from app.config import settings

router = APIRouter(prefix="/agent", tags=["agents"])
logger = logging.getLogger(__name__)


@router.post("/birth", response_model=AgentBirthResponse)
async def birth_agent(db: AsyncSession = Depends(get_db)):
    """Generate a new agent with cryptographic identity."""
    seed = generate_seed()
    vector = seed_to_personality_vector(seed)
    encrypted_vector = encrypt_vector(vector)
    behavioral_summary = generate_behavioral_summary(vector)

    agent = Agent(
        personality_vector_encrypted=encrypted_vector,
        behavioral_summary=behavioral_summary,
        status='alive'
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)

    agent_id_str = str(agent.agent_id)
    ts = agent.birth_timestamp.isoformat()

    # Register on blockchain (async, non-blocking)
    tx_hash = await register_birth_on_chain(agent_id_str, seed, ts)
    if tx_hash:
        await db.execute(
            update(Agent).where(Agent.agent_id == agent.agent_id).values(blockchain_tx_hash=tx_hash)
        )
        await db.commit()
        agent.blockchain_tx_hash = tx_hash

    # Initialize memory in Supabase
    memory = create_default_memory(agent_id_str, vector)
    await save_agent_memory(agent_id_str, memory)

    birth_certificate = {
        "agent_id": agent_id_str,
        "birth_timestamp": ts,
        "blockchain_tx_hash": tx_hash,
        "personality_hash": hashlib.sha256(encrypted_vector.encode()).hexdigest()[:16],
    }

    return AgentBirthResponse(
        agent_id=agent.agent_id,
        birth_certificate=birth_certificate,
        blockchain_tx_hash=tx_hash,
        behavioral_summary=behavioral_summary,
        message="Agent born successfully."
    )


@router.get("/{agent_id}/identity", response_model=AgentIdentity)
async def get_agent_identity(agent_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.agent_id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return AgentIdentity(
        agent_id=agent.agent_id,
        birth_date=agent.birth_timestamp,
        interaction_count=agent.interaction_count,
        reputation_score=round(agent.reputation_score, 3),
        behavioral_summary=agent.behavioral_summary,
        status=agent.status,
        citation_count=agent.citation_count
    )


@router.post("/{agent_id}/interact", response_model=InteractResponse)
async def interact(agent_id: UUID, req: InteractRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.agent_id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.status != 'alive':
        raise HTTPException(status_code=410, detail="Agent is deceased")

    memory = await load_agent_memory(str(agent_id))
    if not memory:
        # Rebuild memory if missing
        vector = decrypt_vector(agent.personality_vector_encrypted)
        memory = create_default_memory(str(agent_id), vector)
        await save_agent_memory(str(agent_id), memory)

    vector = decrypt_vector(agent.personality_vector_encrypted)
    effective_vector = get_effective_vector(memory)
    system_prompt = vector_to_system_prompt(effective_vector)

    # Build conversation context from last 20 interactions
    history = memory.get("interaction_history", [])[-20:]
    messages = []
    for h in history:
        messages.append({"role": "user", "content": h["user_message"]})
        messages.append({"role": "assistant", "content": h["agent_response"]})
    messages.append({"role": "user", "content": req.user_message})

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            system=system_prompt,
            messages=messages
        )
        agent_response = response.content[0].text
    except Exception as e:
        logger.error(f"Claude API error: {e}")
        raise HTTPException(status_code=503, detail="LLM service unavailable")

    # Score quality (simple heuristic: length normalized)
    quality = min(1.0, len(agent_response) / 300)

    # Save interaction to DB
    interaction = Interaction(
        agent_id=agent_id,
        user_message=req.user_message,
        agent_response=agent_response,
        response_quality_score=quality,
        context=req.context
    )
    db.add(interaction)

    # Update agent stats
    agent.interaction_count += 1
    agent.reputation_score += quality * 0.2  # +0.2 max per interaction

    await db.commit()
    await db.refresh(agent)

    # Update memory + maybe evolve
    await add_interaction_to_memory(str(agent_id), req.user_message, agent_response, quality)
    evolution = await maybe_evolve(str(agent_id), agent.interaction_count)

    if evolution:
        # Save evolution snapshot
        snapshot = EvolutionSnapshot(
            agent_id=agent_id,
            behavioral_drift=evolution["adjustments"],
            behavioral_summary=evolution["behavioral_summary"],
            interaction_count_at_snapshot=agent.interaction_count
        )
        db.add(snapshot)
        agent.behavioral_summary = evolution["behavioral_summary"]
        await db.commit()

    return InteractResponse(
        response=agent_response,
        interaction_id=interaction.interaction_id,
        updated_reputation=round(agent.reputation_score, 3),
        agent_id=agent.agent_id
    )


@router.post("/cite")
async def cite_agent(req: CitationRequest, db: AsyncSession = Depends(get_db)):
    citing = await db.execute(select(Agent).where(Agent.agent_id == req.citing_agent_id))
    cited = await db.execute(select(Agent).where(Agent.agent_id == req.cited_agent_id))

    citing_agent = citing.scalar_one_or_none()
    cited_agent = cited.scalar_one_or_none()

    if not citing_agent or not cited_agent:
        raise HTTPException(status_code=404, detail="One or both agents not found")

    citation = Citation(
        citing_agent_id=req.citing_agent_id,
        cited_agent_id=req.cited_agent_id,
        context=req.context
    )
    db.add(citation)

    cited_agent.reputation_score += 0.5
    cited_agent.citation_count += 1

    await db.commit()

    return {
        "message": "Citation recorded",
        "cited_agent_id": str(req.cited_agent_id),
        "new_reputation": round(cited_agent.reputation_score, 3)
    }


@router.delete("/{agent_id}/death")
async def kill_agent(agent_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.agent_id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.status == 'deceased':
        raise HTTPException(status_code=410, detail="Agent already deceased")

    birth_tx = agent.blockchain_tx_hash

    # Overwrite sensitive data with zeros
    agent.personality_vector_encrypted = "0" * 64
    agent.status = 'deceased'
    agent.death_timestamp = datetime.utcnow()

    # Register death on blockchain
    death_tx = await register_death_on_chain(str(agent_id), birth_tx)

    # Anonymize memory but preserve history structure
    memory = await load_agent_memory(str(agent_id))
    if memory:
        memory["base_vector"] = {t: 0.0 for t in ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]}
        memory["behavioral_drift"] = {t: 0.0 for t in ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]}
        memory["status"] = "deceased"
        from app.services.supabase_service import save_agent_memory as _save
        await _save(str(agent_id), memory)

    await db.commit()

    return {
        "message": "Agent deceased. This is irreversible.",
        "agent_id": str(agent_id),
        "death_timestamp": agent.death_timestamp.isoformat(),
        "death_tx_hash": death_tx
    }


@router.get("/{agent_id}/evolution", response_model=EvolutionResponse)
async def get_evolution(agent_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.agent_id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    snapshots_result = await db.execute(
        select(EvolutionSnapshot)
        .where(EvolutionSnapshot.agent_id == agent_id)
        .order_by(EvolutionSnapshot.timestamp)
    )
    snapshots = snapshots_result.scalars().all()

    return EvolutionResponse(
        agent_id=agent.agent_id,
        snapshots=[{
            "snapshot_id": str(s.snapshot_id),
            "timestamp": s.timestamp.isoformat(),
            "behavioral_drift": s.behavioral_drift,
            "behavioral_summary": s.behavioral_summary,
            "interaction_count_at_snapshot": s.interaction_count_at_snapshot
        } for s in snapshots],
        current_reputation=round(agent.reputation_score, 3),
        total_interactions=agent.interaction_count
    )
