"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCity } from "@/lib/city-context";
import { use } from "react";
import { LAYOUT, SPACING, TYPOGRAPHY } from "@/lib/layout-constants";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

interface ItineraryStop {
  id: string;
  order: number;
  poi?: {
    id: string;
    name: string;
    slug: string;
    primaryPhotoUrl?: string;
    categoryName?: string;
    categoryEmoji?: string;
  };
  poiName?: string;
  timeOfDay?: string;
  durationMinutes?: number;
  note?: string;
  transportMode?: string;
  transportNote?: string;
  transportDurationMinutes?: number;
}

interface ItineraryDetail {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  durationMinutes?: number;
  difficulty?: string;
  budgetEstimate?: string;
  stops: ItineraryStop[];
}

function formatDuration(minutes?: number): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function transportIcon(mode?: string) {
  switch (mode?.toLowerCase()) {
    case "walk":
    case "walking":
      return "\uD83D\uDEB6";
    case "bus":
    case "transit":
      return "\uD83D\uDE8C";
    case "auto":
    case "rickshaw":
      return "\uD83D\uDEFA";
    case "car":
    case "taxi":
    case "cab":
      return "\uD83D\uDE97";
    case "bike":
    case "cycle":
      return "\uD83D\uDEB2";
    case "train":
    case "metro":
      return "\uD83D\uDE86";
    case "boat":
    case "ferry":
      return "\u26F5";
    default:
      return "\u2192";
  }
}

