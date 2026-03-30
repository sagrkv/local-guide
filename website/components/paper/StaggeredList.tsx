'use client';

import { Children, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DURATION, EASING } from '@/lib/animations';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StaggeredListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number; // default 0.05s
}

// Variants

const containerVariants = (stagger: number) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger } },
});

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASING.smooth },
  },
};

const reducedItemVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.fast },
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Wraps children and staggers their entrance with fade-in + translateY.
 *
 * Triggers on viewport entry via `whileInView`. Each direct child is
 * wrapped in a motion.div that inherits stagger timing from the parent.
 */
export function StaggeredList({
  children,
  className,
  staggerDelay = 0.05,
}: StaggeredListProps) {
  const prefersReduced = useReducedMotion();
  const items = Children.toArray(children);

  return (
    <motion.div
      className={className}
      variants={containerVariants(staggerDelay)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      {items.map((child, i) => (
        <motion.div
          key={i}
          variants={prefersReduced ? reducedItemVariants : itemVariants}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default StaggeredList;
