'use client';

import { useCulturalTheme } from './CulturalProvider';

interface CityMarkProps {
  size?: number;
  color?: string;
  className?: string;
}

export function CityMark({ size = 32, color, className }: CityMarkProps) {
  const theme = useCulturalTheme();
  const logo = theme.logo;

  if (!logo) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${logo.width} ${logo.height}`}
      fill="none"
      stroke={color || 'var(--c-primary)'}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label={logo.alt}
      role="img"
    >
      <path d={logo.svg} />
    </svg>
  );
}
