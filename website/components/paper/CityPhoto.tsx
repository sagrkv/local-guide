'use client';

import Image from 'next/image';

// ---------------------------------------------------------------------------
// Filter Presets
// ---------------------------------------------------------------------------

export const PHOTO_FILTER_PRESETS: Record<string, { label: string; css: string }> = {
  warm_golden: { label: 'Warm Golden', css: 'saturate(0.9) sepia(0.1) brightness(1.05)' },
  vivid_tropical: { label: 'Vivid Tropical', css: 'saturate(1.2) contrast(1.05)' },
  vintage_rose: { label: 'Vintage Rose', css: 'saturate(0.85) sepia(0.15) hue-rotate(-5deg)' },
  cool_heritage: { label: 'Cool Heritage', css: 'saturate(0.95) brightness(1.02)' },
  monsoon_mist: { label: 'Monsoon Mist', css: 'saturate(0.8) brightness(0.95) contrast(1.1)' },
  natural: { label: 'Natural', css: 'none' },
};

/** Look up a preset key and return its CSS filter string, or 'none'. */
export function getPhotoFilterCSS(presetKey: string): string {
  return PHOTO_FILTER_PRESETS[presetKey]?.css ?? 'none';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CityPhotoProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
}

export function CityPhoto({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
}: CityPhotoProps) {
  // Read the photo filter from the CSS variable set by ThemeProvider.
  // At render time we use a CSS var reference so it stays reactive to theme changes.
  const filterStyle = 'var(--pm-photo-filter, none)';

  return (
    <div className={`overflow-hidden ${className ?? ''}`}>
      <Image
        src={src}
        alt={alt}
        {...(fill ? { fill: true } : { width, height })}
        priority={priority}
        style={{ filter: filterStyle, width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}
