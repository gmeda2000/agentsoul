/**
 * generateSoulAvatar — Deterministic SVG avatar generator for AgentSoul
 *
 * Each agent's personality vector produces a unique, reproducible SVG.
 * The form is a 5-pointed biological specimen — one axis per Big Five dimension.
 * Color: always ink + amber palette. Amber scarcity preserved.
 * No two souls produce the same avatar.
 *
 * Usage:
 *   import { generateSoulAvatar } from '@/lib/generateSoulAvatar';
 *   const svgString = generateSoulAvatar(agent.personality_vector, agent.soul_id, {
 *     size: 200,
 *     interactionCount: agent.interaction_count.total,
 *   });
 *
 *   // Or as React component:
 *   import { SoulAvatarSVG } from '@/lib/generateSoulAvatar';
 *   <SoulAvatarSVG personality={agent.personality_vector} size={40} />
 */

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const COLORS = {
  ink:        '#3A2E24',
  inkLight:   '#5A4A3A',
  inkFaint:   '#8A7A68',
  cream:      '#EDE8DF',
  amber:      '#BA7517',
  amberLight: '#E9A925',
  amberPale:  '#FEF0D0',
};

// ─── SEEDED PSEUDO-RANDOM ─────────────────────────────────────────────────────
// Deterministic noise from soul_id so avatar never changes
function seededRand(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function() {
    h ^= h << 13; h ^= h >> 17; h ^= h << 5;
    return ((h >>> 0) / 0xFFFFFFFF);
  };
}

// ─── CORE GENERATOR ───────────────────────────────────────────────────────────
/**
 * @param {Object} personalityVector - { openness, conscientiousness, extraversion, agreeableness, neuroticism }
 * @param {string} soulId            - UUID used for deterministic noise seeding
 * @param {Object} options
 *   @param {number} options.size              - Output size in px (default 200)
 *   @param {number} options.interactionCount  - More interactions → more amber rays
 *   @param {boolean} options.alive            - Deceased souls render in grey only
 */
