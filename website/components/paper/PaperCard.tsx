'use client';

import { type ReactNode, useId, useMemo } from 'react';
import { wobbleRect } from './wobble';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaperCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'flat';
  seed?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Card with a hand-drawn SVG border overlay.
 *
 * The border is rendered as an absolutely-positioned SVG that draws a
 * wobbly rectangle. A seeded random ensures the wobble is stable across
 * re-renders.
 */
export function PaperCard({
  children,
  className,
  variant = 'default',
  seed = 0,
}: PaperCardProps) {
  const uid = useId();

  const wobblePath = useMemo(
    () => wobbleRect(1, 1, 298, 198, seed, 1.5),
    [seed],
  );

  const variantClasses: Record<string, string> = {
    default: 'shadow-[0_1px_3px_rgba(0,0,0,0.06)]',
    elevated:
      'shadow-[0_4px_12px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.05)]',
    flat: '',
  };

  return (
    <div
      className={[
        'relative p-4 rounded-lg transition-transform duration-200',
        'hover:-translate-y-0.5',
        variantClasses[variant],
        className ?? '',
      ].join(' ')}
      style={{ backgroundColor: 'var(--c-surface, #FFFFFF)' }}
    >
      {/* Hand-drawn border overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 300 200"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <path
          d={wobblePath}
          stroke="var(--c-border, #E7E5E4)"
          strokeWidth="1.2"
          fill="none"
          key={uid}
        />
      </svg>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default PaperCard;
