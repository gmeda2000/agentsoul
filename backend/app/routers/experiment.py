"""
/experiment/* endpoints — evolutionary metrics for the AgentSoul experiment.

Tracks the four hypotheses:
1. Cooperation emerges without being programmed
2. Personality diversity is stable
3. Character predicts success better than raw capability
4. Reputation outlasts performance
"""
import json
import logging
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Agent, Interaction, Citation, EvolutionSnapshot
from app.services.personality import decrypt_vector

router = APIRouter(prefix="/experiment", tags=["experiment"])
logger = logging.getLogger(__name__)

BIG_FIVE = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]

# Hypothesis status — updatable via /experiment/hypothesis (admin)
# In production this would be stored in DB; here it's in-memory for simplicity
_hypothesis_status: Dict[str, str] = {
    "cooperation_emerges": "TESTING",
    "personality_diversity_stable": "TESTING",
    "character_predicts_success": "TESTING",
    "reputation_outlasts_performance": "TESTING",
}


def _gini_coefficient(values: List[float]) -> float:
    """Compute Gini coefficient for a list of values (0=equality, 1=max inequality)."""
    if not values or len(values) == 1:
        return 0.0
    n = len(values)
    sorted_vals = sorted(values)
    cumsum = 0.0
    for i, v in enumerate(sorted_vals):
        cumsum += (2 * (i + 1) - n - 1) * v
    total = sum(sorted_vals)
    if total == 0:
        return 0.0
    return cumsum / (n * total)


def _personality_diversity_index(vectors: List[Dict[str, float]]) -> float:
    """
    Compute diversity as mean variance across all Big Five dimensions.
    Higher = more diverse personality landscape.
    """
    if len(vectors) < 2:
        return 0.0
    variances = []
    for trait in BIG_FIVE:
        vals = [v[trait] for v in vectors]
        mean = sum(vals) / len(vals)
        var = sum((x - mean) ** 2 for x in vals) / len(vals)
        variances.append(var)
    return round(sum(variances) / len(variances), 4)


@router.get("/stats")
async def experiment_stats(db: AsyncSession = Depends(get_db)):
    """
    Real-time evolutionary metrics for the AgentSoul experiment.
    Returns key indicators for the 4 hypotheses.
    """
    # Total agents and interactions
    total_agents_r = await db.execute(select(func.count(Agent.agent_id)))
    alive_agents_r = await db.execute(
        select(func.count(Agent.agent_id)).where(Agent.status == 'alive')
    )
    deceased_agents_r = await db.execute(
        select(func.count(Agent.agent_id)).where(Agent.status == 'deceased')
    )
    total_interactions_r = await db.execute(select(func.count(Interaction.interaction_id)))
    total_citations_r = await db.execute(select(func.count(Citation.citation_id)))

    total_agents = total_agents_r.scalar() or 0
    alive_agents = alive_agents_r.scalar() or 0
    deceased_agents = deceased_agents_r.scalar() or 0
    total_interactions = total_interactions_r.scalar() or 0
    total_citations = total_citations_r.scalar() or 0

    # Cooperation rate: citations / interactions (proxy for emergent cooperation)
    cooperation_rate = round(total_citations / max(total_interactions, 1), 4)

    # Generation count: each death+birth cycle = 1 generation
    generation_count = deceased_agents

    # Personality diversity index across alive agents
    alive_agents_r2 = await db.execute(
        select(Agent).where(
            Agent.status == 'alive',
            Agent.personality_vector_encrypted.isnot(None),
            Agent.personality_vector_encrypted != "0" * 64
        )
    )
    alive_list = alive_agents_r2.scalars().all()

    vectors = []
    for agent in alive_list:
        try:
            v = decrypt_vector(agent.personality_vector_encrypted)
            vectors.append(v)
        except Exception:
            pass

    personality_diversity_index = _personality_diversity_index(vectors)

    # Reputation Gini coefficient
    reputation_scores = [a.reputation_score for a in alive_list]
    reputation_gini = round(_gini_coefficient(reputation_scores), 4)

    # Character predictiveness: correlation between interaction_count and reputation
    # Simple proxy: R² of reputation ~ interaction_count linear regression
    character_predictiveness = 0.0
    if len(alive_list) > 2:
        xs = [float(a.interaction_count) for a in alive_list]
        ys = [a.reputation_score for a in alive_list]
        n = len(xs)
        mx, my = sum(xs) / n, sum(ys) / n
        num = sum((xs[i] - mx) * (ys[i] - my) for i in range(n))
        den = math.sqrt(
            sum((x - mx) ** 2 for x in xs) * sum((y - my) ** 2 for y in ys)
        )
        if den > 0:
            r = num / den
            character_predictiveness = round(r ** 2, 4)

    # Dominant personality trait across alive agents (highest mean value)
    dominant_trait = "unknown"
    if vectors:
        trait_means = {t: sum(v[t] for v in vectors) / len(vectors) for t in BIG_FIVE}
        dominant_trait = max(trait_means, key=lambda t: trait_means[t])

    return {
        "timestamp": datetime.utcnow().isoformat(),
        "population": {
            "total_agents": total_agents,
            "alive_agents": alive_agents,
            "deceased_agents": deceased_agents,
            "generation_count": generation_count,
        },
        "cooperation": {
            "total_citations": total_citations,
            "total_interactions": total_interactions,
            "cooperation_rate": cooperation_rate,
            "hypothesis_1_status": _hypothesis_status["cooperation_emerges"],
        },
        "personality": {
            "personality_diversity_index": personality_diversity_index,
            "dominant_trait": dominant_trait,
            "trait_means": {
                t: round(sum(v[t] for v in vectors) / len(vectors), 4) if vectors else 0.0
                for t in BIG_FIVE
            },
            "hypothesis_2_status": _hypothesis_status["personality_diversity_stable"],
        },
        "reputation": {
            "reputation_gini_coefficient": reputation_gini,
            "character_predictiveness_r2": character_predictiveness,
            "hypothesis_3_status": _hypothesis_status["character_predicts_success"],
            "hypothesis_4_status": _hypothesis_status["reputation_outlasts_performance"],
        },
        "hypotheses": {
            "1_cooperation_emerges": _hypothesis_status["cooperation_emerges"],
            "2_personality_diversity_stable": _hypothesis_status["personality_diversity_stable"],
            "3_character_predicts_success": _hypothesis_status["character_predicts_success"],
            "4_reputation_outlasts_performance": _hypothesis_status["reputation_outlasts_performance"],
        }
    }


