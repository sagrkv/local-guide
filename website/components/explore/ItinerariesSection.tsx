"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Itinerary {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  durationMinutes?: number;
  difficulty?: string;
  stopCount?: number;
  stops?: Array<{ poi?: { name: string } }>;
  _count?: { stops: number };
}

interface ItinerariesSectionProps {
  itineraries: Itinerary[];
  citySlug: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(minutes?: number): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ItinerariesSection({
  itineraries,
  citySlug,
}: ItinerariesSectionProps) {
  if (itineraries.length === 0) return null;

  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{
                fontFamily: "var(--pm-font-display)",
                color: "var(--pm-ink, #1A1A1A)",
                letterSpacing: "-0.02em",
              }}
            >
              Curated Itineraries
            </h2>
            <p
              className="text-base"
              style={{
                fontFamily: "var(--pm-font-body)",
                color: "var(--pm-muted, #9CA3AF)",
              }}
            >
              Follow a local route through the city
            </p>
          </div>
          {itineraries.length > 2 && (
            <Link
              href={`/explore/${citySlug}/itineraries`}
              className="text-sm font-semibold hover:underline hidden sm:flex items-center gap-1"
              style={{
                color: "var(--pm-primary, #1E3A5F)",
                fontFamily: "var(--pm-font-body)",
              }}
            >
              View all
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {itineraries.map((itin, i) => {
            const stops = itin.stopCount || itin._count?.stops || 0;
            const previewStops = (itin.stops || [])
              .slice(0, 4)
              .map((s) => s.poi?.name)
              .filter(Boolean);

            return (
              <motion.div
                key={itin.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link href={`/explore/${citySlug}/itinerary/${itin.slug}`}>
                  <div
                    className="group p-5 md:p-6 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: "var(--pm-surface, #FAFAF8)",
                      border: "1px solid",
                      borderColor:
                        "color-mix(in srgb, var(--pm-accent, #D4A574) 30%, transparent)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div className="flex items-start gap-5">
                      {/* Cover thumbnail */}
                      {itin.coverImageUrl && (
                        <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl overflow-hidden">
                          <img
                            src={itin.coverImageUrl}
                            alt={itin.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-lg font-semibold mb-1.5"
                          style={{
                            fontFamily: "var(--pm-font-display)",
                            color: "var(--pm-ink, #1A1A1A)",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {itin.title}
                        </h3>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          {itin.durationMinutes && (
                            <span
                              className="text-xs font-medium"
                              style={{ color: "var(--pm-muted, #9CA3AF)" }}
                            >
                              {formatDuration(itin.durationMinutes)}
                            </span>
                          )}
                          {stops > 0 && (
                            <span
                              className="text-xs font-medium"
                              style={{ color: "var(--pm-muted, #9CA3AF)" }}
                            >
                              {stops} stops
                            </span>
                          )}
                          {itin.difficulty && (
                            <span
                              className="text-xs font-medium"
                              style={{ color: "var(--pm-muted, #9CA3AF)" }}
                            >
                              {itin.difficulty}
                            </span>
                          )}
                        </div>

                        {/* Route preview */}
                        {previewStops.length > 0 && (
                          <p
                            className="text-sm truncate"
                            style={{
                              color: "var(--pm-primary, #1E3A5F)",
                              fontFamily: "var(--pm-font-body)",
                              opacity: 0.7,
                            }}
                          >
                            {previewStops.join(" \u2192 ")}
                            {stops > previewStops.length && " \u2192 ..."}
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      <svg
                        className="w-5 h-5 shrink-0 mt-1 opacity-0 group-hover:opacity-60 transition-opacity"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="var(--pm-ink, #1A1A1A)"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
