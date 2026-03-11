'use client';

import React from 'react';

// ---------------------------------------------------------------------------
// Shared prop types
// ---------------------------------------------------------------------------

interface PatternProps {
  primaryColor?: string;
  secondaryColor?: string;
  opacity?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// 1. DiamondGrid — Repeating diamond / rhombus pattern
// ---------------------------------------------------------------------------

export function DiamondGrid({
  primaryColor = 'var(--c-primary, #92400E)',
  opacity = 0.05,
  className,
}: PatternProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="diamond-grid"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          {/* Diamond shape */}
          <path
            d="M20 2 L38 20 L20 38 L2 20Z"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1"
          />
          {/* Inner diamond */}
          <path
            d="M20 10 L30 20 L20 30 L10 20Z"
            fill="none"
            stroke={primaryColor}
            strokeWidth="0.5"
          />
          {/* Center dot */}
          <circle cx="20" cy="20" r="1.5" fill={primaryColor} fillOpacity="0.4" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#diamond-grid)" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 2. DotMatrix — Spaced dots in a grid
// ---------------------------------------------------------------------------

export function DotMatrix({
  primaryColor = 'var(--c-primary, #92400E)',
  opacity = 0.06,
  className,
}: PatternProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="dot-matrix"
          x="0"
          y="0"
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="12" cy="12" r="2" fill={primaryColor} />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#dot-matrix)" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 3. WavePattern — Horizontal wavy lines
// ---------------------------------------------------------------------------

export function WavePattern({
  primaryColor = 'var(--c-primary, #92400E)',
  opacity = 0.05,
  className,
}: PatternProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="wave-lines"
          x="0"
          y="0"
          width="200"
          height="30"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 15 C25 5, 50 5, 75 15 C100 25, 125 25, 150 15 C175 5, 200 5, 200 15"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#wave-lines)" />
    </svg>
  );
}

export default {
  DiamondGrid,
  DotMatrix,
  WavePattern,
};
