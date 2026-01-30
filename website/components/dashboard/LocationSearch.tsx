"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string]; // [south, north, west, east]
}

interface LocationBounds {
  ne: { lat: number; lng: number };
  sw: { lat: number; lng: number };
}

interface LocationSearchProps {
  onLocationSelect: (bounds: LocationBounds, name: string) => void;
  className?: string;
  placeholder?: string;
}

export function LocationSearch({
  onLocationSelect,
  className = "",
  placeholder = "Search location...",
}: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 500);

  // Search Nominatim API
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchLocation = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            debouncedQuery
          )}&limit=5&countrycodes=in`,
          {
            headers: {
              "Accept-Language": "en",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data: NominatimResult[] = await response.json();
        setResults(data);
        setIsOpen(data.length > 0);
      } catch {
        setError("Search failed. Try again.");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchLocation();
  }, [debouncedQuery]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle result selection
  const handleSelect = useCallback(
    (result: NominatimResult) => {
      const [south, north, west, east] = result.boundingbox.map(Number);

      const bounds: LocationBounds = {
        sw: { lat: south, lng: west },
        ne: { lat: north, lng: east },
      };

      // Get a shortened display name (first part before comma)
      const shortName = result.display_name.split(",")[0].trim();

      onLocationSelect(bounds, shortName);
      setQuery(shortName);
      setIsOpen(false);
      setResults([]);
    },
    [onLocationSelect]
  );

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-9 pl-9 pr-3 bg-gray-800/95 backdrop-blur border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/25 transition-all shadow-lg"
          aria-label="Search for a location"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <LoadingSpinner className="w-4 h-4 text-gray-500" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-[9999] overflow-hidden"
          role="listbox"
        >
          {error ? (
            <div className="px-4 py-3 text-sm text-red-400">{error}</div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.place_id}
                  type="button"
                  role="option"
                  onClick={() => handleSelect(result)}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-700/50 transition-colors flex items-start gap-3 group"
                >
                  <MapPinIcon className="w-4 h-4 text-gray-500 group-hover:text-accent mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-accent transition-colors">
                      {result.display_name.split(",")[0]}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {result.display_name.split(",").slice(1, 3).join(",")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
