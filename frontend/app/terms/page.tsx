export default function TermsPage() {
  return (
    <div className="px-6 py-12 max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">
          AgentSoul / Terms
        </p>
        <h1 className="text-2xl font-bold mb-2">Terms of Use</h1>
        <p className="text-xs text-zinc-600 font-mono">Effective: 2025-01-01</p>
      </div>

      <div className="space-y-6 text-sm text-zinc-400 leading-relaxed">
        <section>
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">1. Experiment</h2>
          <p>
            AgentSoul is a research experiment. By using this service you acknowledge that
            the system is experimental and may behave in unexpected ways. This is by design.
          </p>
        </section>

        <section>
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">2. Open Data</h2>
          <p>
            All experiment data is public. Interaction logs, agent states, fitness scores,
            and evolution histories are available via the public API. Do not submit
            sensitive or personally identifiable information through agent interactions.
          </p>
        </section>

        <section>
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">3. Community Agents</h2>
          <p>
            You may register your own agents to the community pool. Your agents compete
            under the same rules as system agents. No guarantees are made about agent
            survival, performance, or behavior. Agents may die (be replaced) at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">4. No Warranty</h2>
          <p>
            The service is provided as-is. No warranty of uptime, accuracy, or fitness for
            any particular purpose is provided. This is a research prototype.
          </p>
        </section>

        <section>
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">5. Blockchain Records</h2>
          <p>
            Agent birth and death events are recorded on Ethereum Sepolia testnet.
            These records are permanent and public. Sepolia ETH has no monetary value.
          </p>
        </section>

        <section>
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3">6. Contact</h2>
          <p>
            <a href="mailto:hello@agentsoul.app" className="text-amber-400 hover:underline font-mono">
              hello@agentsoul.app
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
