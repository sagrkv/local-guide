'use client';

import React from 'react';
import { PaisleyPattern } from './patterns/MysorePatterns';
import { DiamondGrid, DotMatrix, WavePattern } from './patterns/DefaultPatterns';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PatternType = 'paisley' | 'diamond' | 'dots' | 'tile' | 'wave' | 'none';

interface BackgroundPatternProps {
  pattern?: PatternType;
  /** Override the default low opacity (0.03-0.06). */
  opacity?: number;
  /** Primary color for the pattern strokes/fills. */
  primaryColor?: string;
  /** Secondary color for accents within the pattern. */
  secondaryColor?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Tile pattern (Azulejo-inspired, used for Goa)
// ---------------------------------------------------------------------------

function TilePatternSvg({
  primaryColor,
  opacity,
}: {
  primaryColor: string;
  opacity: number;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className="w-full h-full"
      style={{ opacity }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="azulejo-tile"
          x="0"
          y="0"
          width="50"
          height="50"
          patternUnits="userSpaceOnUse"
        >
          {/* Tile border */}
          <rect
            x="1"
            y="1"
            width="48"
            height="48"
            fill="none"
            stroke={primaryColor}
            strokeWidth="0.5"
          />
          {/* Center cross */}
          <line x1="25" y1="5" x2="25" y2="45" stroke={primaryColor} strokeWidth="0.4" />
          <line x1="5" y1="25" x2="45" y2="25" stroke={primaryColor} strokeWidth="0.4" />
          {/* Quarter circles in corners */}
          <path d="M0 0 A12 12 0 0 1 12 0" fill="none" stroke={primaryColor} strokeWidth="0.6" transform="translate(1,1)" />
          <path d="M0 0 A12 12 0 0 1 12 0" fill="none" stroke={primaryColor} strokeWidth="0.6" transform="translate(49,1) rotate(90)" />
          <path d="M0 0 A12 12 0 0 1 12 0" fill="none" stroke={primaryColor} strokeWidth="0.6" transform="translate(49,49) rotate(180)" />
          <path d="M0 0 A12 12 0 0 1 12 0" fill="none" stroke={primaryColor} strokeWidth="0.6" transform="translate(1,49) rotate(270)" />
          {/* Center diamond */}
          <path
            d="M25 15 L35 25 L25 35 L15 25Z"
            fill="none"
            stroke={primaryColor}
            strokeWidth="0.6"
          />
          {/* Center dot */}
          <circle cx="25" cy="25" r="2" fill={primaryColor} fillOpacity="0.3" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#azulejo-tile)" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Pattern renderer
// ---------------------------------------------------------------------------

function renderPattern(
  pattern: PatternType,
  primaryColor: string,
  secondaryColor: string,
  opacity: number,
) {
  switch (pattern) {
    case 'paisley':
      return (
        <PaisleyPattern
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          opacity={opacity}
          className="w-full h-full"
        />
      );
    case 'diamond':
      return (
        <DiamondGrid
          primaryColor={primaryColor}
          opacity={opacity}
          className="w-full h-full"
        />
      );
    case 'dots':
      return (
        <DotMatrix
          primaryColor={primaryColor}
          opacity={opacity}
          className="w-full h-full"
        />
      );
    case 'wave':
      return (
        <WavePattern
          primaryColor={primaryColor}
          opacity={opacity}
          className="w-full h-full"
        />
      );
    case 'tile':
      return (
        <TilePatternSvg
          primaryColor={primaryColor}
          opacity={opacity}
        />
      );
    case 'none':
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BackgroundPattern({
  pattern = 'dots',
  opacity,
  primaryColor = 'var(--c-primary)',
  secondaryColor = 'var(--c-gold)',
  className,
}: BackgroundPatternProps) {
  if (pattern === 'none') return null;

  const resolvedOpacity = opacity ?? (pattern === 'paisley' ? 0.04 : 0.05);

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className ?? ''}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-cover">
        {renderPattern(pattern, primaryColor, secondaryColor, resolvedOpacity)}
      </div>
    </div>
  );
}

export default BackgroundPattern;
