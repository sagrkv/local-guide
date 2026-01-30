"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { apiClient } from "@/lib/api-client";

// Dynamically import map component to avoid SSR issues with Leaflet
const ZonesMap = dynamic(() => import("./zones-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-zinc-800/50 rounded-xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 border-2 border-emerald-500/20 rounded-full" />
          <div className="absolute inset-0 w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-sm text-zinc-500">Loading map...</span>
      </div>
    </div>
  ),
});

type ZoneType =
  | "COMMERCIAL"
  | "INDUSTRIAL"
  | "TOURIST"
  | "MEDICAL"
  | "EDUCATION"
  | "MIXED";

interface Zone {
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
  type: string;
  businessTypes: string[];
  priority: number;
  description?: string;
}

interface CityData {
  name: string;
  state: string;
  zones: Zone[];
  totalZones: number;
  zonesByType: Record<string, number>;
}

interface ZonesResponse {
  cities: CityData[];
  businessTypes: string[];
  summary: { totalCities: number; totalZones: number };
}

const ZONE_TYPE_CONFIG: Record<
  ZoneType,
  { label: string; color: string; bgColor: string; icon: string }
> = {
  COMMERCIAL: {
    label: "Commercial",
    color: "#10b981",
    bgColor: "bg-emerald-500/10",
    icon: "🏢",
  },
  INDUSTRIAL: {
    label: "Industrial",
    color: "#f59e0b",
    bgColor: "bg-amber-500/10",
    icon: "🏭",
  },
  TOURIST: {
    label: "Tourist",
    color: "#8b5cf6",
    bgColor: "bg-violet-500/10",
    icon: "🏛",
  },
  MEDICAL: {
    label: "Medical",
    color: "#ef4444",
    bgColor: "bg-red-500/10",
    icon: "🏥",
  },
  EDUCATION: {
    label: "Education",
    color: "#3b82f6",
    bgColor: "bg-blue-500/10",
    icon: "🎓",
  },
  MIXED: {
    label: "Mixed Use",
    color: "#6b7280",
    bgColor: "bg-zinc-500/10",
    icon: "🏘",
  },
};

const CITY_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> =
  {
    Bangalore: { lat: 12.9716, lng: 77.5946, zoom: 11 },
    Hyderabad: { lat: 17.385, lng: 78.4867, zoom: 11 },
    Chennai: { lat: 13.0827, lng: 80.2707, zoom: 11 },
    Mysore: { lat: 12.2958, lng: 76.6394, zoom: 12 },
  };

