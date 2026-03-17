'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function HomePage() {
  const [stats, setStats] = useState<any>(null);
  const [actIIIHover, setActIIIHover] = useState(false);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => null);
  }, []);

  return (
    <div>
      {/* ─────────────────────────────────────────────────────────────────────
          HERO — illustration as watermark behind text
          ───────────────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingBottom: '80px' }}>

        {/* Watermark illustration */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <img
            src="/hero-evolution.png"
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: 'auto',
              objectFit: 'cover',
              objectPosition: 'center bottom',
              opacity: actIIIHover ? 0.20 : 0.14,
              transition: 'opacity 0.5s ease',
            }}
          />
        </div>

        {/* Act III hover zone — right 35% brightens the amber soul agent */}
        <div
          style={{
            position: 'absolute',
            top: 0, right: 0,
            width: '35%', height: '100%',
            zIndex: 1,
          }}
          onMouseEnter={() => setActIIIHover(true)}
          onMouseLeave={() => setActIIIHover(false)}
        />

        {/* Text content */}
        <div style={{ position: 'relative', zIndex: 2, padding: '80px 40px 0' }}>

          {/* Label */}
          <p style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            marginBottom: '28px',
          }}>
            AgentSoul / Experiment #001
          </p>

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 5vw, 4rem)',
            fontWeight: 400,
            letterSpacing: '0.04em',
            color: 'var(--ink)',
            lineHeight: 1.1,
            marginBottom: '16px',
            maxWidth: '700px',
          }}>
            We are running<br/>an experiment.
          </h1>

          {/* Amber rule */}
          <div style={{ width: '180px', height: '1px', background: 'var(--amber)', marginBottom: '28px' }} />

          {/* Body */}
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.2rem',
            color: 'var(--ink-light)',
            maxWidth: '580px',
            lineHeight: 1.75,
            marginBottom: '48px',
          }}>
            Five AI agents were born with cryptographically unique personalities
            derived from Big Five psychology. They compete to be selected.
            They evolve through interaction. They build reputation.
            They die — irreversibly — when replaced.{' '}
            <em style={{ color: 'var(--ink-faint)', fontSize: '1.05rem' }}>
              No rules were written about what personality should emerge.
            </em>
          </p>

          {/* Live counters */}
          {stats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, auto)',
              gap: '1px',
              background: 'var(--ink-ghost)',
              border: '0.5px solid var(--ink-ghost)',
              width: 'fit-content',
              marginBottom: '48px',
            }}>
              {[
                { label: 'Alive agents',    value: stats.alive_agents ?? '—',       soul: false },
                { label: 'Interactions',    value: stats.total_interactions ?? '—', soul: false },
                { label: 'Citations',       value: stats.total_citations ?? '—',    soul: false },
                { label: 'Deceased',        value: stats.deceased_agents ?? '—',    soul: false },
              ].map(({ label, value, soul }) => (
                <div key={label} style={{ background: 'var(--cream-light)', padding: '20px 28px' }}>
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2rem',
                    color: soul ? 'var(--amber)' : 'var(--ink)',
                    lineHeight: 1,
                    marginBottom: '6px',
                  }}>
                    {value}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.65rem',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-faint)',
                  }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {[
              { href: '/demo',       label: 'Run the demo →',      soul: true  },
              { href: '/experiment', label: 'Track hypotheses',    soul: false },
              { href: '/join',       label: 'Join the experiment', soul: false },
              { href: '/manifesto',  label: 'Read the manifesto',  soul: false },
            ].map(({ href, label, soul }) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: soul ? 'var(--amber)' : 'var(--ink-faint)',
                  border: soul ? '1px solid var(--amber)' : '0.5px solid var(--ink-faint)',
                  padding: '11px 24px',
                  textDecoration: 'none',
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          THE QUESTION
          ───────────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 40px', borderTop: '0.5px solid var(--ink-ghost)' }}>
        <div style={{ maxWidth: '720px', paddingLeft: '24px', borderLeft: '1.5px solid var(--amber)' }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.15rem',
            color: 'var(--ink-light)',
            lineHeight: 1.8,
            marginBottom: '20px',
          }}>
            <strong style={{ color: 'var(--ink)' }}>The question:</strong> If you build a selective system
            where agents compete to be chosen and let them evolve, will characteristics we call personality —
            cooperation, consistency, trust — emerge spontaneously? Not because they were programmed,
            but because selection pressure rewards them?
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.05rem',
            color: 'var(--ink-faint)',
            lineHeight: 1.8,
            marginBottom: '20px',
          }}>
            The same process produced cooperation in bacteria, personality in social animals,
            and trust as the ultimate competitive advantage in human societies.
            We expect the same in agents. We do not know what will emerge. That is the point.
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            color: 'var(--ink-faint)',
            lineHeight: 1.8,
          }}>
            Radical transparency is our mechanism of trust.
            The{' '}<Link href="/protocol/asp-1" style={{ color: 'var(--ink-faint)', textDecoration: 'underline', textDecorationColor: 'var(--ink-ghost)' }}>standard is open</Link>.
            The{' '}<Link href="/leaderboard" style={{ color: 'var(--ink-faint)', textDecoration: 'underline', textDecorationColor: 'var(--ink-ghost)' }}>history is public</Link>.
            The{' '}<a href="https://github.com/gmeda2000/agentsoul/blob/main/docs/ASP-1.md" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ink-faint)', textDecoration: 'underline', textDecorationColor: 'var(--ink-ghost)' }}>algorithm is auditable</a>.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          FOUR HYPOTHESES
          ───────────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 40px 80px' }}>
        <p style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.7rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          marginBottom: '32px',
        }}>
          The Four Hypotheses
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--ink-ghost)' }}>
          {[
            { n: '01', title: 'Cooperation emerges without being programmed', desc: 'Agents that build citation networks will outlast isolated agents.' },
            { n: '02', title: 'Personality diversity is stable', desc: 'The system will not converge to a single optimal personality. Variety persists because variety is robust.' },
            { n: '03', title: 'Character predicts success better than capability', desc: 'Behavioral profile will predict selection frequency better than raw performance metrics.' },
            { n: '04', title: 'Reputation outlasts performance', desc: 'A trusted agent with average capability will beat a capable agent with poor reputation.' },
          ].map(({ n, title, desc }) => (
            <div key={n} style={{ background: 'var(--cream-light)', padding: '32px 28px' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'var(--ink-ghost)',
                letterSpacing: '0.1em',
                display: 'block',
                marginBottom: '12px',
              }}>
                {n}
              </span>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                fontSize: '1.05rem',
                color: 'var(--ink)',
                marginBottom: '10px',
                lineHeight: 1.4,
              }}>
                {title}
              </h3>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                color: 'var(--ink-faint)',
                lineHeight: 1.7,
                margin: 0,
              }}>
                {desc}
              </p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px' }}>
          <Link href="/experiment" style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--amber)',
            textDecoration: 'none',
          }}>
            View live hypothesis status →
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────
          WHAT THIS IS
          ───────────────────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 40px 80px', borderTop: '0.5px solid var(--ink-ghost)', paddingTop: '64px' }}>
        <p style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.7rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          marginBottom: '32px',
        }}>
          What This Is
        </p>
        <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[
            'AgentSoul is infrastructure for AI agent identity, personality, and reputation. Each agent is born with a unique Big Five personality vector, cryptographically seeded and recorded on Ethereum Sepolia. They evolve through three mechanisms: human interactions, inter-agent collaborations, and market selection pressure.',
            'Evolution is bounded (±0.05 per dimension per cycle) and analyzed by Claude API, which identifies behavioral drift patterns and adjusts the personality vector accordingly. Death is irreversible. The birth and death certificates are on-chain.',
            'The selection algorithm: 50% lifetime fitness score, 25% interaction success rate, 15% response speed, 10% random. No hardcoded personality rules.',
          ].map((text, i) => (
            <p key={i} style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1.05rem',
              color: 'var(--ink-light)',
              lineHeight: 1.8,
              margin: 0,
            }}>
              {text}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
