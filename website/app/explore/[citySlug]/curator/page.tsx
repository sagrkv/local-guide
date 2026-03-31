'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Instagram, Globe, ArrowLeft, MapPin } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  website?: string;
}

interface CuratorCity {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  heroImageUrl?: string;
  country?: string;
  state?: string;
}

interface CuratorProfile {
  id: string;
  displayName?: string | null;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  imageUrl?: string | null;
  baseCity?: string | null;
  curatorSince?: string | null;
  isPublicCurator: boolean;
  socialLinks?: SocialLinks | null;
  curatedCities?: CuratorCity[];
  poiCount?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: 'var(--pm-surface, #FFF9F0)',
    fontFamily: "'DM Sans', sans-serif",
  } as React.CSSProperties,
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '48px 24px 80px',
  } as React.CSSProperties,
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    fontFamily: "'DM Sans', sans-serif",
    color: 'var(--pm-muted, #8B7D6B)',
    textDecoration: 'none',
    marginBottom: '32px',
    transition: 'color 0.2s ease',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    gap: '16px',
    marginBottom: '40px',
  } as React.CSSProperties,
  avatar: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    border: '3px solid #E8D5B7',
  } as React.CSSProperties,
  avatarFallback: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5E6D3',
    color: 'var(--pm-accent, #C4663A)',
    fontSize: '32px',
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    border: '3px solid #E8D5B7',
  } as React.CSSProperties,
  curatedByLabel: {
    fontSize: '16px',
    fontFamily: "'Kalam', cursive",
    color: 'var(--pm-accent, #C4663A)',
    transform: 'rotate(-1deg)',
    display: 'inline-block',
  } as React.CSSProperties,
  curatorName: {
    fontSize: '28px',
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    color: 'var(--pm-ink, #2D2926)',
    lineHeight: 1.2,
    margin: 0,
  } as React.CSSProperties,
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  metaItem: {
    fontSize: '14px',
    fontFamily: "'DM Sans', sans-serif",
    color: 'var(--pm-muted, #8B7D6B)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  } as React.CSSProperties,
  metaDot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: '#D4C4A8',
  } as React.CSSProperties,
  bio: {
    fontSize: '16px',
    fontFamily: "'DM Sans', sans-serif",
    color: '#5C4F3D',
    lineHeight: 1.7,
    textAlign: 'center' as const,
    maxWidth: '560px',
    margin: '0 auto 8px',
  } as React.CSSProperties,
  socialRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '8px',
  } as React.CSSProperties,
  socialLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#F5E6D3',
    color: 'var(--pm-muted, #8B7D6B)',
    textDecoration: 'none',
    transition: 'background-color 0.2s ease, color 0.2s ease',
  } as React.CSSProperties,
  divider: {
    border: 'none',
    borderTop: '1px solid #E8D5B7',
    margin: '40px 0',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '14px',
    fontFamily: "'Kalam', cursive",
    color: 'var(--pm-accent, #C4663A)',
    letterSpacing: '0.04em',
    marginBottom: '20px',
    transform: 'rotate(-0.5deg)',
    display: 'inline-block',
  } as React.CSSProperties,
  cityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  } as React.CSSProperties,
  cityCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    border: '1px solid #E8D5B7',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    textDecoration: 'none',
    transition: 'border-color 0.2s ease, transform 0.2s ease',
  } as React.CSSProperties,
  cityCardHover: {
    borderColor: 'var(--pm-accent, #C4663A)',
    transform: 'translateY(-2px)',
  } as React.CSSProperties,
  cityCardImage: {
    width: '100%',
    height: '140px',
    objectFit: 'cover' as const,
    backgroundColor: '#F5E6D3',
  } as React.CSSProperties,
  cityCardImagePlaceholder: {
    width: '100%',
    height: '140px',
    backgroundColor: '#F5E6D3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--pm-accent, #C4663A)',
    fontFamily: "'Kalam', cursive",
    fontSize: '20px',
  } as React.CSSProperties,
  cityCardBody: {
    padding: '16px 20px',
  } as React.CSSProperties,
  cityCardName: {
    fontSize: '16px',
    fontWeight: 700,
    fontFamily: "'DM Sans', sans-serif",
    color: 'var(--pm-ink, #2D2926)',
    margin: '0 0 4px',
  } as React.CSSProperties,
  cityCardTagline: {
    fontSize: '13px',
    fontFamily: "'DM Sans', sans-serif",
    color: 'var(--pm-muted, #8B7D6B)',
    margin: 0,
    lineHeight: 1.4,
  } as React.CSSProperties,
  statHighlight: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '999px',
    backgroundColor: '#F5E6D3',
    fontSize: '15px',
    fontFamily: "'Kalam', cursive",
    color: 'var(--pm-accent, #C4663A)',
    fontWeight: 700,
  } as React.CSSProperties,
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    fontSize: '16px',
    fontFamily: "'Kalam', cursive",
    color: 'var(--pm-muted, #8B7D6B)',
  } as React.CSSProperties,
  notFound: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    gap: '16px',
    textAlign: 'center' as const,
  } as React.CSSProperties,
  notFoundTitle: {
    fontSize: '24px',
    fontFamily: "'Kalam', cursive",
    color: 'var(--pm-accent, #C4663A)',
  } as React.CSSProperties,
  notFoundText: {
    fontSize: '15px',
    fontFamily: "'DM Sans', sans-serif",
    color: 'var(--pm-muted, #8B7D6B)',
  } as React.CSSProperties,
} as const;

