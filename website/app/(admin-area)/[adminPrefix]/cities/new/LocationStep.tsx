"use client";

import { useRef, useCallback } from "react";
import Map, { Marker, type MapRef, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

interface LocationStepProps {
  lat: number | null;
  lng: number | null;
  zoom: number;
  onLatLngChange: (lat: number, lng: number) => void;
  onZoomChange: (zoom: number) => void;
}

export default function LocationStep({
  lat,
  lng,
  zoom,
  onLatLngChange,
  onZoomChange,
}: LocationStepProps) {
  const mapRef = useRef<MapRef>(null);

  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      onLatLngChange(
        Math.round(e.lngLat.lat * 1_000_000) / 1_000_000,
        Math.round(e.lngLat.lng * 1_000_000) / 1_000_000,
      );
    },
    [onLatLngChange],
  );

  const boundsN = lat !== null ? (lat + 0.1).toFixed(4) : "--";
  const boundsS = lat !== null ? (lat - 0.1).toFixed(4) : "--";
  const boundsE = lng !== null ? (lng + 0.1).toFixed(4) : "--";
  const boundsW = lng !== null ? (lng - 0.1).toFixed(4) : "--";

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Click on the map to place the city center pin.
      </p>

      <div className="rounded-lg overflow-hidden border border-gray-700 h-[320px]">
        <Map
          ref={mapRef}
          initialViewState={{
            latitude: lat ?? 20.5937,
            longitude: lng ?? 78.9629,
            zoom: lat !== null ? zoom : 4,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={MAP_STYLE}
          onClick={handleMapClick}
          cursor="crosshair"
        >
          {lat !== null && lng !== null && (
            <Marker latitude={lat} longitude={lng} anchor="bottom">
              <svg
                width="24"
                height="32"
                viewBox="0 0 24 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 0C5.373 0 0 5.373 0 12c0 9 12 20 12 20s12-11 12-20C24 5.373 18.627 0 12 0z"
                  fill="#e94560"
                />
                <circle cx="12" cy="12" r="5" fill="#fff" />
              </svg>
            </Marker>
          )}
        </Map>
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">Latitude</label>
          <input
            type="number"
            step="any"
            value={lat ?? ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onLatLngChange(v, lng ?? 0);
            }}
            className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
            placeholder="12.3456"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">Longitude</label>
          <input
            type="number"
            step="any"
            value={lng ?? ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onLatLngChange(lat ?? 0, v);
            }}
            className="h-8 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-[13px] text-gray-200 focus:border-gray-500 focus:outline-none"
            placeholder="76.6543"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-400">
            Default Zoom ({zoom})
          </label>
          <input
            type="range"
            min={12}
            max={16}
            step={1}
            value={zoom}
            onChange={(e) => onZoomChange(parseInt(e.target.value, 10))}
            className="mt-2 w-full accent-gray-400"
          />
        </div>
      </div>

      {/* Auto-calculated bounds */}
      <div className="grid grid-cols-4 gap-3">
        {(
          [
            ["North", boundsN],
            ["South", boundsS],
            ["East", boundsE],
            ["West", boundsW],
          ] as const
        ).map(([label, val]) => (
          <div key={label} className="space-y-1">
            <label className="text-xs font-medium text-gray-500">{label}</label>
            <input
              readOnly
              value={val}
              className="h-8 w-full rounded-md border border-gray-800 bg-gray-950/50 px-3 text-[13px] text-gray-500 cursor-not-allowed"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
