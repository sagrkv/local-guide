'use client';

import { type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PaperTextureProps {
  children: ReactNode;
  className?: string;
  /** Show a faint horizontal fold crease across the center. */
  showFold?: boolean;
}

// ---------------------------------------------------------------------------
// Noise texture — base64 SVG for CSS background-image
// ---------------------------------------------------------------------------

/**
 * Tiny SVG noise pattern encoded as a data URI.
 * This creates a subtle paper-grain texture without any external asset.
 * The `<feTurbulence>` filter produces organic noise; we composite it at
 * very low opacity to avoid overwhelming the content.
 */
const NOISE_SVG = `data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="200" height="200" filter="url(#n)" opacity="0.04"/></svg>`) : ''}`;

/**
 * Server-safe fallback: if btoa is unavailable at module-load (edge SSR),
 * we inline the pre-computed base64. This constant is generated from the
 * SVG above and never changes.
 */
const NOISE_DATA_URI =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC43NSIgbnVtT2N0YXZlcz0iNCIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPjxmZUNvbG9yTWF0cml4IHR5cGU9InNhdHVyYXRlIiB2YWx1ZXM9IjAiLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIwLjA0Ii8+PC9zdmc+';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Background wrapper that adds a paper-grain noise texture.
 *
 * Uses a tiling SVG noise pattern via `background-image` and an optional
 * fold-line crease to suggest an old folded map.
 */
export function PaperTexture({
  children,
  className,
  showFold = false,
}: PaperTextureProps) {
  const noiseUrl = NOISE_SVG || NOISE_DATA_URI;

  return (
    <div
      className={`relative ${className ?? ''}`}
      style={{
        backgroundColor: 'var(--c-bg, #FFFBF5)',
        backgroundImage: `url("${noiseUrl}")`,
        backgroundRepeat: 'repeat',
      }}
    >
      {/* Optional fold line — faint horizontal crease */}
      {showFold && (
        <div
          className="absolute left-[8%] right-[8%] pointer-events-none"
          style={{
            top: '50%',
            height: '1px',
            background: `linear-gradient(
              90deg,
              transparent 0%,
              var(--c-border, #E7E5E4) 20%,
              var(--c-border, #E7E5E4) 80%,
              transparent 100%
            )`,
            opacity: 0.25,
          }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default PaperTexture;