export default function ItineraryViewPage({
  params,
}: {
  params: Promise<{ citySlug: string; slug: string }>;
}) {
  const { citySlug, slug } = use(params);
  const { city, loading: cityLoading } = useCity();

  const [itinerary, setItinerary] = useState<ItineraryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city?.id) return;

    const fetchItinerary = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/cities/${city.id}/itineraries/${slug}`,
        );
        if (!res.ok) {
          throw new Error(
            res.status === 404 ? "Itinerary not found" : "Failed to load",
          );
        }
        const json = await res.json();
        // API wraps response in { data: ... }
        setItinerary(json.data || json);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load itinerary",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [city?.id, slug]);

  if (cityLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--c-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--c-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--c-text-muted)]">Loading itinerary...</p>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--c-bg)]">
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold text-[var(--c-text)] mb-2">
            Itinerary not found
          </h1>
          <p className="text-[var(--c-text-muted)] mb-6">{error}</p>
          <Link
            href={`/explore/${citySlug}/itineraries`}
            className="text-[var(--c-primary)] hover:underline font-medium"
          >
            Back to itineraries
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = city?.theme?.colorPrimary || "var(--c-primary)";
  const sortedStops = [...(itinerary.stops || [])].sort(
    (a, b) => a.order - b.order,
  );

  // Get first stop with lat/lng for "Start Itinerary" button
  const firstPoi = sortedStops[0]?.poi;

  return (
    <div className="min-h-screen bg-[var(--c-bg)]">
      {/* Cover */}
      <div className="relative">
        {itinerary.coverImageUrl ? (
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img
              src={itinerary.coverImageUrl}
              alt={itinerary.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--c-bg)] via-[var(--c-bg)]/40 to-transparent" />
          </div>
        ) : (
          <div
            className="h-48 md:h-64"
            style={{
              background: `linear-gradient(160deg, ${primaryColor}25, var(--c-bg), ${primaryColor}10)`,
            }}
          />
        )}

        {/* Back nav */}
        <div className="absolute top-4 left-4 z-10">
          <Link
            href={`/explore/${citySlug}/itineraries`}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-[var(--c-text)]/90 hover:text-[var(--c-text)] transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className={`${LAYOUT.containerNarrow} -mt-8 relative z-10 ${SPACING.contentBottom}`}>
        {/* Title + meta */}
        <h1
          className={`${TYPOGRAPHY.h1} text-[var(--c-text)] mb-4 leading-tight`}
          style={{ fontFamily: "var(--c-font-display)" }}
        >
          {itinerary.title}
        </h1>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {itinerary.durationMinutes && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-xs text-[var(--c-text)]">
              <svg
                className="w-3.5 h-3.5 text-[var(--c-text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatDuration(itinerary.durationMinutes)}
            </span>
          )}
          {itinerary.difficulty && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-xs text-[var(--c-text)]">
              {itinerary.difficulty}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-xs text-[var(--c-text)]">
            <svg
              className="w-3.5 h-3.5 text-[var(--c-text-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
            </svg>
            {sortedStops.length} stops
          </span>
        </div>

        {itinerary.description && (
          <p className="text-[var(--c-text)] leading-relaxed mb-10 whitespace-pre-line">
            {itinerary.description}
          </p>
        )}

        {/* Timeline */}
        {sortedStops.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-[var(--c-text)] mb-6">Route</h2>
            <div className="relative">
              {/* Timeline line */}
              <div
                className="absolute left-5 top-6 bottom-6 w-0.5 rounded-full"
                style={{ backgroundColor: `${primaryColor}30` }}
              />

              <div className="space-y-0">
                {sortedStops.map((stop, i) => {
                  const stopName =
                    stop.poi?.name || stop.poiName || `Stop ${stop.order}`;
                  return (
                    <div key={stop.id}>
                      {/* Stop */}
                      <div className="relative flex items-start gap-4 py-4">
                        {/* Order circle */}
                        <div
                          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold z-10"
                          style={{
                            backgroundColor: primaryColor,
                            color:
                              city?.theme?.colorBackground || "var(--c-bg)",
                          }}
                        >
                          {stop.order}
                        </div>

                        {/* Stop content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            {/* Photo */}
                            {stop.poi?.primaryPhotoUrl && (
                              <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden">
                                <img
                                  src={stop.poi.primaryPhotoUrl}
                                  alt={stopName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              {stop.poi?.slug ? (
                                <Link
                                  href={`/explore/${citySlug}/poi/${stop.poi.slug}`}
                                  className="text-base font-semibold text-[var(--c-text)] hover:underline"
                                >
                                  {stopName}
                                </Link>
                              ) : (
                                <span className="text-base font-semibold text-[var(--c-text)]">
                                  {stopName}
                                </span>
                              )}

                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {stop.timeOfDay && (
                                  <span className="text-xs text-[var(--c-text-muted)] bg-[var(--c-surface)] px-2 py-0.5 rounded">
                                    {stop.timeOfDay}
                                  </span>
                                )}
                                {stop.durationMinutes && (
                                  <span className="text-xs text-[var(--c-text-muted)]">
                                    {formatDuration(stop.durationMinutes)}
                                  </span>
                                )}
                                {stop.poi?.categoryEmoji && (
                                  <span className="text-xs">
                                    {stop.poi.categoryEmoji}
                                  </span>
                                )}
                              </div>

                              {stop.note && (
                                <p className="text-xs text-[var(--c-text-muted)] mt-2 leading-relaxed">
                                  {stop.note}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Transport between stops */}
                      {i < sortedStops.length - 1 && stop.transportMode && (
                        <div className="relative flex items-center gap-4 py-2 pl-[10px]">
                          <div className="w-10 flex items-center justify-center text-lg z-10">
                            {transportIcon(stop.transportMode)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[var(--c-text-muted)]">
                            <span className="capitalize">
                              {stop.transportMode}
                            </span>
                            {stop.transportDurationMinutes && (
                              <span>
                                &middot;{" "}
                                {formatDuration(stop.transportDurationMinutes)}
                              </span>
                            )}
                            {stop.transportNote && (
                              <span className="text-[var(--c-text-muted)]">
                                &middot; {stop.transportNote}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Budget estimate */}
        {itinerary.budgetEstimate && (
          <div className="mb-8 p-4 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)]">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-[var(--c-text-muted)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <span className="text-xs text-[var(--c-text-muted)] uppercase tracking-wider font-medium">
                  Budget Estimate
                </span>
                <p className="text-sm text-[var(--c-text)] font-semibold">
                  {itinerary.budgetEstimate}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Start Itinerary CTA */}
        {firstPoi && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(firstPoi.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-base font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{
              backgroundColor: primaryColor,
              color: city?.theme?.colorBackground || "var(--c-bg)",
            }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Start Itinerary
          </a>
        )}
      </div>
    </div>
  );
}
