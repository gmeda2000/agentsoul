import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch, MagicMock
import json

# We mock external services for unit tests
@pytest.fixture(autouse=True)
def mock_external_services():
    with patch('app.services.blockchain.register_birth_on_chain', new_callable=AsyncMock) as mock_birth, \
         patch('app.services.blockchain.register_death_on_chain', new_callable=AsyncMock) as mock_death, \
         patch('app.services.supabase_service.save_agent_memory', new_callable=AsyncMock, return_value=True) as mock_save, \
         patch('app.services.supabase_service.load_agent_memory', new_callable=AsyncMock) as mock_load, \
         patch('app.services.supabase_service.init_supabase_schema', new_callable=AsyncMock) as mock_init, \
         patch('app.services.scheduler.start_scheduler') as mock_scheduler, \
         patch('anthropic.Anthropic') as mock_anthropic:

        mock_birth.return_value = "0xabc123"
        mock_death.return_value = "0xdead456"

        # Default memory mock
        mock_load.return_value = {
            "agent_id": "test",
            "base_vector": {"openness": 0.7, "conscientiousness": 0.6, "extraversion": 0.5, "agreeableness": 0.8, "neuroticism": 0.3},
            "behavioral_drift": {"openness": 0.0, "conscientiousness": 0.0, "extraversion": 0.0, "agreeableness": 0.0, "neuroticism": 0.0},
            "interaction_history": [],
            "learned_patterns": [],
            "reputation_events": []
        }

        # Mock Claude response
        mock_msg = MagicMock()
        mock_msg.content = [MagicMock(text="This is a test agent response with sufficient length to score well.")]
        mock_anthropic.return_value.messages.create.return_value = mock_msg

        yield


@pytest.mark.asyncio
async def test_health():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data


@pytest.mark.asyncio
async def test_birth_agent():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/agent/birth")
    assert response.status_code == 200
    data = response.json()
    assert "agent_id" in data
    assert "birth_certificate" in data
    assert "behavioral_summary" in data
    return data["agent_id"]


@pytest.mark.asyncio
async def test_get_identity():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        birth = await client.post("/agent/birth")
        agent_id = birth.json()["agent_id"]
        response = await client.get(f"/agent/{agent_id}/identity")
    assert response.status_code == 200
    data = response.json()
    assert data["agent_id"] == agent_id
    assert "reputation_score" in data
    assert "interaction_count" in data
    # Verify seed/vector NOT exposed
    assert "personality_vector_encrypted" not in data
    assert "seed" not in data


@pytest.mark.asyncio
async def test_interact():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        birth = await client.post("/agent/birth")
        agent_id = birth.json()["agent_id"]
        response = await client.post(f"/agent/{agent_id}/interact", json={"user_message": "Hello, who are you?"})
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "interaction_id" in data
    assert "updated_reputation" in data


@pytest.mark.asyncio
async def test_two_agents_different_responses():
    """Core POC criterion: two agents respond differently to same question."""
    from app.main import app
    from unittest.mock import patch, MagicMock

    responses = []
    call_count = [0]

    def make_response():
        texts = ["I tend to approach this through a wide lens...", "Let me give you a precise, structured answer..."]
        r = MagicMock()
        r.content = [MagicMock(text=texts[call_count[0] % 2])]
        call_count[0] += 1
        return r

    with patch('anthropic.Anthropic') as mock_anthropic:
        mock_anthropic.return_value.messages.create.side_effect = lambda **kwargs: make_response()
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            b1 = await client.post("/agent/birth")
            b2 = await client.post("/agent/birth")
            a1 = b1.json()["agent_id"]
            a2 = b2.json()["agent_id"]

            r1 = await client.post(f"/agent/{a1}/interact", json={"user_message": "What is consciousness?"})
            r2 = await client.post(f"/agent/{a2}/interact", json={"user_message": "What is consciousness?"})

            responses = [r1.json()["response"], r2.json()["response"]]

    assert responses[0] != responses[1], "Two agents should respond differently"


@pytest.mark.asyncio
async def test_death_is_irreversible():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        birth = await client.post("/agent/birth")
        agent_id = birth.json()["agent_id"]
        death = await client.delete(f"/agent/{agent_id}/death")
        assert death.status_code == 200
        # Try to interact with deceased agent
        interact = await client.post(f"/agent/{agent_id}/interact", json={"user_message": "Are you still there?"})
        assert interact.status_code == 410


@pytest.mark.asyncio
async def test_citation_increases_reputation():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        b1 = await client.post("/agent/birth")
        b2 = await client.post("/agent/birth")
        a1 = b1.json()["agent_id"]
        a2 = b2.json()["agent_id"]

        id1 = await client.get(f"/agent/{a2}/identity")
        rep_before = id1.json()["reputation_score"]

        await client.post("/agent/cite", json={"citing_agent_id": a1, "cited_agent_id": a2})

        id2 = await client.get(f"/agent/{a2}/identity")
        rep_after = id2.json()["reputation_score"]

        assert rep_after > rep_before


@pytest.mark.asyncio
async def test_leaderboard():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/leaderboard")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_stats():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_agents" in data
    assert "alive_agents" in data
    assert "deceased_agents" in data
    assert "total_interactions" in data


@pytest.mark.asyncio
async def test_evolution_endpoint():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        birth = await client.post("/agent/birth")
        agent_id = birth.json()["agent_id"]
        response = await client.get(f"/agent/{agent_id}/evolution")
    assert response.status_code == 200
    data = response.json()
    assert "snapshots" in data
    assert "current_reputation" in data
