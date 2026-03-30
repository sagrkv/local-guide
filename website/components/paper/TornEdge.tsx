'use client';

import { useMemo } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TornEdgeProps {
  className?: string;
  /** Color of the section above the tear. Defaults to --c-surface. */
  color?: string;
  seed?: number;
}

// ---------------------------------------------------------------------------
// Torn-edge path generator
// ---------------------------------------------------------------------------

function generateTornPath(seed: number): string {
  // Seeded RNG
  let s = Math.abs(seed + 7919) | 0;
  const rng = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff; // 0 to 1
  };

  const width = 1200;
  const height = 40;
  const step = 8; // px between tear points
  const points: string[] = [`M 0 0`, `L 0 ${10 + rng() * 6}`];

  // Walk across the bottom edge with jagged tears
  for (let x = step; x <= width; x += step) {
    const y = 8 + rng() * 18 + (rng() > 0.85 ? rng() * 12 : 0);
    // Occasional sharp peak for more realism
    const cx = x - step * 0.5 + (rng() - 0.5) * 4;
    const cy = y + (rng() - 0.5) * 10;
    points.push(`Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x} ${y.toFixed(1)}`);
  }

  // Close the path back to top-right
  points.push(`L ${width} 0`);
  points.push('Z');

  return points.join(' ');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Decorative torn paper edge for the bottom of sections.
 * Renders an SVG path that looks like ripped paper. The fill color matches
 * the section above so the background below shows through the tears.
 */
export function TornEdge({ className, color, seed = 0 }: TornEdgeProps) {
  const tornPath = useMemo(() => generateTornPath(seed), [seed]);

  return (
    <div
      className={`w-full overflow-hidden leading-none ${className ?? ''}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
        className="block w-full"
        style={{ height: 'clamp(20px, 3vw, 40px)' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={tornPath}
          fill={color ?? 'var(--c-surface, #FFFFFF)'}
        />
      </svg>
    </div>
  );
}

export default TornEdge;
