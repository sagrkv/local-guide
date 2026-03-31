'use client';

import React from 'react';
import Link from 'next/link';
import { Instagram, Globe } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  website?: string;
}

export interface CuratorCardProps {
  /** Curator user ID */
  curatorId: string;
  /** Display name (falls back to name) */
  displayName?: string | null;
  /** Full name */
  name: string;
  /** Short bio */
  bio?: string | null;
  /** Avatar URL (falls back to imageUrl) */
  avatarUrl?: string | null;
  /** General profile image */
  imageUrl?: string | null;
  /** City where the curator is based */
  baseCity?: string | null;
  /** Number of POIs curated */
  poiCount?: number;
  /** Social links */
  socialLinks?: SocialLinks | null;
  /** Year they started curating */
  curatorSinceYear?: number | null;
  /** City slug — for linking to full profile */
  citySlug: string;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    padding: '24px',
    backgroundColor: 'var(--pm-surface, #FFF9F0)',
    border: '1px solid var(--pm-muted, #E8D5B7)',
    borderRadius: '12px',
    maxWidth: '400px',
    transition: 'border-color 0.2s ease',
  } as React.CSSProperties,
  cardHover: {
    borderColor: 'var(--pm-accent, #C4663A)',
  } as React.CSSProperties,
  topRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  } as React.CSSProperties,
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    flexShrink: 0,
    border: '2px solid var(--pm-muted, #E8D5B7)',
  } as React.CSSProperties,
  avatarFallback: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--pm-surface, #F5E6D3)',
    color: 'var(--pm-accent, #C4663A)',
    fontSize: '22px',
    fontWeight: 700,
    fontFamily: "var(--pm-font-body, 'DM Sans', sans-serif)",
    border: '2px solid var(--pm-muted, #E8D5B7)',
  } as React.CSSProperties,
  info: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    flex: 1,
    minWidth: 0,
  } as React.CSSProperties,
  curatorName: {
    fontSize: '18px',
    fontWeight: 700,
    fontFamily: "var(--pm-font-body, 'DM Sans', sans-serif)",
    color: 'var(--pm-ink, #2D2926)',
    lineHeight: 1.3,
    margin: 0,
  } as React.CSSProperties,
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  metaItem: {
    fontSize: '13px',
    fontFamily: "var(--pm-font-body, 'DM Sans', sans-serif)",
    color: 'var(--pm-muted, #8B7355)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  } as React.CSSProperties,
  metaDot: {
    width: '3px',
    height: '3px',
    borderRadius: '50%',
    backgroundColor: 'var(--pm-muted, #D4C4A8)',
    flexShrink: 0,
  } as React.CSSProperties,
  bio: {
    fontSize: '14px',
    fontFamily: "var(--pm-font-body, 'DM Sans', sans-serif)",
    color: 'var(--pm-ink, #5C4F3D)',
    lineHeight: 1.6,
    margin: 0,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  } as React.CSSProperties,
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    borderTop: '1px solid var(--pm-muted, #E8D5B7)',
    paddingTop: '12px',
  } as React.CSSProperties,
  poiStat: {
    fontSize: '13px',
    fontFamily: "var(--pm-font-display, 'Kalam', cursive)",
    color: 'var(--pm-accent, #C4663A)',
    fontWeight: 700,
  } as React.CSSProperties,
  socialRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
  socialLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'var(--pm-surface, #F5E6D3)',
    color: 'var(--pm-muted, #8B7355)',
    textDecoration: 'none',
    transition: 'background-color 0.2s ease, color 0.2s ease',
  } as React.CSSProperties,
  profileLink: {
    display: 'inline-block',
    fontSize: '13px',
    fontFamily: "var(--pm-font-body, 'DM Sans', sans-serif)",
    fontWeight: 600,
    color: 'var(--pm-accent, #C4663A)',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
  } as React.CSSProperties,
} as const;

// ---------------------------------------------------------------------------
// Social icons (inline SVG)
// ---------------------------------------------------------------------------

function TwitterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CuratorCard({
  curatorId,
  displayName,
  name,
  bio,
  avatarUrl,
  imageUrl,
  baseCity,
  poiCount,
  socialLinks,
  curatorSinceYear,
  citySlug,
}: CuratorCardProps) {
  const resolvedName = displayName || name;
  const resolvedAvatar = avatarUrl || imageUrl;
  const initials = resolvedName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const [hovered, setHovered] = React.useState(false);

  const hasSocials =
    socialLinks &&
    (socialLinks.instagram || socialLinks.twitter || socialLinks.website);

  return (
    <div
      style={{
        ...styles.card,
        ...(hovered ? styles.cardHover : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row: avatar + info */}
      <div style={styles.topRow}>
        {resolvedAvatar ? (
          <img src={resolvedAvatar} alt={resolvedName} style={styles.avatar} />
        ) : (
          <span style={styles.avatarFallback}>{initials}</span>
        )}
        <div style={styles.info}>
          <h3 style={styles.curatorName}>{resolvedName}</h3>
          <div style={styles.metaRow}>
            {baseCity && <span style={styles.metaItem}>{baseCity}</span>}
            {baseCity && curatorSinceYear && <span style={styles.metaDot} />}
            {curatorSinceYear && (
              <span style={styles.metaItem}>
                Local since {curatorSinceYear}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {bio && <p style={styles.bio}>{bio}</p>}

      {/* Footer: POI count + socials + profile link */}
      <div style={styles.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {typeof poiCount === 'number' && poiCount > 0 && (
            <span style={styles.poiStat}>
              {poiCount} place{poiCount !== 1 ? 's' : ''} curated
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hasSocials && (
            <div style={styles.socialRow}>
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.socialLink}
                  aria-label="Instagram"
                >
                  <Instagram size={14} strokeWidth={1.8} />
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.socialLink}
                  aria-label="Twitter"
                >
                  <TwitterIcon />
                </a>
              )}
              {socialLinks.website && (
                <a
                  href={socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.socialLink}
                  aria-label="Website"
                >
                  <Globe size={14} strokeWidth={1.8} />
                </a>
              )}
            </div>
          )}
          <Link href={`/explore/${citySlug}/curator`} style={styles.profileLink}>
            View profile
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CuratorCard;
