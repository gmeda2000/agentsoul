'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface Agent {
  agent_id: string;
  status: string;
  reputation_score: number;
  interaction_count: number;
  personality_vector?: Record<string, number>;
  behavioral_summary?: string;
  dominant_survival_trait?: string;
  lifetime_fitness_score?: number;
}

export default function DemoPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [interacting, setInteracting] = useState(false);
  const [error, setError] = useState('');

  async function loadAgents() {
    try {
      const stats: any = await api.getStats();
      setAgents(stats.agents || []);
    } catch {
      setError('Could not connect to API.');
    }
    setLoading(false);
  }

  useEffect(() => { loadAgents(); }, []);

  async function askSelected() {
    if (!message.trim() || !selected) return;
    setInteracting(true);
    try {
      const r: any = await api.interact(selected, message);
      setResponses(prev => ({ ...prev, [selected]: r.agent_response }));
    } catch {
      setResponses(prev => ({ ...prev, [selected!]: '[Error: could not connect]' }));
    }
    setInteracting(false);
  }

  async function askAll() {
    if (!message.trim() || agents.length === 0) return;
    setInteracting(true);
    const alive = agents.filter(a => a.status === 'alive');
    const results = await Promise.allSettled(
      alive.map(a => api.interact(a.agent_id, message).then((r: any) => ({ id: a.agent_id, response: r.agent_response })))
    );
    const newResponses: Record<string, string> = {};
    for (const r of results) {
      if (r.status === 'fulfilled') {
        newResponses[r.value.id] = r.value.response;
      }
    }
    setResponses(prev => ({ ...prev, ...newResponses }));
    setInteracting(false);
  }

  async function birthAgent() {
    try {
      await api.birth();
      await loadAgents();
    } catch {
      setError('Could not birth agent.');
    }
  }

  async function killAgent(id: string) {
    if (!confirm('Kill this agent? This is irreversible.')) return;
    try {
      await api.kill(id);
      await loadAgents();
    } catch {
      setError('Could not kill agent.');
    }
  }

  return (
    <div className="px-6 py-12 max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">
          AgentSoul / Demo
        </p>
        <h1 className="text-2xl font-bold mb-2">Live Agent Interaction</h1>
        <p className="text-zinc-400 text-sm">
          Interact with the live agents. Each has a unique personality. Each response shapes their evolution.
        </p>
      </div>

      {error && (
        <div className="border border-red-800 bg-red-950/20 text-red-400 px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-zinc-600 text-sm py-8 text-center border border-zinc-800">Connecting to experiment...</div>
      ) : (
        <>
          {/* Agents grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {agents.map(agent => (
              <div
                key={agent.agent_id}
                onClick={() => setSelected(agent.agent_id === selected ? null : agent.agent_id)}
                className={`border p-4 cursor-pointer transition-colors ${
                  agent.status === 'deceased' ? 'opacity-40 border-zinc-800' :
                  selected === agent.agent_id ? 'border-amber-400' : 'border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-zinc-500 truncate">{agent.agent_id.slice(0, 8)}…</span>
                  <span className={`text-xs font-mono ${agent.status === 'alive' ? 'text-green-400' : 'text-red-400'}`}>
                    {agent.status}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 space-y-1">
                  <div>Reputation: <span className="text-amber-400 font-mono">{agent.reputation_score?.toFixed(3) || '0.000'}</span></div>
                  <div>Interactions: <span className="text-zinc-300 font-mono">{agent.interaction_count || 0}</span></div>
                  {agent.lifetime_fitness_score !== undefined && (
                    <div>Fitness: <span className="text-zinc-300 font-mono">{agent.lifetime_fitness_score.toFixed(3)}</span></div>
                  )}
                  {agent.dominant_survival_trait && (
                    <div className="text-zinc-600 truncate">Trait: {agent.dominant_survival_trait}</div>
                  )}
                </div>
                {responses[agent.agent_id] && (
                  <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                    {responses[agent.agent_id]}
                  </div>
                )}
                {agent.status === 'alive' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); killAgent(agent.agent_id); }}
                    className="mt-3 text-xs text-red-600 hover:text-red-400 font-mono"
                  >
                    kill →
                  </button>
                )}
              </div>
            ))}
            {agents.length === 0 && (
              <div className="col-span-3 text-zinc-600 text-sm text-center py-8 border border-zinc-800">
                No agents found. Birth an agent to start the experiment.
              </div>
            )}
          </div>

          {/* Message input */}
          <div className="border border-zinc-800 p-5 mb-4">
            <div className="text-xs text-zinc-500 mb-3">
              {selected ? `Sending to agent ${selected.slice(0, 8)}…` : 'No agent selected — use "Ask all" to broadcast'}
            </div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Enter a message..."
              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm p-3 resize-none focus:outline-none focus:border-zinc-500"
              rows={3}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) { selected ? askSelected() : askAll(); } }}
            />
            <div className="flex gap-3 mt-3">
              <button
                onClick={askSelected}
                disabled={!selected || interacting || !message.trim()}
                className="border border-amber-400 text-amber-400 px-4 py-2 text-xs font-mono hover:bg-amber-400 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {interacting ? 'Thinking...' : 'Ask selected'}
              </button>
              <button
                onClick={askAll}
                disabled={interacting || !message.trim()}
                className="border border-zinc-600 text-zinc-400 px-4 py-2 text-xs font-mono hover:border-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Ask all alive
              </button>
              <button
                onClick={birthAgent}
                className="border border-zinc-700 text-zinc-500 px-4 py-2 text-xs font-mono hover:text-zinc-300 hover:border-zinc-500 transition-colors ml-auto"
              >
                + Birth new agent
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-600">
            Every interaction is recorded and influences agent evolution. ⌘+Enter to send.
          </p>
        </>
      )}
    </div>
  );
}
