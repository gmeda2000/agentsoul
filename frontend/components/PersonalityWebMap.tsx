'use client';

import { useState, useRef, useCallback } from 'react';

const DIMS = [
  { key: 'openness', label: 'Context\nExploration' },
  { key: 'conscientiousness', label: 'Task\nThoroughness' },
  { key: 'extraversion', label: 'Interaction\nSeeking' },
  { key: 'agreeableness', label: 'Position\nFlexibility' },
  { key: 'neuroticism', label: 'Pressure\nStability' },
];

const DIM_LABELS: Record<string, string> = {
  openness: 'Context Exploration',
  conscientiousness: 'Task Thoroughness',
  extraversion: 'Interaction Seeking',
  agreeableness: 'Position Flexibility',
  neuroticism: 'Pressure Stability',
};

const SOURCE_COLORS: Record<string, string> = {
  human: '#3b82f6',
  agent: '#22c55e',
  market: '#F59E0B',
  feedback: '#ffffff',
};

interface EvolutionSnapshot {
  snapshot_id: string;
  timestamp: string;
  behavioral_drift?: Record<string, number>;
  behavioral_summary?: string;
  interaction_count_at_snapshot?: number;
  trigger_source?: string;
  previous_vector?: Record<string, number>;
  new_vector?: Record<string, number>;
}

interface Props {
  vector: Record<string, number>;
  confidence: number;
  interactionCount: number;
  snapshots?: EvolutionSnapshot[];
  populationAverage?: Record<string, number>;
}

const CX = 150;
const CY = 150;
const R = 105;
const N = 5;

