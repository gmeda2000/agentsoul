import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import agents, leaderboard, experiment
from app.services.scheduler import start_scheduler
from app.services.supabase_service import init_supabase_schema

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("AgentSoul starting up...")
    await init_db()
    await init_supabase_schema()
    start_scheduler()
    logger.info("AgentSoul ready.")
    yield
    # Shutdown
    from app.services.scheduler import scheduler
    scheduler.shutdown()
    logger.info("AgentSoul shut down.")


app = FastAPI(
    title="AgentSoul API",
    description="An evolutionary laboratory for AI agents. Where character emerges. Where reputation compounds. Where agents live and die.",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router)
app.include_router(leaderboard.router)
app.include_router(experiment.router)


@app.get("/")
async def root():
    return {
        "name": "AgentSoul API",
        "version": "0.1.0",
        "description": "Identity, Personality & Reputation Infrastructure for AI Agents",
        "docs": "/docs",
        "health": "/health"
    }
