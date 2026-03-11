"use client";

import Link from "next/link";
import { useFavorites } from "@/hooks/useFavorites";

interface POIPopupProps {
  poi: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    primaryPhotoUrl?: string;
    categoryName?: string;
    categoryColor?: string;
    categoryEmoji?: string;
    priority?: string;
    timeToSpend?: string;
    entryFee?: string;
    lat: number;
    lng: number;
  };
  citySlug: string;
  onClose: () => void;
}

export default function POIPopup({ poi, citySlug, onClose }: POIPopupProps) {
  const { isFavorite, toggle } = useFavorites();
  const favorited = isFavorite(poi.id);

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`;
  const desc = poi.shortDescription || poi.description;
  const truncatedDesc =
    desc && desc.length > 120 ? `${desc.slice(0, 120)}...` : desc;

  return (
    <div className="bg-[var(--c-surface)] border border-[var(--c-border)] rounded-2xl overflow-hidden shadow-2xl w-full max-w-sm">
      {/* Photo */}
      {poi.primaryPhotoUrl ? (
        <div className="relative h-40 overflow-hidden">
          <img
            src={poi.primaryPhotoUrl}
            alt={poi.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--c-surface)] via-transparent to-transparent" />
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-[var(--c-text)]/80 hover:text-[var(--c-text)] transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* Fav button */}
          <button
            onClick={() => toggle(poi.id, citySlug)}
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center transition-colors"
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          >
            <svg
              className={`w-4 h-4 ${favorited ? "text-red-500 fill-red-500" : "text-[var(--c-text)]/80"}`}
              viewBox="0 0 24 24"
              fill={favorited ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="relative h-24 bg-gradient-to-br from-[var(--c-primary)]/30 to-[var(--c-border)]">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-[var(--c-text)]/80 hover:text-[var(--c-text)] transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={() => toggle(poi.id, citySlug)}
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center transition-colors"
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          >
            <svg
              className={`w-4 h-4 ${favorited ? "text-red-500 fill-red-500" : "text-[var(--c-text)]/80"}`}
              viewBox="0 0 24 24"
              fill={favorited ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Category + Priority */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {poi.categoryName && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: poi.categoryColor
                  ? `${poi.categoryColor}20`
                  : "var(--c-border)",
                color: poi.categoryColor || "var(--c-text)",
                border: `1px solid ${poi.categoryColor ? `${poi.categoryColor}40` : "var(--c-border)"}`,
              }}
            >
              {poi.categoryEmoji && <span>{poi.categoryEmoji}</span>}
              {poi.categoryName}
            </span>
          )}
          {poi.priority === "MUST_VISIT" && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--c-primary)]/15 text-[var(--c-primary)] border border-[var(--c-primary)]/30">
              Must Visit
            </span>
          )}
          {poi.priority === "HIDDEN_GEM" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Hidden Gem
            </span>
          )}
        </div>

        {/* Name */}
        <h3
          className="text-lg font-bold text-[var(--c-text)] mb-1 leading-tight"
          style={{ fontFamily: "var(--c-font-display)" }}
        >
          {poi.name}
        </h3>

        {/* Description */}
        {truncatedDesc && (
          <p className="text-sm text-[var(--c-text-muted)] mb-3 leading-relaxed">
            {truncatedDesc}
          </p>
        )}

        {/* Quick info */}
        {(poi.timeToSpend || poi.entryFee) && (
          <div className="flex items-center gap-3 mb-4 text-xs text-[var(--c-text-muted)]">
            {poi.timeToSpend && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {poi.timeToSpend}
              </span>
            )}
            {poi.entryFee && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {poi.entryFee}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/explore/${citySlug}/poi/${poi.slug}`}
            className="flex-1 text-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: "var(--c-primary)",
              color: "var(--color-city-bg, var(--c-bg))",
            }}
          >
            View Details
          </Link>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--c-border)] border border-[var(--c-border)] text-[var(--c-text)] hover:text-[var(--c-text)] hover:border-[var(--c-border)] transition-colors"
            aria-label="Get Directions"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