function axisPoint(i: number, r: number): [number, number] {
  const angle = (i * 2 * Math.PI) / N - Math.PI / 2;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

function polygon(values: number[], r = R): string {
  return values
    .map((v, i) => axisPoint(i, v * r).join(','))
    .join(' ');
}

export default function PersonalityWebMap({
  vector,
  confidence,
  interactionCount,
  snapshots = [],
  populationAverage,
}: Props) {
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const [hoveredSnap, setHoveredSnap] = useState<number | null>(null);
  const scrubRef = useRef<HTMLDivElement>(null);

  const confidenceMargin = (1 - confidence) * 0.15;

  const currentVector =
    scrubIndex !== null && snapshots[scrubIndex]?.new_vector
      ? snapshots[scrubIndex].new_vector!
      : vector;

  const vals = DIMS.map((d) => currentVector[d.key] ?? 0.5);
  const outerVals = vals.map((v) => Math.min(1, v + confidenceMargin));
  const innerVals = vals.map((v) => Math.max(0, v - confidenceMargin));

  const popVals = populationAverage
    ? DIMS.map((d) => populationAverage[d.key] ?? 0.5)
    : null;

  const confidenceTier =
    confidence < 0.1
      ? 'Exploratory'
      : confidence < 0.4
      ? 'Emerging'
      : confidence < 0.8
      ? 'Established'
      : 'Verified';

  // Birth vector (before any evolution)
  const birthVector =
    snapshots.length > 0 && snapshots[0].previous_vector
      ? snapshots[0].previous_vector
      : vector;

  const handleScrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!scrubRef.current || snapshots.length === 0) return;
      const rect = scrubRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      const idx = Math.round(pct * (snapshots.length - 1));
      setScrubIndex(idx);
    },
    [snapshots]
  );

  return (
    <div className="w-full">
      {/* SVG Radar Chart */}
      <div className="relative">
        <svg viewBox="0 0 300 300" className="w-full max-w-sm mx-auto block">
          {/* Grid rings */}
          {[0.25, 0.5, 0.75, 1.0].map((g) => (
            <polygon
              key={g}
              points={polygon(Array(5).fill(g))}
              fill="none"
              stroke="#27272a"
              strokeWidth="0.5"
            />
          ))}

          {/* Axes */}
          {DIMS.map((_, i) => {
            const [x, y] = axisPoint(i, R);
            return (
              <line
                key={i}
                x1={CX}
                y1={CY}
                x2={x}
                y2={y}
                stroke="#27272a"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Population average — dotted white */}
          {popVals && (
            <polygon
              points={polygon(popVals)}
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          )}

          {/* Confidence band — outer fill */}
          <polygon
            points={polygon(outerVals)}
            fill="rgba(245,158,11,0.08)"
            stroke="rgba(245,158,11,0.2)"
            strokeWidth="0.5"
          />

          {/* Confidence band — inner fill (punches hole) */}
          <polygon
            points={polygon(innerVals)}
            fill="#000"
            stroke="rgba(245,158,11,0.15)"
            strokeWidth="0.5"
          />

          {/* Main value polygon */}
          <polygon
            points={polygon(vals)}
            fill="rgba(245,158,11,0.15)"
            stroke="#F59E0B"
            strokeWidth="1.5"
          />

          {/* Value dots */}
          {vals.map((v, i) => {
            const [x, y] = axisPoint(i, v * R);
            return (
              <circle key={i} cx={x} cy={y} r="3" fill="#F59E0B" />
            );
          })}

          {/* Axis labels */}
          {DIMS.map((d, i) => {
            const [x, y] = axisPoint(i, R + 18);
            const lines = d.label.split('\n');
            return (
              <text
                key={d.key}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#71717a"
                fontSize="7"
              >
                {lines.map((line, li) => (
                  <tspan key={li} x={x} dy={li === 0 ? 0 : 9}>
                    {line}
                  </tspan>
                ))}
              </text>
            );
          })}

          {/* Population average label */}
          {popVals && (
            <text x={CX} y={289} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="6">
              Population average
            </text>
          )}
        </svg>
      </div>

      {/* Confidence tier label */}
      <p className="text-center text-xs font-mono text-amber-400 mt-1">
        {confidenceTier} · Based on {interactionCount} interactions
      </p>

      {/* Timeline Scrubber */}
      {snapshots.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-2">
            Evolution Timeline
          </p>
          <div
            ref={scrubRef}
            className="relative h-8 cursor-pointer select-none"
            onMouseMove={handleScrub}
            onClick={handleScrub}
            onMouseLeave={() => setHoveredSnap(null)}
          >
            {/* Track */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-zinc-800" />

            {/* Birth dot */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-600 cursor-pointer"
              style={{ left: 0 }}
              title="Birth"
            />

            {/* Evolution dots */}
            {snapshots.map((snap, i) => {
              const pct = snapshots.length > 1 ? i / (snapshots.length - 1) : 0.5;
              const src = snap.trigger_source || 'human';
              const color = SOURCE_COLORS[src] || '#F59E0B';
              const isActive = scrubIndex === i;
              return (
                <div
                  key={snap.snapshot_id}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full transition-transform"
                  style={{
                    left: `${pct * 100}%`,
                    width: isActive ? 10 : 6,
                    height: isActive ? 10 : 6,
                    background: color,
                    boxShadow: isActive ? `0 0 6px ${color}` : 'none',
                  }}
                  onMouseEnter={() => { setScrubIndex(i); setHoveredSnap(i); }}
                />
              );
            })}

            {/* Scrubber thumb */}
            {scrubIndex !== null && (
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 border border-amber-400 bg-black rounded-full pointer-events-none"
                style={{
                  left: `${snapshots.length > 1 ? (scrubIndex / (snapshots.length - 1)) * 100 : 50}%`,
                }}
              />
            )}
          </div>

          {/* Tooltip */}
          {hoveredSnap !== null && snapshots[hoveredSnap] && (
            <div className="mt-2 border border-zinc-800 p-3 text-xs bg-zinc-950">
              <div className="text-zinc-400 mb-1">
                {new Date(snapshots[hoveredSnap].timestamp).toLocaleDateString()} ·{' '}
                <span
                  style={{ color: SOURCE_COLORS[snapshots[hoveredSnap].trigger_source || 'human'] }}
                >
                  {snapshots[hoveredSnap].trigger_source || 'human'}
                </span>
              </div>
              {snapshots[hoveredSnap].interaction_count_at_snapshot !== undefined && (
                <div className="text-zinc-600">
                  {snapshots[hoveredSnap].interaction_count_at_snapshot} interactions at this point
                </div>
              )}
              {snapshots[hoveredSnap].behavioral_drift && (
                <div className="mt-1 space-y-0.5">
                  {Object.entries(snapshots[hoveredSnap].behavioral_drift!).map(([k, v]) =>
                    v !== 0 ? (
                      <div key={k} className="flex gap-2">
                        <span className="text-zinc-600">{DIM_LABELS[k] || k}</span>
                        <span className={Number(v) > 0 ? 'text-green-400' : 'text-red-400'}>
                          {Number(v) > 0 ? '+' : ''}{Number(v).toFixed(3)}
                        </span>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-2 text-xs text-zinc-700">
            {Object.entries(SOURCE_COLORS).map(([src, color]) => (
              <span key={src} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                {src}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Numerical table */}
      <div className="mt-6 border border-zinc-800">
        <div className="grid grid-cols-4 text-xs font-mono text-zinc-600 px-3 py-2 border-b border-zinc-800">
          <span>Dimension</span>
          <span className="text-right">Value</span>
          <span className="text-right">± Interval</span>
          <span className="text-right">Δ Birth</span>
        </div>
        {DIMS.map((d) => {
          const current = currentVector[d.key] ?? 0.5;
          const birth = (birthVector as Record<string, number>)[d.key] ?? current;
          const drift = current - birth;
          const interval = confidenceMargin * 2;
          return (
            <div key={d.key} className="grid grid-cols-4 text-xs px-3 py-2 border-b border-zinc-900 last:border-0">
              <span className="text-zinc-400">{DIM_LABELS[d.key]}</span>
              <span className="text-right font-mono text-amber-400">{current.toFixed(3)}</span>
              <span className="text-right font-mono text-zinc-500">± {interval.toFixed(3)}</span>
              <span className={`text-right font-mono ${drift > 0.005 ? 'text-green-400' : drift < -0.005 ? 'text-red-400' : 'text-zinc-600'}`}>
                {drift >= 0 ? '+' : ''}{drift.toFixed(3)}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-700 mt-3 leading-relaxed">
        Confidence intervals narrow as interactions accumulate.
        Algorithm:{' '}
        <a href="/protocol/asp-1" className="text-zinc-500 hover:underline">
          agentsoul.app/protocol/asp-1
        </a>
      </p>
    </div>
  );
}
