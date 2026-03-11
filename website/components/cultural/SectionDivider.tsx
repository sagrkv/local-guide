'use client';

import React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DividerVariant = 'lotus' | 'wave' | 'arch' | 'simple' | 'ornate';

interface SectionDividerProps {
  variant?: DividerVariant;
  color?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Lotus divider — horizontal line with a lotus flower in the center
// ---------------------------------------------------------------------------

function LotusDivider({ color }: { color: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 40"
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-auto"
      aria-hidden="true"
    >
      {/* Left line */}
      <line
        x1="20"
        y1="20"
        x2="250"
        y2="20"
        stroke={color}
        strokeWidth="1"
        opacity="0.6"
      />
      {/* Left inner line (double rule) */}
      <line
        x1="60"
        y1="22.5"
        x2="255"
        y2="22.5"
        stroke={color}
        strokeWidth="0.5"
        opacity="0.3"
      />

      {/* Center lotus */}
      <g transform="translate(300, 20)">
        {/* Central petal (up) */}
        <path
          d="M0 -14 C-4 -6, -4 -2, 0 2 C4 -2, 4 -6, 0 -14Z"
          fill={color}
          opacity="0.7"
        />
        {/* Left inner petal */}
        <path
          d="M0 2 C-6 -2, -10 -8, -10 -12 C-8 -6, -4 -2, 0 2Z"
          fill={color}
          opacity="0.5"
        />
        {/* Right inner petal */}
        <path
          d="M0 2 C6 -2, 10 -8, 10 -12 C8 -6, 4 -2, 0 2Z"
          fill={color}
          opacity="0.5"
        />
        {/* Left outer petal */}
        <path
          d="M0 4 C-8 0, -16 -6, -18 -10 C-14 -4, -6 0, 0 4Z"
          fill={color}
          opacity="0.35"
        />
        {/* Right outer petal */}
        <path
          d="M0 4 C8 0, 16 -6, 18 -10 C14 -4, 6 0, 0 4Z"
          fill={color}
          opacity="0.35"
        />
        {/* Base ellipse */}
        <ellipse
          cx="0"
          cy="6"
          rx="10"
          ry="3"
          fill="none"
          stroke={color}
          strokeWidth="0.6"
          opacity="0.4"
        />
        {/* Center dot */}
        <circle cx="0" cy="-2" r="1.5" fill={color} opacity="0.6" />
      </g>

      {/* Small diamond accents flanking lotus */}
      <path
        d="M260 20 L265 17 L270 20 L265 23Z"
        fill={color}
        opacity="0.4"
      />
      <path
        d="M340 20 L335 17 L330 20 L335 23Z"
        fill={color}
        opacity="0.4"
      />

      {/* Right line */}
      <line
        x1="350"
        y1="20"
        x2="580"
        y2="20"
        stroke={color}
        strokeWidth="1"
        opacity="0.6"
      />
      {/* Right inner line (double rule) */}
      <line
        x1="345"
        y1="22.5"
        x2="540"
        y2="22.5"
        stroke={color}
        strokeWidth="0.5"
        opacity="0.3"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Wave divider
// ---------------------------------------------------------------------------

function WaveDivider({ color }: { color: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 24"
      preserveAspectRatio="none"
      className="w-full h-auto"
      aria-hidden="true"
    >
      <path
        d="M0 12 C30 4, 60 4, 90 12 C120 20, 150 20, 180 12 C210 4, 240 4, 270 12 C300 20, 330 20, 360 12 C390 4, 420 4, 450 12 C480 20, 510 20, 540 12 C570 4, 600 4, 600 12"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.5"
      />
      <path
        d="M0 14 C30 6, 60 6, 90 14 C120 22, 150 22, 180 14 C210 6, 240 6, 270 14 C300 22, 330 22, 360 14 C390 6, 420 6, 450 14 C480 22, 510 22, 540 14 C570 6, 600 6, 600 14"
        fill="none"
        stroke={color}
        strokeWidth="0.6"
        opacity="0.25"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Arch divider — row of small cusped arches
// ---------------------------------------------------------------------------

function ArchDivider({ color }: { color: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 30"
      preserveAspectRatio="none"
      className="w-full h-auto"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="arch-divider-unit"
          x="0"
          y="0"
          width="60"
          height="30"
          patternUnits="userSpaceOnUse"
        >
          {/* Single cusped arch */}
          <path
            d="M5 30 L5 15 C5 10, 10 4, 18 3 C22 2, 26 4, 30 3 C34 4, 38 2, 42 3 C50 4, 55 10, 55 15 L55 30"
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity="0.5"
          />
          {/* Keystone dot */}
          <circle cx="30" cy="4" r="1.5" fill={color} opacity="0.4" />
        </pattern>
      </defs>
      <rect width="600" height="30" fill="url(#arch-divider-unit)" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Simple divider — thin line with end diamonds
// ---------------------------------------------------------------------------

function SimpleDivider({ color }: { color: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 12"
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-auto"
      aria-hidden="true"
    >
      <line
        x1="40"
        y1="6"
        x2="560"
        y2="6"
        stroke={color}
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Left diamond */}
      <path
        d="M40 6 L44 3 L48 6 L44 9Z"
        fill={color}
        opacity="0.5"
      />
      {/* Center diamond */}
      <path
        d="M296 6 L300 2 L304 6 L300 10Z"
        fill={color}
        opacity="0.5"
      />
      {/* Right diamond */}
      <path
        d="M552 6 L556 3 L560 6 L556 9Z"
        fill={color}
        opacity="0.5"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Ornate divider — elaborate flourish with swirls
// ---------------------------------------------------------------------------

function OrnateDivider({ color }: { color: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 40"
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-auto"
      aria-hidden="true"
    >
      {/* Left line */}
      <line
        x1="30"
        y1="20"
        x2="220"
        y2="20"
        stroke={color}
        strokeWidth="0.8"
        opacity="0.4"
      />

      {/* Left flourish swirl */}
      <path
        d="M230 20 C240 14, 250 10, 260 14 C265 16, 262 22, 258 22 C254 22, 252 18, 258 16"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.5"
      />

      {/* Center ornament — a stylized medallion */}
      <g transform="translate(300, 20)">
        <circle cx="0" cy="0" r="8" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
        <circle cx="0" cy="0" r="4" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />
        <circle cx="0" cy="0" r="1.5" fill={color} opacity="0.5" />
        {/* Radiating dots */}
        <circle cx="0" cy="-12" r="1" fill={color} opacity="0.35" />
        <circle cx="0" cy="12" r="1" fill={color} opacity="0.35" />
        <circle cx="-12" cy="0" r="1" fill={color} opacity="0.35" />
        <circle cx="12" cy="0" r="1" fill={color} opacity="0.35" />
      </g>

      {/* Right flourish swirl */}
      <path
        d="M370 20 C360 14, 350 10, 340 14 C335 16, 338 22, 342 22 C346 22, 348 18, 342 16"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        opacity="0.5"
      />

      {/* Right line */}
      <line
        x1="380"
        y1="20"
        x2="570"
        y2="20"
        stroke={color}
        strokeWidth="0.8"
        opacity="0.4"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const variantMap: Record<
  DividerVariant,
  React.FC<{ color: string }>
> = {
  lotus: LotusDivider,
  wave: WaveDivider,
  arch: ArchDivider,
  simple: SimpleDivider,
  ornate: OrnateDivider,
};

export function SectionDivider({
  variant = 'simple',
  color = 'var(--c-gold, #C5A55A)',
  className,
}: SectionDividerProps) {
  const Component = variantMap[variant];

  return (
    <div
      className={`w-full max-w-3xl mx-auto py-4 ${className ?? ''}`}
      role="separator"
    >
      <Component color={color} />
    </div>
  );
}

export default SectionDivider;
