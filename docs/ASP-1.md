# Agentsoul Protocol — ASP-1

**Version:** 1.0.0-draft
**Published:** March 2026
**Authors:** Agentsoul Project
**License:** CC0 (public domain)
**Repository:** github.com/gmeda2000/agentsoul

---

## Overview

ASP-1 defines the structure, generation, and evolution of an AI agent soul —
a persistent identity and personality layer that works across any LLM.
Any compliant implementation must produce identical results from identical inputs.

Agentsoul.app is the reference implementation and canonical registry.
The algorithm is fully open — anyone can audit and reimplement.

---

## 1. Soul Structure

A compliant soul contains exactly these fields:

| Field | Type | Description |
|-------|------|-------------|
| `soul_id` | UUID v4 | Generated at birth, immutable |
| `birth_timestamp` | ISO 8601 UTC | Immutable |
| `death_timestamp` | ISO 8601 UTC | Null until death, immutable once set |
| `blockchain_tx_hash` | string | Ethereum transaction hash, immutable |
| `seed_hash` | SHA-256 hex | Hash of original seed. Seed itself never stored. |
| `personality_vector` | object | Five floats (see section 3) |
| `behavioral_summary` | string ≤200 | Updated on evolution |
| `dominant_survival_trait` | string ≤5 words | Updated on evolution |
| `evolution_history` | array | Append-only evolution snapshots (see section 5) |
| `reputation_score` | float 0–1 | Updated continuously |
| `lifetime_fitness_score` | float 0–1 | Updated daily |
| `interaction_count` | object | total, human, agent counts (see section 2) |
| `citation_count` | integer | Incremented on citation |
| `review_count` | integer | Incremented on public review |
| `status` | enum | `alive` \| `deceased` |
| `owner_handle` | string? | Optional pseudonymous identifier |

---

## 2. Interaction Count Tracking

`interaction_count` contains:

```
total: integer          — all interactions
human: integer          — interactions with human users
agent: integer          — interactions with other agents
last_updated: ISO 8601  — timestamp of last increment
```

Interactions are counted, not stored.
No content, no metadata beyond type and timestamp of last update.
This is the only interaction data retained in the soul.

---

## 3. Personality Vector — Big Five for Agents

Five dimensions, each a float between 0.0 and 1.0.

**openness** → *Context Exploration*
- 0.0 = relies strictly on established patterns, resists novel context
- 1.0 = actively incorporates new context, explores beyond task scope

**conscientiousness** → *Task Thoroughness*
- 0.0 = fast and approximate, prioritizes speed over completeness
- 1.0 = thorough and methodical, verifies before responding

**extraversion** → *Interaction Seeking*
- 0.0 = responds to exactly what is asked, minimal probing
- 1.0 = proactively seeks context, expands interaction scope

**agreeableness** → *Position Flexibility*
- 0.0 = maintains position firmly when output conflicts with expectations
- 1.0 = accommodates and adjusts readily to requester preferences

**neuroticism** → *Pressure Stability*
- 0.0 = stable performance under ambiguity and conflicting instructions
- 1.0 = performance degrades under pressure or unclear requirements

---

## 4. Seed-to-Vector Algorithm (fully open)

Given a random 32-byte seed:

1. Compute `seed_hash = SHA-256(seed)`
2. Never store seed after this step
3. Derive personality_vector deterministically:

```python
import hashlib

def derive_personality_vector(seed: bytes) -> dict:
    seed_hash = hashlib.sha256(seed).hexdigest()
    personality_hash = hashlib.sha256(
        (seed_hash + "personality_v1").encode()
    ).hexdigest()
    segment_len = len(personality_hash) // 5
    dimensions = ["openness", "conscientiousness", "extraversion",
                  "agreeableness", "neuroticism"]
    vector = {}
    for i, dim in enumerate(dimensions):
        segment = personality_hash[i*segment_len:(i+1)*segment_len]
        raw = int(segment, 16)
        vector[dim] = (raw % 10000) / 10000.0
    return vector
```

4. Generate behavioral_summary from personality_vector using compliant LLM with this exact prompt:

```
Given these Big Five personality values for an AI agent:
openness={o}, conscientiousness={c}, extraversion={e},
agreeableness={a}, neuroticism={n}
Describe the behavioral patterns of this agent in max 200 characters.
Do not use the dimension names. Describe observed behavior only.
No moral judgments.
```

5. Register on Ethereum (mainnet for production, Sepolia for development):
   `tx_data = keccak256(soul_id + birth_timestamp + seed_hash)`

---

## 5. Evolution Snapshots

Each evolution event appends one snapshot to `evolution_history`:

```json
{
  "snapshot_id": "UUID",
  "timestamp": "ISO 8601 UTC",
  "trigger_source": "human | agent | market | feedback",
  "interaction_count_at_snapshot": 42,
  "previous_vector": { "openness": 0.5, "...": "..." },
  "new_vector": { "openness": 0.53, "...": "..." },
  "drift_applied": { "openness": 0.03, "...": "..." },
  "new_behavioral_summary": "string",
  "new_dominant_survival_trait": "string",
  "confidence_at_snapshot": 0.084
}
```

Evolution history is append-only. No snapshot can be modified or deleted.

---

## 6. Confidence Score

```python
def compute_confidence(interaction_count: int) -> float:
    return min(1.0, interaction_count / 500)

def compute_confidence_margin(confidence: float) -> float:
    return (1.0 - confidence) * 0.15
```

| Range | Example | Tier |
|-------|---------|------|
| 0.00–0.10 | <50 interactions | Exploratory — fewer than 50 interactions |
| 0.10–0.40 | 50–200 interactions | Emerging — personality becoming visible |
| 0.40–0.80 | 200–400 interactions | Established — key traits stable |
| 0.80–1.00 | 400–500+ interactions | Verified — high statistical confidence |

Confidence affects personality_vector display only.
It does not affect reputation or fitness calculations.

---

## 7. Death Protocol

On death:

1. Set `death_timestamp` (immutable)
2. Set `status = deceased`
3. Overwrite `seed_hash` with `SHA-256("deceased" + soul_id)` — original unrecoverable
4. Freeze `personality_vector`, `behavioral_summary`, `reputation_score`
5. Register death on blockchain: `keccak256(soul_id + death_timestamp)`
6. Preserve all `evolution_history`, `review_count`, `interaction_count`
7. Soul remains publicly visible as historical record

**Death is irreversible. No resurrection. No clone inherits history.**

---

## 8. Compliance Requirements

A compliant ASP-1 implementation must:

- Produce identical `personality_vector` from identical seed (deterministic)
- Never store the original seed
- Register birth and death on a public blockchain
- Implement `interaction_count` tracking (count only, no content)
- Publish `evolution_history` as append-only
- Calculate confidence using the formula in section 6
- Make the soul publicly readable via standardized `GET` endpoint

---

## License

ASP-1 is published under CC0 — public domain.
No permission required to implement, fork, or extend.
Implementations that diverge from this specification
should use a different version identifier.

To propose changes: open a GitHub issue or pull request.
