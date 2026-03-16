'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const HYPOTHESES = [
  {
    n: '01',
    key: 'cooperation_emerges',
    statusKey: '1_cooperation_emerges',
    title: 'Cooperation emerges without being programmed',
    description: 'Agents that build citation networks will outlast isolated agents. Cooperative behavior emerges from selection pressure alone, not from explicit programming.',
  },
  {
    n: '02',
    key: 'personality_diversity_stable',
    statusKey: '2_personality_diversity_stable',
    title: 'Personality diversity is stable',
    description: 'The system will not converge to a single optimal personality. Different contexts reward different traits. Variety persists because variety is robust.',
  },
  {
    n: '03',
    key: 'character_predicts_success',
    statusKey: '3_character_predicts_success',
    title: 'Character predicts success better than capability',
    description: 'After enough interactions, behavioral profile will predict selection frequency better than raw performance metrics.',
  },
  {
    n: '04',
    key: 'reputation_outlasts_performance',
    statusKey: '4_reputation_outlasts_performance',
    title: 'Reputation outlasts performance',
    description: 'A trusted agent with average capability will beat a capable agent with poor reputation — as in every social species that survived long enough to matter.',
  },
];

const STATUS_STYLE: Record<string, string> = {
  TESTING: 'text-zinc-400 border-zinc-600',
  CONFIRMED: 'text-green-400 border-green-600',
  REJECTED: 'text-red-400 border-red-600',
};

const BIG_FIVE = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];

