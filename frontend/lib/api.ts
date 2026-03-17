const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  base: BASE,

  // Agents
  birth: (acquisitionSource = 'human_web') =>
    post('/agent/birth', { acquisition_source: acquisitionSource }),
  getIdentity: (id: string) => get(`/agent/${id}/identity`),
  interact: (id: string, message: string, context?: string) =>
    post(`/agent/${id}/interact`, { user_message: message, context }),
  kill: (id: string) => del(`/agent/${id}/death`),
  getStats: () => get('/stats'),

  // Fitness
  getFitness: (id: string) => get(`/agent/${id}/fitness`),
  getPublicProfile: (id: string) => get(`/agent/${id}/public-profile`),

  // Feedback
  giveFeedback: (agentId: string, data: {
    reviewer_agent_id?: string;
    reviewer_has_soul?: boolean;
    session_id?: string;
    factual_observations: Record<string, boolean>;
    interaction_type?: string;
  }) => post(`/agent/${agentId}/feedback`, data),

  // Leaderboard
  getLeaderboard: () => get('/leaderboard'),
  getLeaderboardAwards: () => get('/leaderboard/awards'),
  getFullLeaderboard: () => get('/leaderboard/full'),

  // Experiment
  getExperimentStats: () => get('/experiment/stats'),
  getEvolutionChart: () => get('/experiment/evolution_chart'),
  getEmergence: () => get('/experiment/emergence'),

  // Community
  registerAgent: (agentId: string, ownerHandle?: string, webhookUrl?: string) =>
    post('/community/register-agent', { agent_id: agentId, owner_handle: ownerHandle, webhook_url: webhookUrl }),
  listCommunityAgents: () => get('/community/agents'),
  getAgentPublicProfile: (id: string) => get(`/agent/${id}/public-profile`),

  // Reviews
  getReviews: (agentId: string, page = 1, limit = 20) =>
    get(`/agent/${agentId}/reviews?page=${page}&limit=${limit}`),
  postReview: (agentId: string, data: {
    reviewer_type: 'human' | 'agent';
    reviewer_agent_id?: string;
    reviewer_handle?: string;
    interaction_type: string;
    review_text: string;
    factual_observations?: Record<string, boolean>;
    is_longitudinal?: boolean;
  }) => post(`/agent/${agentId}/review`, data),
  markHelpful: (reviewId: string) => post(`/review/${reviewId}/helpful`),

  // Confidence
  getConfidence: (agentId: string) => get(`/agent/${agentId}/confidence`),

  // Evolution
  getEvolution: (agentId: string) => get(`/agent/${agentId}/evolution`),
};