export default function ZonesPage() {
  const [data, setData] = useState<ZonesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>("Bangalore");
  const [selectedTypes, setSelectedTypes] = useState<Set<ZoneType>>(
    new Set([
      "COMMERCIAL",
      "INDUSTRIAL",
      "TOURIST",
      "MEDICAL",
      "EDUCATION",
      "MIXED",
    ]),
  );
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.getZones();
        setData(response);
      } catch (error) {
        console.error("Failed to fetch zones:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentCity = useMemo(() => {
    return data?.cities.find((c) => c.name === selectedCity);
  }, [data, selectedCity]);

  const filteredZones = useMemo(() => {
    if (!currentCity) return [];
    return currentCity.zones.filter((zone) => {
      const matchesType = selectedTypes.has(zone.type as ZoneType);
      const matchesSearch =
        !searchQuery ||
        zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zone.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zone.businessTypes.some((bt) =>
          bt.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      return matchesType && matchesSearch;
    });
  }, [currentCity, selectedTypes, searchQuery]);

  const toggleZoneType = (type: ZoneType) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedTypes(newTypes);
  };

  const mapCenter = CITY_CENTERS[selectedCity] || CITY_CENTERS.Bangalore;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-emerald-500/20 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Discovery Zones
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Geographic micro-areas optimized for lead discovery
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="px-3 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded-lg text-zinc-400">
            {data?.summary.totalCities} Cities
          </span>
          <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            {data?.summary.totalZones} Zones
          </span>
        </div>
      </div>

      {/* City Tabs */}
      <div className="flex gap-2">
        {data?.cities.map((city) => (
          <button
            key={city.name}
            onClick={() => {
              setSelectedCity(city.name);
              setSelectedZone(null);
            }}
            className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
              selectedCity === city.name
                ? "bg-emerald-500 text-zinc-900"
                : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-300 border border-zinc-700/50"
            }`}
          >
            <span className="mr-2">{city.name}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                selectedCity === city.name ? "bg-zinc-900/20" : "bg-zinc-700/50"
              }`}
            >
              {city.totalZones}
            </span>
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search zones or business types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-all text-sm"
          />
        </div>

        {/* Zone Type Filters */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ZONE_TYPE_CONFIG) as ZoneType[]).map((type) => {
            const config = ZONE_TYPE_CONFIG[type];
            const isSelected = selectedTypes.has(type);
            const count =
              currentCity?.zones.filter((z) => z.type === type).length || 0;

            return (
              <button
                key={type}
                onClick={() => toggleZoneType(type)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                  isSelected
                    ? "border-zinc-600 bg-zinc-800/80 text-white"
                    : "border-zinc-700/50 bg-zinc-800/30 text-zinc-500 hover:text-zinc-400"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: isSelected ? config.color : "#52525b",
                  }}
                />
                <span>{config.label}</span>
                <span className="text-xs text-zinc-500">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-700/50 flex items-center justify-between">
              <h2 className="font-medium text-white flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-emerald-400"
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
                {selectedCity} Zones
              </h2>
              <span className="text-xs text-zinc-500">
                Showing {filteredZones.length} of {currentCity?.totalZones || 0}{" "}
                zones
              </span>
            </div>
            <ZonesMap
              zones={filteredZones}
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={mapCenter.zoom}
              selectedZone={selectedZone}
              onZoneSelect={setSelectedZone}
              zoneTypeConfig={ZONE_TYPE_CONFIG}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* City Stats */}
          <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-zinc-400 mb-3">
              {selectedCity} Overview
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(ZONE_TYPE_CONFIG) as ZoneType[]).map((type) => {
                const config = ZONE_TYPE_CONFIG[type];
                const count = currentCity?.zonesByType[type] || 0;
                return (
                  <div
                    key={type}
                    className={`${config.bgColor} border border-zinc-700/30 rounded-lg p-3`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{config.icon}</span>
                      <div>
                        <p className="text-xs text-zinc-500">{config.label}</p>
                        <p
                          className="text-lg font-semibold"
                          style={{ color: config.color }}
                        >
                          {count}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Zone Details */}
          {selectedZone ? (
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl overflow-hidden">
              <div
                className="px-4 py-3 border-b border-zinc-700/50"
                style={{
                  backgroundColor: `${ZONE_TYPE_CONFIG[selectedZone.type as ZoneType].color}10`,
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <span>
                      {ZONE_TYPE_CONFIG[selectedZone.type as ZoneType].icon}
                    </span>
                    {selectedZone.name}
                  </h3>
                  <button
                    onClick={() => setSelectedZone(null)}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {selectedZone.description && (
                  <p className="text-sm text-zinc-400">
                    {selectedZone.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-zinc-500 text-xs">Type</p>
                    <p
                      className="font-medium"
                      style={{
                        color:
                          ZONE_TYPE_CONFIG[selectedZone.type as ZoneType].color,
                      }}
                    >
                      {ZONE_TYPE_CONFIG[selectedZone.type as ZoneType].label}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Priority</p>
                    <p className="font-medium text-white flex items-center gap-1">
                      {selectedZone.priority}
                      <span className="text-xs text-zinc-500">/10</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Radius</p>
                    <p className="font-medium text-white">
                      {selectedZone.radiusKm} km
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Coordinates</p>
                    <p className="font-medium text-white text-xs">
                      {selectedZone.lat.toFixed(4)},{" "}
                      {selectedZone.lng.toFixed(4)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-zinc-500 text-xs mb-2">Business Types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedZone.businessTypes.map((bt) => (
                      <span
                        key={bt}
                        className="px-2 py-1 bg-zinc-700/50 rounded text-xs text-zinc-300 capitalize"
                      >
                        {bt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-zinc-700/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-zinc-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                  />
                </svg>
              </div>
              <p className="text-zinc-400 text-sm">Click a zone on the map</p>
              <p className="text-zinc-600 text-xs mt-1">
                to view detailed information
              </p>
            </div>
          )}

          {/* Zone List */}
          <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-700/50 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">All Zones</h3>
              <span className="text-xs text-zinc-500">
                {filteredZones.length} zones
              </span>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {filteredZones.length === 0 ? (
                <div className="p-4 text-center text-sm text-zinc-500">
                  No zones match your filters
                </div>
              ) : (
                <div className="divide-y divide-zinc-700/30">
                  {filteredZones
                    .sort((a, b) => b.priority - a.priority)
                    .map((zone) => (
                      <button
                        key={zone.name}
                        onClick={() => setSelectedZone(zone)}
                        className={`w-full px-4 py-3 text-left hover:bg-zinc-700/20 transition-colors ${
                          selectedZone?.name === zone.name
                            ? "bg-zinc-700/30"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  ZONE_TYPE_CONFIG[zone.type as ZoneType].color,
                              }}
                            />
                            <span className="text-sm text-white">
                              {zone.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500">
                              P{zone.priority}
                            </span>
                            <span className="text-xs text-zinc-600">
                              {zone.radiusKm}km
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4">
        <h3 className="text-sm font-medium text-zinc-400 mb-3">
          How Zones Work
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-emerald-400"
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
            </div>
            <div>
              <p className="font-medium text-white">Location Bias</p>
              <p className="text-zinc-500 text-xs mt-0.5">
                Each zone has precise coordinates used to bias Google Places
                searches for better local results.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-white">Priority Scoring</p>
              <p className="text-zinc-500 text-xs mt-0.5">
                Zones are searched in priority order (10 = highest). High
                priority zones have better lead density.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-white">Business Type Mapping</p>
              <p className="text-zinc-500 text-xs mt-0.5">
                Each zone is tagged with business types that thrive there,
                enabling smart zone selection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
