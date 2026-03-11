'use client';

import React, { type ReactNode } from 'react';
import { motion } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CardVariant = 'palace' | 'simple' | 'frame' | 'leaf';

interface DecorativeCardProps {
  variant?: CardVariant;
  children: ReactNode;
  className?: string;
  /** Disable the hover glow animation. */
  disableHover?: boolean;
}

// ---------------------------------------------------------------------------
// SVG corner ornament for the "frame" variant
// ---------------------------------------------------------------------------

function CornerOrnament({
  position,
}: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  const rotationMap: Record<string, string> = {
    'top-left': 'rotate(0)',
    'top-right': 'rotate(90)',
    'bottom-right': 'rotate(180)',
    'bottom-left': 'rotate(270)',
  };

  const positionClasses: Record<string, string> = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      className={`absolute w-8 h-8 pointer-events-none ${positionClasses[position]}`}
      style={{ opacity: 0.25 }}
      aria-hidden="true"
    >
      <g transform={`${rotationMap[position]} translate(${position.includes('right') ? -40 : 0}, ${position.includes('bottom') ? -40 : 0})`} transform-origin="20 20">
        {/* Concentric quarter arcs */}
        <path
          d="M0 40 A40 40 0 0 1 40 0"
          fill="none"
          stroke="var(--c-gold, #C5A55A)"
          strokeWidth="1"
        />
        <path
          d="M0 30 A30 30 0 0 1 30 0"
          fill="none"
          stroke="var(--c-primary, #4A154B)"
          strokeWidth="0.7"
        />
        <path
          d="M0 20 A20 20 0 0 1 20 0"
          fill="none"
          stroke="var(--c-gold, #C5A55A)"
          strokeWidth="0.8"
        />
        {/* Petal detail */}
        <path
          d="M8 28 C10 24, 14 22, 14 28 C14 22, 18 24, 20 28"
          fill="none"
          stroke="var(--c-gold, #C5A55A)"
          strokeWidth="0.6"
          opacity="0.6"
        />
        {/* Center dot */}
        <circle cx="4" cy="4" r="2" fill="var(--c-gold, #C5A55A)" opacity="0.5" />
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Palace arch SVG for the "palace" variant (top of card)
// ---------------------------------------------------------------------------

function PalaceArchTop() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 40"
      preserveAspectRatio="none"
      className="w-full h-8 absolute top-0 left-0 pointer-events-none"
      style={{ opacity: 0.2 }}
      aria-hidden="true"
    >
      {/* Cusped arch silhouette */}
      <path
        d="M0 40
           L0 20
           C0 15, 20 8, 50 6
           C65 5, 80 10, 100 6
           C115 4, 130 2, 150 0
           C170 2, 185 4, 200 6
           C220 10, 235 5, 250 6
           C280 8, 300 15, 300 20
           L300 40Z"
        fill="var(--c-primary, #4A154B)"
        opacity="0.08"
      />
      {/* Arch outline */}
      <path
        d="M0 20
           C0 15, 20 8, 50 6
           C65 5, 80 10, 100 6
           C115 4, 130 2, 150 0
           C170 2, 185 4, 200 6
           C220 10, 235 5, 250 6
           C280 8, 300 15, 300 20"
        fill="none"
        stroke="var(--c-gold, #C5A55A)"
        strokeWidth="1.5"
      />
      {/* Keystone dot */}
      <circle cx="150" cy="2" r="3" fill="var(--c-gold, #C5A55A)" opacity="0.5" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Leaf vine border for the "leaf" variant
// ---------------------------------------------------------------------------

function LeafVineBorder() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* Top edge */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 16"
        preserveAspectRatio="none"
        className="absolute top-0 left-0 w-full h-3"
        style={{ opacity: 0.18 }}
      >
        <defs>
          <pattern
            id="leaf-vine-h"
            x="0"
            y="0"
            width="40"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            {/* Vine stem */}
            <path
              d="M0 8 C10 4, 20 12, 30 8 C35 6, 40 8, 40 8"
              fill="none"
              stroke="var(--c-accent, #2D5016)"
              strokeWidth="1"
            />
            {/* Leaf */}
            <path
              d="M18 6 C16 2, 20 0, 22 4 C24 0, 28 2, 26 6Z"
              fill="var(--c-accent, #2D5016)"
              fillOpacity="0.5"
            />
          </pattern>
        </defs>
        <rect width="400" height="16" fill="url(#leaf-vine-h)" />
      </svg>

      {/* Bottom edge */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 400 16"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-3"
        style={{ opacity: 0.18, transform: 'scaleY(-1)' }}
      >
        <rect width="400" height="16" fill="url(#leaf-vine-h)" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DecorativeCard({
  variant = 'simple',
  children,
  className,
  disableHover = false,
}: DecorativeCardProps) {
  const baseClasses = `
    relative overflow-hidden rounded-lg
    transition-shadow duration-300
  `;

  const variantStyles: Record<CardVariant, string> = {
    palace: 'pt-10 pb-6 px-6',
    simple: 'p-6',
    frame: 'p-8',
    leaf: 'p-6',
  };

  const hoverAnimation = disableHover
    ? {}
    : {
        whileHover: {
          boxShadow: '0 0 24px 2px var(--c-gold, rgba(197,165,90,0.2))',
        },
      };

  return (
    <motion.div
      className={`${baseClasses} ${variantStyles[variant]} ${className ?? ''}`}
      style={{
        backgroundColor: 'var(--c-surface, #FFFFFF)',
        border:
          variant === 'simple'
            ? '1px solid var(--c-gold, #C5A55A)'
            : '1px solid var(--c-border, #E8D5B7)',
      }}
      {...hoverAnimation}
      transition={{ duration: 0.25 }}
    >
      {/* Variant-specific decorations */}
      {variant === 'palace' && <PalaceArchTop />}

      {variant === 'frame' && (
        <>
          <CornerOrnament position="top-left" />
          <CornerOrnament position="top-right" />
          <CornerOrnament position="bottom-left" />
          <CornerOrnament position="bottom-right" />
        </>
      )}

      {variant === 'leaf' && <LeafVineBorder />}

      {/* Card content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export default DecorativeCard;
