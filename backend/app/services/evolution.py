import json
import logging
from typing import Dict, Any, List, Optional
import anthropic
from app.config import settings
from app.services.supabase_service import load_agent_memory, save_agent_memory

logger = logging.getLogger(__name__)

BIG_FIVE = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]
MAX_DRIFT_PER_CYCLE = 0.05
EVOLUTION_TRIGGER = 10  # every N interactions


def create_default_memory(agent_id: str, base_vector: Dict[str, float]) -> Dict[str, Any]:
    return {
        "agent_id": agent_id,
        "base_vector": base_vector,
        "behavioral_drift": {t: 0.0 for t in BIG_FIVE},
        "interaction_history": [],
        "learned_patterns": [],
        "reputation_events": []
    }


def get_effective_vector(memory: Dict[str, Any]) -> Dict[str, float]:
    """Compute effective personality = base + accumulated drift."""
    base = memory["base_vector"]
    drift = memory["behavioral_drift"]
    return {
        t: max(0.0, min(1.0, base[t] + drift[t]))
        for t in BIG_FIVE
    }


async def maybe_evolve(agent_id: str, interaction_count: int) -> Optional[Dict]:
    """Trigger evolution analysis if interaction_count is a multiple of EVOLUTION_TRIGGER."""
    if interaction_count % EVOLUTION_TRIGGER != 0:
        return None

    memory = await load_agent_memory(agent_id)
    if not memory:
        return None

    history = memory.get("interaction_history", [])
    if len(history) < EVOLUTION_TRIGGER:
        return None

    last_10 = history[-EVOLUTION_TRIGGER:]
    current_vector = get_effective_vector(memory)

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        interactions_text = "\n".join([
            f"User: {i.get('user_message', '')[:200]}\nAgent: {i.get('agent_response', '')[:200]}"
            for i in last_10
        ])

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=512,
            system="You are a personality evolution analyzer. Respond ONLY with valid JSON, no other text.",
            messages=[{
                "role": "user",
                "content": f"""Analyze these 10 interactions of an AI agent.
Identify emerging behavioral patterns.
Suggest micro-adjustments to personality drift (max +/-{MAX_DRIFT_PER_CYCLE} per dimension per cycle).
Current vector: {json.dumps(current_vector)}
Interactions:
{interactions_text}

Return ONLY valid JSON:
{{
  "drift_adjustments": {{
    "openness": 0.0,
    "conscientiousness": 0.0,
    "extraversion": 0.0,
    "agreeableness": 0.0,
    "neuroticism": 0.0
  }},
  "behavioral_summary": "string max 100 words",
  "dominant_pattern": "string max 20 words"
}}"""
            }]
        )

        result = json.loads(message.content[0].text)
        adjustments = result.get("drift_adjustments", {})

        # Clamp adjustments
        for trait in BIG_FIVE:
            adj = adjustments.get(trait, 0.0)
            adj = max(-MAX_DRIFT_PER_CYCLE, min(MAX_DRIFT_PER_CYCLE, adj))
            memory["behavioral_drift"][trait] = round(
                memory["behavioral_drift"][trait] + adj, 4
            )

        if result.get("behavioral_summary"):
            memory.setdefault("learned_patterns", []).append({
                "at_interaction": interaction_count,
                "summary": result["behavioral_summary"],
                "dominant_pattern": result.get("dominant_pattern", "")
            })

        await save_agent_memory(agent_id, memory)

        return {
            "adjustments": adjustments,
            "behavioral_summary": result.get("behavioral_summary", ""),
            "dominant_pattern": result.get("dominant_pattern", ""),
            "new_effective_vector": get_effective_vector(memory)
        }

    except Exception as e:
        logger.error(f"Evolution engine failed for {agent_id}: {e}")
        return None


async def add_interaction_to_memory(
    agent_id: str,
    user_message: str,
    agent_response: str,
    quality_score: float
) -> bool:
    memory = await load_agent_memory(agent_id)
    if not memory:
        return False

    memory["interaction_history"].append({
        "user_message": user_message[:500],
        "agent_response": agent_response[:500],
        "quality_score": quality_score
    })

    # Keep last 100 in memory
    if len(memory["interaction_history"]) > 100:
        memory["interaction_history"] = memory["interaction_history"][-100:]

    return await save_agent_memory(agent_id, memory)
