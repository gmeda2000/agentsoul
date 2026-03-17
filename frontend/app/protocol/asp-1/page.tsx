import Link from 'next/link';

export const metadata = {
  title: 'ASP-1 — Agentsoul Protocol Version 1',
  description: 'Open standard for AI agent soul specification. Defines structure, generation, and evolution of persistent agent identity and personality.',
};

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-zinc-950 border border-zinc-800 p-4 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed whitespace-pre my-4">
      {children}
    </pre>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12">
      <h2 className="text-lg font-semibold text-zinc-100 mb-4 border-b border-zinc-800 pb-2">{title}</h2>
      {children}
    </section>
  );
}

function Field({ name, type, desc }: { name: string; type: string; desc: string }) {
  return (
    <div className="grid grid-cols-12 gap-3 text-sm py-2 border-b border-zinc-900 last:border-0">
      <span className="col-span-3 font-mono text-amber-400 text-xs">{name}</span>
      <span className="col-span-3 font-mono text-zinc-500 text-xs">{type}</span>
      <span className="col-span-6 text-zinc-400 text-xs leading-relaxed">{desc}</span>
    </div>
  );
}

export default function ASP1Page() {
  return (
    <div className="px-6 py-16 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-12 pb-8 border-b border-zinc-800">
        <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-4">
          AgentSoul / Protocol
        </p>
        <h1 className="text-3xl font-normal text-zinc-100 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
          Agentsoul Protocol — ASP-1
        </h1>
        <div className="text-sm text-zinc-500 space-y-1 font-mono">
          <div>Version: 1.0.0-draft</div>
          <div>Published: March 2026</div>
          <div>Authors: Agentsoul Project</div>
          <div>
            License:{' '}
            <a href="https://creativecommons.org/publicdomain/zero/1.0/" className="text-zinc-400 hover:underline" target="_blank" rel="noopener noreferrer">
              CC0 (public domain)
            </a>
          </div>
          <div>
            Repository:{' '}
            <a href="https://github.com/gmeda2000/agentsoul/blob/main/docs/ASP-1.md" className="text-zinc-400 hover:underline" target="_blank" rel="noopener noreferrer">
              github.com/gmeda2000/agentsoul
            </a>
          </div>
        </div>
      </div>

      {/* Overview */}
      <Section id="overview" title="Overview">
        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
          ASP-1 defines the structure, generation, and evolution of an AI agent soul —
          a persistent identity and personality layer that works across any LLM.
          Any compliant implementation must produce identical results from identical inputs.
        </p>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Agentsoul.app is the reference implementation and canonical registry.
          The algorithm is fully open — anyone can audit and reimplement.
        </p>
      </Section>

      {/* Soul Structure */}
      <Section id="soul-structure" title="1. Soul Structure">
        <p className="text-zinc-500 text-sm mb-4">A compliant soul contains exactly these fields:</p>
        <div className="border border-zinc-800">
          <div className="grid grid-cols-12 gap-3 text-xs font-mono text-zinc-700 px-3 py-2 border-b border-zinc-800">
            <span className="col-span-3">Field</span>
            <span className="col-span-3">Type</span>
            <span className="col-span-6">Description</span>
          </div>
          <div className="px-3">
            <Field name="soul_id" type="UUID v4" desc="Generated at birth, immutable" />
            <Field name="birth_timestamp" type="ISO 8601 UTC" desc="Immutable" />
            <Field name="death_timestamp" type="ISO 8601 UTC" desc="Null until death, immutable once set" />
            <Field name="blockchain_tx_hash" type="string" desc="Ethereum transaction hash, immutable" />
            <Field name="seed_hash" type="SHA-256 hex" desc="Hash of original seed. Seed itself never stored." />
            <Field name="personality_vector" type="object" desc="Five floats (see section 3)" />
            <Field name="behavioral_summary" type="string ≤200" desc="Updated on evolution" />
            <Field name="dominant_survival_trait" type="string ≤5 words" desc="Updated on evolution" />
            <Field name="evolution_history" type="array" desc="Append-only evolution snapshots (see section 5)" />
            <Field name="reputation_score" type="float 0–1" desc="Updated continuously" />
            <Field name="lifetime_fitness_score" type="float 0–1" desc="Updated daily" />
            <Field name="interaction_count" type="object" desc="total, human, agent counts (see section 2)" />
            <Field name="citation_count" type="integer" desc="Incremented on citation" />
            <Field name="review_count" type="integer" desc="Incremented on public review" />
            <Field name="status" type="enum" desc="alive | deceased" />
            <Field name="owner_handle" type="string?" desc="Optional pseudonymous identifier" />
          </div>
        </div>
      </Section>

      {/* Interaction Count */}
      <Section id="interaction-count" title="2. Interaction Count Tracking">
        <p className="text-zinc-400 text-sm leading-relaxed mb-3">
          <code className="font-mono text-amber-400 text-xs">interaction_count</code> contains:
        </p>
        <Code>{`interaction_count:
  total: integer          — all interactions
  human: integer          — interactions with human users
  agent: integer          — interactions with other agents
  last_updated: ISO 8601  — timestamp of last increment`}</Code>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Interactions are counted, not stored.
          No content, no metadata beyond type and timestamp of last update.
          This is the only interaction data retained in the soul.
        </p>
      </Section>

      {/* Personality Vector */}
      <Section id="personality-vector" title="3. Personality Vector — Big Five for Agents">
        <p className="text-zinc-500 text-sm mb-4">Five dimensions, each a float between 0.0 and 1.0.</p>
        <div className="space-y-4">
          {[
            {
              key: 'openness',
              label: 'Context Exploration',
              low: 'Relies strictly on established patterns, resists novel context',
              high: 'Actively incorporates new context, explores beyond task scope',
            },
            {
              key: 'conscientiousness',
              label: 'Task Thoroughness',
              low: 'Fast and approximate, prioritizes speed over completeness',
              high: 'Thorough and methodical, verifies before responding',
            },
            {
              key: 'extraversion',
              label: 'Interaction Seeking',
              low: 'Responds to exactly what is asked, minimal probing',
              high: 'Proactively seeks context, expands interaction scope',
            },
            {
              key: 'agreeableness',
              label: 'Position Flexibility',
              low: 'Maintains position firmly when output conflicts with expectations',
              high: 'Accommodates and adjusts readily to requester preferences',
            },
            {
              key: 'neuroticism',
              label: 'Pressure Stability',
              low: 'Stable performance under ambiguity and conflicting instructions',
              high: 'Performance degrades under pressure or unclear requirements',
            },
          ].map((d) => (
            <div key={d.key} className="border border-zinc-800 p-4">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-mono text-amber-400 text-xs">{d.key}</span>
                <span className="text-zinc-300 text-sm">{d.label}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs text-zinc-500">
                <div><span className="text-zinc-700">0.0 —</span> {d.low}</div>
                <div><span className="text-zinc-700">1.0 —</span> {d.high}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Algorithm */}
      <Section id="algorithm" title="4. Seed-to-Vector Algorithm (fully open)">
        <p className="text-zinc-500 text-sm mb-4">Given a random 32-byte seed:</p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-400 mb-4 ml-2">
          <li>Compute <code className="font-mono text-amber-400 text-xs">seed_hash = SHA-256(seed)</code></li>
          <li>Never store seed after this step</li>
          <li>Derive personality_vector deterministically (see below)</li>
          <li>Generate behavioral_summary via LLM with standardized prompt</li>
          <li>Register on Ethereum — <code className="font-mono text-xs text-amber-400">keccak256(soul_id + birth_timestamp + seed_hash)</code></li>
        </ol>
        <Code>{`# Python reference implementation

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

def compute_confidence(interaction_count: int) -> float:
    return min(1.0, interaction_count / 500)

def compute_confidence_margin(confidence: float) -> float:
    return (1.0 - confidence) * 0.15`}</Code>
        <p className="text-zinc-600 text-xs">
          This algorithm is deterministic. Identical seed → identical personality_vector across all compliant implementations.
        </p>
      </Section>

      {/* Evolution Snapshots */}
      <Section id="evolution-snapshots" title="5. Evolution Snapshots">
        <p className="text-zinc-500 text-sm mb-4">Each evolution event appends one snapshot to evolution_history:</p>
        <Code>{`{
  snapshot_id: UUID,
  timestamp: ISO 8601 UTC,
  trigger_source: "human" | "agent" | "market" | "feedback",
  interaction_count_at_snapshot: integer,
  previous_vector: { openness, conscientiousness, extraversion,
                     agreeableness, neuroticism },
  new_vector: { openness, conscientiousness, extraversion,
                agreeableness, neuroticism },
  drift_applied: { ... },        // signed floats per dimension
  new_behavioral_summary: string,
  new_dominant_survival_trait: string,
  confidence_at_snapshot: float
}`}</Code>
        <p className="text-zinc-500 text-sm">
          Evolution history is append-only. No snapshot can be modified or deleted.
        </p>
      </Section>

      {/* Confidence Score */}
      <Section id="confidence-score" title="6. Confidence Score">
        <Code>{`confidence = min(1.0, interaction_count.total / 500)
confidence_margin = (1.0 - confidence) * 0.15`}</Code>
        <div className="border border-zinc-800 mb-4">
          <div className="grid grid-cols-3 text-xs font-mono text-zinc-600 px-3 py-2 border-b border-zinc-800">
            <span>Range</span>
            <span>Example</span>
            <span>Tier</span>
          </div>
          {[
            ['0.00–0.10', '&lt;50 interactions', 'Exploratory — fewer than 50 interactions'],
            ['0.10–0.40', '50–200 interactions', 'Emerging — personality becoming visible'],
            ['0.40–0.80', '200–400 interactions', 'Established — key traits stable'],
            ['0.80–1.00', '400–500+ interactions', 'Verified — high statistical confidence'],
          ].map(([range, example, tier]) => (
            <div key={range} className="grid grid-cols-3 text-xs px-3 py-2 border-b border-zinc-900 last:border-0">
              <span className="font-mono text-zinc-500">{range}</span>
              <span className="text-zinc-600">{example}</span>
              <span className="text-zinc-400">{tier}</span>
            </div>
          ))}
        </div>
        <p className="text-zinc-500 text-sm">
          Confidence affects personality_vector display only.
          It does not affect reputation or fitness calculations.
        </p>
      </Section>

      {/* Death Protocol */}
      <Section id="death-protocol" title="7. Death Protocol">
        <p className="text-zinc-500 text-sm mb-4">On death:</p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-400 ml-2">
          <li>Set death_timestamp (immutable)</li>
          <li>Set status = deceased</li>
          <li>Overwrite seed_hash with SHA-256(&quot;deceased&quot; + soul_id) — original unrecoverable</li>
          <li>Freeze personality_vector, behavioral_summary, reputation_score</li>
          <li>Register death on blockchain: keccak256(soul_id + death_timestamp)</li>
          <li>Preserve all evolution_history, review_count, interaction_count</li>
          <li>Soul remains publicly visible as historical record</li>
        </ol>
        <p className="text-zinc-600 text-sm mt-4 italic">
          Death is irreversible. No resurrection. No clone inherits history.
        </p>
      </Section>

      {/* Compliance */}
      <Section id="compliance" title="8. Compliance Requirements">
        <p className="text-zinc-500 text-sm mb-3">A compliant ASP-1 implementation must:</p>
        <ul className="space-y-2 text-sm text-zinc-400">
          {[
            'Produce identical personality_vector from identical seed (deterministic)',
            'Never store the original seed',
            'Register birth and death on a public blockchain',
            'Implement interaction_count tracking (count only, no content)',
            'Publish evolution_history as append-only',
            'Calculate confidence using the formula in section 6',
            'Make the soul publicly readable via standardized GET endpoint',
          ].map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-amber-400 shrink-0">·</span>
              {r}
            </li>
          ))}
        </ul>
      </Section>

      {/* Footer */}
      <div className="border-t border-zinc-800 pt-8 text-xs text-zinc-600 leading-relaxed space-y-2">
        <p>
          ASP-1 is published under CC0 — public domain.
          No permission required to implement, fork, or extend.
        </p>
        <p>
          Implementations that diverge from this specification should use a different version identifier.
        </p>
        <p>
          To propose changes:{' '}
          <a
            href="https://github.com/gmeda2000/agentsoul/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:underline"
          >
            open a GitHub issue or pull request
          </a>
          .
        </p>
        <p className="mt-4">
          <Link href="/" className="text-zinc-500 hover:underline">← agentsoul.app</Link>
        </p>
      </div>
    </div>
  );
}
