'use client';
/**
 * HeroIllustration — Evolution strip in the style of the "March of Progress"
 * Inline SVG, three acts: Animals → Humans → Robots
 * Timeline: millions of years → thousands of years → months
 * Amber ONLY on the soul agent (final figure, rightmost)
 */

import { useState } from 'react';

// ── palette ──────────────────────────────────────────────────────────────────
const INK   = '#3A2E24';
const FAINT = '#8A7A68';
const GHOST = '#B8AFA4';
const AMBER = '#BA7517';
const AMBER_L = '#E9A925';
const AMBER_P = '#FEF0D0';

// ── crosshatch patterns ───────────────────────────────────────────────────────
const Patterns = () => (
  <defs>
    {/* Light hatch — 45°, for lit areas */}
    <pattern id="h-light" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="5" stroke={INK} strokeWidth="0.55" opacity="0.20"/>
    </pattern>
    {/* Medium hatch — 45° */}
    <pattern id="h-med" patternUnits="userSpaceOnUse" width="4.5" height="4.5" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="4.5" stroke={INK} strokeWidth="0.6" opacity="0.28"/>
    </pattern>
    {/* Dark double hatch — shadow areas */}
    <pattern id="h-dark" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="4" stroke={INK} strokeWidth="0.7" opacity="0.32"/>
    </pattern>
    <pattern id="h-dark2" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(-45)">
      <line x1="0" y1="0" x2="0" y2="4" stroke={INK} strokeWidth="0.6" opacity="0.22"/>
    </pattern>
    {/* Amber hatch — for soul agent */}
    <pattern id="h-amber" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="5" stroke={AMBER_L} strokeWidth="0.7" opacity="0.30"/>
    </pattern>
    {/* Amber double hatch */}
    <pattern id="h-amber2" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(-45)">
      <line x1="0" y1="0" x2="0" y2="4" stroke={AMBER} strokeWidth="0.55" opacity="0.22"/>
    </pattern>
    {/* Dot texture for background */}
    <pattern id="dots" patternUnits="userSpaceOnUse" width="6" height="6">
      <circle cx="3" cy="3" r="0.5" fill={FAINT} opacity="0.06"/>
    </pattern>
  </defs>
);

