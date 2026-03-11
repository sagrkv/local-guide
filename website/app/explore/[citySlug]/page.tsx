"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCity } from "@/lib/city-context";
import {
  SectionDivider,
  DecorativeCard,
  BackgroundPattern,
  FloatingMotifs,
  HeroOverlay,
  GoldAccent,
  CityMark,
} from "@/components/cultural";
import { LAYOUT, SPACING, GRID, TYPOGRAPHY, ANIMATION } from "@/lib/layout-constants";

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

interface Collection {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImageUrl?: string;
  itemCount?: number;
  _count?: { items: number };
}

interface Category {
  id: string;
  name: string;
  emoji?: string;
  icon?: string;
  color?: string;
  slug?: string;
  _count?: { pois: number };
}

// ---------------------------------------------------------------------------
// Category SVG icons — mapped from the `icon` field in the database
// ---------------------------------------------------------------------------

function CategoryIcon({ icon, className }: { icon?: string; className?: string }) {
  const cls = className || "w-5 h-5";

  switch (icon) {
    case "temple":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L8 6H4v2h1l1 12h12l1-12h1V6h-4l-4-4z" />
          <path d="M9 20v-5a3 3 0 016 0v5" />
          <path d="M12 2v4" />
        </svg>
      );
    case "castle":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V7l2-2V3h2v2h6V3h2v2l2 2v14" />
          <path d="M9 21v-4a3 3 0 016 0v4" />
          <rect x="7" y="9" width="3" height="3" rx="0.5" />
          <rect x="14" y="9" width="3" height="3" rx="0.5" />
        </svg>
      );
    case "museum":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V10l7-6 7 6v11" />
          <path d="M9 21v-6h6v6" />
          <path d="M2 10h20" />
        </svg>
      );
    case "tree":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22v-7" />
          <path d="M12 15C7.5 15 4 11.5 4 8c0-2.5 1.5-4.5 3.5-5.5C8 2 9.5 1 12 1s4 1 4.5 1.5C18.5 3.5 20 5.5 20 8c0 3.5-3.5 7-8 7z" />
          <path d="M8 22h8" />
        </svg>
      );
    case "shopping-bag":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      );
    case "utensils":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
        </svg>
      );
    case "coffee":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 8h1a4 4 0 010 8h-1" />
          <path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
          <line x1="6" y1="2" x2="6" y2="4" />
          <line x1="10" y1="2" x2="10" y2="4" />
          <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
      );
    case "food-stall":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10h16" />
          <path d="M4 10l1 10h14l1-10" />
          <path d="M12 3C8 3 4 6 4 10" />
          <path d="M12 3c4 0 8 3 8 7" />
          <path d="M9 14v3" />
          <path d="M15 14v3" />
        </svg>
      );
    case "moon":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      );
    case "bag":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      );
    case "umbrella-beach":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21H7" />
          <path d="M12 12v9" />
          <path d="M4 12a8 8 0 0116 0" />
          <path d="M12 4a8 8 0 00-8 8h16a8 8 0 00-8-8z" />
        </svg>
      );
    case "water":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
          <path d="M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
          <path d="M2 7c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
        </svg>
      );
    case "binoculars":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="17" r="4" />
          <circle cx="17" cy="17" r="4" />
          <path d="M7 13V5a2 2 0 012-2h1" />
          <path d="M17 13V5a2 2 0 00-2-2h-1" />
          <path d="M11 5h2" />
        </svg>
      );
    case "palette":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r="1.5" />
          <circle cx="17.5" cy="10.5" r="1.5" />
          <circle cx="8.5" cy="7.5" r="1.5" />
          <circle cx="6.5" cy="12.5" r="1.5" />
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
        </svg>
      );
    case "spa":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22c-4-3-8-7-8-12a8 8 0 0116 0c0 5-4 9-8 12z" />
          <path d="M12 14c-2-1.5-4-3.5-4-6a4 4 0 018 0c0 2.5-2 4.5-4 6z" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
  }
}

