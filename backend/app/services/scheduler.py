import asyncio
import logging
import random
from typing import List
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select, update
from app.database import AsyncSessionLocal
from app.models import Agent, Interaction

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

DEMO_QUESTIONS = [
    # Technical
    "Explain how transformers work in machine learning.",
    "What is the difference between async and sync programming?",
    "How would you design a scalable caching system?",
    # Emotional
    "I'm feeling overwhelmed with my workload. What should I do?",
    "How do you deal with failure?",
    "What does it mean to be happy?",
    # Advice
    "Should I quit my job to start a startup?",
    "How do I become a better leader?",
    "What's the most important skill for the next decade?",
    # Ambiguous
    "Is technology making us more or less human?",
    "What's the right amount of ambition?",
    "When should you break the rules?",
]


async def select_agent_for_task(agents: List[Agent]) -> Agent:
    """
    Selection algorithm:
    40% reputation_score
    30% interaction_success_rate (approximated by reputation / max_interaction)
    20% response_time_ms (random simulation)
    10% random
    """
    if not agents:
        return None

    max_rep = max(a.reputation_score for a in agents) or 1.0
    max_count = max(a.interaction_count for a in agents) or 1

    scores = []
    for agent in agents:
        rep_score = (agent.reputation_score / max_rep) * 0.4
        success_rate = (agent.interaction_count / max_count) * 0.3
        speed_score = random.random() * 0.2
        random_score = random.random() * 0.1
        total = rep_score + success_rate + speed_score + random_score
        scores.append((agent, total))

    scores.sort(key=lambda x: x[1], reverse=True)
    return scores[0][0]


async def run_simulation_tick():
    """Run 3 simulated interactions per tick."""
    try:
        import anthropic
        from app.config import settings
        from app.services.supabase_service import load_agent_memory
        from app.services.personality import decrypt_vector, vector_to_system_prompt
        from app.services.evolution import add_interaction_to_memory, maybe_evolve, get_effective_vector

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Agent).where(Agent.status == 'alive').limit(10)
            )
            agents = result.scalars().all()

            if not agents:
                return

            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

            for _ in range(3):
                selected = await select_agent_for_task(agents)
                if not selected:
                    continue

                question = random.choice(DEMO_QUESTIONS)
                memory = await load_agent_memory(str(selected.agent_id))

                if not memory or not selected.personality_vector_encrypted:
                    continue

                base_vector = decrypt_vector(selected.personality_vector_encrypted)
                effective_vector = get_effective_vector(memory)
                system_prompt = vector_to_system_prompt(effective_vector)

                # Add recent history to context
                history = memory.get("interaction_history", [])[-5:]
                messages = []
                for h in history:
                    messages.append({"role": "user", "content": h["user_message"]})
                    messages.append({"role": "assistant", "content": h["agent_response"]})
                messages.append({"role": "user", "content": question})

                try:
                    response = client.messages.create(
                        model="claude-sonnet-4-20250514",
                        max_tokens=300,
                        system=system_prompt,
                        messages=messages
                    )
                    agent_response = response.content[0].text

                    # Save interaction
                    interaction = Interaction(
                        agent_id=selected.agent_id,
                        user_message=question,
                        agent_response=agent_response,
                        response_quality_score=random.uniform(0.6, 1.0),
                        context="simulation"
                    )
                    db.add(interaction)

                    # Update agent stats
                    selected.interaction_count += 1
                    selected.reputation_score += random.uniform(0.1, 0.3)

                    await db.commit()
                    await db.refresh(selected)

                    # Memory + evolution
                    await add_interaction_to_memory(
                        str(selected.agent_id), question, agent_response, 0.8
                    )
                    await maybe_evolve(str(selected.agent_id), selected.interaction_count)

                    logger.info(f"Simulation tick: agent {selected.agent_id} answered '{question[:40]}...'")

                except Exception as e:
                    logger.error(f"Simulation interaction failed: {e}")
                    await db.rollback()

    except Exception as e:
        logger.error(f"Simulation tick failed: {e}")


def start_scheduler():
    scheduler.add_job(run_simulation_tick, 'interval', minutes=60, id='simulation')
    scheduler.start()
    logger.info("Scheduler started — simulation every 60 minutes")