export function generateSoulAvatar(personalityVector, soulId = 'default', options = {}) {
  const {
    size = 200,
    interactionCount = 0,
    alive = true,
  } = options;

  const rand = seededRand(soulId);
  const cx = size / 2, cy = size / 2;
  const maxR = size * 0.38;
  const minR = size * 0.08;

  // Five dimensions mapped to five axes (evenly spaced around circle)
  // Starting from top (-90deg), going clockwise
  const dims = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
  const baseAngle = -Math.PI / 2;
  const angleStep  = (Math.PI * 2) / 5;

  const v = personalityVector || {};
  const values = dims.map(d => Math.max(0.05, Math.min(0.98, v[d] ?? 0.5)));

  // ── Axis endpoints ──────────────────────────────────────────────────────────
  const points = values.map((val, i) => {
    const angle = baseAngle + i * angleStep;
    const r = minR + val * (maxR - minR);
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      angle,
      r,
      val,
      dim: dims[i],
    };
  });

  // ── Curvature per dimension (controlled by conscientiousness) ───────────────
  // High conscientiousness = tighter, more angular form
  // Low conscientiousness = more organic, flowing curves
  const curvature = 1 - values[1]; // conscientiousness inverted
  const cp = points.map((p, i) => {
    const next = points[(i + 1) % 5];
    const mx = (p.x + next.x) / 2;
    const my = (p.y + next.y) / 2;
    const perpAngle = Math.atan2(next.y - p.y, next.x - p.x) + Math.PI / 2;
    const cpDist = (size * 0.06 * curvature) * (0.6 + rand() * 0.8);
    return {
      cx: mx + Math.cos(perpAngle) * cpDist * (rand() > 0.5 ? 1 : -1),
      cy: my + Math.sin(perpAngle) * cpDist * (rand() > 0.5 ? 1 : -1),
    };
  });

  // ── SVG path for main form ──────────────────────────────────────────────────
  const formPath = points.map((p, i) => {
    const cpPoint = cp[i];
    const prefix = i === 0 ? `M ${p.x.toFixed(2)},${p.y.toFixed(2)}` : '';
    const next = points[(i + 1) % 5];
    return `${prefix} Q ${cpPoint.cx.toFixed(2)},${cpPoint.cy.toFixed(2)} ${next.x.toFixed(2)},${next.y.toFixed(2)}`;
  }).join(' ') + ' Z';

  // ── Crosshatch density from conscientiousness ───────────────────────────────
  // High cons = dense regular hatch; low cons = sparse irregular
  const hatchSpacing = 6 + (1 - values[1]) * 10; // 6-16px
  const hatchAngle = (values[0] * 180).toFixed(1); // openness sets angle

  // ── Amber rays from top point — count from interaction count ───────────────
  const rayCount = alive ? Math.min(12, Math.floor(interactionCount / 20)) : 0;
  const topPoint = points[0]; // openness is top

  const rays = [];
  for (let i = 0; i < rayCount; i++) {
    const randSeed = rand();
    const rayAngle = topPoint.angle - 0.8 + i * (1.6 / Math.max(1, rayCount - 1));
    const rayLen = (size * 0.12 + randSeed * size * 0.18);
    const opacity = (0.4 + randSeed * 0.5).toFixed(2);
    const ex = topPoint.x + Math.cos(rayAngle) * rayLen;
    const ey = topPoint.y + Math.sin(rayAngle) * rayLen;
    rays.push({ x1: topPoint.x, y1: topPoint.y, x2: ex, y2: ey, opacity });
  }

  // ── Axis guide lines ────────────────────────────────────────────────────────
  const axisLines = points.map(p =>
    `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(2)}" y2="${p.y.toFixed(2)}"
      stroke="${COLORS.inkFaint}" stroke-width="0.4" stroke-dasharray="2,4" opacity="0.6"/>`
  ).join('\n    ');

  // ── Axis endpoint dots ──────────────────────────────────────────────────────
  const axisDots = points.map((p, i) => {
    const isAmber = alive && i === 0 && values[0] > 0.7; // high openness → amber apex
    return `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="2"
      fill="${isAmber ? COLORS.amber : COLORS.inkFaint}" opacity="0.8"/>`;
  }).join('\n    ');

  // ── Dimension labels (for larger sizes) ────────────────────────────────────
  const showLabels = size >= 120;
  const labelOffset = size * 0.06;
  const dimAbbrev = ['O', 'C', 'E', 'A', 'N'];

  const dimLabels = showLabels ? points.map((p, i) => {
    const lx = cx + Math.cos(p.angle) * (p.r + labelOffset);
    const ly = cy + Math.sin(p.angle) * (p.r + labelOffset);
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}"
      font-family="monospace" font-size="${(size * 0.055).toFixed(1)}"
      fill="${COLORS.inkFaint}" text-anchor="middle" dominant-baseline="central"
      opacity="0.7">${dimAbbrev[i]}</text>`;
  }).join('\n    ') : '';

  // ── Color scheme ────────────────────────────────────────────────────────────
  const fillColor   = alive ? COLORS.amberPale : COLORS.cream;
  const strokeColor = alive ? COLORS.inkLight : COLORS.inkFaint;
  const fillOpacity = alive ? '0.35' : '0.15';

  // ── Hatching pattern ────────────────────────────────────────────────────────
  const patternId = `hatch-${soulId.slice(0,8)}`;
  const hatchPattern = `
  <defs>
    <pattern id="${patternId}" patternUnits="userSpaceOnUse"
      width="${hatchSpacing.toFixed(1)}" height="${hatchSpacing.toFixed(1)}"
      patternTransform="rotate(${hatchAngle} ${cx} ${cy})">
      <line x1="0" y1="0" x2="0" y2="${hatchSpacing}"
        stroke="${alive ? COLORS.inkLight : COLORS.inkFaint}"
        stroke-width="0.5" opacity="${alive ? '0.2' : '0.1'}"/>
    </pattern>
    <clipPath id="form-clip-${soulId.slice(0,8)}">
      <path d="${formPath}"/>
    </clipPath>
  </defs>`;

  // ── Amber rays (only rendered if alive + has interactions) ─────────────────
  const raysMarkup = rays.map(r =>
    `<line x1="${r.x1.toFixed(1)}" y1="${r.y1.toFixed(1)}"
      x2="${r.x2.toFixed(1)}" y2="${r.y2.toFixed(1)}"
      stroke="${COLORS.amberLight}" stroke-width="0.7" opacity="${r.opacity}"/>`
  ).join('\n    ');

  // ── Assemble SVG ───────────────────────────────────────────────────────────
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"
  width="${size}" height="${size}"
  viewBox="0 0 ${size} ${size}"
  role="img"
  aria-label="Soul avatar for agent ${soulId.slice(0,8)}">

  ${hatchPattern}

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="${COLORS.cream}" rx="2"/>

  <!-- Amber soul rays (earned through interactions) -->
  ${raysMarkup}

  <!-- Axis guide lines -->
  ${axisLines}

  <!-- Main form — filled -->
  <path d="${formPath}"
    fill="${fillColor}" fill-opacity="${fillOpacity}"
    stroke="${strokeColor}" stroke-width="${(size * 0.007).toFixed(1)}"
    stroke-linejoin="round"/>

  <!-- Hatch fill (clipped to form) -->
  <rect width="${size}" height="${size}"
    fill="url(#${patternId})"
    clip-path="url(#form-clip-${soulId.slice(0,8)})"/>

  <!-- Form outline (second pass for crispness) -->
  <path d="${formPath}"
    fill="none"
    stroke="${strokeColor}" stroke-width="${(size * 0.006).toFixed(1)}"
    stroke-linejoin="round"/>

  <!-- Axis endpoints -->
  ${axisDots}

  <!-- Dimension labels -->
  ${dimLabels}

  <!-- Center point -->
  <circle cx="${cx}" cy="${cy}" r="1.5"
    fill="${alive ? COLORS.amber : COLORS.inkFaint}" opacity="0.6"/>

  <!-- Deceased indicator -->
  ${!alive ? `<line x1="${size*0.15}" y1="${size*0.15}" x2="${size*0.85}" y2="${size*0.85}"
    stroke="${COLORS.inkFaint}" stroke-width="0.5" opacity="0.3"/>` : ''}

</svg>`;

  return svg;
}

