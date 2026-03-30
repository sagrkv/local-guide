// ============================================================================
// Paper Maps — Animation System
// Framer Motion variants and constants for paper-like transitions
// ============================================================================

// Easing curves
export const EASING = {
  smooth: [0.25, 0.1, 0.25, 1] as const,
  bouncy: [0.34, 1.56, 0.64, 1] as const,
  paper: [0.4, 0, 0.2, 1] as const,
} as const;

// Durations (seconds)
export const DURATION = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.45,
  page: 0.35,
} as const;

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASING.smooth },
  },
};

export const staggerChildren = {
  animate: { transition: { staggerChildren: 0.05 } },
};

export const cardHover = {
  whileHover: { y: -2, transition: { duration: DURATION.fast } },
  whileTap: { scale: 0.98 },
};

export const stampPress = {
  initial: { scale: 0, rotate: -15 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: { type: 'spring', stiffness: 500, damping: 25 },
  },
};

export const slideInFromRight = {
  initial: { x: '100%', opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: DURATION.page, ease: EASING.paper },
  },
  exit: {
    x: '-30%',
    opacity: 0,
    transition: { duration: DURATION.normal, ease: EASING.smooth },
  },
};

export const slideUp = {
  initial: { y: '100%' },
  animate: {
    y: 0,
    transition: { type: 'spring', damping: 30, stiffness: 300 },
  },
  exit: {
    y: '100%',
    transition: { duration: DURATION.normal, ease: EASING.smooth },
  },
};

// ---------------------------------------------------------------------------
// Reduced-motion–safe variant factory
// ---------------------------------------------------------------------------

/** Strip transform/position keys, keeping only opacity. */
export function reducedMotionVariant<T extends Record<string, unknown>>(
  variant: T,
): T {
  const safe = { ...variant };
  for (const key of Object.keys(safe)) {
    const val = safe[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const inner = val as Record<string, unknown>;
      const cleaned = { ...inner };
      delete cleaned.x;
      delete cleaned.y;
      delete cleaned.scale;
      delete cleaned.rotate;
      (safe as Record<string, unknown>)[key] = cleaned;
    }
  }
  return safe;
}