// ── ANIMAL: Quadruped (dog-like silhouette) ──────────────────────────────────
const Quadruped = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x},${y})`} opacity="0.92">
    {/* Body */}
    <path d="M-52,-42 C-55,-52 -50,-62 -38,-66 C-26,-70 -10,-68 4,-64 C18,-60 32,-58 44,-54 C56,-50 60,-42 58,-34 C56,-26 46,-22 36,-20 C26,-18 10,-18 -4,-20 C-18,-22 -32,-26 -42,-34 Z"
      fill="url(#h-med)" stroke={INK} strokeWidth="1.1" strokeLinejoin="round"/>
    {/* Shadow belly */}
    <path d="M-20,-22 C-10,-18 10,-18 28,-20 C36,-21 44,-24 44,-30 C36,-24 20,-22 -4,-24 Z"
      fill="url(#h-dark)" stroke="none"/>
    {/* Head */}
    <ellipse cx="-48" cy="-52" rx="20" ry="16" fill="url(#h-med)" stroke={INK} strokeWidth="1.1"/>
    {/* Snout */}
    <path d="M-64,-48 C-70,-46 -74,-42 -70,-38 C-66,-34 -60,-36 -56,-40"
      fill="url(#h-med)" stroke={INK} strokeWidth="0.9"/>
    {/* Eye */}
    <circle cx="-53" cy="-58" r="3.5" fill={INK} opacity="0.85"/>
    <circle cx="-52" cy="-59" r="1" fill="white" opacity="0.4"/>
    {/* Ear */}
    <path d="M-38,-66 C-36,-74 -30,-78 -28,-72 C-26,-66 -30,-62 -36,-62 Z"
      fill="url(#h-dark)" stroke={INK} strokeWidth="0.8"/>
    {/* Neck crosshatch shadow */}
    <path d="M-48,-36 C-44,-32 -38,-30 -34,-32 C-30,-34 -30,-40 -34,-44 C-38,-46 -44,-44 -48,-40 Z"
      fill="url(#h-dark)" stroke="none" opacity="0.6"/>
    {/* Legs — 4 legs in stride */}
    {[[-38,-22,-34,0],[-20,-20,-16,0],[12,-20,8,0],[32,-20,28,0]].map(([x1,y1,x2,y2],i) => (
      <g key={i}>
        <path d={`M${x1},${y1} C${x1},${(y1+y2)/2} ${x2},${(y1+y2)/2} ${x2},${y2}`}
          stroke={INK} strokeWidth="7" strokeLinecap="round" fill="none"/>
        <path d={`M${x1},${y1} C${x1},${(y1+y2)/2} ${x2},${(y1+y2)/2} ${x2},${y2}`}
          stroke="url(#h-dark)" strokeWidth="7" strokeLinecap="round" fill="none"/>
      </g>
    ))}
    {/* Tail */}
    <path d="M56,-38 C64,-42 72,-36 74,-28 C76,-20 70,-16 66,-20" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round"/>
    <text y="20" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="11" fill={FAINT}>tetrapod</text>
  </g>
);

// ── ANIMAL: Primate (chimp, knuckle-walking) ──────────────────────────────────
const Primate = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x},${y})`} opacity="0.92">
    {/* Torso — angled, hunched */}
    <path d="M-26,-48 C-30,-60 -26,-72 -16,-76 C-6,-80 8,-78 18,-72 C28,-66 32,-54 28,-44 C24,-34 12,-28 0,-28 C-14,-28 -22,-36 -26,-48 Z"
      fill="url(#h-med)" stroke={INK} strokeWidth="1.2" strokeLinejoin="round"/>
    {/* Chest shadow */}
    <path d="M-16,-44 C-12,-34 0,-30 12,-36 C18,-40 20,-48 16,-54 C8,-46 -4,-40 -16,-44 Z"
      fill="url(#h-dark2)" stroke="none" opacity="0.7"/>
    {/* Head */}
    <ellipse cx="-20" cy="-86" rx="18" ry="16" fill="url(#h-med)" stroke={INK} strokeWidth="1.2"/>
    {/* Brow ridge */}
    <path d="M-34,-90 C-28,-96 -16,-96 -10,-90" fill="none" stroke={INK} strokeWidth="2.5"/>
    {/* Face shadow */}
    <path d="M-26,-82 C-22,-78 -16,-76 -12,-80 C-8,-84 -10,-92 -16,-94 C-22,-92 -28,-88 -26,-82 Z"
      fill="url(#h-dark)" stroke="none" opacity="0.7"/>
    {/* Eye */}
    <circle cx="-18" cy="-88" r="3.5" fill={INK} opacity="0.85"/>
    <circle cx="-17" cy="-89" r="1" fill="white" opacity="0.4"/>
    {/* Nostrils */}
    <path d="M-28,-78 C-26,-76 -24,-76 -22,-78" fill="none" stroke={INK} strokeWidth="1.2"/>
    {/* Long arms to ground */}
    {/* Left arm (forward) */}
    <path d="M-26,-66 C-34,-52 -38,-34 -36,-14 C-36,-8 -34,-4 -30,0"
      stroke={INK} strokeWidth="11" strokeLinecap="round" fill="none"/>
    <path d="M-26,-66 C-34,-52 -38,-34 -36,-14 C-36,-8 -34,-4 -30,0"
      stroke="url(#h-dark)" strokeWidth="11" strokeLinecap="round" fill="none"/>
    {/* Right arm (back, slightly behind) */}
    <path d="M16,-62 C22,-48 26,-32 22,-14 C20,-6 16,-2 14,0"
      stroke={INK} strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.7"/>
    <path d="M16,-62 C22,-48 26,-32 22,-14 C20,-6 16,-2 14,0"
      stroke="url(#h-med)" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.7"/>
    {/* Knuckle hands */}
    <ellipse cx="-30" cy="2" rx="8" ry="5" fill="url(#h-dark)" stroke={INK} strokeWidth="0.8"/>
    <ellipse cx="14" cy="2" rx="7" ry="4.5" fill="url(#h-dark)" stroke={INK} strokeWidth="0.8" opacity="0.7"/>
    {/* Legs — bent */}
    <path d="M-10,-28 C-14,-14 -16,0 -14,0" stroke={INK} strokeWidth="10" strokeLinecap="round" fill="none"/>
    <path d="M-10,-28 C-14,-14 -16,0 -14,0" stroke="url(#h-dark2)" strokeWidth="10" strokeLinecap="round" fill="none"/>
    <path d="M8,-28 C12,-14 14,0 12,0" stroke={INK} strokeWidth="9" strokeLinecap="round" fill="none" opacity="0.75"/>
    <text y="24" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="11" fill={FAINT}>simian</text>
  </g>
);

