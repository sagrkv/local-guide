"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useCity } from "@/lib/city-context";
import { useCulturalTheme } from "@/components/cultural";
import CityMap from "@/components/map/CityMap";
import POIPopup from "@/components/map/POIPopup";
import CategoryFilter from "@/components/map/CategoryFilter";
import { SurpriseMe } from "@/components/explore/SurpriseMe";
import { DownloadMapButton } from "@/components/explore/DownloadMapButton";
import { OfflineBanner } from "@/components/explore/OfflineBanner";
import type maplibregl from "maplibre-gl";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

/** Cities with significant elevation changes that benefit from terrain rendering */
const TERRAIN_CITIES = ["mysore", "goa", "coorg", "ooty", "munnar"];

interface Category {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
}

interface SelectedPOI {
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
}

interface MoodCollection {
  id: string;
  title: string;
  slug: string;
  icon?: string;
  _count: { items: number };
}

interface MoodCollectionDetail {
  items: Array<{ poi: { id: string; latitude: number; longitude: number } }>;
}

export default function CityMapPage() {
  const { city, loading, error } = useCity();
  const theme = useCulturalTheme();
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(
    null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<SelectedPOI | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  // Mood + day trip filter state
  const [moods, setMoods] = useState<MoodCollection[]>([]);
  const [activeMoodSlug, setActiveMoodSlug] = useState<string | null>(null);
  const [activeMoodTitle, setActiveMoodTitle] = useState<string | null>(null);
  const [moodPoiIds, setMoodPoiIds] = useState<Set<string> | null>(null);
  const [showDayTrips, setShowDayTrips] = useState(false);
  const [surpriseOpen, setSurpriseOpen] = useState(false);

  // Fetch categories
  useEffect(() => {
    if (!city?.id) return;
    fetch(`${API_BASE}/cities/${city.id}/categories`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setCategories(
          Array.isArray(data) ? data : data.categories || data.data || [],
        );
      })
      .catch(() => setCategories([]));
  }, [city?.id]);

  // Fetch GeoJSON (filtered)
  useEffect(() => {
    if (!city?.slug) return;
    setGeoLoading(true);

    const params = new URLSearchParams();
    if (activeFilters.length > 0) {
      activeFilters.forEach((id) => params.append("category", id));
    }
    const query = params.toString();
    const url = `${API_BASE}/cities/${city.slug}/pois.geojson${query ? `?${query}` : ""}`;

    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setGeojson(data);
      })
      .catch(() => setGeojson(null))
      .finally(() => setGeoLoading(false));
  }, [city?.slug, activeFilters]);

  // Fetch mood collections
  useEffect(() => {
    if (!city?.id) return;
    fetch(`${API_BASE}/cities/${city.id}/collections?type=mood&limit=50`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        const list = json.data || json.collections || [];
        setMoods(Array.isArray(list) ? list : []);
      })
      .catch(() => setMoods([]));
  }, [city?.id]);

  // When a mood is selected, fetch its POI IDs and fit bounds
  useEffect(() => {
    if (!activeMoodSlug || !city?.id) {
      setMoodPoiIds(null);
      return;
    }

    fetch(`${API_BASE}/cities/${city.id}/collections/${activeMoodSlug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const detail: MoodCollectionDetail | null = json?.data || json;
        if (!detail?.items) {
          setMoodPoiIds(null);
          return;
        }

        const ids = new Set(detail.items.map((item) => item.poi.id));
        setMoodPoiIds(ids);

        // Auto-fit bounds to mood POIs
        const coords = detail.items
          .map((item) => item.poi)
          .filter((p) => p.latitude && p.longitude);
        if (coords.length > 0 && mapInstanceRef.current) {
          const bounds = coords.reduce(
            (b, p) => ({
              minLng: Math.min(b.minLng, p.longitude),
              maxLng: Math.max(b.maxLng, p.longitude),
              minLat: Math.min(b.minLat, p.latitude),
              maxLat: Math.max(b.maxLat, p.latitude),
            }),
            { minLng: 180, maxLng: -180, minLat: 90, maxLat: -90 },
          );
          mapInstanceRef.current.fitBounds(
            [
              [bounds.minLng, bounds.minLat],
              [bounds.maxLng, bounds.maxLat],
            ],
            { padding: 80, duration: 1200 },
          );
        }
      })
      .catch(() => setMoodPoiIds(null));
  }, [activeMoodSlug, city?.id]);

  // Build POI list for SurpriseMe from geojson features
  const surprisePois = useMemo(() => {
    if (!geojson?.features) return [];
    return geojson.features
      .filter((f) => f.properties && f.geometry.type === "Point")
      .map((f) => ({
        id: f.properties!.id,
        name: f.properties!.name,
        slug: f.properties!.slug,
        shortDescription: f.properties!.shortDescription,
        latitude: (f.geometry as GeoJSON.Point).coordinates[1],
        longitude: (f.geometry as GeoJSON.Point).coordinates[0],
        priority: f.properties!.priority || "RECOMMENDED",
        category: f.properties!.category
          ? { name: f.properties!.category, emoji: f.properties!.categoryIcon }
          : undefined,
        photos: f.properties!.primaryPhotoUrl
          ? [{ url: f.properties!.primaryPhotoUrl }]
          : [],
      }));
  }, [geojson]);

  const handleClearMoodFilter = useCallback(() => {
    setActiveMoodSlug(null);
    setActiveMoodTitle(null);
    setMoodPoiIds(null);
  }, []);

  const handleSelectMood = useCallback(
    (slug: string, title: string) => {
      if (activeMoodSlug === slug) {
        handleClearMoodFilter();
      } else {
        setActiveMoodSlug(slug);
        setActiveMoodTitle(title);
      }
    },
    [activeMoodSlug, handleClearMoodFilter],
  );

  const handleToggleDayTrips = useCallback(() => {
    setShowDayTrips((prev) => {
      const next = !prev;
      if (next && mapInstanceRef.current && city) {
        mapInstanceRef.current.flyTo({
          center: [city.centerLng, city.centerLat],
          zoom: Math.max((city.defaultZoom || 13) - 1.5, 8),
          duration: 1200,
        });
      }
      return next;
    });
  }, [city]);

  // Handle marker click
  const handleMarkerClick = useCallback(
    (poiId: string, coordinates: [number, number]) => {
      if (!city?.id) return;

      fetch(`${API_BASE}/cities/${city.id}/pois/${poiId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          const data = json?.data || json;
          if (data) {
            setSelectedPOI({
              ...data,
              lat: data.lat || data.latitude || coordinates[1],
              lng: data.lng || data.longitude || coordinates[0],
            });
          } else {
            setSelectedPOI({
              id: poiId,
              name: poiId,
              slug: poiId,
              lat: coordinates[1],
              lng: coordinates[0],
            });
          }
        })
        .catch(() => {
          setSelectedPOI({
            id: poiId,
            name: poiId,
            slug: poiId,
            lat: coordinates[1],
            lng: coordinates[0],
          });
        });
    },
    [city?.id],
  );

  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo({
            center: [pos.coords.longitude, pos.coords.latitude],
            zoom: 15,
            duration: 1500,
          });
        }
      },
      () => {},
    );
  }, []);

  const handleSurprise = useCallback(() => {
    setSurpriseOpen(true);
  }, []);

  const handleMapReady = useCallback((map: maplibregl.Map) => {
    mapInstanceRef.current = map;
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--pm-paper, #FFF9F0)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--pm-accent, #D4A574)" }}
          />
          <span
            className="text-xs tracking-wide uppercase"
            style={{
              color: "var(--pm-muted, #8B7D6B)",
              fontFamily: "var(--pm-font-body, 'DM Sans', sans-serif)",
            }}
          >
            Loading map...
          </span>
        </div>
      </div>
    );
  }

  if (error || !city) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--pm-paper, #FFF9F0)" }}
      >
        <div className="text-center">
          <h1
            className="text-2xl font-bold mb-2"
            style={{
              color: "var(--pm-ink, #2D2926)",
              fontFamily: "var(--pm-font-display, 'Fraunces', serif)",
            }}
          >
            City not found
          </h1>
          <p className="mb-6" style={{ color: "var(--pm-muted, #8B7D6B)" }}>
            {error || "We couldn't find this city."}
          </p>
          <Link
            href="/"
            className="hover:underline"
            style={{ color: "var(--pm-primary, #1E3A5F)" }}
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const mapPalette = {
    primary: theme.palette.primary,
    gold: theme.palette.gold,
    bg: theme.palette.background,
    surface: theme.palette.surface,
    text: theme.palette.text,
    textMuted: theme.palette.textMuted,
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Offline banner */}
      <OfflineBanner citySlug={city.slug} />

      {/* Full-bleed map */}
      <div className="absolute inset-0">
        <CityMap
          center={[city.centerLng, city.centerLat]}
          zoom={city.defaultZoom}
          pois={geojson || undefined}
          onMarkerClick={handleMarkerClick}
          onMapReady={handleMapReady}
          palette={mapPalette}
          highlightPoiIds={moodPoiIds}
          showDayTrips={showDayTrips}
          enableTerrain={TERRAIN_CITIES.includes(city.slug)}
        />
      </div>

      {/* Floating header */}
      <header className="relative z-20 m-3 md:m-4">
        <div
          className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-lg backdrop-blur-md"
          style={{
            backgroundColor: `${theme.palette.surface}E8`,
            border: `1.5px solid ${theme.palette.gold}40`,
          }}
        >
          <Link
            href={`/explore/${city.slug}`}
            className="transition-colors hover:opacity-70"
            style={{ color: theme.palette.textMuted }}
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

          <div
            className="w-px h-5"
            style={{ backgroundColor: `${theme.palette.gold}30` }}
          />

          <h1
            className="text-sm font-semibold tracking-wide"
            style={{
              color: theme.palette.text,
              fontFamily: "var(--pm-font-display, 'Fraunces', serif)",
            }}
          >
            {city.name}
          </h1>

          {geoLoading && (
            <div
              className="w-3 h-3 border-[1.5px] border-t-transparent rounded-full animate-spin"
              style={{ borderColor: theme.palette.gold }}
            />
          )}

          <div
            className="w-px h-5"
            style={{ backgroundColor: `${theme.palette.gold}30` }}
          />

          {/* Action buttons */}
          <button
            onClick={handleNearMe}
            className="p-1.5 rounded-lg transition-all hover:scale-110"
            style={{ color: theme.palette.textMuted }}
            title="Find my location"
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
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          <button
            onClick={handleSurprise}
            className="p-1.5 rounded-lg transition-all hover:scale-110"
            style={{ color: theme.palette.gold }}
            title="Surprise me"
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
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Floating category filter */}
      {categories.length > 0 && (
        <div className="relative z-10 mx-3 md:mx-4 -mt-1">
          <div
            className="rounded-2xl shadow-md backdrop-blur-md overflow-hidden"
            style={{
              backgroundColor: `${theme.palette.surface}E0`,
              border: `1px solid ${theme.palette.gold}25`,
            }}
          >
            <CategoryFilter
              categories={categories}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
            />
          </div>
        </div>
      )}

      {/* Mood / Day Trip toolbar */}
      {geojson && (
        <div className="relative z-10 mx-3 md:mx-4 mt-2">
          <div
            className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-xl shadow-md backdrop-blur-md"
            style={{
              backgroundColor: `${theme.palette.surface}E0`,
              border: `1px solid ${theme.palette.gold}25`,
            }}
          >
            {/* All Spots */}
            <button
              onClick={() => {
                handleClearMoodFilter();
                setShowDayTrips(false);
              }}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={
                !activeMoodSlug && !showDayTrips
                  ? {
                      backgroundColor: theme.palette.primary,
                      color: "#fff",
                    }
                  : {
                      backgroundColor: "transparent",
                      color: theme.palette.textMuted,
                    }
              }
            >
              All Spots
            </button>

            {/* Mood dropdown */}
            {moods.length > 0 && (
              <select
                value={activeMoodSlug || ""}
                onChange={(e) => {
                  const slug = e.target.value;
                  if (!slug) {
                    handleClearMoodFilter();
                  } else {
                    const mood = moods.find((m) => m.slug === slug);
                    if (mood) handleSelectMood(slug, mood.title);
                  }
                }}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all appearance-none cursor-pointer"
                style={{
                  backgroundColor: activeMoodSlug
                    ? `${theme.palette.gold}30`
                    : "transparent",
                  color: activeMoodSlug
                    ? theme.palette.text
                    : theme.palette.textMuted,
                  border: "none",
                  outline: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B8070' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 4px center",
                  paddingRight: "20px",
                }}
              >
                <option value="">Moods</option>
                {moods.map((mood) => (
                  <option key={mood.id} value={mood.slug}>
                    {mood.icon ? `${mood.icon} ` : ""}{mood.title}
                  </option>
                ))}
              </select>
            )}

            {/* Day Trips toggle */}
            <button
              onClick={handleToggleDayTrips}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={
                showDayTrips
                  ? {
                      backgroundColor: `${theme.palette.gold}30`,
                      color: theme.palette.text,
                    }
                  : {
                      backgroundColor: "transparent",
                      color: theme.palette.textMuted,
                    }
              }
            >
              Day Trips
            </button>

            {/* Divider */}
            <div
              className="w-px h-4 mx-0.5"
              style={{ backgroundColor: `${theme.palette.gold}30` }}
            />

            {/* Surprise Me */}
            <button
              onClick={handleSurprise}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: `${theme.palette.gold}20`,
                color: theme.palette.gold,
              }}
            >
              Surprise Me
            </button>
          </div>
        </div>
      )}

      {/* Active mood chip */}
      {activeMoodSlug && activeMoodTitle && (
        <div className="relative z-10 mx-3 md:mx-4 mt-2">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: `${theme.palette.gold}20`,
              color: theme.palette.text,
              border: `1px solid ${theme.palette.gold}40`,
            }}
          >
            <span>
              Showing: {activeMoodTitle}
              {moodPoiIds ? ` (${moodPoiIds.size} spots)` : ""}
            </span>
            <button
              onClick={handleClearMoodFilter}
              className="ml-1 hover:opacity-70 transition-opacity"
              style={{ color: theme.palette.textMuted }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* POI Popup */}
      {selectedPOI && (
        <>
          {/* Desktop: side panel */}
          <div className="hidden md:block absolute top-4 right-4 z-30 w-80 max-h-[calc(100%-2rem)] overflow-y-auto rounded-2xl shadow-xl">
            <POIPopup
              poi={selectedPOI}
              citySlug={city.slug}
              onClose={() => setSelectedPOI(null)}
            />
          </div>

          {/* Mobile: slide-up sheet */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 z-30 animate-[slideUp_0.3s_ease-out]">
            <POIPopup
              poi={selectedPOI}
              citySlug={city.slug}
              onClose={() => setSelectedPOI(null)}
            />
          </div>
        </>
      )}

      {/* Offline download button */}
      <div className="absolute bottom-4 left-4 z-20 hidden md:block">
        <DownloadMapButton citySlug={city.slug} cityName={city.name} />
      </div>

      {/* Decorative corner accents */}
      <div
        className="pointer-events-none absolute top-0 left-0 w-24 h-24 z-[2]"
        style={{
          borderTop: `2px solid ${theme.palette.gold}30`,
          borderLeft: `2px solid ${theme.palette.gold}30`,
          borderTopLeftRadius: "12px",
          margin: "4px",
        }}
      />
      <div
        className="pointer-events-none absolute top-0 right-0 w-24 h-24 z-[2]"
        style={{
          borderTop: `2px solid ${theme.palette.gold}30`,
          borderRight: `2px solid ${theme.palette.gold}30`,
          borderTopRightRadius: "12px",
          margin: "4px",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 w-24 h-24 z-[2]"
        style={{
          borderBottom: `2px solid ${theme.palette.gold}30`,
          borderLeft: `2px solid ${theme.palette.gold}30`,
          borderBottomLeftRadius: "12px",
          margin: "4px",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-24 h-24 z-[2]"
        style={{
          borderBottom: `2px solid ${theme.palette.gold}30`,
          borderRight: `2px solid ${theme.palette.gold}30`,
          borderBottomRightRadius: "12px",
          margin: "4px",
        }}
      />

      {/* Surprise Me overlay */}
      <SurpriseMe
        pois={surprisePois}
        citySlug={city.slug}
        isOpen={surpriseOpen}
        onClose={() => setSurpriseOpen(false)}
      />

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
