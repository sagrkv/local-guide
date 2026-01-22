"use client";

import { motion } from "framer-motion";

interface DotGridProps {
  className?: string;
  rows?: number;
  cols?: number;
  dotSize?: number;
  gap?: number;
  animated?: boolean;
  highlightPattern?: boolean;
}

export default function DotGrid({
  className = "",
  rows = 10,
  cols = 20,
  dotSize = 2,
  gap = 20,
  animated = true,
  highlightPattern = true,
}: DotGridProps) {
  const width = cols * gap;
  const height = rows * gap;

  // Create highlight pattern (some dots glow)
  const isHighlighted = (row: number, col: number) => {
    if (!highlightPattern) return false;
    // Create a diagonal pattern
    return (row + col) % 5 === 0;
  };

  return (
    <svg
      className={`absolute pointer-events-none ${className}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
    >
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: cols }).map((_, col) => {
          const x = col * gap + gap / 2;
          const y = row * gap + gap / 2;
          const highlighted = isHighlighted(row, col);
          const delay = (row + col) * 0.02;

          return (
            <motion.circle
              key={`${row}-${col}`}
              cx={x}
              cy={y}
              r={highlighted ? dotSize * 1.5 : dotSize}
              fill="var(--accent)"
              opacity={highlighted ? 0.3 : 0.08}
              initial={animated ? { scale: 0 } : undefined}
              animate={
                animated
                  ? highlighted
                    ? { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }
                    : { scale: 1 }
                  : undefined
              }
              transition={
                animated
                  ? highlighted
                    ? {
                        duration: 2,
                        delay: delay,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }
                    : { delay: delay, duration: 0.3 }
                  : undefined
              }
            />
          );
        })
      )}
    </svg>
  );
}

// Simpler variant for backgrounds
export function SimpleDotPattern({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle, var(--accent) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
        opacity: 0.06,
      }}
    />
  );
}
