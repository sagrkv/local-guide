'use client';

import React from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CuratorBadgeProps {
  /** Curator user ID — used to build the profile link */
  curatorId: string;
  /** Display name (falls back to name) */
  displayName?: string | null;
  /** Full name — used when displayName is not set */
  name: string;
  /** Avatar URL (falls back to imageUrl, then to initials) */
  avatarUrl?: string | null;
  /** General profile image */
  imageUrl?: string | null;
  /** Year the curator started curating (derived from curatorSince) */
  curatorSinceYear?: number | null;
  /** City slug — used to build the link to the city's curator page */
  citySlug: string;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  wrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    padding: '6px 12px 6px 6px',
    borderRadius: '999px',
    border: '1px solid var(--pm-muted, #E8D5B7)',
    backgroundColor: 'var(--pm-surface, #FFF9F0)',
    transition: 'border-color 0.2s ease, background-color 0.2s ease',
  } as React.CSSProperties,
  wrapperHover: {
    borderColor: 'var(--pm-accent, #C4663A)',
    backgroundColor: 'var(--pm-surface, #FFF5EB)',
  } as React.CSSProperties,
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    flexShrink: 0,
    border: '1px solid var(--pm-muted, #E8D5B7)',
  } as React.CSSProperties,
  avatarFallback: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--pm-surface, #F5E6D3)',
    color: 'var(--pm-accent, #C4663A)',
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: "var(--pm-font-body, 'DM Sans', sans-serif)",
    border: '1px solid var(--pm-muted, #E8D5B7)',
  } as React.CSSProperties,
  textWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0px',
    lineHeight: 1.2,
  } as React.CSSProperties,
  curatedByLabel: {
    fontSize: '11px',
    fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
    color: 'var(--pm-muted, #8B7355)',
    letterSpacing: '0.02em',
    transform: 'rotate(-0.5deg)',
  } as React.CSSProperties,
  curatorName: {
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: "var(--pm-font-body, 'DM Sans', sans-serif)",
    color: 'var(--pm-ink, #2D2926)',
    lineHeight: 1.2,
  } as React.CSSProperties,
  sinceLabel: {
    fontSize: '10px',
    fontFamily: "var(--pm-font-body, 'DM Sans', sans-serif)",
    color: 'var(--pm-muted, #A89279)',
    marginLeft: '4px',
  } as React.CSSProperties,
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CuratorBadge({
  curatorId,
  displayName,
  name,
  avatarUrl,
  imageUrl,
  curatorSinceYear,
  citySlug,
}: CuratorBadgeProps) {
  const resolvedName = displayName || name;
  const resolvedAvatar = avatarUrl || imageUrl;
  const initials = resolvedName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const [hovered, setHovered] = React.useState(false);

  return (
    <Link
      href={`/explore/${citySlug}/curator`}
      style={{
        ...styles.wrapper,
        ...(hovered ? styles.wrapperHover : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {resolvedAvatar ? (
        <img src={resolvedAvatar} alt={resolvedName} style={styles.avatar} />
      ) : (
        <span style={styles.avatarFallback}>{initials}</span>
      )}
      <span style={styles.textWrap}>
        <span style={styles.curatedByLabel}>Curated by</span>
        <span style={styles.curatorName}>
          {resolvedName}
          {curatorSinceYear && (
            <span style={styles.sinceLabel}>
              Local since {curatorSinceYear}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

export default CuratorBadge;
