"""
Test configuration — uses in-memory SQLite instead of PostgreSQL.
All external services (Supabase, Anthropic, blockchain) are mocked.
"""
import os
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch

# Force SQLite for tests before any app module is imported
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_KEY"] = "test-key"
os.environ["ANTHROPIC_API_KEY"] = "sk-ant-test"
os.environ["SEPOLIA_PRIVATE_KEY"] = ""


def make_mock_claude_response(text="This is a detailed test response from the agent with sufficient length."):
    msg = MagicMock()
    msg.content = [MagicMock(text=text)]
    return msg


@pytest.fixture(autouse=True)
def mock_all_external():
    """Mock every external service call for all tests."""
    default_memory = {
        "agent_id": "test-agent",
        "base_vector": {
            "openness": 0.7, "conscientiousness": 0.6,
            "extraversion": 0.5, "agreeableness": 0.8, "neuroticism": 0.3
        },
        "behavioral_drift": {
            "openness": 0.0, "conscientiousness": 0.0,
            "extraversion": 0.0, "agreeableness": 0.0, "neuroticism": 0.0
        },
        "interaction_history": [],
        "learned_patterns": [],
        "reputation_events": []
    }

    with patch("app.services.blockchain.register_birth_on_chain", new_callable=AsyncMock, return_value="0xabc123test"), \
         patch("app.services.blockchain.register_death_on_chain", new_callable=AsyncMock, return_value="0xdead456test"), \
         patch("app.services.supabase_service.save_agent_memory", new_callable=AsyncMock, return_value=True), \
         patch("app.services.supabase_service.load_agent_memory", new_callable=AsyncMock, return_value=default_memory), \
         patch("app.services.supabase_service.init_supabase_schema", new_callable=AsyncMock), \
         patch("app.services.scheduler.start_scheduler"), \
         patch("anthropic.Anthropic") as mock_claude:
        mock_claude.return_value.messages.create.return_value = make_mock_claude_response()
        yield


@pytest_asyncio.fixture(autouse=True)
async def reset_db():
    """Re-create all tables before each test (fresh SQLite in-memory DB)."""
    from app.database import engine, Base
    # Import models so they register with Base.metadata
    import app.models  # noqa
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
