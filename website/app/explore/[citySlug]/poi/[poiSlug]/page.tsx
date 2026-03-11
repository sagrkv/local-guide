"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCity } from "@/lib/city-context";
import { useFavorites } from "@/hooks/useFavorites";
import { use } from "react";
import { LAYOUT, SPACING, TYPOGRAPHY } from "@/lib/layout-constants";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

interface POIDetail {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  primaryPhotoUrl?: string;
  photos?: string[];
  categoryName?: string;
  categoryColor?: string;
  categoryEmoji?: string;
  priority?: string;
  timeToSpend?: string;
  bestTimeToVisit?: string;
  entryFee?: string;
  bestSeason?: string;
  localTip?: string;
  warning?: string;
  openingHours?: Record<string, string>;
  phone?: string;
  website?: string;
  instagram?: string;
  address?: string;
  lat: number;
  lng: number;
  hasWifi?: boolean;
  hasParking?: boolean;
  isWheelchairAccessible?: boolean;
  hasRestrooms?: boolean;
  isPetFriendly?: boolean;
  servesFood?: boolean;
  servesAlcohol?: boolean;
}

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function getIsOpenNow(hours?: Record<string, string>): boolean | null {
  if (!hours) return null;
  const now = new Date();
  const dayName = DAY_ORDER[now.getDay() === 0 ? 6 : now.getDay() - 1];
  const todayHours = hours[dayName];
  if (!todayHours || todayHours.toLowerCase() === "closed") return false;
  // Simple heuristic: if hours exist and not "closed", assume open
  return true;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function POIDetailPage({
  params,
}: {
  params: Promise<{ citySlug: string; poiSlug: string }>;
}) {
  const { citySlug, poiSlug } = use(params);
  const { city, loading: cityLoading } = useCity();
  const { isFavorite, toggle } = useFavorites();

  const [poi, setPoi] = useState<POIDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city?.id) return;

    const fetchPOI = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/cities/${city.id}/pois/${poiSlug}`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? "Place not found" : "Failed to load");
        }
        const json = await res.json();
        // API wraps response in { data: ... }
        setPoi(json.data || json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load place");
      } finally {
        setLoading(false);
      }
    };

    fetchPOI();
  }, [city?.id, poiSlug]);

  if (cityLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--c-bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--c-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--c-text-muted)]">Loading place...</p>
        </div>
      </div>
    );
  }

  if (error || !poi) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--c-bg)]">
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold text-[var(--c-text)] mb-2">Place not found</h1>
          <p className="text-[var(--c-text-muted)] mb-6">{error || "We couldn't find this place."}</p>
          <Link
            href={`/explore/${citySlug}`}
            className="text-[var(--c-primary)] hover:underline font-medium"
          >
            Back to {city?.name || "city"}
          </Link>
        </div>
      </div>
    );
  }

  const primaryColor = city?.theme?.colorPrimary || "var(--c-primary)";
  const favorited = isFavorite(poi.id);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`;
  const isOpen = getIsOpenNow(poi.openingHours);

  const amenities = [
    { key: "hasWifi", label: "WiFi", icon: "wifi" },
    { key: "hasParking", label: "Parking", icon: "car" },
    { key: "isWheelchairAccessible", label: "Accessible", icon: "accessible" },
    { key: "hasRestrooms", label: "Restrooms", icon: "restroom" },
    { key: "isPetFriendly", label: "Pet Friendly", icon: "pet" },
    { key: "servesFood", label: "Food", icon: "food" },
    { key: "servesAlcohol", label: "Drinks", icon: "drink" },
  ].filter((a) => (poi as unknown as Record<string, unknown>)[a.key] === true);

  return (
    <div className="min-h-screen bg-[var(--c-bg)]">
      {/* Hero / Photo */}
      <div className="relative">
        {poi.primaryPhotoUrl ? (
          <div className="relative h-72 md:h-96 overflow-hidden">
            <img
              src={poi.primaryPhotoUrl}
              alt={poi.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--c-bg)] via-[var(--c-bg)]/30 to-transparent" />
          </div>
        ) : (
          <div
            className="h-48 md:h-64"
            style={{
              background: `linear-gradient(160deg, ${primaryColor}25, var(--c-bg), ${primaryColor}10)`,
            }}
          />
        )}

        {/* Top nav */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <Link
            href={`/explore/${citySlug}/map`}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-[var(--c-text)]/90 hover:text-[var(--c-text)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <button
            onClick={() => toggle(poi.id, citySlug)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur flex items-center justify-center transition-colors"
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
          >
            <svg
              className={`w-5 h-5 ${favorited ? "text-red-500 fill-red-500" : "text-[var(--c-text)]/90"}`}
              viewBox="0 0 24 24"
              fill={favorited ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`${LAYOUT.containerNarrow} -mt-8 relative z-10 ${SPACING.contentBottom}`}>
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {poi.categoryName && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: `${poi.categoryColor || primaryColor}18`,
                color: poi.categoryColor || primaryColor,
                border: `1px solid ${poi.categoryColor || primaryColor}30`,
              }}
            >
              {poi.categoryEmoji && <span>{poi.categoryEmoji}</span>}
              {poi.categoryName}
            </span>
          )}
          {poi.priority === "MUST_VISIT" && (
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
              style={{
                backgroundColor: `${primaryColor}15`,
                color: primaryColor,
                border: `1px solid ${primaryColor}30`,
              }}
            >
              Must Visit
            </span>
          )}
          {poi.priority === "HIDDEN_GEM" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Hidden Gem
            </span>
          )}
          {poi.priority === "RECOMMENDED" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Recommended
            </span>
          )}
        </div>

        {/* Name */}
        <h1
          className={`${TYPOGRAPHY.h1} text-[var(--c-text)] mb-4 leading-tight`}
          style={{ fontFamily: "var(--c-font-display)" }}
        >
          {poi.name}
        </h1>

        {/* Quick info pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {poi.timeToSpend && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-xs text-[var(--c-text)]">
              <svg className="w-3.5 h-3.5 text-[var(--c-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {poi.timeToSpend}
            </span>
          )}
          {poi.bestTimeToVisit && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-xs text-[var(--c-text)]">
              <svg className="w-3.5 h-3.5 text-[var(--c-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {poi.bestTimeToVisit}
            </span>
          )}
          {poi.entryFee && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-xs text-[var(--c-text)]">
              <svg className="w-3.5 h-3.5 text-[var(--c-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {poi.entryFee}
            </span>
          )}
          {poi.bestSeason && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-xs text-[var(--c-text)]">
              <svg className="w-3.5 h-3.5 text-[var(--c-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              {poi.bestSeason}
            </span>
          )}
        </div>

        {/* Description */}
        {poi.description && (
          <div className="mb-8">
            <p className="text-[var(--c-text)] leading-relaxed whitespace-pre-line">
              {poi.description}
            </p>
          </div>
        )}

        {/* Local Tip */}
        {poi.localTip && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">💡</span>
              <div>
                <h3 className="text-sm font-semibold text-amber-400 mb-1">Local Tip</h3>
                <p className="text-sm text-amber-200/80 leading-relaxed">
                  {poi.localTip}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning */}
        {poi.warning && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/8 border border-red-500/20">
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5">⚠️</span>
              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-1">Warning</h3>
                <p className="text-sm text-red-200/80 leading-relaxed">
                  {poi.warning}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Opening Hours */}
        {poi.openingHours && Object.keys(poi.openingHours).length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-base font-semibold text-[var(--c-text)]">Opening Hours</h3>
              {isOpen !== null && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isOpen
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/15 text-red-400 border border-red-500/30"
                  }`}
                >
                  {isOpen ? "Open Now" : "Closed"}
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {DAY_ORDER.map((day) => {
                const hours = poi.openingHours?.[day];
                if (!hours) return null;
                const today = new Date();
                const isToday =
                  day === DAY_ORDER[today.getDay() === 0 ? 6 : today.getDay() - 1];
                return (
                  <div
                    key={day}
                    className={`flex items-center justify-between py-1.5 px-3 rounded-lg text-sm ${
                      isToday ? "bg-[var(--c-surface)]" : ""
                    }`}
                  >
                    <span
                      className={`${isToday ? "text-[var(--c-text)] font-medium" : "text-[var(--c-text-muted)]"}`}
                    >
                      {capitalize(day)}
                    </span>
                    <span
                      className={`${
                        hours.toLowerCase() === "closed"
                          ? "text-red-400"
                          : isToday
                            ? "text-[var(--c-text)]"
                            : "text-[var(--c-text)]"
                      }`}
                    >
                      {hours}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contact */}
        {(poi.phone || poi.website || poi.instagram) && (
          <div className="mb-8">
            <h3 className="text-base font-semibold text-[var(--c-text)] mb-3">Contact</h3>
            <div className="space-y-2">
              {poi.phone && (
                <a
                  href={`tel:${poi.phone}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] hover:border-[var(--c-border)] transition-colors"
                >
                  <svg className="w-4 h-4 text-[var(--c-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm text-[var(--c-text)]">{poi.phone}</span>
                </a>
              )}
              {poi.website && (
                <a
                  href={poi.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] hover:border-[var(--c-border)] transition-colors"
                >
                  <svg className="w-4 h-4 text-[var(--c-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span className="text-sm text-[var(--c-text)] truncate">{poi.website}</span>
                </a>
              )}
              {poi.instagram && (
                <a
                  href={`https://instagram.com/${poi.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] hover:border-[var(--c-border)] transition-colors"
                >
                  <svg className="w-4 h-4 text-[var(--c-text-muted)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                  <span className="text-sm text-[var(--c-text)]">{poi.instagram}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Address + Directions */}
        {poi.address && (
          <div className="mb-8">
            <h3 className="text-base font-semibold text-[var(--c-text)] mb-3">Location</h3>
            <p className="text-sm text-[var(--c-text-muted)] mb-3">{poi.address}</p>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: primaryColor,
                color: city?.theme?.colorBackground || "var(--c-bg)",
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Get Directions
            </a>
          </div>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="mb-8">
            <h3 className="text-base font-semibold text-[var(--c-text)] mb-3">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => (
                <span
                  key={a.key}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] text-xs text-[var(--c-text)]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {a.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Back to map */}
        <div className="pt-4 border-t border-[var(--c-border)]">
          <Link
            href={`/explore/${citySlug}/map`}
            className="inline-flex items-center gap-2 text-sm text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to {city?.name || "city"} map
          </Link>
        </div>
      </div>
    </div>
  );
}
