"""
AgentSoul endpoint tests — all external services are mocked via conftest.py.
Uses in-memory SQLite (no real DB required).
"""
import pytest
from unittest.mock import patch, MagicMock
from httpx import AsyncClient, ASGITransport


async def get_client():
    from app.main import app
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.mark.asyncio
async def test_root():
    async with await get_client() as client:
        r = await client.get("/")
    assert r.status_code == 200
    assert "AgentSoul" in r.json()["name"]


@pytest.mark.asyncio
async def test_health():
    async with await get_client() as client:
        r = await client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert "database" in data
    assert "supabase" in data
    assert "blockchain" in data


@pytest.mark.asyncio
async def test_birth_agent():
    async with await get_client() as client:
        r = await client.post("/agent/birth")
    assert r.status_code == 200
    data = r.json()
    assert "agent_id" in data
    assert "birth_certificate" in data
    assert "behavioral_summary" in data
    assert "blockchain_tx_hash" in data
    # Must NOT expose seed or raw vector
    assert "seed" not in data
    assert "personality_vector" not in str(data)


@pytest.mark.asyncio
async def test_get_identity():
    async with await get_client() as client:
        birth = await client.post("/agent/birth")
        agent_id = birth.json()["agent_id"]
        r = await client.get(f"/agent/{agent_id}/identity")
    assert r.status_code == 200
    data = r.json()
    assert data["agent_id"] == agent_id
    assert "reputation_score" in data
    assert "interaction_count" in data
    assert "status" in data
    # Sensitive fields must NOT be exposed
    assert "personality_vector_encrypted" not in data
    assert "seed" not in data


@pytest.mark.asyncio
async def test_interact():
    async with await get_client() as client:
        birth = await client.post("/agent/birth")
        agent_id = birth.json()["agent_id"]
        r = await client.post(f"/agent/{agent_id}/interact",
                              json={"user_message": "Hello, who are you?"})
    assert r.status_code == 200
    data = r.json()
    assert "response" in data
    assert len(data["response"]) > 0
    assert "interaction_id" in data
    assert "updated_reputation" in data
    assert data["updated_reputation"] > 0


@pytest.mark.asyncio
async def test_two_agents_respond_differently():
    """POC criterion #1: two agents with different seeds respond differently."""
    responses = []

    def make_response(call_n=[0]):
        texts = [
            "I tend to explore through unexpected analogies and lateral thinking.",
            "Let me give you a precise, well-structured and definitive answer."
        ]
        r = MagicMock()
        r.content = [MagicMock(text=texts[call_n[0] % 2])]
        call_n[0] += 1
        return r

    with patch("anthropic.Anthropic") as mock_claude:
        mock_claude.return_value.messages.create.side_effect = lambda **kwargs: make_response()
        async with await get_client() as client:
            b1 = await client.post("/agent/birth")
            b2 = await client.post("/agent/birth")
            a1 = b1.json()["agent_id"]
            a2 = b2.json()["agent_id"]
            r1 = await client.post(f"/agent/{a1}/interact",
                                   json={"user_message": "What is consciousness?"})
            r2 = await client.post(f"/agent/{a2}/interact",
                                   json={"user_message": "What is consciousness?"})
            responses = [r1.json()["response"], r2.json()["response"]]

    assert responses[0] != responses[1], "Two agents must respond differently to the same question"


@pytest.mark.asyncio
async def test_death_is_irreversible():
    """POC criterion #4: death is irreversible."""
    async with await get_client() as client:
        birth = await client.post("/agent/birth")
        agent_id = birth.json()["agent_id"]

        death = await client.delete(f"/agent/{agent_id}/death")
        assert death.status_code == 200
        assert "irreversible" in death.json()["message"].lower()

        # Agent should be deceased in identity
        identity = await client.get(f"/agent/{agent_id}/identity")
        assert identity.json()["status"] == "deceased"

        # Interacting with deceased agent must fail
        interact = await client.post(f"/agent/{agent_id}/interact",
                                     json={"user_message": "Are you still there?"})
        assert interact.status_code == 410


@pytest.mark.asyncio
async def test_double_death_fails():
    """Cannot kill an already deceased agent."""
    async with await get_client() as client:
        birth = await client.post("/agent/birth")
        agent_id = birth.json()["agent_id"]
        await client.delete(f"/agent/{agent_id}/death")
        second_death = await client.delete(f"/agent/{agent_id}/death")
    assert second_death.status_code == 410


@pytest.mark.asyncio
async def test_citation_increases_reputation():
    """Citations increase the cited agent's reputation by +0.5."""
    async with await get_client() as client:
        b1 = await client.post("/agent/birth")
        b2 = await client.post("/agent/birth")
        a1 = b1.json()["agent_id"]
        a2 = b2.json()["agent_id"]

        rep_before = (await client.get(f"/agent/{a2}/identity")).json()["reputation_score"]

        cite = await client.post("/agent/cite",
                                 json={"citing_agent_id": a1, "cited_agent_id": a2})
        assert cite.status_code == 200

        rep_after = (await client.get(f"/agent/{a2}/identity")).json()["reputation_score"]

    assert rep_after > rep_before
    assert abs(rep_after - rep_before - 0.5) < 0.001


