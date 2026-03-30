'use client';

import { motion, useReducedMotion } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaperSkeletonProps {
  variant: 'text' | 'card' | 'circle' | 'image';
  width?: string | number;
  height?: string | number;
  size?: number; // for circle
  className?: string;
}

// ---------------------------------------------------------------------------
// Dimension defaults per variant
// ---------------------------------------------------------------------------

const DEFAULTS: Record<string, { width: string | number; height: string | number }> = {
  text: { width: '100%', height: 16 },
  card: { width: '100%', height: 160 },
  circle: { width: 48, height: 48 },
  image: { width: '100%', height: 200 },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Loading skeleton with a warm paper-grain feel.
 *
 * Uses --pm-surface as the base color and a gentle opacity wave
 * instead of the typical gray shimmer.
 */
export function PaperSkeleton({
  variant,
  width,
  height,
  size,
  className,
}: PaperSkeletonProps) {
  const prefersReduced = useReducedMotion();

  const resolvedWidth = variant === 'circle' && size ? size : (width ?? DEFAULTS[variant].width);
  const resolvedHeight = variant === 'circle' && size ? size : (height ?? DEFAULTS[variant].height);

  return (
    <motion.div
      className={className}
      aria-hidden="true"
      animate={prefersReduced ? undefined : { opacity: [0.5, 0.8, 0.5] }}
      transition={
        prefersReduced
          ? undefined
          : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
      }
      style={{
        width: resolvedWidth,
        height: resolvedHeight,
        borderRadius: variant === 'circle' ? '50%' : variant === 'text' ? 4 : 8,
        backgroundColor: 'var(--pm-surface, #FAFAF8)',
        border: '1px solid color-mix(in srgb, var(--pm-ink, #1A1A1A) 6%, transparent)',
        opacity: prefersReduced ? 0.6 : undefined,
      }}
    />
  );
}

export default PaperSkeleton;
