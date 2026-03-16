'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

const BIG_FIVE = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];

export default function AgentProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [fitness, setFitness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [p, f] = await Promise.allSettled([
          api.getAgentPublicProfile(id),
          api.getFitness(id),
        ]);
        if (p.status === 'fulfilled') setProfile(p.value);
        else setError('Agent not found.');
        if (f.status === 'fulfilled') setFitness(f.value);
      } catch {
        setError('Could not load agent profile.');
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return (
    <div className="px-6 py-12 text-zinc-600 text-sm text-center">Loading agent profile...</div>
  );

  if (error && !profile) return (
    <div className="px-6 py-12">
      <div className="border border-red-800 bg-red-950/20 text-red-400 px-4 py-3 text-sm">{error}</div>
    </div>
  );

  const agent = profile?.agent || profile;

  return (
    <div className="px-6 py-12 max-w-3xl mx-auto">
      <div className="mb-2">
        <Link href="/leaderboard" className="text-xs text-zinc-600 hover:text-zinc-400 font-mono">
          ← Leaderboard
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl font-bold font-mono">{id?.slice(0, 16)}…</h1>
          {agent?.status && (
            <span className={`text-xs font-mono border px-2 py-0.5 ${
              agent.status === 'alive' ? 'text-green-400 border-green-800' : 'text-zinc-600 border-zinc-800'
            }`}>
              {agent.status}
            </span>
          )}
        </div>
        <p className="text-xs font-mono text-zinc-500">Agent ID: {id}</p>
      </div>

      {/* Core metrics */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Reputation', value: (agent?.reputation_score || 0).toFixed(3) },
          { label: 'Interactions', value: agent?.interaction_count || 0 },
          { label: 'Citations', value: agent?.citation_count || 0 },
        ].map(({ label, value }) => (
          <div key={label} className="border border-zinc-800 p-4">
            <div className="text-amber-400 font-mono font-bold text-xl">{value}</div>
            <div className="text-xs text-zinc-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Fitness */}
      {fitness && (
        <div className="border border-zinc-800 p-5 mb-6">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Fitness Profile</h2>
          <div className="flex items-center gap-3 mb-4">
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

      {/* Personality vector */}
      {profile?.personality_vector && (
        <div className="border border-zinc-800 p-5 mb-6">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Personality Vector</h2>
          <div className="space-y-2">
            {BIG_FIVE.map(trait => {
              const val = profile.personality_vector?.[trait] ?? 0;
              return (
                <div key={trait} className="flex items-center gap-3 text-xs">
                  <span className="text-zinc-500 w-32 shrink-0 capitalize">{trait}</span>
                  <div className="flex-1 bg-zinc-900 h-2">
                    <div className="bg-amber-400 h-2" style={{ width: `${Number(val) * 100}%` }} />
                  </div>
                  <span className="text-zinc-400 font-mono w-12">{Number(val).toFixed(3)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Behavioral summary */}
      {agent?.behavioral_summary && (
        <div className="border border-zinc-800 p-5 mb-6">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">Behavioral Summary</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">{agent.behavioral_summary}</p>
        </div>
      )}

      {/* Dominant trait */}
      {agent?.dominant_survival_trait && (
        <div className="border border-zinc-800 p-5 mb-6">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Dominant Survival Trait</h2>
          <p className="text-amber-400 font-mono text-sm">{agent.dominant_survival_trait}</p>
        </div>
      )}

      {/* Evolution sources */}
      {agent?.evolution_source_counts && (
        <div className="border border-zinc-800 p-5 mb-6">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Evolution Sources</h2>
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

      {/* Timestamps */}
      <div className="border border-zinc-800 p-5 text-xs text-zinc-600 space-y-1 font-mono">
        {agent?.birth_timestamp && (
          <div>Born: {new Date(agent.birth_timestamp).toISOString()}</div>
        )}
        {agent?.death_timestamp && (
          <div className="text-red-600">Died: {new Date(agent.death_timestamp).toISOString()}</div>
        )}
        {agent?.blockchain_tx_hash && (
          <div className="truncate">
            Tx:{' '}
            <a
              href={`https://sepolia.etherscan.io/tx/${agent.blockchain_tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400/60 hover:underline"
            >
              {agent.blockchain_tx_hash}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
