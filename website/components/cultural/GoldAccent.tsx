'use client';

import React, { type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AccentVariant = 'text' | 'line' | 'flourish';

interface GoldAccentProps {
  variant?: AccentVariant;
  children?: ReactNode;
  className?: string;
  /** Override gold color (default: var(--c-gold)). */
  color?: string;
  /** For 'line' variant — show decorative end caps. */
  endCaps?: boolean;
}

// ---------------------------------------------------------------------------
// Gold text — metallic gradient on text
// ---------------------------------------------------------------------------

function GoldText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${className ?? ''}`}
      style={{
        backgroundImage: `linear-gradient(
          135deg,
          var(--c-gold, #C5A55A) 0%,
          #E8D5A0 25%,
          var(--c-gold, #C5A55A) 50%,
          #A88C3A 75%,
          var(--c-gold, #C5A55A) 100%
        )`,
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Gold line — thin decorative horizontal line
// ---------------------------------------------------------------------------

function GoldLine({
  color,
  endCaps,
  className,
}: {
  color: string;
  endCaps: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 ${className ?? ''}`}>
      {endCaps && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 12 12"
          className="w-3 h-3 shrink-0"
          aria-hidden="true"
        >
          <path
            d="M6 1 L11 6 L6 11 L1 6Z"
            fill={color}
            opacity="0.6"
          />
        </svg>
      )}
      <div
        className="flex-1 h-px"
        style={{
          backgroundImage: `linear-gradient(
            90deg,
            transparent 0%,
            ${color} 15%,
            ${color} 85%,
            transparent 100%
          )`,
          opacity: 0.5,
        }}
      />
      {endCaps && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 12 12"
          className="w-3 h-3 shrink-0"
          aria-hidden="true"
        >
          <path
            d="M6 1 L11 6 L6 11 L1 6Z"
            fill={color}
            opacity="0.6"
          />
        </svg>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gold flourish — decorative swirl/curl
// ---------------------------------------------------------------------------

function GoldFlourish({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 24"
      className={`w-24 h-5 ${className ?? ''}`}
      aria-hidden="true"
    >
      {/* Left swirl */}
      <path
        d="M10 12 C14 6, 22 4, 28 8 C32 10, 30 16, 26 16 C22 16, 20 12, 26 10"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.6"
      />
      {/* Center line */}
      <line
        x1="34"
        y1="12"
        x2="86"
        y2="12"
        stroke={color}
        strokeWidth="0.8"
        opacity="0.4"
      />
      {/* Center dot */}
      <circle cx="60" cy="12" r="2" fill={color} opacity="0.5" />
      {/* Right swirl (mirrored) */}
      <path
        d="M110 12 C106 6, 98 4, 92 8 C88 10, 90 16, 94 16 C98 16, 100 12, 94 10"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.6"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function GoldAccent({
  variant = 'text',
  children,
  className,
  color = 'var(--c-gold, #C5A55A)',
  endCaps = false,
}: GoldAccentProps) {
  switch (variant) {
    case 'text':
      return <GoldText className={className}>{children}</GoldText>;
    case 'line':
      return <GoldLine color={color} endCaps={endCaps} className={className} />;
    case 'flourish':
      return <GoldFlourish color={color} className={className} />;
    default:
      return <GoldText className={className}>{children}</GoldText>;
  }
}

export default GoldAccent;
