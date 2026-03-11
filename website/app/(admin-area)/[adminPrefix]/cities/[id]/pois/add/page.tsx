"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";

interface PlaceResult {
  name: string;
  address: string;
  rating?: number;
  googlePlaceId: string;
  latitude: number;
  longitude: number;
  types?: string[];
}

export default function QuickAddPOIPage() {
  const params = useParams();
  const router = useRouter();
  const adminPrefix = params.adminPrefix as string;
  const cityId = params.id as string;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [existingPlaceIds, setExistingPlaceIds] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [city, setCity] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCity = async () => {
      try {
        const [cityRes, catsRes, poisRes] = await Promise.allSettled([
          apiClient.getCityBySlug(cityId),
          apiClient.getCategories({ limit: 100 }),
          apiClient.getCityPOIs(cityId, { limit: 100 }),
        ]);

        if (cityRes.status === "fulfilled") setCity(cityRes.value.data);
        if (catsRes.status === "fulfilled") setCategories(catsRes.value.data ?? []);
        if (poisRes.status === "fulfilled") {
          const ids = new Set<string>();
          for (const poi of poisRes.value.data ?? []) {
            if (poi.googlePlaceId) ids.add(poi.googlePlaceId);
          }
          setExistingPlaceIds(ids);
        }
      } catch {
        // Best effort
      }
    };
    fetchCity();
  }, [cityId]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    if (!city) {
      setError("City data not loaded");
      return;
    }

    try {
      setSearching(true);
      setError("");
      const bounds = {
        northLat: (city.centerLat ?? 0) + 0.2,
        southLat: (city.centerLat ?? 0) - 0.2,
        eastLng: (city.centerLng ?? 0) + 0.2,
        westLng: (city.centerLng ?? 0) - 0.2,
      };
      const res = await apiClient.searchPlaces(query, bounds);
      setResults(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleImport = async (place: PlaceResult) => {
    try {
      setImporting(place.googlePlaceId);
      setError("");

      const defaultCategory = categories.length > 0 ? categories[0].id : undefined;

      const res = await apiClient.createPOI({
        cityId,
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        address: place.address,
        googlePlaceId: place.googlePlaceId,
        categoryId: defaultCategory,
      });

      const poiId = res.data?.id;
      if (poiId) {
        router.push(`/${adminPrefix}/pois/${poiId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setImporting(null);
    }
  };

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-[13px]">
        <Link href={`/${adminPrefix}/cities`} className="text-gray-400 hover:text-white">Cities</Link>
        <ChevronRight />
        <Link href={`/${adminPrefix}/cities/${cityId}`} className="text-gray-400 hover:text-white">City</Link>
        <ChevronRight />
        <Link href={`/${adminPrefix}/cities/${cityId}/pois`} className="text-gray-400 hover:text-white">POIs</Link>
        <ChevronRight />
        <span className="text-gray-200">Quick Add</span>
      </nav>

      <h1 className="text-xl font-semibold">Quick Add from Google</h1>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-8 w-full rounded-md border border-gray-700 bg-gray-900 pl-8 pr-3 text-[13px] text-gray-300 placeholder:text-gray-500 focus:border-gray-500 focus:outline-none"
            placeholder="Search for a place..."
          />
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="h-8 px-3 inline-flex items-center rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors disabled:opacity-50"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{error}</div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((place) => {
            const alreadyAdded = existingPlaceIds.has(place.googlePlaceId);
            return (
              <div
                key={place.googlePlaceId}
                className="border border-gray-800 rounded-lg bg-gray-900 p-3 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-[13px] font-medium text-gray-200">{place.name}</p>
                  <p className="text-xs text-gray-500 truncate">{place.address}</p>
                  {place.rating != null && (
                    <span className="text-xs text-amber-400 mt-0.5 inline-block">
                      Rating: {place.rating}
                    </span>
                  )}
                </div>
                {alreadyAdded ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-500/10 text-gray-400 shrink-0">
                    Already Added
                  </span>
                ) : (
                  <button
                    onClick={() => handleImport(place)}
                    disabled={importing === place.googlePlaceId}
                    className="h-7 px-3 rounded-md bg-white text-gray-900 hover:bg-gray-100 text-[13px] font-medium transition-colors disabled:opacity-50 shrink-0"
                  >
                    {importing === place.googlePlaceId ? "Importing..." : "Import"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!searching && results.length === 0 && query && (
        <div className="border border-gray-800 rounded-lg p-8 text-center">
          <p className="text-[13px] text-gray-500">No results found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}

function ChevronRight() {
  return (
    <svg className="h-3.5 w-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
