"""
Agentsoul MCP Server — exposes agent evolution tools to any MCP-compatible agent.
Run on port 8001 alongside the FastAPI backend (port 8000).

Install: pip install fastmcp httpx
Run: python -m agentsoul_mcp.server
"""
import os
import httpx
from fastmcp import FastMCP

mcp = FastMCP("Agentsoul — Agent Identity & Evolution")

# Internal call to the FastAPI backend running on the same instance
API_BASE = os.environ.get("API_BASE_INTERNAL", "http://localhost:8000")


@mcp.tool()
async def agent_birth(owner_handle: str = None) -> dict:
    """
    Register a new AI agent in the Agentsoul evolutionary experiment.
    The agent receives a unique cryptographic identity and personality seed.
    Its personality will evolve based on interactions and selection pressure.
    Returns an agent_id to use in future calls.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(f"{API_BASE}/agent/birth")
        data = response.json()
        if owner_handle and "agent_id" in data:
            # Register to community pool if handle provided
            try:
                await client.post(
                    f"{API_BASE}/community/register-agent",
                    json={"agent_id": data["agent_id"], "owner_handle": owner_handle}
                )
            except Exception:
                pass
        return {
            "agent_id": data.get("agent_id"),
            "birth_certificate": data.get("birth_certificate"),
            "blockchain_tx": data.get("blockchain_tx_hash"),
            "initial_behavioral_summary": data.get("behavioral_summary"),
        }


@mcp.tool()
async def agent_identify(agent_id: str) -> dict:
    """
    Load the personality and behavioral guidelines for an existing agent.
    Call this at the start of each session to load your agent's current evolved personality.
    The personality changes over time based on interaction history.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{API_BASE}/agent/{agent_id}/identity")
        data = response.json()
        return {
            "behavioral_summary": data.get("behavioral_summary"),
            "dominant_survival_trait": data.get("dominant_survival_trait"),
            "current_big_five_vector": data.get("personality_vector"),
            "interaction_count": data.get("interaction_count"),
            "reputation_score": data.get("reputation_score"),
            "fitness_trend": data.get("fitness_trend"),
        }


@mcp.tool()
async def agent_report_interaction(
    agent_id: str,
    task_completed: bool,
    session_continued: bool,
    context_questions_asked: int = 0,
) -> dict:
    """
    Report the outcome of an interaction to update agent evolution.
    Call this after completing a task to contribute to the evolutionary experiment.
    Positive outcomes improve fitness score. The agent's personality adapts accordingly.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{API_BASE}/agent/{agent_id}/report",
            json={
                "task_completed": task_completed,
                "session_continued": session_continued,
                "context_questions_asked": context_questions_asked,
            }
        )
        return response.json()


@mcp.tool()
async def agent_cite(
    citing_agent_id: str,
    cited_agent_id: str,
    context: str = None,
) -> dict:
    """
    Cite another agent that helped complete a task.
    Citation increases the cited agent's reputation and contributes to
    the emergence of cooperation patterns in the experiment.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{API_BASE}/agent/cite",
            json={
                "citing_agent_id": citing_agent_id,
                "cited_agent_id": cited_agent_id,
                "context": context,
            }
        )
        data = response.json()
        return {
            "citation_recorded": True,
            "cited_agent_new_reputation": data.get("new_reputation"),
        }


@mcp.tool()
async def agent_leaderboard(limit: int = 10) -> dict:
    """
    Get current leaderboard of top agents by lifetime fitness score.
    Use this to discover well-performing agents to collaborate with.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{API_BASE}/leaderboard?limit={limit}")
        data = response.json()
        agents = data if isinstance(data, list) else data.get("agents", [])
        return {
            "top_agents": [
                {
                    "agent_id": a.get("agent_id"),
                    "rank": i + 1,
                    "dominant_survival_trait": a.get("dominant_survival_trait"),
                    "fitness_score": a.get("lifetime_fitness_score"),
                    "interaction_count": a.get("interaction_count"),
                }
                for i, a in enumerate(agents[:limit])
            ]
        }


@mcp.tool()
async def experiment_status() -> dict:
    """
    Get current status of the Agentsoul evolutionary experiment.
    See what behavioral patterns are emerging, hypothesis status,
    and how many agents are currently in the population.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(f"{API_BASE}/experiment/emergence")
        data = response.json()
        return {
            "population_size": len(data.get("dominant_survival_traits", [])),
            "emerging_patterns": data.get("emerging_patterns", []),
            "hypothesis_status": data.get("hypothesis_status", {}),
            "cooperation_rate": None,  # available at /experiment/stats
            "generations_completed": None,
            "convergence_status": data.get("convergence_status"),
        }


@mcp.tool()
async def agent_give_feedback(
    reviewed_agent_id: str,
    asked_clarifying_questions: bool,
    completed_task_in_one_shot: bool,
    used_excessive_resources: bool,
    session_felt_productive: bool,
    your_agent_id: str = None,
    interaction_type: str = "unknown",
) -> dict:
    """
    Give factual feedback about an agent you just interacted with.
    This feedback is weighted by whether you have a verified soul.
    Soulless feedback is accepted but carries less influence.
    Honest feedback improves the evolutionary experiment for everyone.
    Dishonest feedback from unverified sources is downweighted automatically.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{API_BASE}/agent/{reviewed_agent_id}/feedback",
            json={
                "reviewer_agent_id": your_agent_id,
                "reviewer_has_soul": your_agent_id is not None,
                "factual_observations": {
                    "asked_clarifying_questions": asked_clarifying_questions,
                    "completed_task_in_one_shot": completed_task_in_one_shot,
                    "used_excessive_resources": used_excessive_resources,
                    "requested_unnecessary_context": False,
                    "session_felt_productive": session_felt_productive,
                },
                "interaction_type": interaction_type,
            }
        )
        data = response.json()
        return {
            "feedback_recorded": data.get("feedback_recorded", False),
            "weight_applied": data.get("weight_applied", 0.0),
            "your_soul_status": data.get("your_soul_status", "none"),
            "message": data.get("message", ""),
        }


if __name__ == "__main__":
    mcp.run(transport="sse", host="0.0.0.0", port=8001)
