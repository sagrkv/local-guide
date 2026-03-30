'use client';

import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useId,
  useMemo,
} from 'react';
import { wobbleRect } from './wobble';

interface PaperButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  seed?: number;
}

/** Button with a hand-drawn SVG border. */
export function PaperButton({
  children,
  variant = 'primary',
  seed = 0,
  className,
  ...rest
}: PaperButtonProps) {
  const uid = useId();

  const wobblePath = useMemo(
    () => wobbleRect(1, 1, 198, 38, seed, 1.2),
    [seed],
  );

  if (variant === 'ghost') {
    return (
      <button
        className={[
          'relative px-3 py-2 font-medium transition-all duration-200',
          'hover:underline underline-offset-4 decoration-1',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          className ?? '',
        ].join(' ')}
        style={{
          color: 'var(--c-primary, #92400E)',
          outlineColor: 'var(--c-primary, #92400E)',
        }}
        {...rest}
      >
        {children}
      </button>
    );
  }

  const isPrimary = variant === 'primary';

  return (
    <button
      className={[
        'relative px-5 py-2.5 font-medium transition-all duration-200',
        'hover:-translate-y-0.5 active:translate-y-0',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        className ?? '',
      ].join(' ')}
      style={{
        backgroundColor: isPrimary
          ? 'var(--c-primary, #92400E)'
          : 'transparent',
        color: isPrimary
          ? 'var(--c-text-on-primary, #FFFFFF)'
          : 'var(--c-primary, #92400E)',
        outlineColor: 'var(--c-primary, #92400E)',
      }}
      {...rest}
    >
      {/* Hand-drawn border overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 200 40"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <path
          d={wobblePath}
          stroke={
            isPrimary
              ? 'var(--c-deep, #451A03)'
              : 'var(--c-primary, #92400E)'
          }
          strokeWidth="1.4"
          fill="none"
          key={uid}
        />
      </svg>

      {/* Label */}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export default PaperButton;
