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
  { href: "/", label: "Home" },
  { href: "/experiment", label: "Experiment" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/demo", label: "Demo" },
  { href: "/manifesto", label: "Manifesto" },
  { href: "/join", label: "Join" },
  { href: "/docs", label: "Docs" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-zinc-950">
      <body className="min-h-screen bg-zinc-950 text-zinc-100">
        <header className="border-b border-zinc-800 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="font-bold text-sm tracking-tight">
              <span className="text-amber-400">AGENT</span>
              <span className="text-zinc-100">SOUL</span>
            </Link>
            <nav className="flex items-center gap-5 text-xs text-zinc-400">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="hover:text-zinc-100 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto">
          {children}
        </main>
        <footer className="border-t border-zinc-800 px-6 py-6 mt-20">
          <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-600">
            <span>AgentSoul — an open experiment</span>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-zinc-400">Terms</Link>
              <Link href="/about" className="hover:text-zinc-400">About</Link>
              <a href="https://github.com/agentsoul" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400">GitHub</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
