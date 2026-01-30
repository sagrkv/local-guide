"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { LocationSearch } from "./LocationSearch";

// Types
export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapBounds {
  ne: LatLng;
  sw: LatLng;
}

export interface MapEstimate {
  cells: number;
  estimatedLeads: number;
  estimatedCredits: number;
  areaKm2: number;
}

// Cell status type for grid visualization
export type CellStatus = "pending" | "in_progress" | "completed" | "error";

interface MapSelectorProps {
  onBoundsSelected: (bounds: MapBounds | null) => void;
  onEstimateUpdate: (estimate: MapEstimate | null) => void;
  externalBounds?: MapBounds | null; // Bounds from saved regions
  initialCenter?: LatLng;
  initialZoom?: number;
  cellStatuses?: Map<string, CellStatus>;
}

// Grid calculation utilities
const EARTH_RADIUS_KM = 6371;
const DEFAULT_CELL_SIZE_KM = 2;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function calculateAreaKm2(bounds: MapBounds): number {
  const { ne, sw } = bounds;
  const avgLat = (ne.lat + sw.lat) / 2;

  const widthKm = haversineDistance(avgLat, sw.lng, avgLat, ne.lng);
  const heightKm = haversineDistance(
    sw.lat,
    (ne.lng + sw.lng) / 2,
    ne.lat,
    (ne.lng + sw.lng) / 2
  );

  return widthKm * heightKm;
}

function calculateCellCount(bounds: MapBounds): number {
  const { ne, sw } = bounds;
  const avgLat = (ne.lat + sw.lat) / 2;

  const widthKm = haversineDistance(avgLat, sw.lng, avgLat, ne.lng);
  const heightKm = haversineDistance(
    sw.lat,
    (ne.lng + sw.lng) / 2,
    ne.lat,
    (ne.lng + sw.lng) / 2
  );

  const cols = Math.max(1, Math.ceil(widthKm / DEFAULT_CELL_SIZE_KM));
  const rows = Math.max(1, Math.ceil(heightKm / DEFAULT_CELL_SIZE_KM));

  return rows * cols;
}

function calculateEstimate(bounds: MapBounds): MapEstimate {
  const LEADS_PER_CELL = 8;
  const CREDITS_PER_LEAD = 0.05;

  const cellCount = calculateCellCount(bounds);
  const areaKm2 = calculateAreaKm2(bounds);
  const estimatedLeads = cellCount * LEADS_PER_CELL;
  const estimatedCredits = estimatedLeads * CREDITS_PER_LEAD;

  return {
    cells: cellCount,
    estimatedLeads,
    estimatedCredits,
    areaKm2: Math.round(areaKm2 * 100) / 100,
  };
}

// Dynamic import for Leaflet (SSR incompatible)
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

