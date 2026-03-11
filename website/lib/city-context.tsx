"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CityTheme {
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorBackground: string;
  colorText: string;
  displayFontFamily: string;
  bodyFontFamily: string;
  displayFontUrl?: string;
  bodyFontUrl?: string;
  logoUrl?: string;
  emblemUrl?: string;
  mapTileUrl?: string;
  mapStyleJson?: Record<string, unknown>;
  iconPack: string;
}

export interface CityData {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  heroImageUrl?: string;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  theme?: CityTheme;
}

interface CityContextValue {
  city: CityData | null;
  loading: boolean;
  error: string | null;
}

const CityContext = createContext<CityContextValue>({
  city: null,
  loading: true,
  error: null,
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

export function CityProvider({
  citySlug,
  children,
}: {
  citySlug: string;
  children: ReactNode;
}) {
  const [city, setCity] = useState<CityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCity = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/cities/${citySlug}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("City not found");
          }
          throw new Error("Failed to load city data");
        }

        const json = await res.json();
        // API wraps response in { data: ... }
        const data = json.data || json;
        if (!cancelled) {
          setCity(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load city data",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCity();

    return () => {
      cancelled = true;
    };
  }, [citySlug]);

  return (
    <CityContext.Provider value={{ city, loading, error }}>
      {children}
    </CityContext.Provider>
  );
}

export function useCity() {
  const context = useContext(CityContext);
  if (!context) {
    throw new Error("useCity must be used within a CityProvider");
  }
  return context;
}
