"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useCity } from "@/lib/city-context";
import { useCulturalTheme } from "@/components/cultural";
import CityMap from "@/components/map/CityMap";
import POIPopup from "@/components/map/POIPopup";
import CategoryFilter from "@/components/map/CategoryFilter";
import type maplibregl from "maplibre-gl";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

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
    if (!city?.id) return;
    fetch(`${API_BASE}/cities/${city.id}/pois/random`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const data = json?.data || json;
        if (
          data &&
          (data.lat || data.latitude) &&
          (data.lng || data.longitude)
        ) {
          const lng = data.lng || data.longitude;
          const lat = data.lat || data.latitude;
          const map = mapInstanceRef.current;
          if (map) {
            map.flyTo({ center: [lng, lat], zoom: 16, duration: 2000 });
          }
          setSelectedPOI({ ...data, lat, lng });
        }
      })
      .catch(() => {});
  }, [city?.id]);

  const handleMapReady = useCallback((map: maplibregl.Map) => {
    mapInstanceRef.current = map;
  }, []);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--c-bg)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--c-gold)" }}
          />
          <span
            className="text-xs tracking-wide uppercase"
            style={{
              color: "var(--c-text-muted)",
              fontFamily: "var(--c-font-body)",
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
        style={{ background: "var(--c-bg)" }}
      >
        <div className="text-center">
          <h1
            className="text-2xl font-bold mb-2"
            style={{
              color: "var(--c-text)",
              fontFamily: "var(--c-font-display)",
            }}
          >
            City not found
          </h1>
          <p className="mb-6" style={{ color: "var(--c-text-muted)" }}>
            {error || "We couldn't find this city."}
          </p>
          <Link
            href="/"
            className="hover:underline"
            style={{ color: "var(--c-primary)" }}
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
      {/* Full-bleed map */}
      <div className="absolute inset-0">
        <CityMap
          center={[city.centerLng, city.centerLat]}
          zoom={city.defaultZoom}
          pois={geojson || undefined}
          onMarkerClick={handleMarkerClick}
          onMapReady={handleMapReady}
          palette={mapPalette}
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
              fontFamily: "var(--c-font-display)",
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