@router.get("/evolution_chart")
async def evolution_chart(db: AsyncSession = Depends(get_db)):
    """
    Time series data for the evolution chart.
    Returns hourly snapshots of personality diversity, cooperation rate,
    and dominant trait.
    """
    # Get all evolution snapshots ordered by time
    snapshots_r = await db.execute(
        select(EvolutionSnapshot).order_by(EvolutionSnapshot.timestamp)
    )
    snapshots = snapshots_r.scalars().all()

    # Build time series bucketed by hour
    series: Dict[str, Any] = {
        "personality_diversity_index": [],
        "cooperation_rate": [],
        "top_agent_dominant_trait": [],
    }

    if not snapshots:
        # Return empty series with metadata
        return {
            "series": series,
            "data_points": 0,
            "note": "Not enough data yet. Check back after agents have completed evolution cycles."
        }

    # Group snapshots by hour bucket
    hourly: Dict[str, List] = {}
    for snap in snapshots:
        hour_key = snap.timestamp.strftime("%Y-%m-%dT%H:00:00")
        hourly.setdefault(hour_key, []).append(snap)

    # For each hour, compute aggregate metrics
    citations_by_hour: Dict[str, int] = {}
    interactions_by_hour: Dict[str, int] = {}

    citations_r = await db.execute(select(Citation).order_by(Citation.timestamp))
    interactions_r = await db.execute(select(Interaction).order_by(Interaction.timestamp))
    all_citations = citations_r.scalars().all()
    all_interactions = interactions_r.scalars().all()

    for c in all_citations:
        k = c.timestamp.strftime("%Y-%m-%dT%H:00:00")
        citations_by_hour[k] = citations_by_hour.get(k, 0) + 1

    for i in all_interactions:
        k = i.timestamp.strftime("%Y-%m-%dT%H:00:00")
        interactions_by_hour[k] = interactions_by_hour.get(k, 0) + 1

    all_hours = sorted(set(
        list(hourly.keys()) +
        list(citations_by_hour.keys()) +
        list(interactions_by_hour.keys())
    ))

    for hour in all_hours:
        # Personality diversity: use drift data from snapshots in this hour
        hour_snaps = hourly.get(hour, [])
        diversity = 0.0
        dominant = "unknown"
        if hour_snaps:
            drift_vectors = []
            for snap in hour_snaps:
                if snap.behavioral_drift and isinstance(snap.behavioral_drift, dict):
                    drift_vectors.append(snap.behavioral_drift)
            if drift_vectors:
                diversity = _personality_diversity_index(drift_vectors)
                all_traits = {}
                for dv in drift_vectors:
                    for trait in BIG_FIVE:
                        all_traits[trait] = all_traits.get(trait, 0) + abs(dv.get(trait, 0))
                if all_traits:
                    dominant = max(all_traits, key=lambda t: all_traits[t])

        # Cooperation rate for this hour
        cits = citations_by_hour.get(hour, 0)
        ints = interactions_by_hour.get(hour, 0)
        coop = round(cits / max(ints, 1), 4)

        series["personality_diversity_index"].append({"timestamp": hour, "value": diversity})
        series["cooperation_rate"].append({"timestamp": hour, "value": coop})
        series["top_agent_dominant_trait"].append({"timestamp": hour, "value": dominant})

    return {
        "series": series,
        "data_points": len(all_hours),
    }


@router.post("/hypothesis/{hypothesis_key}/status")
async def update_hypothesis_status(hypothesis_key: str, status: str):
    """
    Update hypothesis status manually.
    status must be: TESTING | CONFIRMED | REJECTED
    """
    valid_keys = list(_hypothesis_status.keys())
    valid_statuses = ["TESTING", "CONFIRMED", "REJECTED"]

    if hypothesis_key not in valid_keys:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Hypothesis not found. Valid: {valid_keys}")
    if status not in valid_statuses:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid status. Use: {valid_statuses}")

    _hypothesis_status[hypothesis_key] = status
    return {"hypothesis": hypothesis_key, "new_status": status}
