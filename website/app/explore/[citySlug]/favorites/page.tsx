"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCity } from "@/lib/city-context";
import { useFavorites } from "@/hooks/useFavorites";
import { LAYOUT, SPACING, GRID, CARD, TYPOGRAPHY, ANIMATION } from "@/lib/layout-constants";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

interface POI {
  id: string;
  name: string;
  slug: string;
  primaryPhotoUrl?: string;
  categoryName?: string;
  categoryColor?: string;
  categoryEmoji?: string;
  priority?: string;
}

export default function FavoritesPage() {
  const { city, loading: cityLoading, error: cityError } = useCity();
  const { favorites, getFavoritesForCity, toggle, clear } = useFavorites();

  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);

  const cityFavorites = city ? getFavoritesForCity(city.slug) : [];

  useEffect(() => {
    if (!city?.id || cityFavorites.length === 0) {
      setPois([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch each favorited POI
    const fetchPois = async () => {
      try {
        const results = await Promise.allSettled(
          cityFavorites.map((fav) =>
            fetch(`${API_BASE}/cities/${city.id}/pois/${fav.poiId}`).then(
              async (res) => {
                if (!res.ok) return null;
                const json = await res.json();
                // API wraps response in { data: ... }
                return json.data || json;
              },
            ),
          ),
        );

        const loaded = results
          .filter(
            (r): r is PromiseFulfilledResult<POI | null> =>
              r.status === "fulfilled" && r.value !== null,
          )
          .map((r) => r.value as POI);

        setPois(loaded);
      } catch {
        setPois([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPois();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city?.id, favorites.length]);

  if (cityLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--pm-paper)]">
        <div className="w-8 h-8 border-2 border-[var(--pm-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (cityError || !city) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--pm-paper)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--pm-ink)] mb-2">City not found</h1>
          <Link href="/" className="text-[var(--pm-primary)] hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = "var(--pm-primary)";

  return (
    <div className="min-h-screen bg-[var(--pm-paper)]">
      {/* Header */}
      <div className={`${SPACING.headerPadding} px-6`}>
        <div className={LAYOUT.container}>
          <Link
            href={`/explore/${city.slug}`}
            className="inline-flex items-center gap-2 text-sm text-[var(--pm-muted)] hover:text-[var(--pm-ink)] transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {city.name}
          </Link>

          <div className="flex items-end justify-between">
            <div>
              <h1
                className={`${TYPOGRAPHY.h1} text-[var(--pm-ink)] mb-2`}
                style={{ fontFamily: "var(--pm-font-display)" }}
              >
                Favorites
              </h1>
              <p className="text-[var(--pm-muted)]">
                {cityFavorites.length > 0
                  ? `${cityFavorites.length} saved ${cityFavorites.length === 1 ? "place" : "places"} in ${city.name}`
                  : `Your saved places in ${city.name}`}
              </p>
            </div>
            {cityFavorites.length > 0 && (
              <button
                onClick={clear}
                className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`${LAYOUT.container} ${SPACING.contentBottom}`}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[var(--pm-muted)] border-t-[var(--pm-primary)] rounded-full animate-spin" />
          </div>
        ) : pois.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-[var(--pm-surface)] border border-[var(--pm-muted)] flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[var(--pm-muted)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--pm-ink)] mb-2">
              No favorites yet
            </h3>
            <p className="text-sm text-[var(--pm-muted)] mb-6 max-w-sm mx-auto">
              Tap the heart icon on any place to save it here for quick access.
            </p>
            <Link
              href={`/explore/${city.slug}/map`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: "var(--pm-primary)",
                color: "var(--pm-text-on-primary, var(--pm-paper))",
              }}
            >
              Explore the map
            </Link>
          </div>
        ) : (
          <div className={GRID.cards}>
            {pois.map((poi, i) => (
              <motion.div
                key={poi.id}
                {...ANIMATION.fadeInUp}
                transition={{ ...ANIMATION.entryTransition, delay: i * ANIMATION.staggerDelay }}
              >
                <div className={`group relative ${CARD.base} ${CARD.hover}`}>
                  {/* Heart button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggle(poi.id, city.slug);
                    }}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center"
                    aria-label="Remove from favorites"
                  >
                    <svg
                      className="w-4 h-4 text-red-500 fill-red-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>

                  <Link href={`/explore/${city.slug}/poi/${poi.slug}`}>
                    <div className={`relative ${CARD.imageHeight} overflow-hidden`}>
                      {poi.primaryPhotoUrl ? (
                        <img
                          src={poi.primaryPhotoUrl}
                          alt={poi.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-4xl"
                          style={{
                            background: `linear-gradient(135deg, ${poi.categoryColor || primaryColor}25, var(--pm-muted))`,
                          }}
                        >
                          {poi.categoryEmoji || "\uD83D\uDCCD"}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--pm-surface)] via-transparent to-transparent opacity-60" />
                    </div>
                    <div className={CARD.padding}>
                      {poi.categoryName && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mb-2 uppercase tracking-wider"
                          style={{
                            backgroundColor: `${poi.categoryColor || primaryColor}18`,
                            color: poi.categoryColor || primaryColor,
                          }}
                        >
                          {poi.categoryEmoji && (
                            <span className="text-xs">
                              {poi.categoryEmoji}
                            </span>
                          )}
                          {poi.categoryName}
                        </span>
                      )}
                      <h3 className={`${TYPOGRAPHY.h3} text-[var(--pm-ink)] line-clamp-2`}>
                        {poi.name}
                      </h3>
                    </div>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