export default function MapSelector({
  onBoundsSelected,
  onEstimateUpdate,
  externalBounds,
  initialCenter = { lat: 20.5937, lng: 78.9629 }, // Center of India
  initialZoom = 5,
  cellStatuses,
}: MapSelectorProps) {
  const [selectedBounds, setSelectedBounds] = useState<MapBounds | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const [mapZoom, setMapZoom] = useState(initialZoom);

  // Track external bounds to detect changes
  const prevExternalBoundsRef = useRef<string | null>(null);

  // Handle external bounds changes (from saved regions)
  useEffect(() => {
    if (!externalBounds) return;

    const boundsKey = `${externalBounds.sw.lat},${externalBounds.sw.lng},${externalBounds.ne.lat},${externalBounds.ne.lng}`;

    if (boundsKey !== prevExternalBoundsRef.current) {
      prevExternalBoundsRef.current = boundsKey;
      setSelectedBounds(externalBounds);
      onBoundsSelected(externalBounds);

      const estimate = calculateEstimate(externalBounds);
      onEstimateUpdate(estimate);
    }
  }, [externalBounds, onBoundsSelected, onEstimateUpdate]);

  // Handle bounds change from drawing
  const handleBoundsChange = useCallback(
    (bounds: MapBounds | null) => {
      setSelectedBounds(bounds);
      onBoundsSelected(bounds);

      if (bounds) {
        const estimate = calculateEstimate(bounds);
        onEstimateUpdate(estimate);
      } else {
        onEstimateUpdate(null);
      }
    },
    [onBoundsSelected, onEstimateUpdate]
  );

  // Handle location search selection
  const handleLocationSelect = useCallback(
    (bounds: MapBounds, name: string) => {
      // Calculate center for zoom
      const centerLat = (bounds.ne.lat + bounds.sw.lat) / 2;
      const centerLng = (bounds.ne.lng + bounds.sw.lng) / 2;
      setMapCenter({ lat: centerLat, lng: centerLng });
      setMapZoom(12);

      // Set the bounds for selection
      handleBoundsChange(bounds);
    },
    [handleBoundsChange]
  );

  // Clear selection
  const handleClear = useCallback(() => {
    setSelectedBounds(null);
    setIsDrawing(false);
    onBoundsSelected(null);
    onEstimateUpdate(null);
    prevExternalBoundsRef.current = null;
  }, [onBoundsSelected, onEstimateUpdate]);

  // Start drawing mode (triggered by click on map)
  const handleStartDrawing = useCallback(() => {
    setIsDrawing(true);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[300px]">
      {/* Map Container - Always visible */}
      <div className="absolute inset-0">
        <LeafletMap
          center={mapCenter}
          zoom={mapZoom}
          bounds={selectedBounds}
          externalBounds={externalBounds}
          onBoundsChange={handleBoundsChange}
          isDrawing={isDrawing}
          onDrawingChange={setIsDrawing}
          onStartDrawing={handleStartDrawing}
          cellStatuses={cellStatuses}
          showGridCells={!!selectedBounds}
        />
      </div>

      {/* Location Search - Top Left */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-3 left-3 z-[1000]"
      >
        <LocationSearch
          onLocationSelect={handleLocationSelect}
          placeholder="Search city or area..."
          className="w-64"
        />
      </motion.div>

      {/* Clear Button - Top Right */}
      {selectedBounds && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-3 right-3 z-[1000]"
        >
          <button
            onClick={handleClear}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#FF9500]/20 backdrop-blur border border-[#FF9500]/50 text-[#FF9500] hover:bg-[#FF9500]/30 hover:border-[#FF9500] transition-all shadow-lg"
            title="Clear selection"
            aria-label="Clear region selection"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Selection Info - Bottom */}
      {selectedBounds && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-3 left-3 right-3 z-[1000]"
        >
          <div className="bg-gray-800/95 backdrop-blur border border-gray-700 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <GridIcon className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Selected Area
                  </p>
                  <p className="text-sm font-medium text-white">
                    {calculateEstimate(selectedBounds).areaKm2.toLocaleString()}{" "}
                    km² · {calculateCellCount(selectedBounds)} cells
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Est. leads</p>
                <p className="text-lg font-semibold text-accent">
                  ~{calculateEstimate(selectedBounds).estimatedLeads}
                </p>
              </div>
            </div>

            {/* Edit hint */}
            <p className="text-xs text-gray-500 mt-2 text-center">
              Drag corners to resize · Use Edit/Delete buttons on map to modify
            </p>
          </div>
        </motion.div>
      )}

      {/* Click to Draw Hint - shows when no selection and not drawing */}
      <AnimatePresence>
        {!selectedBounds && !isDrawing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2.5 bg-gray-800/90 backdrop-blur border border-gray-700 text-gray-300 text-sm font-medium rounded-xl shadow-lg flex items-center gap-2"
          >
            <ClickIcon className="w-4 h-4 text-accent" />
            Click on map to draw a region
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawing Instructions */}
      <AnimatePresence>
        {isDrawing && !selectedBounds && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2.5 bg-accent text-background text-sm font-medium rounded-xl shadow-lg flex items-center gap-2"
          >
            <DrawIcon className="w-4 h-4" />
            Click and drag on the map to draw a rectangle
            <span className="text-xs opacity-75 ml-2">(ESC to cancel)</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Legend - shows when there are active cell statuses */}
      {selectedBounds && cellStatuses && cellStatuses.size > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-24 left-3 z-[1000]"
        >
          <div className="bg-gray-800/95 backdrop-blur border border-gray-700 rounded-lg p-2">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">
              Cell Status
            </p>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-gray-500/40 border border-gray-500" />
                <span className="text-xs text-gray-400">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-500/50 border border-blue-500" />
                <span className="text-xs text-gray-400">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-emerald-500/40 border border-emerald-500" />
                <span className="text-xs text-gray-400">Completed</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Icons
function XIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function DrawIcon({ className }: { className?: string }) {
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
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
      />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
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
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

function ClickIcon({ className }: { className?: string }) {
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
        d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
      />
    </svg>
  );
}
