'use client';

import { useMemo } from 'react';
import { wobbleLine } from './wobble';

interface InkDividerProps {
  variant?: 'straight' | 'wavy' | 'dashed';
  className?: string;
  seed?: number;
}

function wavyPath(seed: number): string {
  const points: string[] = [`M 0 6`];
  const segments = 12;
  const segWidth = 600 / segments;

  // Simple seeded offset for each control point
  let s = Math.abs(seed + 42) | 0;
  const rng = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s / 0x7fffffff) * 2 - 1; // -1 to 1
  };

  for (let i = 0; i < segments; i++) {
    const x1 = i * segWidth + segWidth * 0.5;
    const y1 = i % 2 === 0 ? 3 + rng() * 0.8 : 9 + rng() * 0.8;
    const x2 = (i + 1) * segWidth;
    const y2 = 6 + rng() * 0.4;
    points.push(`Q ${x1.toFixed(1)} ${y1.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`);
  }

  return points.join(' ');
}

function dashedPaths(seed: number): string[] {
  const paths: string[] = [];
  const dashCount = 20;
  const gap = 600 / dashCount;

  for (let i = 0; i < dashCount; i++) {
    const x1 = i * gap + 4;
    const x2 = x1 + gap - 10;
    if (x2 > x1) {
      paths.push(wobbleLine(x1, 6, x2, 6, seed + i, 0.8));
    }
  }

  return paths;
}

/** Section divider that looks like a pen stroke. */
export function InkDivider({
  variant = 'straight',
  className,
  seed = 0,
}: InkDividerProps) {
  const content = useMemo(() => {
    if (variant === 'straight') {
      return { type: 'single' as const, d: wobbleLine(10, 6, 590, 6, seed, 1.2) };
    }
    if (variant === 'wavy') {
      return { type: 'single' as const, d: wavyPath(seed) };
    }
    return { type: 'multi' as const, paths: dashedPaths(seed) };
  }, [variant, seed]);

  return (
    <div
      className={`w-full ${className ?? ''}`}
      role="separator"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 600 12"
        preserveAspectRatio="none"
        className="w-full h-[6px]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {content.type === 'single' ? (
          <path
            d={content.d}
            stroke="var(--c-text-muted, #78716C)"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.4"
          />
        ) : (
          content.paths.map((d, i) => (
            <path
              key={i}
              d={d}
              stroke="var(--c-text-muted, #78716C)"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.4"
            />
          ))
        )}
      </svg>
    </div>
  );
}

export default InkDivider;
