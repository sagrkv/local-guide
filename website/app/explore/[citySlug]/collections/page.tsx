"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCity } from "@/lib/city-context";
import { LAYOUT, SPACING, GRID, CARD, TYPOGRAPHY, ANIMATION } from "@/lib/layout-constants";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

interface Collection {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  itemCount?: number;
  _count?: { items: number };
}

export default function CollectionsListPage() {
  const { city, loading: cityLoading, error: cityError } = useCity();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city?.id) return;
    setLoading(true);
    fetch(`${API_BASE}/cities/${city.id}/collections`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setCollections(
          Array.isArray(data) ? data : data.collections || data.data || [],
        );
      })
      .catch(() => setCollections([]))
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
            Collections
          </h1>
          <p className="text-[var(--c-text-muted)]">
            Themed guides for {city.name}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className={`${LAYOUT.container} ${SPACING.contentBottom}`}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-[var(--c-border)] border-t-[var(--c-primary)] rounded-full animate-spin" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--c-text-muted)]">
              No collections available for {city.name} yet.
            </p>
          </div>
        ) : (
          <div className={GRID.cards}>
            {collections.map((col, i) => {
              const count = col.itemCount || col._count?.items || 0;
              return (
                <motion.div
                  key={col.id}
                  {...ANIMATION.fadeInUp}
                  transition={{ ...ANIMATION.entryTransition, delay: i * ANIMATION.staggerDelay }}
                >
                  <Link href={`/explore/${city.slug}/collection/${col.slug}`}>
                    <div className={`group ${CARD.base} ${CARD.hover}`}>
                      <div className={`relative ${CARD.imageHeight} overflow-hidden`}>
                        {col.coverImageUrl ? (
                          <img
                            src={col.coverImageUrl}
                            alt={col.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-4xl"
                            style={{
                              background: `linear-gradient(135deg, ${primaryColor}25, var(--c-border))`,
                            }}
                          >
                            {"\uD83D\uDCDA"}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--c-surface)] via-transparent to-transparent opacity-60" />
                      </div>
                      <div className={CARD.padding}>
                        <h3 className={`${TYPOGRAPHY.h3} text-[var(--c-text)] mb-1 line-clamp-2`}>
                          {col.title}
                        </h3>
                        {col.description && (
                          <p className="text-xs text-[var(--c-text-muted)] line-clamp-2 mb-2">
                            {col.description}
                          </p>
                        )}
                        {count > 0 && (
                          <span className="text-xs text-[var(--c-text-muted)]">
                            {count} {count === 1 ? "place" : "places"}
                          </span>
                        )}
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
