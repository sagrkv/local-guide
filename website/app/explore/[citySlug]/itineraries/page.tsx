"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCity } from "@/lib/city-context";
import { LAYOUT, SPACING, GRID, CARD, TYPOGRAPHY, ANIMATION } from "@/lib/layout-constants";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

interface Itinerary {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  durationMinutes?: number;
  difficulty?: string;
  stopCount?: number;
  _count?: { stops: number };
}

function formatDuration(minutes?: number): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default function ItinerariesListPage() {
  const { city, loading: cityLoading, error: cityError } = useCity();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city?.id) return;
    setLoading(true);
    fetch(`${API_BASE}/cities/${city.id}/itineraries`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setItineraries(
          Array.isArray(data) ? data : data.itineraries || data.data || [],
        );
      })
      .catch(() => setItineraries([]))
      .finally(() => setLoading(false));
  }, [city?.id]);

  if (cityLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--c-bg)]">
        <div className="w-8 h-8 border-2 border-[var(--c-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (cityError || !city) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--c-bg)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--c-text)] mb-2">City not found</h1>
          <Link href="/" className="text-[var(--c-primary)] hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = "var(--c-primary)";

  return (
    <div className="min-h-screen bg-[var(--c-bg)]">
      {/* Header */}
      <div className={`${SPACING.headerPadding} px-6`}>
        <div className={LAYOUT.container}>
          <Link
            href={`/explore/${city.slug}`}
            className="inline-flex items-center gap-2 text-sm text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {city.name}
          </Link>
          <h1
            className={`${TYPOGRAPHY.h1} text-[var(--c-text)] mb-2`}
            style={{ fontFamily: "var(--c-font-display)" }}
          >
            Itineraries
          </h1>
          <p className="text-[var(--c-text-muted)]">
            Curated routes through {city.name}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className={`${LAYOUT.container} ${SPACING.contentBottom}`}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[var(--c-border)] border-t-[var(--c-primary)] rounded-full animate-spin" />
          </div>
        ) : itineraries.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--c-text-muted)]">
              No itineraries available for {city.name} yet.
            </p>
          </div>
        ) : (
          <div className={GRID.cards}>
            {itineraries.map((itin, i) => {
              const stops = itin.stopCount || itin._count?.stops || 0;
              return (
                <motion.div
                  key={itin.id}
                  {...ANIMATION.fadeInUp}
                  transition={{ ...ANIMATION.entryTransition, delay: i * ANIMATION.staggerDelay }}
                >
                  <Link href={`/explore/${city.slug}/itinerary/${itin.slug}`}>
                    <div className={`group ${CARD.base} ${CARD.hover}`}>
                      <div className={`relative ${CARD.imageHeight} overflow-hidden`}>
                        {itin.coverImageUrl ? (
                          <img
                            src={itin.coverImageUrl}
                            alt={itin.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-4xl"
                            style={{
                              background: `linear-gradient(135deg, ${primaryColor}25, var(--c-border))`,
                            }}
                          >
                            ⚡
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--c-surface)] via-transparent to-transparent opacity-60" />
                      </div>
                      <div className={CARD.padding}>
                        <h3 className={`${TYPOGRAPHY.h3} text-[var(--c-text)] mb-2 line-clamp-2`}>
                          {itin.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-[var(--c-text-muted)]">
                          {itin.durationMinutes && (
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDuration(itin.durationMinutes)}
                            </span>
                          )}
                          {stops > 0 && (
                            <span>{stops} stops</span>
                          )}
                          {itin.difficulty && (
                            <span>{itin.difficulty}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