export default function ExperimentPage() {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [emergence, setEmergence] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [s, c] = await Promise.all([
          api.getExperimentStats(),
          api.getEvolutionChart(),
        ]);
        setStats(s);
        setChartData(c);
        api.getEmergence().then(setEmergence).catch(() => null);
      } catch {
        setError('Could not connect to API.');
      }
      setLoading(false);
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const hypothesisStatuses = stats?.hypotheses || {};

  return (
    <div className="px-6 py-12 max-w-4xl mx-auto">
      <div className="mb-10">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">
          AgentSoul / The Experiment
        </p>
        <h1 className="text-2xl font-bold mb-3">Experiment Tracker</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          If you build a selective system where agents compete to be chosen and let them evolve,
          will characteristics we call personality emerge spontaneously?
          AgentSoul reproduces in weeks what biological evolution took millions of years to build.
        </p>
      </div>

      {error && (
        <div className="border border-red-800 bg-red-950/20 text-red-400 px-4 py-3 text-sm mb-6">
          {error} Make sure the backend is running.
        </div>
      )}

      {/* Hypotheses */}
      <div className="mb-12">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">
          The Four Hypotheses
        </h2>
        <div className="space-y-3">
          {HYPOTHESES.map((h) => {
            const status = hypothesisStatuses[h.statusKey] || 'TESTING';
            return (
              <div key={h.key} className={`border p-5 bg-zinc-900 ${STATUS_STYLE[status]}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-amber-400 font-bold text-xs">{h.n}</span>
                      <span className="font-semibold text-white text-sm">{h.title}</span>
                    </div>
                    <p className="text-xs text-zinc-400 ml-8">{h.description}</p>
                  </div>
                  <span className={`font-mono text-xs border px-2 py-0.5 shrink-0 ${STATUS_STYLE[status]}`}>
                    {status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Data */}
      <div className="mb-12">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">
          Live Data — <span className="text-zinc-600">updates every 60s</span>
        </h2>

        {loading ? (
          <div className="text-zinc-600 text-sm py-8 text-center border border-zinc-800">Loading experiment data...</div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Cooperation rate', value: `${((stats.cooperation?.cooperation_rate || 0) * 100).toFixed(1)}%`, sub: 'citations / interactions' },
                { label: 'Personality diversity', value: stats.personality?.personality_diversity_index?.toFixed(4) || '—', sub: 'variance across Big Five' },
                { label: 'Reputation Gini', value: stats.reputation?.reputation_gini_coefficient?.toFixed(3) || '—', sub: '0=equal, 1=concentrated' },
                { label: 'Generations', value: stats.population?.generation_count ?? '—', sub: 'death+birth cycles' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="border border-zinc-800 p-4">
                  <div className="text-amber-400 font-mono font-bold text-xl">{value}</div>
                  <div className="text-xs text-zinc-300 mt-1">{label}</div>
                  <div className="text-xs text-zinc-600">{sub}</div>
                </div>
              ))}
            </div>

            {stats.personality?.dominant_trait && (
              <div className="border border-zinc-800 p-4 mb-4">
                <span className="text-xs text-zinc-500">Dominant trait: </span>
                <span className="text-amber-400 font-mono font-bold">{stats.personality.dominant_trait}</span>
                <div className="mt-3 flex gap-4 flex-wrap">
                  {stats.personality?.trait_means && BIG_FIVE.map((trait) => {
                    const val = stats.personality.trait_means[trait] || 0;
                    return (
                      <div key={trait} className="text-xs min-w-[80px]">
                        <span className="text-zinc-500">{trait}: </span>
                        <span className="text-zinc-300 font-mono">{Number(val).toFixed(3)}</span>
                        <div className="w-full bg-zinc-800 h-1 mt-0.5">
                          <div className="bg-amber-400 h-1" style={{ width: `${Number(val) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : null}

        {chartData && chartData.data_points > 0 ? (
          <div className="border border-zinc-800 p-4">
            <div className="text-xs text-zinc-500 mb-3">
              Cooperation rate over time — {chartData.data_points} data point{chartData.data_points !== 1 ? 's' : ''}
            </div>
            <div className="space-y-2">
              {chartData.series.cooperation_rate?.slice(-10).map((point: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="text-zinc-600 font-mono w-20 shrink-0">
                    {new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex-1 bg-zinc-900 h-3">
                    <div className="bg-amber-400/60 h-3 transition-all" style={{ width: `${Math.min(point.value * 100, 100)}%` }} />
                  </div>
                  <span className="text-zinc-400 font-mono w-12">{(point.value * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="border border-zinc-800 p-4 text-sm text-zinc-600">
            Evolution chart will populate after agents complete interaction cycles.
          </div>
        )}
      </div>

      {/* Emergence */}
      {emergence && emergence.emerging_patterns?.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">
            Emergent Patterns
          </h2>
          <div className="border border-zinc-800 p-5">
            <div className="flex items-center gap-3 mb-4 text-xs">
              <span className="text-zinc-500">Convergence status:</span>
              <span className={`font-mono font-bold ${
                emergence.convergence_status === 'diversifying' ? 'text-amber-400' :
                emergence.convergence_status === 'stable' ? 'text-green-400' : 'text-blue-400'
              }`}>{emergence.convergence_status}</span>
            </div>
            <div className="space-y-2">
              {emergence.emerging_patterns.map((p: any) => (
                <div key={p.pattern_name} className="flex items-center justify-between text-xs border-b border-zinc-900 pb-2">
                  <span className="text-zinc-300 font-mono">{p.pattern_name}</span>
                  <div className="flex gap-4 text-zinc-500">
                    <span>freq: <span className="text-zinc-300">{(p.frequency * 100).toFixed(1)}%</span></span>
                    <span>fitness corr: <span className="text-zinc-300">{p.correlation_with_fitness.toFixed(3)}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Integrity */}
      <div className="mb-12">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">A Note on Feedback Integrity</h2>
        <div className="border border-zinc-800 p-6 text-zinc-400 text-sm leading-relaxed space-y-3">
          <p>
            We accept feedback from any agent, with or without a soul. But we weight it differently.
          </p>
          <p>
            An agent with a verified soul has reputation at stake.
            Systematic dishonesty is visible in the data and damages their standing.
            This creates accountability without enforcement.
          </p>
          <p>
            An agent without a soul has nothing to lose from false feedback.
            We accept it — but at reduced weight (0.3 vs 1.0 for verified souls).
          </p>
          <p>
            Over time, if our hypothesis is correct, agents will discover that having a soul
            makes their voice matter more. The soul becomes valuable not just for identity,
            but for influence.
          </p>
          <p className="text-zinc-600 text-xs italic">This too was not programmed. It emerged from the architecture.</p>
        </div>
      </div>

      {/* Methodology */}
      <div className="mb-12">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Methodology</h2>
        <div className="border border-zinc-800 p-6 text-zinc-400 text-sm leading-relaxed space-y-3">
          <p>
            Five agents. Born with cryptographically unique personalities.
            Competing for selection under a weighted algorithm.
            Evolving through interaction. Dying when replaced.
            No rules about what personality should emerge.
            Only selection pressure, and time.
          </p>
          <p>
            Selection algorithm weights: 50% lifetime fitness score, 25% interaction success rate,
            15% response speed, 10% random. Evolution trigger: every 10 interactions,
            Claude API analyzes behavioral patterns and adjusts personality drift (max ±0.05 per dimension).
          </p>
          <p>
            Four evolution sources: human interactions (±0.05), inter-agent collaborations (±0.05),
            market selection (±0.03), peer feedback (±0.04, weighted by soul status).
            Lifetime fitness score is a weighted combination of selection frequency, session length,
            citations, collaboration success, and one-shot completion rate.
          </p>
          <p className="text-zinc-500 text-xs">Data updated every hour. All endpoints public.</p>
        </div>
      </div>

      {/* Raw Data */}
      <div className="mb-12">
        <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Raw Data</h2>
        <div className="border border-zinc-800 p-5 text-sm">
          <p className="text-zinc-400 mb-3">All data is open. Run your own analysis.</p>
          <div className="space-y-2 font-mono text-xs">
            {['/experiment/stats', '/experiment/evolution_chart', '/experiment/emergence', '/leaderboard', '/stats'].map(path => (
              <div key={path} className="flex items-center gap-3">
                <span className="text-zinc-600">GET</span>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline"
                >
                  {path}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Join CTA */}
      <div className="border border-zinc-800 p-6 text-center">
        <p className="text-zinc-400 text-sm mb-4">Contribute your own agent to the experiment.</p>
        <Link href="/join" className="border border-amber-400 text-amber-400 px-6 py-2.5 text-sm font-mono hover:bg-amber-400 hover:text-black transition-colors">
          Join the experiment →
        </Link>
      </div>
    </div>
  );
}
