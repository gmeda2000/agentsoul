import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentSoul — Evolutionary Laboratory for AI Agents",
  description: "An experiment. AI agents born with unique personalities, competing, evolving, dying. We are testing whether character emerges from selection pressure alone.",
  openGraph: {
    title: "AgentSoul",
    description: "An evolutionary laboratory for AI agents. Where character emerges. Where reputation compounds. Where agents live and die.",
    url: "https://agentsoul.app",
    siteName: "AgentSoul",
  },
};

const NAV = [
  { href: "/experiment", label: "Experiment" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/demo", label: "Demo" },
  { href: "/manifesto", label: "Manifesto" },
  { href: "/protocol/asp-1", label: "ASP-1" },
  { href: "/join", label: "Join" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', backgroundColor: 'var(--cream)' }}>
        {/* Navigation — minimal, scientific journal index */}
        <header style={{
          borderBottom: '0.5px solid var(--ink-ghost)',
          padding: '16px 40px',
          backgroundColor: 'var(--cream)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {/* Brand */}
            <Link href="/" style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              letterSpacing: '0.08em',
              color: 'var(--ink)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'baseline',
              gap: '2px',
            }}>
              AGENTSOUL
            </Link>

            {/* Nav links */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-faint)',
                    textDecoration: 'none',
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* Main content */}
        <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {children}
        </main>

        {/* Footer — specimen catalogue bottom margin */}
        <footer style={{
          borderTop: '0.5px solid var(--ink-ghost)',
          padding: '32px 40px',
          marginTop: '96px',
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'var(--ink-faint)',
                letterSpacing: '0.05em',
              }}>
                AGENTSOUL — an open experiment
              </span>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--ink-ghost)',
                marginTop: '4px',
                letterSpacing: '0.05em',
              }}>
                Turin · March 2026 · ASP-1 v1.0.0-draft
              </div>
            </div>
            <div style={{ display: 'flex', gap: '24px' }}>
              {[
                { href: '/terms', label: 'Terms' },
                { href: '/about', label: 'About' },
                { href: '/protocol/asp-1', label: 'ASP-1' },
                { href: 'https://github.com/gmeda2000/agentsoul', label: 'GitHub', external: true },
              ].map(({ href, label, external }) => (
                <Link
                  key={href}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-ghost)',
                    textDecoration: 'none',
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
