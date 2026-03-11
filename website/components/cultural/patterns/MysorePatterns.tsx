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
// 1. PaisleyPattern — Repeating paisley / mango motif (the "ambi")
// ---------------------------------------------------------------------------

export function PaisleyPattern({
  primaryColor = 'var(--c-primary, #4A154B)',
  secondaryColor = 'var(--c-gold, #C5A55A)',
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
          id="paisley-repeat"
          x="0"
          y="0"
          width="100"
          height="100"
          patternUnits="userSpaceOnUse"
        >
          {/* Main paisley body — teardrop shape curling inward */}
          <path
            d="M50 10
               C35 10, 20 25, 20 45
               C20 65, 35 80, 50 85
               C55 82, 60 75, 62 65
               C65 50, 60 30, 50 10Z"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.5"
          />
          {/* Inner spiral detail */}
          <path
            d="M48 25
               C42 28, 35 38, 35 48
               C35 58, 40 65, 48 70
               C50 68, 53 62, 54 55
               C56 45, 52 32, 48 25Z"
            fill="none"
            stroke={secondaryColor}
            strokeWidth="1"
          />
          {/* Central spiral */}
          <path
            d="M46 40
               C43 42, 40 48, 42 52
               C44 56, 48 56, 50 54
               C52 52, 50 48, 48 46
               C47 44, 46 42, 46 40Z"
            fill={secondaryColor}
            fillOpacity="0.4"
          />
          {/* Leaf details emerging from paisley tip */}
          <path
            d="M50 10 C48 6, 42 4, 38 8"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1"
          />
          <path
            d="M50 10 C52 6, 58 4, 62 8"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1"
          />
          {/* Dots along the inner curve */}
          <circle cx="38" cy="35" r="1.5" fill={secondaryColor} />
          <circle cx="34" cy="45" r="1.5" fill={secondaryColor} />
          <circle cx="36" cy="55" r="1.5" fill={secondaryColor} />
          <circle cx="42" cy="63" r="1.5" fill={secondaryColor} />
          {/* Small secondary paisley (rotated, offset) */}
          <g transform="translate(70, 55) rotate(180) scale(0.4)">
            <path
              d="M50 10
                 C35 10, 20 25, 20 45
                 C20 65, 35 80, 50 85
                 C55 82, 60 75, 62 65
                 C65 50, 60 30, 50 10Z"
              fill="none"
              stroke={primaryColor}
              strokeWidth="2"
            />
          </g>
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#paisley-repeat)" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 2. LotusPattern — Horizontal chain of stylized lotus flowers
// ---------------------------------------------------------------------------

export function LotusPattern({
  primaryColor = 'var(--c-gold, #C5A55A)',
  secondaryColor = 'var(--c-primary, #4A154B)',
  opacity = 0.15,
  className,
}: PatternProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 60"
      preserveAspectRatio="none"
      className={className}
      style={{ opacity, width: '100%' }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="lotus-chain"
          x="0"
          y="0"
          width="100"
          height="60"
          patternUnits="userSpaceOnUse"
        >
          {/* Central petal (top) */}
          <path
            d="M50 8 C46 18, 46 28, 50 35 C54 28, 54 18, 50 8Z"
            fill={primaryColor}
            fillOpacity="0.6"
          />
          {/* Left inner petal */}
          <path
            d="M50 35 C44 30, 38 22, 36 14 C34 22, 38 32, 50 35Z"
            fill={primaryColor}
            fillOpacity="0.45"
          />
          {/* Right inner petal */}
          <path
            d="M50 35 C56 30, 62 22, 64 14 C66 22, 62 32, 50 35Z"
            fill={primaryColor}
            fillOpacity="0.45"
          />
          {/* Left outer petal */}
          <path
            d="M50 38 C40 34, 28 28, 24 18 C22 28, 32 38, 50 38Z"
            fill={primaryColor}
            fillOpacity="0.3"
          />
          {/* Right outer petal */}
          <path
            d="M50 38 C60 34, 72 28, 76 18 C78 28, 68 38, 50 38Z"
            fill={primaryColor}
            fillOpacity="0.3"
          />
          {/* Base / water line */}
          <ellipse
            cx="50"
            cy="40"
            rx="18"
            ry="5"
            fill="none"
            stroke={secondaryColor}
            strokeWidth="0.8"
          />
          {/* Center dot */}
          <circle cx="50" cy="30" r="2" fill={secondaryColor} fillOpacity="0.5" />
          {/* Connecting vine between lotuses */}
          <path
            d="M76 40 C88 42, 88 42, 100 40"
            fill="none"
            stroke={primaryColor}
            strokeWidth="0.8"
          />
          <path
            d="M0 40 C12 42, 12 42, 24 40"
            fill="none"
            stroke={primaryColor}
            strokeWidth="0.8"
          />
        </pattern>
      </defs>
      <rect width="400" height="60" fill="url(#lotus-chain)" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 3. PalaceArchBorder — Cusped / multifoil arch from Mysore Palace
// ---------------------------------------------------------------------------

export function PalaceArchBorder({
  primaryColor = 'var(--c-gold, #C5A55A)',
  secondaryColor = 'var(--c-primary, #4A154B)',
  opacity = 0.2,
  className,
}: PatternProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 80"
      preserveAspectRatio="none"
      className={className}
      style={{ opacity, width: '100%' }}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="palace-arch-repeat"
          x="0"
          y="0"
          width="100"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          {/* Outer arch frame — multifoil (5 cusps) */}
          <path
            d="M5 80
               L5 35
               C5 30, 10 20, 18 18
               C22 16, 26 20, 30 18
               C34 16, 38 10, 42 8
               C46 6, 50 4, 50 4
               C50 4, 54 6, 58 8
               C62 10, 66 16, 70 18
               C74 20, 78 16, 82 18
               C90 20, 95 30, 95 35
               L95 80"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.5"
          />
          {/* Inner arch — single smooth arch */}
          <path
            d="M15 80
               L15 40
               C15 25, 30 12, 50 10
               C70 12, 85 25, 85 40
               L85 80"
            fill="none"
            stroke={secondaryColor}
            strokeWidth="0.8"
          />
          {/* Keystone ornament at top */}
          <circle cx="50" cy="6" r="3" fill={primaryColor} fillOpacity="0.5" />
          <circle cx="50" cy="6" r="1.5" fill={secondaryColor} fillOpacity="0.5" />
          {/* Cusp detail dots */}
          <circle cx="18" cy="18" r="1.5" fill={primaryColor} fillOpacity="0.4" />
          <circle cx="30" cy="16" r="1" fill={primaryColor} fillOpacity="0.4" />
          <circle cx="70" cy="16" r="1" fill={primaryColor} fillOpacity="0.4" />
          <circle cx="82" cy="18" r="1.5" fill={primaryColor} fillOpacity="0.4" />
        </pattern>
      </defs>
      <rect width="300" height="80" fill="url(#palace-arch-repeat)" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 4. ElephantMotif — Elegant elephant silhouette (trunk up, auspicious)
// ---------------------------------------------------------------------------

export function ElephantMotif({
  primaryColor = 'var(--c-primary, #4A154B)',
  secondaryColor = 'var(--c-gold, #C5A55A)',
  opacity = 0.08,
  className,
}: PatternProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 80"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Elephant body — side profile facing right, trunk raised */}
      <path
        d={`
          M22 70 L22 52
          C22 44, 24 38, 28 34
          C30 32, 32 30, 32 26
          C32 22, 30 18, 28 16
          C26 14, 24 12, 24 8
          L24 4
          C26 2, 30 2, 32 4
          C34 6, 34 10, 34 12
          L36 10 C38 6, 40 2, 42 0
          C44 0, 44 4, 42 8
          C40 12, 38 14, 38 16
          C42 16, 46 18, 48 22
          C50 26, 52 30, 54 34
          C56 34, 58 34, 60 36
          C62 38, 62 42, 60 44
          C60 46, 58 48, 56 48
          C56 52, 56 56, 56 60
          L56 70
          L50 70 L50 58
          C50 54, 48 52, 46 52
          C42 52, 38 54, 36 56
          L36 70 L30 70
          L30 58 C30 54, 28 52, 26 52
          L22 52
        `}
        fill={primaryColor}
      />
      {/* Eye */}
      <circle cx="32" cy="10" r="1.5" fill={secondaryColor} />
      {/* Ear detail */}
      <path
        d="M36 20 C38 22, 40 26, 38 28 C36 28, 34 26, 34 22Z"
        fill={secondaryColor}
        fillOpacity="0.4"
      />
      {/* Decorative blanket on back */}
      <path
        d="M38 34 C42 32, 50 32, 54 34 L54 42 C50 44, 42 44, 38 42Z"
        fill="none"
        stroke={secondaryColor}
        strokeWidth="1"
      />
      {/* Blanket tassels */}
      <line x1="40" y1="42" x2="40" y2="46" stroke={secondaryColor} strokeWidth="0.8" />
      <line x1="46" y1="42" x2="46" y2="46" stroke={secondaryColor} strokeWidth="0.8" />
      <line x1="52" y1="42" x2="52" y2="46" stroke={secondaryColor} strokeWidth="0.8" />
      {/* Tusk */}
      <path
        d="M28 14 C26 16, 26 18, 28 18"
        fill="none"
        stroke={secondaryColor}
        strokeWidth="1.2"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 5. GoldLeafTexture — Subtle noise/grain simulating gold leaf
// ---------------------------------------------------------------------------

export function GoldLeafTexture({
  primaryColor = 'var(--c-gold, #C5A55A)',
  opacity = 0.04,
  className,
}: PatternProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      className={className}
      style={{ opacity, width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      <defs>
        <filter id="gold-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="4"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            type="saturate"
            values="0"
            in="noise"
            result="mono"
          />
          <feComponentTransfer in="mono" result="adjusted">
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feFlood floodColor={primaryColor} result="color" />
          <feComposite in="color" in2="adjusted" operator="in" />
        </filter>
        <pattern
          id="gold-grain"
          x="0"
          y="0"
          width="200"
          height="200"
          patternUnits="userSpaceOnUse"
        >
          <rect
            width="200"
            height="200"
            filter="url(#gold-noise)"
          />
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#gold-grain)" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 6. RangoliCorner — Quarter-circle rangoli pattern for card corners
// ---------------------------------------------------------------------------

export function RangoliCorner({
  primaryColor = 'var(--c-gold, #C5A55A)',
  secondaryColor = 'var(--c-primary, #4A154B)',
  opacity = 0.15,
  className,
}: PatternProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 60"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Outermost quarter arc */}
      <path
        d="M0 60 A60 60 0 0 1 60 0"
        fill="none"
        stroke={primaryColor}
        strokeWidth="1"
      />
      {/* Second arc */}
      <path
        d="M0 48 A48 48 0 0 1 48 0"
        fill="none"
        stroke={secondaryColor}
        strokeWidth="0.8"
      />
      {/* Third arc */}
      <path
        d="M0 36 A36 36 0 0 1 36 0"
        fill="none"
        stroke={primaryColor}
        strokeWidth="1"
      />
      {/* Fourth arc */}
      <path
        d="M0 24 A24 24 0 0 1 24 0"
        fill="none"
        stroke={secondaryColor}
        strokeWidth="0.8"
      />
      {/* Inner arc */}
      <path
        d="M0 12 A12 12 0 0 1 12 0"
        fill="none"
        stroke={primaryColor}
        strokeWidth="1"
      />
      {/* Petal shapes between arcs — radiating from origin */}
      {/* Petal at 15 degrees */}
      <path
        d="M14 52 C16 48, 18 46, 16 42 C14 46, 12 48, 14 52Z"
        fill={primaryColor}
        fillOpacity="0.4"
      />
      {/* Petal at 30 degrees */}
      <path
        d="M26 46 C28 42, 30 40, 28 36 C26 40, 24 42, 26 46Z"
        fill={secondaryColor}
        fillOpacity="0.3"
      />
      {/* Petal at 45 degrees */}
      <path
        d="M36 38 C38 34, 40 32, 38 28 C36 32, 34 34, 36 38Z"
        fill={primaryColor}
        fillOpacity="0.4"
      />
      {/* Petal at 60 degrees */}
      <path
        d="M44 28 C46 24, 46 22, 44 18 C42 22, 42 24, 44 28Z"
        fill={secondaryColor}
        fillOpacity="0.3"
      />
      {/* Petal at 75 degrees */}
      <path
        d="M50 16 C52 12, 52 10, 50 6 C48 10, 48 12, 50 16Z"
        fill={primaryColor}
        fillOpacity="0.4"
      />
      {/* Dots at intersections */}
      <circle cx="10" cy="46" r="1.5" fill={primaryColor} fillOpacity="0.5" />
      <circle cx="20" cy="38" r="1.5" fill={secondaryColor} fillOpacity="0.4" />
      <circle cx="28" cy="28" r="1.5" fill={primaryColor} fillOpacity="0.5" />
      <circle cx="38" cy="20" r="1.5" fill={secondaryColor} fillOpacity="0.4" />
      <circle cx="46" cy="10" r="1.5" fill={primaryColor} fillOpacity="0.5" />
      {/* Center dot */}
      <circle cx="4" cy="4" r="2.5" fill={primaryColor} fillOpacity="0.6" />
    </svg>
  );
}

export default {
  PaisleyPattern,
  LotusPattern,
  PalaceArchBorder,
  ElephantMotif,
  GoldLeafTexture,
  RangoliCorner,
};
