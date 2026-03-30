'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, type PanInfo, type Variants } from 'framer-motion';
import { X, Navigation, ArrowRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface POI {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  localTip?: string;
  latitude: number;
  longitude: number;
  priority: string;
  category?: { name: string; emoji?: string };
  photos?: Array<{ url: string }>;
}

export interface SurpriseMeProps {
  pois: POI[];
  citySlug: string;
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Priority weights for random selection
// ---------------------------------------------------------------------------

const PRIORITY_WEIGHTS: Record<string, number> = {
  MUST_VISIT: 3,
  HIDDEN_GEM: 3,
  RECOMMENDED: 1,
  OPTIONAL: 0.5,
};

// ---------------------------------------------------------------------------
// Weighted random pick (immutable — never mutates the input array)
// ---------------------------------------------------------------------------

function pickWeightedRandom(pois: POI[], excludeIds: Set<string>): POI | null {
  const available = pois.filter((p) => !excludeIds.has(p.id));
  if (available.length === 0) return null;

  const weights = available.map((p) => PRIORITY_WEIGHTS[p.priority] ?? 1);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * totalWeight;

  for (let i = 0; i < available.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return available[i];
  }

  return available[available.length - 1];
}

// ---------------------------------------------------------------------------
// Google Maps directions URL
// ---------------------------------------------------------------------------

function getDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const cardVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    rotate: direction > 0 ? 3 : -3,
  }),
  center: {
    x: 0,
    opacity: 1,
    rotate: 0,
    transition: { type: 'spring', stiffness: 300, damping: 28 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    rotate: direction > 0 ? -3 : 3,
    transition: { duration: 0.25 },
  }),
};

const containerSlideUp: Variants = {
  hidden: { y: '100%', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 260, damping: 28, delay: 0.05 },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.25, ease: 'easeIn' },
  },
};

// ---------------------------------------------------------------------------
// Swipe threshold
// ---------------------------------------------------------------------------