// ── HOMINID figure — parameterized by progress 0→1 ───────────────────────────
// progress 0 = fully hunched ape-man, 1 = fully upright modern human
function hominidData(progress: number) {
  // Key measurements (units, foot at 0 growing upward = negative y)
  const h = 130 + progress * 80;          // total figure height
  const lean = (1 - progress) * 38;       // forward lean in degrees
  const torsoW = 13 + progress * 7;       // torso half-width at shoulders
  const legBend = (1 - progress) * 30;    // knee-bend amount
  const armLen = 85 - progress * 22;      // arm total length
  const strideX = progress * 18;          // stride offset

  // Key y positions (from foot upward, so negative)
  const hipY    = -(h * 0.44);
  const waistY  = -(h * 0.52);
  const chestY  = -(h * 0.64);
  const shldrY  = -(h * 0.74);
  const neckY   = -(h * 0.80);
  const headCY  = -(h * 0.89);
  const headRY  = h * 0.075;
  const headRX  = h * 0.063;

  // Lean offset: X displacement of upper body
  const leanRad = lean * Math.PI / 180;
  const leanDx  = Math.sin(leanRad) * h * 0.42;

  // Torso top/bottom offsets
  const sX = -leanDx;  // shoulder X relative to foot
  const hX = -leanDx * 0.3;  // hip X

  return { h, lean, torsoW, hipY, waistY, chestY, shldrY, neckY, headCY, headRX, headRY, leanDx, sX, hX, armLen, strideX, legBend };
}

