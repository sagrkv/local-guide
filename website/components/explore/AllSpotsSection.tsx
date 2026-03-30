"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Category {
  id: string;
  name: string;
  emoji?: string;
  icon?: string;
  color?: string;
  slug?: string;
  _count?: { pois: number };
}

interface AllSpotsSectionProps {
  categories: Category[];
  citySlug: string;
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AllSpotsSection({
  categories,
  citySlug,
  totalCount,
}: AllSpotsSectionProps) {
  const activeCategories = categories.filter(
    (c) => (c._count?.pois ?? 0) > 0,
  );

  if (activeCategories.length === 0 && totalCount === 0) return null;

  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header with view toggle */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{
              fontFamily: "var(--pm-font-display)",
              color: "var(--pm-ink, #1A1A1A)",
              letterSpacing: "-0.02em",
            }}
          >
            All {totalCount > 0 ? totalCount : ""} Spots
          </h2>

          <div className="flex gap-2">
            <Link
              href={`/explore/${citySlug}/map`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150"
              style={{
                backgroundColor: "var(--pm-primary, #1E3A5F)",
                color: "var(--pm-paper, #FAFAF5)",
                fontFamily: "var(--pm-font-body)",
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              Map View
            </Link>
          </div>
        </div>

        {/* Category grid */}
        {activeCategories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {activeCategories.map((cat, i) => {
              const poiCount = cat._count?.pois ?? 0;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <Link
                    href={`/explore/${citySlug}/map?category=${cat.id}`}
                    className="group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      backgroundColor: "var(--pm-surface, #FAFAF8)",
                      border: "1px solid",
                      borderColor: cat.color
                        ? `color-mix(in srgb, ${cat.color} 20%, transparent)`
                        : "color-mix(in srgb, var(--pm-accent, #D4A574) 25%, transparent)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    {cat.emoji && (
                      <span className="text-lg shrink-0">{cat.emoji}</span>
                    )}
                    <div className="min-w-0">
                      <span
                        className="text-sm font-semibold block truncate"
                        style={{
                          fontFamily: "var(--pm-font-body)",
                          color: "var(--pm-ink, #1A1A1A)",
                        }}
                      >
                        {cat.name}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--pm-muted, #9CA3AF)" }}
                      >
                        {poiCount} {poiCount === 1 ? "place" : "places"}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