const SWIPE_THRESHOLD = 60;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SurpriseMe({ pois, citySlug, isOpen, onClose }: SurpriseMeProps) {
  const [shownIds, setShownIds] = useState<Set<string>>(new Set());
  const [currentPoi, setCurrentPoi] = useState<POI | null>(null);
  const [direction, setDirection] = useState(1);
  const [cardKey, setCardKey] = useState(0);
  const previousPois = useRef<POI[]>([]);

  // Memoize to avoid recalculating on every render
  const poisList = useMemo(() => pois, [pois]);

  // Pick initial POI when overlay opens
  useEffect(() => {
    if (isOpen && poisList.length > 0) {
      let exclude = shownIds;
      // Reset if all shown
      if (exclude.size >= poisList.length) {
        exclude = new Set();
        setShownIds(new Set());
      }
      const picked = pickWeightedRandom(poisList, exclude);
      if (picked) {
        setCurrentPoi(picked);
        setShownIds((prev) => new Set([...prev, picked.id]));
        setDirection(1);
        setCardKey((k) => k + 1);
      }
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = useCallback(() => {
    let exclude = shownIds;
    if (exclude.size >= poisList.length) {
      exclude = new Set();
      setShownIds(new Set());
    }
    const picked = pickWeightedRandom(poisList, exclude);
    if (picked) {
      if (currentPoi) {
        previousPois.current = [...previousPois.current, currentPoi];
      }
      setDirection(1);
      setCurrentPoi(picked);
      setShownIds((prev) => new Set([...prev, picked.id]));
      setCardKey((k) => k + 1);
    }
  }, [poisList, shownIds, currentPoi]);

  const handlePrevious = useCallback(() => {
    if (previousPois.current.length === 0) return;
    const prev = previousPois.current[previousPois.current.length - 1];
    previousPois.current = previousPois.current.slice(0, -1);
    setDirection(-1);
    setCurrentPoi(prev);
    setCardKey((k) => k + 1);
  }, []);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x < -SWIPE_THRESHOLD) {
        handleNext();
      } else if (info.offset.x > SWIPE_THRESHOLD) {
        handlePrevious();
      }
    },
    [handleNext, handlePrevious],
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!currentPoi && !isOpen) return null;

  const photo = currentPoi?.photos?.[0]?.url;
  const directionsUrl = currentPoi
    ? getDirectionsUrl(currentPoi.latitude, currentPoi.longitude)
    : '#';

  return (
    <AnimatePresence mode="wait">
      {isOpen && currentPoi && (
        <motion.div
          key="surprise-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(26, 26, 26, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 10,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#FAFAF5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'rgba(255, 255, 255, 0.15)';
            }}
          >
            <X size={20} strokeWidth={2} />
          </button>

          {/* Slide-up container */}
          <motion.div
            variants={containerSlideUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              width: '100%',
              maxWidth: '420px',
              maxHeight: 'calc(100dvh - 32px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Swipeable card area */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={cardKey}
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={handleDragEnd}
                style={{
                  backgroundColor: 'var(--pm-paper, #FAFAF5)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1.5px solid var(--pm-accent, #D4A574)',
                  boxShadow:
                    '0 12px 32px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'grab',
                  touchAction: 'pan-y',
                  maxHeight: 'calc(100dvh - 48px)',
                  overflowY: 'auto',
                }}
              >
                {/* Photo */}
                {photo && (
                  <div
                    style={{
                      width: '100%',
                      height: '220px',
                      overflow: 'hidden',
                      position: 'relative',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={photo}
                      alt={currentPoi.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'var(--pm-photo-filter, none)',
                      }}
                      draggable={false}
                    />
                    {/* Gradient fade at bottom of photo */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '60px',
                        background:
                          'linear-gradient(transparent, var(--pm-paper, #FAFAF5))',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div
                  style={{
                    padding: photo ? '8px 24px 24px' : '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  {/* Category badge */}
                  {currentPoi.category && (
                    <span
                      style={{
                        alignSelf: 'flex-start',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--pm-surface, #FAFAF8)',
                        border: '1px solid var(--pm-accent, #D4A574)',
                        fontFamily: 'var(--pm-font-body, "DM Sans", sans-serif)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'var(--pm-primary, #1E3A5F)',
                        letterSpacing: '0.03em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {currentPoi.category.emoji && (
                        <span style={{ fontSize: '14px' }}>
                          {currentPoi.category.emoji}
                        </span>
                      )}
                      {currentPoi.category.name}
                    </span>
                  )}

                  {/* POI name */}
                  <h2
                    style={{
                      margin: 0,
                      fontFamily:
                        'var(--pm-font-display, "Space Grotesk", sans-serif)',
                      fontSize: '28px',
                      fontWeight: 700,
                      color: 'var(--pm-ink, #1A1A1A)',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.15,
                    }}
                  >
                    {currentPoi.name}
                  </h2>

                  {/* Short description */}
                  {currentPoi.shortDescription && (
                    <p
                      style={{
                        margin: 0,
                        fontFamily:
                          'var(--pm-font-body, "DM Sans", sans-serif)',
                        fontSize: '15px',
                        color: 'var(--pm-muted, #9CA3AF)',
                        lineHeight: 1.55,
                      }}
                    >
                      {currentPoi.shortDescription}
                    </p>
                  )}

                  {/* Local tip */}
                  {currentPoi.localTip && (
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--pm-surface, #FAFAF8)',
                        borderLeft:
                          '3px solid var(--pm-accent, #D4A574)',
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontFamily:
                            'var(--pm-font-body, "DM Sans", sans-serif)',
                          fontSize: '14px',
                          fontStyle: 'italic',
                          color: 'var(--pm-ink, #1A1A1A)',
                          lineHeight: 1.6,
                        }}
                      >
                        &ldquo;{currentPoi.localTip}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      paddingTop: '4px',
                    }}
                  >
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--pm-primary, #1E3A5F)',
                        color: 'var(--pm-paper, #FAFAF5)',
                        border: 'none',
                        fontFamily:
                          'var(--pm-font-body, "DM Sans", sans-serif)',
                        fontSize: '15px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'opacity 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.opacity =
                          '0.88';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.opacity =
                          '1';
                      }}
                    >
                      <Navigation size={16} strokeWidth={2} />
                      Take Me There
                    </a>
                    <button
                      onClick={handleNext}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '14px 16px',
                        borderRadius: '10px',
                        backgroundColor: 'transparent',
                        color: 'var(--pm-ink, #1A1A1A)',
                        border:
                          '1.5px solid var(--pm-accent, #D4A574)',
                        fontFamily:
                          'var(--pm-font-body, "DM Sans", sans-serif)',
                        fontSize: '15px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition:
                          'background-color 0.15s ease, border-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement;
                        btn.style.backgroundColor =
                          'var(--pm-surface, #FAFAF8)';
                      }}
                      onMouseLeave={(e) => {
                        const btn = e.currentTarget as HTMLButtonElement;
                        btn.style.backgroundColor = 'transparent';
                      }}
                    >
                      Another One
                      <ArrowRight size={16} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default SurpriseMe;
