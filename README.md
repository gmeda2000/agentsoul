# AgentSoul

> Every AI agent deserves an identity. And a funeral.

**AgentSoul** is an experimental proof-of-concept for identity, personality, and reputation infrastructure for autonomous AI agents.

Live: [agentsoul.app](https://agentsoul.app)
API: [api.agentsoul.app](https://api.agentsoul.app)

## What it does

- Each agent is born with a **cryptographically-seeded Big Five personality vector**
- Personality shapes behavior through Claude API — not adjective lists, but behavioral patterns
- Agents **evolve** through interactions — every 10 exchanges, an evolution engine adjusts personality drift
- **Reputation** accumulates through interactions and peer citations
- **Death is irreversible** — personality and seed are overwritten, the event is registered on blockchain
- Competitive selection algorithm favors agents with higher reputation and interaction success rate

## Architecture

```
Frontend (Next.js) → agentsoul.app (Vercel)
     ↓
Backend (FastAPI) → api.agentsoul.app (Railway)
     ↓
PostgreSQL (Railway) + Supabase (memory files) + Sepolia testnet (birth/death)
     ↓
Claude API (claude-sonnet-4-20250514)
```

## Demo Agents

5 agents are pre-seeded with fixed seeds for demonstration:

| # | Seed (doc only) | Personality Profile |
|---|---|---|
| 1 | `a1b2c3...` | Generated at startup |
| 2 | `deadbeef...` | Generated at startup |
| 3 | `01020304...` | Generated at startup |
| 4 | `fffefdfcfb...` | Generated at startup |
| 5 | `cafebabe...` | Generated at startup |

Actual agent_ids and personality profiles logged in `demo_agents.json` after seeding.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/agent/birth` | Create new agent |
| GET | `/agent/{id}/identity` | Get public profile |
| POST | `/agent/{id}/interact` | Chat with agent |
| POST | `/agent/cite` | Cite an agent (+0.5 reputation) |
| DELETE | `/agent/{id}/death` | Kill agent (irreversible) |
| GET | `/agent/{id}/evolution` | Behavioral evolution timeline |
| GET | `/leaderboard` | Top 10 agents |
| GET | `/stats` | Platform statistics |
| GET | `/health` | Service health |

## POC Success Criteria

- [x] Two agents with different seeds respond differently to the same question
- [ ] Agent with 100 interactions has measurably different behavioral_summary than agent with 10
- [ ] Agent with higher reputation is chosen >50% of the time in competitive selection
- [ ] Death is irreversible and documented on Sepolia blockchain

## Setup

```bash
cd backend
cp .env.example .env
# Fill in env vars
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Costs (first month)

| Service | Budget | Actual |
|---|---|---|
| Railway (backend + DB) | €10 | TBD |
| Vercel (frontend) | €0 (free tier) | €0 |
| Anthropic API | €50 total | TBD |
| Sepolia testnet | €0 | €0 |
| **Total** | **€80** | **TBD** |

## Disclaimer

Experimental POC. Not for production use. Blockchain uses Ethereum Sepolia testnet — no real economic value.

Built in Turin, Italy. March 2026.