const Hominid = ({
  x, y, progress, label = '', amber = false
}: {
  x: number; y: number; progress: number; label?: string; amber?: boolean;
}) => {
  const d = hominidData(progress);
  const fill1 = amber ? 'url(#h-amber)'  : 'url(#h-med)';
  const fill2 = amber ? 'url(#h-amber2)' : 'url(#h-dark)';
  const fill3 = amber ? 'url(#h-amber2)' : 'url(#h-dark2)';
  const stroke = amber ? AMBER : INK;
  const sw = amber ? 1.4 : 1.2;

  // Torso path
  const torsoPath = `
    M${d.sX - d.torsoW},${d.shldrY}
    C${d.sX - d.torsoW - 2},${d.chestY} ${d.hX - d.torsoW + 2},${d.waistY} ${d.hX - d.torsoW + 4},${d.hipY}
    L${d.hX + d.torsoW - 4},${d.hipY}
    C${d.hX + d.torsoW - 2},${d.waistY} ${d.sX + d.torsoW + 2},${d.chestY} ${d.sX + d.torsoW},${d.shldrY}
    Z
  `;

  // Front leg
  const kneeBend = d.legBend;
  const kneeX = -d.strideX - 5;
  const kneeY = -(d.h * 0.26) - kneeBend * 0.5;
  const frontLeg = `M${d.hX - 6},${d.hipY} C${kneeX - 2},${(d.hipY + kneeY) / 2} ${kneeX},${kneeY} ${kneeX + 2},${-d.h * 0.26} L${-d.strideX - 12},0`;

  // Back leg
  const bKneeX = d.strideX + 8;
  const backLeg = `M${d.hX + 6},${d.hipY} C${bKneeX},${(d.hipY + kneeY) / 2} ${bKneeX + 2},${kneeY} ${bKneeX},${-d.h * 0.26} L${d.strideX + 6},0`;

  // Arm (near, forward swing at low progress, pendulum at high progress)
  const aStartX = d.sX + d.torsoW;
  const aStartY = d.shldrY + 10;
  const aAngle = progress < 0.5
    ? 0.8 - progress * 1.2   // reaching somewhat forward/down when hunched
    : 0.3 - progress * 0.6;  // pendulum swing
  const aMidX = aStartX + Math.sin(aAngle) * d.armLen * 0.55;
  const aMidY = aStartY + Math.cos(aAngle) * d.armLen * 0.55;
  const aEndX = aStartX + Math.sin(aAngle * 0.7) * d.armLen;
  const aEndY = aStartY + Math.cos(aAngle * 0.7) * d.armLen;

  // Far arm (back swing)
  const bAStartX = d.sX - d.torsoW;
  const bAAngle = aAngle - 0.8;
  const bAEndX = bAStartX + Math.sin(bAAngle) * d.armLen * 0.9;
  const bAEndY = aStartY + Math.cos(bAAngle) * d.armLen * 0.9;

  // Spear (for progress >= 0.7)
  const hasSpear = progress >= 0.7;
  const spearAngle = -Math.PI * 0.3;
  const spearLen = 90 + progress * 30;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Far arm (behind body) */}
      <path
        d={`M${bAStartX},${aStartY} Q${(bAStartX + bAEndX) / 2},${(aStartY + bAEndY) / 2 + 10} ${bAEndX},${bAEndY}`}
        stroke={stroke} strokeWidth={8 + progress * 3} strokeLinecap="round" fill="none" opacity="0.65"
      />
      <path
        d={`M${bAStartX},${aStartY} Q${(bAStartX + bAEndX) / 2},${(aStartY + bAEndY) / 2 + 10} ${bAEndX},${bAEndY}`}
        stroke={fill2} strokeWidth={8 + progress * 3} strokeLinecap="round" fill="none" opacity="0.65"
      />

      {/* Back leg (behind) */}
      <path d={backLeg} stroke={stroke} strokeWidth={10 + progress * 4} strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d={backLeg} stroke={fill3} strokeWidth={10 + progress * 4} strokeLinecap="round" fill="none" opacity="0.7"/>

      {/* Torso */}
      <path d={torsoPath} fill={fill1} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
      {/* Chest shadow (darker on right side) */}
      <path
        d={`M${d.sX},${d.shldrY} C${d.sX + d.torsoW + 1},${d.chestY} ${d.hX + d.torsoW},${d.waistY} ${d.hX + d.torsoW - 4},${d.hipY} L${d.hX},${d.hipY} C${d.hX + 2},${d.waistY} ${d.sX + 2},${d.chestY} ${d.sX},${d.shldrY} Z`}
        fill={fill2} stroke="none" opacity="0.6"
      />

      {/* Head */}
      <ellipse
        cx={d.sX - 2 + (1 - progress) * (-8)}
        cy={d.headCY}
        rx={d.headRX}
        ry={d.headRY}
        fill={fill1} stroke={stroke} strokeWidth={sw}
      />
      {/* Face shadow */}
      <ellipse
        cx={d.sX + d.headRX * 0.3 + (1 - progress) * (-6)}
        cy={d.headCY + 2}
        rx={d.headRX * 0.65}
        ry={d.headRY * 0.72}
        fill={fill2} stroke="none" opacity="0.65"
      />
      {/* Eye */}
      <circle
        cx={d.sX + d.headRX * 0.2 + (1-progress)*(-8)}
        cy={d.headCY - d.headRY * 0.15}
        r={2.2 + progress * 0.5}
        fill={amber ? AMBER : INK}
        opacity={amber ? 0.9 : 0.85}
      />
      {/* Brow ridge (reduces with progress) */}
      {progress < 0.75 && (
        <path
          d={`M${d.sX - d.headRX * 0.9 + (1-progress)*(-8)},${d.headCY - d.headRY * 0.4} C${d.sX + (1-progress)*(-8)},${d.headCY - d.headRY * 0.6} ${d.sX + d.headRX * 0.4 + (1-progress)*(-8)},${d.headCY - d.headRY * 0.5}`}
          fill="none" stroke={stroke} strokeWidth={1.8 - progress * 1.2}
        />
      )}
      {/* Neck */}
      <path
        d={`M${d.sX - 5},${d.neckY} L${d.sX - 4},${d.shldrY} L${d.sX + 5},${d.shldrY} L${d.sX + 6},${d.neckY} Z`}
        fill={fill1} stroke={stroke} strokeWidth={0.8}
      />

      {/* Front leg */}
      <path d={frontLeg} stroke={stroke} strokeWidth={11 + progress * 4} strokeLinecap="round" fill="none"/>
      <path d={frontLeg} stroke={fill2} strokeWidth={11 + progress * 4} strokeLinecap="round" fill="none"/>

      {/* Near arm */}
      <path
        d={`M${aStartX},${aStartY} Q${aMidX},${aMidY} ${aEndX},${aEndY}`}
        stroke={stroke} strokeWidth={9 + progress * 3} strokeLinecap="round" fill="none"
      />
      <path
        d={`M${aStartX},${aStartY} Q${aMidX},${aMidY} ${aEndX},${aEndY}`}
        stroke={fill2} strokeWidth={9 + progress * 3} strokeLinecap="round" fill="none"
      />

      {/* Spear */}
      {hasSpear && !amber && (
        <line
          x1={bAEndX} y1={bAEndY}
          x2={bAEndX + Math.cos(spearAngle) * spearLen}
          y2={bAEndY + Math.sin(spearAngle) * spearLen}
          stroke={INK} strokeWidth="1.8" strokeLinecap="round"
        />
      )}

      {/* Soul rays — amber ONLY */}
      {amber && Array.from({ length: 12 }).map((_, i) => {
        const rayAngle = -Math.PI * 0.9 + i * (Math.PI * 1.8 / 11);
        const len = 36 + (i % 3) * 16;
        const op = 0.45 + (i % 4) * 0.15;
        const hcx = d.sX - 2;
        const hcy = d.headCY;
        return (
          <g key={i}>
            <line
              x1={hcx} y1={hcy}
              x2={hcx + Math.cos(rayAngle) * len}
              y2={hcy + Math.sin(rayAngle) * len}
              stroke={AMBER_L} strokeWidth="0.8" opacity={op}
            />
            <line
              x1={hcx + Math.cos(rayAngle) * (len - 3) + Math.cos(rayAngle + Math.PI/2) * 3}
              y1={hcy + Math.sin(rayAngle) * (len - 3) + Math.sin(rayAngle + Math.PI/2) * 3}
              x2={hcx + Math.cos(rayAngle) * (len - 3) - Math.cos(rayAngle + Math.PI/2) * 3}
              y2={hcy + Math.sin(rayAngle) * (len - 3) - Math.sin(rayAngle + Math.PI/2) * 3}
              stroke={AMBER} strokeWidth="0.5" opacity={op * 0.6}
            />
          </g>
        );
      })}

      {/* ASP-1 badge for soul agent */}
      {amber && (
        <>
          <line
            x1={d.sX + d.torsoW} y1={d.shldrY - 10}
            x2={d.sX + d.torsoW + 52} y2={d.shldrY - 28}
            stroke={AMBER} strokeWidth="0.6" strokeDasharray="3,4" opacity="0.7"
          />
          <rect
            x={d.sX + d.torsoW + 52} y={d.shldrY - 37}
            width={44} height={16}
            fill="none" stroke={AMBER} strokeWidth="0.7"
          />
          <text
            x={d.sX + d.torsoW + 74} y={d.shldrY - 25}
            textAnchor="middle" fontFamily="monospace" fontSize="8.5" fill={AMBER}
          >ASP-1</text>
        </>
      )}

      {/* Label */}
      {label && (
        <text y={24} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="10.5" fill={amber ? AMBER : FAINT}>
          {label}
        </text>
      )}
    </g>
  );
};