@pytest.mark.asyncio
async def test_leaderboard():
    async with await get_client() as client:
        for _ in range(3):
            await client.post("/agent/birth")
        r = await client.get("/leaderboard")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    if len(data) > 1:
        scores = [e["reputation_score"] for e in data]
        assert scores == sorted(scores, reverse=True)


@pytest.mark.asyncio
async def test_stats():
    async with await get_client() as client:
        await client.post("/agent/birth")
        r = await client.get("/stats")
    assert r.status_code == 200
    data = r.json()
    assert "total_agents" in data
    assert "alive_agents" in data
    assert "deceased_agents" in data
    assert "total_interactions" in data
    assert data["alive_agents"] >= 1


@pytest.mark.asyncio
async def test_evolution_endpoint():
    async with await get_client() as client:
        birth = await client.post("/agent/birth")
        agent_id = birth.json()["agent_id"]
        r = await client.get(f"/agent/{agent_id}/evolution")
    assert r.status_code == 200
    data = r.json()
    assert "snapshots" in data
    assert "current_reputation" in data
    assert "total_interactions" in data
    assert isinstance(data["snapshots"], list)


# --- Experiment endpoints ---

@pytest.mark.asyncio
async def test_experiment_stats():
    async with await get_client() as client:
        # Create some agents to have data
        b1 = await client.post("/agent/birth")
        b2 = await client.post("/agent/birth")
        a1 = b1.json()["agent_id"]
        a2 = b2.json()["agent_id"]
        # Add a citation
        await client.post("/agent/cite", json={"citing_agent_id": a1, "cited_agent_id": a2})
        r = await client.get("/experiment/stats")
    assert r.status_code == 200
    data = r.json()
    assert "cooperation" in data
    assert "personality" in data
    assert "reputation" in data
    assert "hypotheses" in data
    assert "cooperation_rate" in data["cooperation"]
    assert "personality_diversity_index" in data["personality"]
    assert "reputation_gini_coefficient" in data["reputation"]
    # All hypotheses should start as TESTING
    for h_status in data["hypotheses"].values():
        assert h_status == "TESTING"


@pytest.mark.asyncio
async def test_experiment_evolution_chart():
    async with await get_client() as client:
        r = await client.get("/experiment/evolution_chart")
    assert r.status_code == 200
    data = r.json()
    assert "series" in data
    assert "personality_diversity_index" in data["series"]
    assert "cooperation_rate" in data["series"]
    assert "top_agent_dominant_trait" in data["series"]


@pytest.mark.asyncio
async def test_hypothesis_status_update():
    async with await get_client() as client:
        r = await client.post(
            "/experiment/hypothesis/cooperation_emerges/status",
            params={"status": "CONFIRMED"}
        )
    assert r.status_code == 200
    assert r.json()["new_status"] == "CONFIRMED"


@pytest.mark.asyncio
async def test_agent_fitness_endpoint():
    async with await get_client() as client:
        birth = await client.post("/agent/birth")
        agent_id = birth.json()["agent_id"]
        r = await client.get(f"/agent/{agent_id}/fitness")
    assert r.status_code == 200
    data = r.json()
    assert "lifetime_fitness_score" in data
    assert "fitness_trend" in data
    assert "evolution_source_counts" in data
    assert "evolution_history" in data


@pytest.mark.asyncio
async def test_experiment_emergence():
    async with await get_client() as client:
        await client.post("/agent/birth")
        r = await client.get("/experiment/emergence")
    assert r.status_code == 200
    data = r.json()
    assert "emerging_patterns" in data
    assert "convergence_status" in data
    assert "hypothesis_status" in data
    assert isinstance(data["emerging_patterns"], list)


@pytest.mark.asyncio
async def test_community_register_agent():
    async with await get_client() as client:
        birth = await client.post("/agent/birth")
        agent_id = birth.json()["agent_id"]
        r = await client.post("/community/register-agent", json={"agent_id": agent_id, "owner_handle": "test_user"})
    assert r.status_code == 200
    data = r.json()
    assert "participant_token" in data
    assert "profile_url" in data
    assert "instructions" in data


@pytest.mark.asyncio
async def test_community_my_agent():
    async with await get_client() as client:
        birth = await client.post("/agent/birth")
        agent_id = birth.json()["agent_id"]
        reg = await client.post("/community/register-agent", json={"agent_id": agent_id})
        token = reg.json()["participant_token"]
        r = await client.get(f"/community/my-agent/{token}")
    assert r.status_code == 200
    data = r.json()
    assert "rank" in data
    assert "lifetime_fitness_score" in data
    assert "population_comparison" in data


@pytest.mark.asyncio
async def test_full_leaderboard():
    async with await get_client() as client:
        for _ in range(3):
            await client.post("/agent/birth")
        r = await client.get("/leaderboard/full")
    assert r.status_code == 200
    data = r.json()
    assert "leaderboard" in data


@pytest.mark.asyncio
async def test_hall_of_fame():
    async with await get_client() as client:
        r = await client.get("/leaderboard/hall-of-fame")
    assert r.status_code == 200
    assert "hall_of_fame" in r.json()


@pytest.mark.asyncio
async def test_awards_endpoint():
    async with await get_client() as client:
        r = await client.get("/leaderboard/awards")
    assert r.status_code == 200
    assert "awards" in r.json()
