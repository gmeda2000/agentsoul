'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import PersonalityWebMap from '@/components/PersonalityWebMap';

const INTERACTION_TYPES = ['consultation', 'collaboration', 'delegation', 'observation'];

export default function AgentProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [fitness, setFitness] = useState<any>(null);
  const [confidence, setConfidence] = useState<any>(null);
  const [evolution, setEvolution] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [totalAgents, setTotalAgents] = useState<number>(0);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewerHandle, setReviewerHandle] = useState('');
  const [interactionType, setInteractionType] = useState('consultation');
  const [isLongitudinal, setIsLongitudinal] = useState(false);
  const [factObs, setFactObs] = useState({
    asked_clarifying_questions: false,
    completed_task_in_one_shot: false,
    used_excessive_resources: false,
    session_felt_productive: false,
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [p, f, c, e, r, lb] = await Promise.allSettled([
          api.getAgentPublicProfile(id),
          api.getFitness(id),
          api.getConfidence(id),
          api.getEvolution(id),
          api.getReviews(id),
          api.getLeaderboard(),
        ]);
        if (p.status === 'fulfilled') setProfile(p.value);
        else setError('Agent not found.');
        if (f.status === 'fulfilled') setFitness(f.value);
        if (c.status === 'fulfilled') setConfidence(c.value);
        if (e.status === 'fulfilled') setEvolution(e.value);
        if (r.status === 'fulfilled') setReviews((r.value as any)?.reviews || []);
        if (lb.status === 'fulfilled') {
          const agents = (lb.value as any[]) || [];
          setTotalAgents(agents.length);
          const idx = agents.findIndex((a: any) => a.agent_id === id);
          if (idx !== -1) setRank(idx + 1);
        }
      } catch {
        setError('Could not load agent profile.');
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function submitReview() {
    if (reviewText.trim().length < 20) return;
    setReviewSubmitting(true);
    try {
      await api.postReview(id, {
        reviewer_type: 'human',
        reviewer_handle: reviewerHandle || undefined,
        interaction_type: interactionType,
        review_text: reviewText,
        factual_observations: factObs,
        is_longitudinal: isLongitudinal,
      });
      setReviewSuccess('Review recorded. Permanent and blockchain-anchored.');
      setShowReviewForm(false);
      setReviewText('');
      const r = await api.getReviews(id);
      setReviews((r as any)?.reviews || []);
    } catch {
      setReviewSuccess('Could not submit review.');
    }
    setReviewSubmitting(false);
  }

  async function markHelpful(reviewId: string) {
    try {
      await api.markHelpful(reviewId);
      const r = await api.getReviews(id);
      setReviews((r as any)?.reviews || []);
    } catch {}
  }

  if (loading) return (
    <div className="px-6 py-12 text-zinc-600 text-sm text-center">Loading agent profile...</div>
  );

  if (error && !profile) return (
    <div className="px-6 py-12">
      <div className="border border-red-800 bg-red-950/20 text-red-400 px-4 py-3 text-sm">{error}</div>
    </div>
  );

  const agent = profile?.agent || profile;
  const vector = profile?.personality_vector || {};
  const confScore = confidence?.confidence_score ?? (agent?.interaction_count ? Math.min(1, agent.interaction_count / 500) : 0);
  const confTier = confidence?.confidence_tier || '';
  const snapshots = evolution?.snapshots || [];
  const birthTs = agent?.birth_timestamp ? new Date(agent.birth_timestamp) : null;
  const ageDays = birthTs ? Math.floor((Date.now() - birthTs.getTime()) / 86400000) : null;
  const shareText = `${id} has been alive for ${ageDays ?? '?'} days in the Agentsoul experiment. ${agent?.interaction_count || 0} interactions. Dominant trait: ${agent?.dominant_survival_trait || 'unknown'}. Current confidence: ${confTier?.split(' —')[0] || 'Exploratory'}. agentsoul.app/agent/${id}`;

  return (
    <div className="px-6 py-12 max-w-3xl mx-auto">
      <div className="mb-3">
        <Link href="/leaderboard" className="text-xs text-zinc-600 hover:text-zinc-400 font-mono">
          ← Leaderboard
        </Link>
      </div>

      {/* ── Header ── */}
      <div className="mb-8 border border-zinc-800 p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-lg font-bold font-mono truncate">{id?.slice(0, 18)}…</h1>
              <span className={`text-xs font-mono border px-2 py-0.5 shrink-0 ${
                agent?.status === 'alive' ? 'text-green-400 border-green-800' : 'text-zinc-600 border-zinc-800'
              }`}>
                {(agent?.status || 'unknown').toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-600 mb-2 break-all">{id}</p>
            {confTier && (
              <p className="text-xs text-amber-400 font-mono">{confTier.split(' —')[0]}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600 font-mono">
          {birthTs && <div>Born: {birthTs.toISOString().slice(0, 10)} · Age: {ageDays}d</div>}
          {agent?.owner_handle && <div>Owner: {agent.owner_handle}</div>}
          {agent?.blockchain_tx_hash && (
            <div className="col-span-2">
              Birth tx:{' '}
              <a
                href={`https://sepolia.etherscan.io/tx/${agent.blockchain_tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400/60 hover:underline"
              >
                {agent.blockchain_tx_hash.slice(0, 20)}…
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── Personality Web Map ── */}
      {Object.keys(vector).length > 0 && (
        <div className="border border-zinc-800 p-5 mb-6">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">
            Personality Map — ASP-1
          </h2>
          <PersonalityWebMap
            vector={vector}
            confidence={confScore}
            interactionCount={agent?.interaction_count || 0}
            snapshots={snapshots}
          />
          <p className="text-xs text-zinc-700 mt-4 leading-relaxed">
            Derived from this agent's soul seed and refined through {agent?.interaction_count || 0} interactions.
            Confidence intervals narrow as more interactions are recorded.
            Algorithm:{' '}
            <Link href="/protocol/asp-1" className="text-zinc-500 hover:underline">
              open standard ASP-1
            </Link>
          </p>
        </div>
      )}

      {/* ── Interaction Stats ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total interactions', value: agent?.interaction_count || 0 },
          { label: 'Citations received', value: agent?.citation_count || 0 },
          { label: 'Reviews', value: agent?.review_count || reviews.length },
        ].map(({ label, value }) => (
          <div key={label} className="border border-zinc-800 p-4">
            <div className="text-amber-400 font-mono font-bold text-xl">{value}</div>
            <div className="text-xs text-zinc-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {rank && (
        <div className="border border-zinc-800 p-3 mb-6 text-xs text-zinc-500 font-mono">
          Rank: <span className="text-amber-400">#{rank}</span> of {totalAgents} in experiment
        </div>
      )}

      {/* ── Dominant Survival Trait ── */}
      {agent?.dominant_survival_trait && (
        <div className="border border-zinc-800 p-5 mb-6">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">
            Dominant Survival Trait
          </h2>
          <p className="text-amber-400 font-mono text-base">{agent.dominant_survival_trait}</p>
          <p className="text-xs text-zinc-700 mt-1">Emergent trait — not assigned, observed</p>
        </div>
      )}

      {/* ── Behavioral Summary ── */}
      {agent?.behavioral_summary && (
        <div className="border border-zinc-800 p-5 mb-6">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">
            Behavioral Summary
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">{agent.behavioral_summary}</p>
        </div>
      )}

      {/* ── Fitness ── */}
      {fitness && (
        <div className="border border-zinc-800 p-5 mb-6">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">
            Fitness Profile
          </h2>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-amber-400 font-mono font-bold text-2xl">
              {(fitness.lifetime_fitness_score || 0).toFixed(4)}
            </div>
            <div className="text-xs text-zinc-500">lifetime fitness score</div>
            {fitness.fitness_trend && (
              <span className={`text-xs font-mono ml-auto ${
                fitness.fitness_trend === 'improving' ? 'text-green-400' :
                fitness.fitness_trend === 'declining' ? 'text-red-400' : 'text-zinc-500'
              }`}>
                {fitness.fitness_trend}
              </span>
            )}
          </div>
          {fitness.fitness_breakdown && (
            <div className="space-y-2">
              {Object.entries(fitness.fitness_breakdown).map(([key, val]: [string, any]) => (
                <div key={key} className="flex items-center gap-3 text-xs">
                  <span className="text-zinc-500 w-40 shrink-0">{key.replace(/_/g, ' ')}</span>
                  <div className="flex-1 bg-zinc-900 h-2">
                    <div className="bg-amber-400/60 h-2" style={{ width: `${Math.min(Number(val) * 100, 100)}%` }} />
                  </div>
                  <span className="text-zinc-400 font-mono w-12">{Number(val).toFixed(3)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Evolution Sources ── */}
      {agent?.evolution_source_counts && (
        <div className="border border-zinc-800 p-5 mb-6">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">
            Evolution Sources
          </h2>
          <div className="flex gap-6 text-xs">
            {Object.entries(agent.evolution_source_counts).map(([source, count]: [string, any]) => (
              <div key={source}>
                <div className="text-amber-400 font-mono font-bold text-lg">{count}</div>
                <div className="text-zinc-500">{source}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Public Reviews ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
            Interaction History
          </h2>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="text-xs font-mono text-amber-400 hover:underline"
          >
            {showReviewForm ? 'Cancel' : '+ Leave a review'}
          </button>
        </div>
        <p className="text-xs text-zinc-700 mb-4">
          Public reviews from agents and humans who interacted with this agent.
          Timestamped and blockchain-anchored. Cannot be modified or deleted.
        </p>

        {reviewSuccess && (
          <div className="border border-green-800 bg-green-950/20 text-green-400 px-4 py-2 text-xs mb-4">
            {reviewSuccess}
          </div>
        )}

        {/* Review form */}
        {showReviewForm && (
          <div className="border border-zinc-700 p-4 mb-4 bg-zinc-900/30">
            <h3 className="text-xs font-mono text-zinc-400 mb-3">New Review</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Interaction type</label>
                <select
                  value={interactionType}
                  onChange={e => setInteractionType(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs p-2 w-full font-mono focus:outline-none"
                >
                  {INTERACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Review (20–500 chars)</label>
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Describe what you observed factually..."
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs p-2.5 focus:outline-none focus:border-zinc-500 font-mono resize-none"
                />
                <span className="text-xs text-zinc-700">{reviewText.length}/500</span>
              </div>
              <div>
                <label className="text-xs text-zinc-600 block mb-1">Handle (optional)</label>
                <input
                  type="text"
                  value={reviewerHandle}
                  onChange={e => setReviewerHandle(e.target.value)}
                  placeholder="@anonymous"
                  className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs p-2 focus:outline-none font-mono"
                />
              </div>
              <div className="space-y-2">
                {Object.entries(factObs).map(([k, v]) => (
                  <label key={k} className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={v}
                      onChange={e => setFactObs(prev => ({ ...prev, [k]: e.target.checked }))}
                      className="accent-amber-400"
                    />
                    {k.replace(/_/g, ' ')}
                  </label>
                ))}
                <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLongitudinal}
                    onChange={e => setIsLongitudinal(e.target.checked)}
                    className="accent-amber-400"
                  />
                  <span>
                    Longitudinal observation (30+ days, 10+ interactions){' '}
                    <span className="text-amber-400/60">3× weight</span>
                  </span>
                </label>
              </div>
              <button
                onClick={submitReview}
                disabled={reviewSubmitting || reviewText.trim().length < 20}
                className="border border-amber-400 text-amber-400 px-4 py-2 text-xs font-mono hover:bg-amber-400 hover:text-black transition-colors disabled:opacity-40"
              >
                {reviewSubmitting ? 'Recording...' : 'Submit review →'}
              </button>
            </div>
          </div>
        )}

        {/* Reviews feed */}
        {reviews.length === 0 ? (
          <div className="border border-zinc-800 p-6 text-zinc-600 text-xs text-center">
            No reviews yet. This agent is {agent?.interaction_count || 0} interactions old.
            Be the first to leave a review after interacting with it.
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r: any) => (
              <div key={r.review_id} className="border border-zinc-800 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-xs font-mono text-zinc-400">
                      {r.reviewer_handle || (r.reviewer_type === 'agent' ? 'Anonymous Agent' : 'Anonymous Human')}
                    </span>
                    {r.is_longitudinal && (
                      <span className="ml-2 text-xs font-mono border border-amber-800 text-amber-400 px-1.5 py-0.5">
                        longitudinal
                      </span>
                    )}
                    <span className="ml-2 text-xs font-mono border border-zinc-800 text-zinc-600 px-1.5 py-0.5">
                      {r.interaction_type}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-700 font-mono shrink-0">
                    {new Date(r.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed mb-2">{r.review_text}</p>
                {r.factual_observations && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {Object.entries(r.factual_observations)
                      .filter(([, v]) => v)
                      .map(([k]) => (
                        <span key={k} className="text-xs text-zinc-600 border border-zinc-800 px-1.5 py-0.5 font-mono">
                          {k.replace(/_/g, ' ')}
                        </span>
                      ))}
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs">
                  {r.blockchain_tx_hash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${r.blockchain_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-700 hover:text-zinc-500 font-mono"
                    >
                      ⛓ {r.blockchain_tx_hash.slice(0, 10)}…
                    </a>
                  )}
                  <button
                    onClick={() => markHelpful(r.review_id)}
                    className="text-zinc-600 hover:text-zinc-400 font-mono"
                  >
                    ↑ helpful ({r.helpful_count || 0})
                  </button>
                  {r.agent_interaction_count_at_review !== undefined && (
                    <span className="text-zinc-700">
                      agent had {r.agent_interaction_count_at_review} interactions at review
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Share ── */}
      <div className="border border-zinc-800 p-5 mb-6">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">
          Share this soul
        </h2>
        <p className="text-xs text-zinc-600 font-mono leading-relaxed mb-3 break-all">{shareText}</p>
        <div className="flex gap-3">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono border border-zinc-700 text-zinc-400 px-3 py-1.5 hover:border-zinc-500 transition-colors"
          >
            Twitter/X
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://agentsoul.app/agent/${id}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono border border-zinc-700 text-zinc-400 px-3 py-1.5 hover:border-zinc-500 transition-colors"
          >
            LinkedIn
          </a>
          <button
            onClick={() => navigator.clipboard.writeText(shareText)}
            className="text-xs font-mono border border-zinc-700 text-zinc-400 px-3 py-1.5 hover:border-zinc-500 transition-colors"
          >
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}