// ── ROBOT — boxy, hunched like early hominid ──────────────────────────────────
const BoxRobot = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x},${y})`} opacity="0.92">
    {/* Torso — box, slightly tilted */}
    <rect x="-18" y="-110" width="36" height="50" rx="2"
      fill="url(#h-med)" stroke={INK} strokeWidth="1.1"/>
    {/* Panel lines */}
    <line x1="-14" y1="-102" x2="14" y2="-102" stroke={INK} strokeWidth="0.5" opacity="0.5"/>
    <line x1="-14" y1="-94" x2="14" y2="-94" stroke={INK} strokeWidth="0.5" opacity="0.5"/>
    {/* Chest indicator */}
    <rect x="-8" y="-104" width="5" height="5" rx="1" fill="url(#h-dark)" stroke={INK} strokeWidth="0.5"/>
    <rect x="1" y="-104" width="5" height="5" rx="1" fill="url(#h-dark)" stroke={INK} strokeWidth="0.5"/>
    {/* Head — box */}
    <rect x="-14" y="-148" width="28" height="30" rx="2"
      fill="url(#h-med)" stroke={INK} strokeWidth="1.1"/>
    {/* Eyes — rectangular */}
    <rect x="-10" y="-142" width="7" height="6" rx="1" fill="url(#h-dark)" stroke={INK} strokeWidth="0.7"/>
    <rect x="3" y="-142" width="7" height="6" rx="1" fill="url(#h-dark)" stroke={INK} strokeWidth="0.7"/>
    {/* Antenna */}
    <line x1="0" y1="-148" x2="0" y2="-162" stroke={INK} strokeWidth="1.2"/>
    <circle cx="0" cy="-165" r="4" fill="url(#h-dark)" stroke={INK} strokeWidth="0.9"/>
    {/* Arms — reaching forward/down (hunched pose) */}
    <line x1="-18" y1="-100" x2="-30" y2="-72" stroke={INK} strokeWidth="8" strokeLinecap="round"/>
    <line x1="-18" y1="-100" x2="-30" y2="-72" stroke="url(#h-dark)" strokeWidth="8" strokeLinecap="round"/>
    <line x1="-30" y1="-72" x2="-28" y2="-50" stroke={INK} strokeWidth="7" strokeLinecap="round"/>
    <line x1="18" y1="-100" x2="28" y2="-74" stroke={INK} strokeWidth="8" strokeLinecap="round" opacity="0.75"/>
    <line x1="28" y1="-74" x2="26" y2="-52" stroke={INK} strokeWidth="7" strokeLinecap="round" opacity="0.75"/>
    {/* Gripper hands */}
    <rect x="-34" y="-50" width="10" height="10" rx="1" fill="url(#h-dark)" stroke={INK} strokeWidth="0.9"/>
    <rect x="22" y="-52" width="10" height="10" rx="1" fill="url(#h-dark)" stroke={INK} strokeWidth="0.9" opacity="0.75"/>
    {/* Legs */}
    <line x1="-10" y1="-60" x2="-14" y2="-28" stroke={INK} strokeWidth="10" strokeLinecap="round"/>
    <line x1="-10" y1="-60" x2="-14" y2="-28" stroke="url(#h-dark2)" strokeWidth="10" strokeLinecap="round"/>
    <line x1="-14" y1="-28" x2="-12" y2="0" stroke={INK} strokeWidth="9" strokeLinecap="round"/>
    <line x1="10" y1="-60" x2="14" y2="-28" stroke={INK} strokeWidth="10" strokeLinecap="round" opacity="0.75"/>
    <line x1="14" y1="-28" x2="12" y2="0" stroke={INK} strokeWidth="9" strokeLinecap="round" opacity="0.75"/>
    <text y="20" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="11" fill={FAINT}>automaton</text>
  </g>
);

// ── ANDROID — more humanoid, semi-upright ─────────────────────────────────────
const Android = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x},${y})`} opacity="0.92">
    {/* Torso — rounded box, upright */}
    <path d="M-18,-155 C-20,-145 -20,-125 -18,-108 C-16,-94 -12,-88 -8,-86 L10,-86 C14,-88 18,-94 20,-108 C22,-125 22,-145 20,-155 Z"
      fill="url(#h-med)" stroke={INK} strokeWidth="1.2"/>
    {/* Chest panel */}
    <rect x="-12" y="-148" width="24" height="18" rx="2" fill="url(#h-dark)" stroke={INK} strokeWidth="0.6" opacity="0.8"/>
    {/* LEDs */}
    {[-8,-3,2,7].map((lx,i) => (
      <rect key={i} x={lx} y="-142" width="3" height="3" rx="0.5" fill={INK} opacity="0.4 "/>
    ))}
    {/* Head — oval, more humanoid */}
    <ellipse cx="-2" cy="-174" rx="16" ry="18" fill="url(#h-med)" stroke={INK} strokeWidth="1.2"/>
    {/* Face shading */}
    <ellipse cx="4" cy="-172" rx="10" ry="14" fill="url(#h-dark)" stroke="none" opacity="0.55"/>
    {/* Eyes */}
    <circle cx="-8" cy="-178" r="4" fill="url(#h-dark)" stroke={INK} strokeWidth="0.8"/>
    <circle cx="4" cy="-178" r="4" fill="url(#h-dark)" stroke={INK} strokeWidth="0.8"/>
    <circle cx="-7" cy="-178" r="1.5" fill={INK} opacity="0.7"/>
    <circle cx="5" cy="-178" r="1.5" fill={INK} opacity="0.7"/>
    {/* Shoulder joints */}
    <circle cx="-22" cy="-148" r="6" fill="url(#h-dark)" stroke={INK} strokeWidth="0.9"/>
    <circle cx="22" cy="-148" r="6" fill="url(#h-dark)" stroke={INK} strokeWidth="0.9"/>
    {/* Arms with elbow joints */}
    <line x1="-22" y1="-142" x2="-28" y2="-112" stroke={INK} strokeWidth="10" strokeLinecap="round"/>
    <line x1="-22" y1="-142" x2="-28" y2="-112" stroke="url(#h-dark2)" strokeWidth="10" strokeLinecap="round"/>
    <circle cx="-28" cy="-112" r="5" fill="url(#h-dark)" stroke={INK} strokeWidth="0.8"/>
    <line x1="-28" y1="-107" x2="-26" y2="-78" stroke={INK} strokeWidth="9" strokeLinecap="round"/>
    <line x1="-28" y1="-107" x2="-26" y2="-78" stroke="url(#h-dark)" strokeWidth="9" strokeLinecap="round"/>
    <line x1="22" y1="-142" x2="28" y2="-113" stroke={INK} strokeWidth="10" strokeLinecap="round" opacity="0.75"/>
    <circle cx="28" cy="-113" r="5" fill="url(#h-dark)" stroke={INK} strokeWidth="0.8" opacity="0.75"/>
    <line x1="28" y1="-108" x2="26" y2="-79" stroke={INK} strokeWidth="9" strokeLinecap="round" opacity="0.75"/>
    {/* Hip joints */}
    <circle cx="-11" cy="-84" r="5" fill="url(#h-dark)" stroke={INK} strokeWidth="0.8"/>
    <circle cx="11" cy="-84" r="5" fill="url(#h-dark)" stroke={INK} strokeWidth="0.8"/>
    {/* Legs with knee joints */}
    <line x1="-11" y1="-79" x2="-15" y2="-44" stroke={INK} strokeWidth="11" strokeLinecap="round"/>
    <line x1="-11" y1="-79" x2="-15" y2="-44" stroke="url(#h-dark2)" strokeWidth="11" strokeLinecap="round"/>
    <circle cx="-15" cy="-44" r="6" fill="url(#h-dark)" stroke={INK} strokeWidth="0.9"/>
    <line x1="-15" y1="-38" x2="-11" y2="0" stroke={INK} strokeWidth="10" strokeLinecap="round"/>
    <line x1="11" y1="-79" x2="17" y2="-44" stroke={INK} strokeWidth="11" strokeLinecap="round" opacity="0.75"/>
    <circle cx="17" cy="-44" r="6" fill="url(#h-dark)" stroke={INK} strokeWidth="0.9" opacity="0.75"/>
    <line x1="17" y1="-38" x2="13" y2="0" stroke={INK} strokeWidth="10" strokeLinecap="round" opacity="0.75"/>
    <text y="22" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="11" fill={FAINT}>android</text>
  </g>
);

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export function HeroIllustration({
  className = '',
  style = {},
  interactive = true,
}: {
  className?: string;
  style?: React.CSSProperties;
  interactive?: boolean;
}) {
  const [soulBright, setSoulBright] = useState(false);
  const GY = 570; // ground Y

  // Hominid positions and progresses
  const hominids = [
    { x: 520,  p: 0.05, label: 'Australopithecus' },
    { x: 666,  p: 0.25, label: 'H. habilis' },
    { x: 810,  p: 0.48, label: 'H. erectus' },
    { x: 950,  p: 0.68, label: 'H. heidelbergensis' },
    { x: 1096, p: 0.86, label: 'H. sapiens archaicus' },
    { x: 1244, p: 1.00, label: 'H. sapiens' },
  ];

  return (
    <svg
      viewBox="0 0 2400 700"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: '100%', height: 'auto', display: 'block', ...style }}
      role="img"
      aria-label="Evolution of character: from animals to humans to agents with souls"
    >
      <Patterns />

      {/* ── Background ─────────────────────────────────────────────────────── */}
      <rect width="2400" height="700" fill="#EDE8DF"/>
      <rect width="2400" height="700" fill="url(#dots)"/>

      {/* ── Ground line ────────────────────────────────────────────────────── */}
      <line x1="40" y1={GY} x2="2360" y2={GY} stroke={GHOST} strokeWidth="0.6"/>

      {/* ── Act dividers ───────────────────────────────────────────────────── */}
      {[440, 1340].map(dx => (
        <line key={dx} x1={dx} y1="70" x2={dx} y2={GY} stroke={GHOST} strokeWidth="0.5" strokeDasharray="5,9" opacity="0.6"/>
      ))}

      {/* ── Act labels ─────────────────────────────────────────────────────── */}
      {/* Animals */}
      <text x="240" y="96" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="600" fontSize="11" letterSpacing="5" fill={FAINT}>ANIMALS</text>
      <line x1="130" y1="103" x2="350" y2="103" stroke={GHOST} strokeWidth="0.4"/>
      <text x="240" y="120" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="10.5" fill={GHOST}>millions of years</text>

      {/* Humans */}
      <text x="890" y="96" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="600" fontSize="11" letterSpacing="5" fill={FAINT}>HUMANITY</text>
      <line x1="680" y1="103" x2="1100" y2="103" stroke={GHOST} strokeWidth="0.4"/>
      <text x="890" y="120" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="10.5" fill={GHOST}>thousands of years</text>

      {/* Agents */}
      <text x="1870" y="96" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="600" fontSize="11" letterSpacing="5" fill={AMBER}>AGENTS</text>
      <line x1="1380" y1="103" x2="2360" y2="103" stroke={AMBER} strokeWidth="0.4" opacity="0.5"/>
      <text x="1870" y="120" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="10.5" fill={AMBER} opacity="0.75">months →</text>

      {/* ── Title (top-left) ───────────────────────────────────────────────── */}
      <text x="52" y="50" fontFamily="Georgia, serif" fontSize="28" letterSpacing="6" fill={INK}>AGENTSOUL</text>
      <rect x="52" y="58" width="180" height="1" fill={AMBER}/>
      <text x="52" y="72" fontFamily="monospace" fontSize="8" letterSpacing="2" fill={FAINT}>THE FIRST EVOLUTIONARY EXPERIMENT FOR ARTIFICIAL CHARACTER</text>

      {/* ── Bottom stamp ──────────────────────────────────────────────────── */}
      <text x="2360" y={GY + 40} textAnchor="end" fontFamily="monospace" fontSize="8.5" letterSpacing="1.5" fill={FAINT}>
        OPEN STANDARD · TURIN · MARCH 2026
      </text>

      {/* Timeline arrow */}
      <line x1="52" y1={GY + 22} x2="2340" y2={GY + 22} stroke={GHOST} strokeWidth="0.5"/>
      <polygon points={`2340,${GY+18} 2360,${GY+22} 2340,${GY+26}`} fill={GHOST}/>
      <text x="1200" y={GY + 38} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="12.5" fill={GHOST}>
        the evolution of character
      </text>

      {/* ── ACT I: Animals ────────────────────────────────────────────────── */}
      <Quadruped x={140} y={GY} />
      <Primate   x={340} y={GY} />

      {/* ── ACT II: Hominids ──────────────────────────────────────────────── */}
      {hominids.map((h, i) => (
        <Hominid key={i} x={h.x} y={GY} progress={h.p} />
      ))}
      {/* Species labels staggered */}
      {hominids.map((h, i) => (
        <text
          key={`lbl-${i}`}
          x={h.x}
          y={GY + 16 + (i % 2 === 0 ? 0 : 14)}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="9.5"
          fill={FAINT}
        >
          {h.label}
        </text>
      ))}

      {/* ── ACT III: Agents ───────────────────────────────────────────────── */}
      <BoxRobot x={1430} y={GY} />
      <Android  x={1680} y={GY} />

      {/* Soul agent hover zone */}
      {interactive && (
        <rect
          x={1840} y={GY - 240}
          width={260} height={260}
          fill="transparent"
          style={{ cursor: 'default' }}
          onMouseEnter={() => setSoulBright(true)}
          onMouseLeave={() => setSoulBright(false)}
        />
      )}
      <g opacity={soulBright ? 1 : 0.92} style={{ transition: 'opacity 0.4s' }}>
        <Hominid x={1970} y={GY} progress={1.0} amber label="agent · soul" />
      </g>

      {/* ── Outer border ──────────────────────────────────────────────────── */}
      <rect x="16" y="16" width="2368" height="668" fill="none" stroke={GHOST} strokeWidth="0.5" opacity="0.4"/>
    </svg>
  );
}

export default HeroIllustration;