// ─── REACT COMPONENT WRAPPER ──────────────────────────────────────────────────
/**
 * Drop-in React component.
 *
 * @example
 * <SoulAvatarSVG
 *   personality={agent.personality_vector}
 *   soulId={agent.soul_id}
 *   size={40}
 *   interactionCount={agent.interaction_count?.total}
 *   alive={agent.status === 'alive'}
 *   className="rounded-sm"
 * />
 */
export function SoulAvatarSVG({
  personality,
  soulId = 'default',
  size = 40,
  interactionCount = 0,
  alive = true,
  className = '',
  style = {},
}) {
  const svgString = generateSoulAvatar(personality, soulId, { size, interactionCount, alive });
  return (
    <div
      className={className}
      style={{ width: size, height: size, flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}

// ─── EXAMPLE USAGE ───────────────────────────────────────────────────────────
/*
// In a leaderboard row (40x40):
<SoulAvatarSVG
  personality={agent.personality_vector}
  soulId={agent.soul_id}
  size={40}
  interactionCount={agent.interaction_count?.total ?? 0}
  alive={agent.status === 'alive'}
/>

// In an agent profile (200x200):
<SoulAvatarSVG
  personality={agent.personality_vector}
  soulId={agent.soul_id}
  size={200}
  interactionCount={agent.interaction_count?.total ?? 0}
  alive={agent.status === 'alive'}
/>

// In a review card (24x24):
<SoulAvatarSVG
  personality={agent.personality_vector}
  soulId={agent.soul_id}
  size={24}
  alive={agent.status === 'alive'}
/>

// Server-side static PNG generation (node-canvas):
// const { createCanvas } = require('canvas');
// const { JSDOM } = require('jsdom');
// ... parse SVG and render to PNG for OG images, favicons, etc.
*/