// ---------------------------------------------------------------------------
// Social icons (inline SVG)
// ---------------------------------------------------------------------------

function TwitterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CuratorProfilePage() {
  const params = useParams();
  const citySlug = params?.citySlug as string;

  const [curator, setCurator] = useState<CuratorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!citySlug) return;

    async function fetchCurator() {
      try {
        const res = await fetch(`${API_BASE}/cities/${citySlug}/curator`);
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const json = await res.json();
        const data = json.data || json;

        // If we have a curator, fetch their full profile to get curated cities
        if (data?.id) {
          try {
            const profileRes = await fetch(`${API_BASE}/curators/${data.id}`);
            if (profileRes.ok) {
              const profileJson = await profileRes.json();
              setCurator(profileJson.data || profileJson);
              setLoading(false);
              return;
            }
          } catch {
            // Fall through to use the city curator data
          }
        }

        setCurator(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchCurator();
  }, [citySlug]);

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loading}>Loading curator profile...</div>
      </div>
    );
  }

  if (notFound || !curator) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <Link href={`/explore/${citySlug}`} style={styles.backLink}>
            <ArrowLeft size={16} strokeWidth={1.8} />
            Back to city
          </Link>
          <div style={styles.notFound}>
            <span style={styles.notFoundTitle}>No curator found</span>
            <span style={styles.notFoundText}>
              This city does not have a public curator profile yet.
            </span>
            <Link href={`/explore/${citySlug}`} style={{ ...styles.backLink, marginBottom: 0 }}>
              Back to {citySlug}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const resolvedName = curator.displayName || curator.name;
  const resolvedAvatar = curator.avatarUrl || curator.imageUrl;
  const initials = resolvedName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const curatorSinceYear = curator.curatorSince
    ? new Date(curator.curatorSince).getFullYear()
    : null;

  const socialLinks = (curator.socialLinks || {}) as SocialLinks;
  const hasSocials =
    socialLinks.instagram || socialLinks.twitter || socialLinks.website;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Back link */}
        <Link href={`/explore/${citySlug}`} style={styles.backLink}>
          <ArrowLeft size={16} strokeWidth={1.8} />
          Back to {citySlug}
        </Link>

        {/* Header */}
        <div style={styles.header}>
          {resolvedAvatar ? (
            <img src={resolvedAvatar} alt={resolvedName} style={styles.avatar} />
          ) : (
            <span style={styles.avatarFallback}>{initials}</span>
          )}

          <span style={styles.curatedByLabel}>Your local curator</span>
          <h1 style={styles.curatorName}>{resolvedName}</h1>

          <div style={styles.metaRow}>
            {curator.baseCity && (
              <span style={styles.metaItem}>
                <MapPin size={14} strokeWidth={1.8} />
                {curator.baseCity}
              </span>
            )}
            {curator.baseCity && curatorSinceYear && (
              <span style={styles.metaDot} />
            )}
            {curatorSinceYear && (
              <span style={styles.metaItem}>
                Local since {curatorSinceYear}
              </span>
            )}
          </div>

          {curator.bio && <p style={styles.bio}>{curator.bio}</p>}

          {typeof curator.poiCount === 'number' && curator.poiCount > 0 && (
            <span style={styles.statHighlight}>
              {curator.poiCount} place{curator.poiCount !== 1 ? 's' : ''} hand-picked
            </span>
          )}

          {/* Social links */}
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
                  <Instagram size={16} strokeWidth={1.8} />
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
                  <Globe size={16} strokeWidth={1.8} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Curated cities section */}
        {curator.curatedCities && curator.curatedCities.length > 0 && (
          <>
            <hr style={styles.divider} />
            <span style={styles.sectionTitle}>
              Cities curated by {resolvedName}
            </span>
            <CityGrid cities={curator.curatedCities} />
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// City grid sub-component
// ---------------------------------------------------------------------------

function CityGrid({ cities }: { cities: CuratorCity[] }) {
  return (
    <div style={styles.cityGrid}>
      {cities.map((city) => (
        <CityCardItem key={city.id} city={city} />
      ))}
    </div>
  );
}

function CityCardItem({ city }: { city: CuratorCity }) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <Link
      href={`/explore/${city.slug}`}
      style={{
        ...styles.cityCard,
        ...(hovered ? styles.cityCardHover : {}),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {city.heroImageUrl ? (
        <img
          src={city.heroImageUrl}
          alt={city.name}
          style={styles.cityCardImage}
        />
      ) : (
        <div style={styles.cityCardImagePlaceholder}>
          {city.name}
        </div>
      )}
      <div style={styles.cityCardBody}>
        <h3 style={styles.cityCardName}>{city.name}</h3>
        {city.tagline && (
          <p style={styles.cityCardTagline}>{city.tagline}</p>
        )}
        {(city.state || city.country) && (
          <p style={{ ...styles.cityCardTagline, fontSize: '12px', marginTop: '4px' }}>
            {[city.state, city.country].filter(Boolean).join(', ')}
          </p>
        )}
      </div>
    </Link>
  );
}