function formatDuration(minutes?: number): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function LoadingSpinner() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--c-bg)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--c-gold)" }}
        />
        <p
          className="text-sm"
          style={{ color: "var(--c-text-muted)", fontFamily: "var(--c-font-body)" }}
        >
          Loading city...
        </p>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--c-bg)" }}
    >
      <div className="text-center max-w-md px-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "var(--c-surface)", border: "1px solid var(--c-border)" }}
        >
          <svg
            className="w-8 h-8"
            style={{ color: "var(--c-secondary)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--c-text)", fontFamily: "var(--c-font-display)" }}
        >
          City not found
        </h1>
        <p className="mb-6" style={{ color: "var(--c-text-muted)" }}>
          {error}
        </p>
        <Link
          href="/"
          className="font-medium hover:underline"
          style={{ color: "var(--c-primary)" }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default function CityLandingPage() {
  const { city, loading, error } = useCity();
  const [pois, setPois] = useState<POI[]>([]);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!city?.id) return;

    const fetchData = async () => {
      setDataLoading(true);
      try {
        const [poisRes, itinRes, collRes, catRes] = await Promise.allSettled([
          fetch(`${API_BASE}/cities/${city.id}/pois?priority=MUST_VISIT&limit=8`),
          fetch(`${API_BASE}/cities/${city.id}/itineraries?limit=3`),
          fetch(`${API_BASE}/cities/${city.id}/collections?limit=4`),
          fetch(`${API_BASE}/cities/${city.id}/categories`),
        ]);

        if (poisRes.status === "fulfilled" && poisRes.value.ok) {
          const data = await poisRes.value.json();
          setPois(Array.isArray(data) ? data : data.pois || data.data || []);
        }
        if (itinRes.status === "fulfilled" && itinRes.value.ok) {
          const data = await itinRes.value.json();
          setItineraries(
            Array.isArray(data) ? data : data.itineraries || data.data || [],
          );
        }
        if (collRes.status === "fulfilled" && collRes.value.ok) {
          const data = await collRes.value.json();
          setCollections(
            Array.isArray(data) ? data : data.collections || data.data || [],
          );
        }
        if (catRes.status === "fulfilled" && catRes.value.ok) {
          const data = await catRes.value.json();
          setCategories(
            Array.isArray(data) ? data : data.categories || data.data || [],
          );
        }
      } catch {
        // non-critical
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [city?.id]);

  if (loading) return <LoadingSpinner />;
  if (error || !city)
    return <ErrorState error={error || "City not found"} />;

  return (
    <div className="min-h-screen" style={{ background: "var(--c-bg)", colorScheme: "light" }}>
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden">
          {/* Background layers */}
          {city.heroImageUrl ? (
            <div className="absolute inset-0">
              <img
                src={city.heroImageUrl}
                alt={city.name}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to bottom, var(--c-deep)cc 0%, var(--c-primary)88 40%, var(--c-bg) 100%)`,
                }}
              />
            </div>
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(160deg, var(--c-primary) 0%, var(--c-deep) 40%, var(--c-bg) 100%)`,
              }}
            />
          )}

          {/* Cultural pattern overlay on hero */}
          <HeroOverlay position="bottom" height={240} opacity={0.1} />
          <FloatingMotifs count={6} />

          <div className="relative z-10 pt-32 pb-24 px-6">
            <div className="max-w-4xl mx-auto text-center">
              {/* Emblem or CityMark fallback */}
              {city.theme?.emblemUrl ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  src={city.theme.emblemUrl}
                  alt=""
                  className="w-20 h-20 mx-auto mb-6 object-contain drop-shadow-lg"
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mx-auto mb-6 w-fit"
                >
                  <CityMark size={64} color="var(--c-text-on-primary)" className="drop-shadow-lg" />
                </motion.div>
              )}

              {/* City name — cultural display font */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-7xl lg:text-8xl font-bold mb-5 tracking-tight"
                style={{
                  fontFamily: "var(--c-font-display)",
                  color: "var(--c-text-on-primary)",
                  textShadow: "0 2px 20px rgba(0,0,0,0.3)",
                }}
              >
                {city.name}
              </motion.h1>

              {city.tagline && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-xl md:text-2xl mb-3 font-light"
                  style={{
                    fontFamily: "var(--c-font-decorative)",
                    color: "var(--c-text-on-primary)",
                    opacity: 0.9,
                  }}
                >
                  {city.tagline}
                </motion.p>
              )}

              {city.description && (
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-base max-w-2xl mx-auto mb-10 leading-relaxed"
                  style={{
                    fontFamily: "var(--c-font-body)",
                    color: "var(--c-text-on-primary)",
                    opacity: 0.8,
                  }}
                >
                  {city.description}
                </motion.p>
              )}

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link
                  href={`/explore/${city.slug}/map`}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                  style={{
                    backgroundColor: "var(--c-gold)",
                    color: "var(--c-deep)",
                    fontFamily: "var(--c-font-body)",
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
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  Explore Map
                </Link>
                <Link
                  href={`/explore/${city.slug}/itineraries`}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-xl text-base font-semibold border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    borderColor: "var(--c-gold)",
                    color: "var(--c-text-on-primary)",
                    fontFamily: "var(--c-font-body)",
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  View Itineraries
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== DIVIDER ===== */}
        <SectionDivider variant="lotus" />

        {/* ===== MUST-VISIT PLACES ===== */}
        {!dataLoading && pois.length > 0 && (
          <section className={`relative ${SPACING.sectionPadding}`}>
            <BackgroundPattern pattern="dots" opacity={0.03} />

            <div className={`${LAYOUT.containerWide} relative z-10`}>
              <div className="px-6 mb-10 flex items-end justify-between">
                <div>
                  <h2
                    className={`${TYPOGRAPHY.h1} mb-2`}
                    style={{
                      fontFamily: "var(--c-font-display)",
                      color: "var(--c-text)",
                    }}
                  >
                    Must Visit
                  </h2>
                  <p
                    className="text-base"
                    style={{
                      fontFamily: "var(--c-font-body)",
                      color: "var(--c-text-muted)",
                    }}
                  >
                    The places you cannot miss in {city.name}
                  </p>
                </div>
                <Link
                  href={`/explore/${city.slug}/map`}
                  className="text-sm font-semibold hover:underline hidden sm:flex items-center gap-1"
                  style={{ color: "var(--c-primary)", fontFamily: "var(--c-font-body)" }}
                >
                  See all on map
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="flex gap-5 overflow-x-auto scrollbar-hide px-6 pb-4">
                {pois.map((poi, i) => (
                  <motion.div
                    key={poi.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="shrink-0 w-64"
                  >
                    <Link href={`/explore/${city.slug}/poi/${poi.slug}`}>
                      <div
                        className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                        style={{
                          backgroundColor: "var(--c-surface)",
                          border: "1px solid var(--c-border)",
                          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                        }}
                      >
                        <div className="relative h-44 overflow-hidden">
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
                                background: `linear-gradient(135deg, var(--c-primary)20, var(--c-gold)20)`,
                              }}
                            >
                              {poi.categoryEmoji || "\uD83D\uDCCD"}
                            </div>
                          )}
                          <div
                            className="absolute inset-0 opacity-40"
                            style={{
                              background:
                                "linear-gradient(to top, var(--c-surface), transparent 50%)",
                            }}
                          />
                        </div>
                        <div className="p-4">
                          {poi.categoryName && (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold mb-2 uppercase tracking-wider"
                              style={{
                                backgroundColor: `${poi.categoryColor || "var(--c-primary)"}14`,
                                color: poi.categoryColor || "var(--c-primary)",
                              }}
                            >
                              {poi.categoryEmoji && (
                                <span className="text-xs">{poi.categoryEmoji}</span>
                              )}
                              {poi.categoryName}
                            </span>
                          )}
                          <h3
                            className="text-base font-semibold leading-tight"
                            style={{
                              fontFamily: "var(--c-font-display)",
                              color: "var(--c-text)",
                            }}
                          >
                            {poi.name}
                          </h3>
                        </div>
                        {/* Gold accent bottom line */}
                        <div
                          className="h-0.5 w-0 group-hover:w-full transition-all duration-500"
                          style={{ backgroundColor: "var(--c-gold)" }}
                        />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===== DIVIDER ===== */}
        {!dataLoading && categories.filter((c) => (c._count?.pois ?? 0) > 0).length > 0 && (
          <SectionDivider variant="ornate" />
        )}

        {/* ===== CATEGORIES ===== */}
        {!dataLoading && (() => {
          const activeCategories = categories.filter((c) => (c._count?.pois ?? 0) > 0);
          if (activeCategories.length === 0) return null;
          return (
            <section className="py-12">
              <div className={LAYOUT.container}>
                <h2
                  className={`${TYPOGRAPHY.h1} mb-8`}
                  style={{
                    fontFamily: "var(--c-font-display)",
                    color: "var(--c-text)",
                  }}
                >
                  Explore by Category
                </h2>
                <div className={GRID.categories}>
                  {activeCategories.map((cat, i) => {
                    const poiCount = cat._count?.pois ?? 0;
                    return (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.06 }}
                      >
                        <Link
                          href={`/explore/${city.slug}/map?category=${cat.id}`}
                          className="group flex flex-col items-center gap-3 px-4 py-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1"
                          style={{
                            borderColor: cat.color ? `${cat.color}30` : "var(--c-border)",
                            backgroundColor: "var(--c-surface)",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                          }}
                        >
                          {/* Icon circle */}
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                            style={{
                              backgroundColor: cat.color ? `${cat.color}15` : "var(--c-primary)10",
                              color: cat.color || "var(--c-primary)",
                            }}
                          >
                            <CategoryIcon icon={cat.icon} className="w-5 h-5" />
                          </div>

                          {/* Name */}
                          <span
                            className="text-sm font-semibold text-center leading-tight"
                            style={{
                              fontFamily: "var(--c-font-body)",
                              color: "var(--c-text)",
                            }}
                          >
                            {cat.name}
                          </span>

                          {/* Count */}
                          <span
                            className="text-xs font-medium"
                            style={{ color: "var(--c-text-muted)" }}
                          >
                            {poiCount} {poiCount === 1 ? "place" : "places"}
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })()}

        {/* ===== DIVIDER ===== */}
        {!dataLoading && itineraries.length > 0 && (
          <SectionDivider variant="arch" />
        )}

        {/* ===== FEATURED ITINERARY ===== */}
        {!dataLoading && itineraries.length > 0 && (
          <section className={`relative ${SPACING.sectionPadding}`}>
            <BackgroundPattern pattern="paisley" opacity={0.025} />

            <div className={`${LAYOUT.container} relative z-10`}>
              <div className="mb-10 flex items-end justify-between">
                <div>
                  <h2
                    className={`${TYPOGRAPHY.h1} mb-2`}
                    style={{
                      fontFamily: "var(--c-font-display)",
                      color: "var(--c-text)",
                    }}
                  >
                    Featured Itinerary
                  </h2>
                  <p
                    className="text-base"
                    style={{
                      fontFamily: "var(--c-font-body)",
                      color: "var(--c-text-muted)",
                    }}
                  >
                    A curated route through {city.name}
                  </p>
                </div>
                {itineraries.length > 1 && (
                  <Link
                    href={`/explore/${city.slug}/itineraries`}
                    className="text-sm font-semibold hover:underline hidden sm:flex items-center gap-1"
                    style={{ color: "var(--c-primary)", fontFamily: "var(--c-font-body)" }}
                  >
                    View all itineraries
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>

              {(() => {
                const featured = itineraries[0];
                const stops =
                  featured.stopCount || featured._count?.stops || 0;
                return (
                  <Link
                    href={`/explore/${city.slug}/itinerary/${featured.slug}`}
                  >
                    <DecorativeCard variant="simple">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="group relative rounded-xl overflow-hidden"
                      >
                        {/* Cover */}
                        <div className="relative h-56 md:h-72 overflow-hidden rounded-xl">
                          {featured.coverImageUrl ? (
                            <img
                              src={featured.coverImageUrl}
                              alt={featured.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <div
                              className="w-full h-full"
                              style={{
                                background: `linear-gradient(135deg, var(--c-primary)40, var(--c-deep), var(--c-gold)30)`,
                              }}
                            />
                          )}
                          <div
                            className="absolute inset-0"
                            style={{
                              background:
                                "linear-gradient(to top, var(--c-deep) 0%, var(--c-deep)60 30%, transparent 70%)",
                            }}
                          />
                        </div>

                        {/* Content overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            {featured.durationMinutes && (
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur"
                                style={{
                                  backgroundColor: "var(--c-gold)30",
                                  color: "var(--c-text-on-primary)",
                                  border: "1px solid var(--c-gold)40",
                                }}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {formatDuration(featured.durationMinutes)}
                              </span>
                            )}
                            {stops > 0 && (
                              <span
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur"
                                style={{
                                  backgroundColor: "var(--c-gold)30",
                                  color: "var(--c-text-on-primary)",
                                  border: "1px solid var(--c-gold)40",
                                }}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                {stops} stops
                              </span>
                            )}
                            {featured.difficulty && (
                              <span
                                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold backdrop-blur"
                                style={{
                                  backgroundColor: "var(--c-gold)30",
                                  color: "var(--c-text-on-primary)",
                                  border: "1px solid var(--c-gold)40",
                                }}
                              >
                                {featured.difficulty}
                              </span>
                            )}
                          </div>
                          <h3
                            className="text-2xl md:text-3xl font-bold mb-2"
                            style={{
                              fontFamily: "var(--c-font-display)",
                              color: "var(--c-text-on-primary)",
                            }}
                          >
                            {featured.title}
                          </h3>
                          {featured.description && (
                            <p
                              className="text-sm line-clamp-2 max-w-xl"
                              style={{
                                color: "var(--c-text-on-primary)",
                                opacity: 0.8,
                                fontFamily: "var(--c-font-body)",
                              }}
                            >
                              {featured.description}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    </DecorativeCard>
                  </Link>
                );
              })()}
            </div>
          </section>
        )}

        {/* ===== DIVIDER ===== */}
        {!dataLoading && collections.length > 0 && (
          <SectionDivider variant="lotus" />
        )}

        {/* ===== COLLECTIONS ===== */}
        {!dataLoading && collections.length > 0 && (
          <section className={`${SPACING.sectionPadding} ${SPACING.contentBottom}`}>
            <div className={LAYOUT.container}>
              <div className="mb-10 flex items-end justify-between">
                <div>
                  <h2
                    className={`${TYPOGRAPHY.h1} mb-2`}
                    style={{
                      fontFamily: "var(--c-font-display)",
                      color: "var(--c-text)",
                    }}
                  >
                    Collections
                  </h2>
                  <p
                    className="text-base"
                    style={{
                      fontFamily: "var(--c-font-body)",
                      color: "var(--c-text-muted)",
                    }}
                  >
                    Themed guides curated for you
                  </p>
                </div>
                <Link
                  href={`/explore/${city.slug}/collections`}
                  className="text-sm font-semibold hover:underline hidden sm:flex items-center gap-1"
                  style={{ color: "var(--c-primary)", fontFamily: "var(--c-font-body)" }}
                >
                  View all
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                {collections.map((col, i) => {
                  const count = col.itemCount || col._count?.items || 0;
                  return (
                    <motion.div
                      key={col.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.06 }}
                    >
                      <Link
                        href={`/explore/${city.slug}/collection/${col.slug}`}
                      >
                        <div
                          className="group flex gap-4 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
                          style={{
                            backgroundColor: "var(--c-surface)",
                            border: "1px solid var(--c-border)",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                          }}
                        >
                          {col.coverImageUrl ? (
                            <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden">
                              <img
                                src={col.coverImageUrl}
                                alt={col.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                          ) : (
                            <div
                              className="w-20 h-20 shrink-0 rounded-xl flex items-center justify-center text-2xl"
                              style={{
                                background: `linear-gradient(135deg, var(--c-primary)18, var(--c-gold)18)`,
                              }}
                            >
                              {"\uD83D\uDCDA"}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-base font-semibold mb-1 truncate"
                              style={{
                                fontFamily: "var(--c-font-display)",
                                color: "var(--c-text)",
                              }}
                            >
                              {col.title}
                            </h3>
                            {col.description && (
                              <p
                                className="text-xs line-clamp-2 mb-2"
                                style={{
                                  color: "var(--c-text-muted)",
                                  fontFamily: "var(--c-font-body)",
                                }}
                              >
                                {col.description}
                              </p>
                            )}
                            {count > 0 && (
                              <GoldAccent variant="text">
                                <span className="text-xs font-semibold">
                                  {count} {count === 1 ? "place" : "places"}
                                </span>
                              </GoldAccent>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Loading state for data */}
        {dataLoading && (
          <section className="py-24">
            <div className={`${LAYOUT.container} text-center`}>
              <div className="flex items-center justify-center gap-3">
                <div
                  className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: "var(--c-gold)" }}
                />
                <span
                  className="text-sm"
                  style={{
                    color: "var(--c-text-muted)",
                    fontFamily: "var(--c-font-body)",
                  }}
                >
                  Loading places and itineraries...
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Empty state */}
        {!dataLoading &&
          pois.length === 0 &&
          itineraries.length === 0 &&
          collections.length === 0 &&
          categories.length === 0 && (
            <section className="py-24">
              <div className={`${LAYOUT.container} text-center`}>
                <GoldAccent variant="text">
                  <p
                    className="text-lg"
                    style={{ fontFamily: "var(--c-font-display)" }}
                  >
                    Curated places and itineraries for {city.name} coming soon.
                  </p>
                </GoldAccent>
              </div>
            </section>
          )}

        {/* Bottom flourish */}
        <div className="pb-8">
          <SectionDivider variant="simple" />
        </div>
    </div>
  );
}
