"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCity } from "@/lib/city-context";
import { use } from "react";
import { LAYOUT, SPACING, GRID, CARD, TYPOGRAPHY, ANIMATION } from "@/lib/layout-constants";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

interface CollectionItem {
  id: string;
  poi: {
    id: string;
    name: string;
    slug: string;
    primaryPhotoUrl?: string;
    categoryName?: string;
    categoryColor?: string;
    categoryEmoji?: string;
  };
  curatorNote?: string;
  order?: number;
}

interface CollectionDetail {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  items: CollectionItem[];
}

export default function CollectionViewPage({
  params,
}: {
  params: Promise<{ citySlug: string; slug: string }>;
}) {
  const { citySlug, slug } = use(params);
  const { city, loading: cityLoading } = useCity();

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city?.id) return;

    const fetchCollection = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/cities/${city.id}/collections/${slug}`,
        );
        if (!res.ok) {
          throw new Error(
            res.status === 404 ? "Collection not found" : "Failed to load",
          );
        }
        const json = await res.json();
        // API wraps response in { data: ... }
        setCollection(json.data || json);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load collection",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [city?.id, slug]);

  if (cityLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--pm-paper)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--pm-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--pm-muted)]">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--pm-paper)]">
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold text-[var(--pm-ink)] mb-2">
            Collection not found
          </h1>
          <p className="text-[var(--pm-muted)] mb-6">{error}</p>
          <Link
            href={`/explore/${citySlug}/collections`}
            className="text-[var(--pm-primary)] hover:underline font-medium"
          >
            Back to collections
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = city?.theme?.colorPrimary || "var(--pm-primary)";
  const items = [...(collection.items || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  );

  return (
    <div className="min-h-screen bg-[var(--pm-paper)]">
      {/* Header */}
      <div className={`${SPACING.headerPadding} px-6`}>
        <div className={LAYOUT.container}>
          <Link
            href={`/explore/${citySlug}/collections`}
            className="inline-flex items-center gap-2 text-sm text-[var(--pm-muted)] hover:text-[var(--pm-ink)] transition-colors mb-6"
          >
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Collections
          </Link>

          <h1
            className={`${TYPOGRAPHY.h1} text-[var(--pm-ink)] mb-2`}
            style={{ fontFamily: "var(--pm-font-display)" }}
          >
            {collection.title}
          </h1>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-[var(--pm-muted)]">
              {items.length} {items.length === 1 ? "place" : "places"}
            </span>
          </div>
          {collection.description && (
            <p className="text-[var(--pm-muted)] leading-relaxed max-w-2xl">
              {collection.description}
            </p>
          )}
        </div>
      </div>

      {/* Items grid */}
      <div className={`${LAYOUT.container} ${SPACING.contentBottom}`}>
        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--pm-muted)]">
              This collection is empty.
            </p>
          </div>
        ) : (
          <div className={GRID.cards}>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                {...ANIMATION.fadeInUp}
                transition={{ ...ANIMATION.entryTransition, delay: i * ANIMATION.staggerDelay }}
              >
                <Link
                  href={`/explore/${citySlug}/poi/${item.poi.slug}`}
                >
                  <div className={`group ${CARD.base} ${CARD.hover}`}>
                    <div className={`relative ${CARD.imageHeight} overflow-hidden`}>
                      {item.poi.primaryPhotoUrl ? (
                        <img
                          src={item.poi.primaryPhotoUrl}
                          alt={item.poi.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-4xl"
                          style={{
                            background: `linear-gradient(135deg, ${item.poi.categoryColor || primaryColor}25, var(--pm-muted))`,
                          }}
                        >
                          {item.poi.categoryEmoji || "\uD83D\uDCCD"}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--pm-surface)] via-transparent to-transparent opacity-60" />
                    </div>
                    <div className={CARD.padding}>
                      {item.poi.categoryName && (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mb-2 uppercase tracking-wider"
                          style={{
                            backgroundColor: `${item.poi.categoryColor || primaryColor}18`,
                            color:
                              item.poi.categoryColor || primaryColor,
                          }}
                        >
                          {item.poi.categoryEmoji && (
                            <span className="text-xs">
                              {item.poi.categoryEmoji}
                            </span>
                          )}
                          {item.poi.categoryName}
                        </span>
                      )}
                      <h3 className={`${TYPOGRAPHY.h3} text-[var(--pm-ink)] mb-1 line-clamp-2`}>
                        {item.poi.name}
                      </h3>
                      {item.curatorNote && (
                        <p className="text-xs text-[var(--pm-muted)] line-clamp-2 italic mt-1">
                          &ldquo;{item.curatorNote}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
