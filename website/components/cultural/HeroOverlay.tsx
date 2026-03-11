'use client';

import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HeroOverlayProps {
  /** Where the overlay appears: top fades down, bottom fades up. */
  position?: 'top' | 'bottom';
  /** Height of the overlay region in px (default 200). */
  height?: number;
  /** Opacity of the pattern layer (default 0.08). */
  opacity?: number;
  /** Pattern variant — maps to different overlay SVGs. */
  pattern?: 'paisley' | 'tile' | 'jali' | 'diamond' | 'dots' | 'none';
  className?: string;
}

// ---------------------------------------------------------------------------
// Inline pattern SVGs (self-contained, no external refs)
// ---------------------------------------------------------------------------

function PatternContent({ pattern, color }: { pattern: string; color: string }) {
  switch (pattern) {
    case 'paisley':
      return (
        <pattern
          id="hero-paisley"
          x="0"
          y="0"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M40 8 C30 8, 18 20, 18 34 C18 50, 30 60, 40 64 C44 60, 48 54, 50 46 C52 36, 48 20, 40 8Z"
            fill="none"
            stroke={color}
            strokeWidth="1"
          />
          <path
            d="M38 18 C34 22, 28 30, 28 38 C28 46, 34 52, 38 54"
            fill="none"
            stroke={color}
            strokeWidth="0.6"
          />
          <circle cx="34" cy="30" r="1" fill={color} />
          <circle cx="32" cy="38" r="1" fill={color} />
        </pattern>
      );
    case 'tile':
      return (
        <pattern
          id="hero-tile"
          x="0"
          y="0"
          width="50"
          height="50"
          patternUnits="userSpaceOnUse"
        >
          <rect x="1" y="1" width="48" height="48" fill="none" stroke={color} strokeWidth="0.5" />
          <path d="M25 5 L25 45" stroke={color} strokeWidth="0.3" />
          <path d="M5 25 L45 25" stroke={color} strokeWidth="0.3" />
          <path d="M25 15 L35 25 L25 35 L15 25Z" fill="none" stroke={color} strokeWidth="0.5" />
          <circle cx="25" cy="25" r="2" fill={color} fillOpacity="0.3" />
        </pattern>
      );
    case 'jali':
      return (
        <pattern
          id="hero-jali"
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          {/* Star / geometric lattice */}
          <path
            d="M20 4 L24 16 L36 16 L26 24 L30 36 L20 28 L10 36 L14 24 L4 16 L16 16Z"
            fill="none"
            stroke={color}
            strokeWidth="0.6"
          />
          <circle cx="20" cy="20" r="2" fill={color} fillOpacity="0.25" />
        </pattern>
      );
    case 'diamond':
      return (
        <pattern
          id="hero-diamond"
          x="0"
          y="0"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <path d="M16 2 L30 16 L16 30 L2 16Z" fill="none" stroke={color} strokeWidth="0.6" />
          <circle cx="16" cy="16" r="1.5" fill={color} fillOpacity="0.3" />
        </pattern>
      );
    case 'dots':
      return (
        <pattern
          id="hero-dots"
          x="0"
          y="0"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="10" cy="10" r="1.5" fill={color} />
        </pattern>
      );
    default:
      return null;
  }
}

function patternId(pattern: string): string {
  return `hero-${pattern}`;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function HeroOverlay({
  position = 'bottom',
  height = 200,
  opacity = 0.08,
  pattern = 'paisley',
  className,
}: HeroOverlayProps) {
  if (pattern === 'none') return null;

  const isTop = position === 'top';
  const gradientId = `hero-fade-${position}`;
  const pId = patternId(pattern);

  return (
    <div
      className={`absolute left-0 right-0 pointer-events-none overflow-hidden ${
        isTop ? 'top-0' : 'bottom-0'
      } ${className ?? ''}`}
      style={{ height }}
      aria-hidden="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 800 ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        <defs>
          {/* Pattern definition */}
          <PatternContent
            pattern={pattern}
            color="var(--c-primary, #4A154B)"
          />
          {/* Gradient mask: opaque where we want the pattern, transparent where we fade */}
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            {isTop ? (
              <>
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="white" stopOpacity="0" />
                <stop offset="100%" stopColor="white" stopOpacity="1" />
              </>
            )}
          </linearGradient>
          <mask id={`mask-${position}`}>
            <rect width="800" height={height} fill={`url(#${gradientId})`} />
          </mask>
        </defs>
        <rect
          width="800"
          height={height}
          fill={`url(#${pId})`}
          mask={`url(#mask-${position})`}
          opacity={opacity}
        />
      </svg>
    </div>
  );
}

export default HeroOverlay;
