'use client';

import React, { useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FloatingMotifsProps {
  /** SVG path data strings for the shapes to render. */
  shapes?: string[];
  /** How many motifs to scatter (default 6, clamped to 3-10). */
  count?: number;
  /** Base color for all motifs (default: var(--c-primary)). */
  color?: string;
  /** Overall opacity multiplier (default 1.0 — individual shapes vary 0.04-0.1). */
  opacityScale?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Deterministic pseudo-random generator (seeded by index)
// Avoids re-renders producing different layouts.
// ---------------------------------------------------------------------------

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// ---------------------------------------------------------------------------
// Pre-computed layout for a single floating shape
// ---------------------------------------------------------------------------

interface ShapeLayout {
  path: string;
  x: number;       // percent 5-95
  y: number;       // percent 5-95
  size: number;    // px 24-80
  rotation: number; // 0-360
  opacity: number; // 0.04-0.1
}

function computeLayouts(
  shapes: string[],
  count: number,
): ShapeLayout[] {
  const clamped = Math.max(3, Math.min(count, 10));
  const layouts: ShapeLayout[] = [];

  for (let i = 0; i < clamped; i++) {
    const r1 = seededRandom(i * 7 + 1);
    const r2 = seededRandom(i * 7 + 2);
    const r3 = seededRandom(i * 7 + 3);
    const r4 = seededRandom(i * 7 + 4);
    const r5 = seededRandom(i * 7 + 5);

    layouts.push({
      path: shapes[i % shapes.length],
      x: 5 + r1 * 90,
      y: 5 + r2 * 90,
      size: 24 + r3 * 56,
      rotation: r4 * 360,
      opacity: 0.04 + r5 * 0.06,
    });
  }
  return layouts;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FloatingMotifs({
  shapes = [],
  count = 6,
  color = 'var(--c-primary)',
  opacityScale = 1,
  className,
}: FloatingMotifsProps) {
  const layouts = useMemo(
    () => computeLayouts(shapes.length > 0 ? shapes : fallbackShapes, count),
    [shapes, count],
  );

  if (shapes.length === 0 && fallbackShapes.length === 0) return null;

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className ?? ''}`}
      aria-hidden="true"
    >
      {layouts.map((s, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="absolute"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity * opacityScale,
            transform: `rotate(${s.rotation}deg)`,
          }}
        >
          <path d={s.path} fill={color} />
        </svg>
      ))}
    </div>
  );
}

// Minimal fallback shapes (simple geometric)
const fallbackShapes = [
  'M16 4L28 16L16 28L4 16Z',  // diamond
  'M16 4A12 12 0 1 0 16 28A12 12 0 1 0 16 4Z', // circle
];

export default FloatingMotifs;
