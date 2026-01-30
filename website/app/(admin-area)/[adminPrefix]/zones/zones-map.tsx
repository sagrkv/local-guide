"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

interface ZoneTypeConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

interface ZonesMapProps {
  zones: Zone[];
  center: [number, number];
  zoom: number;
  selectedZone: Zone | null;
  onZoneSelect: (zone: Zone | null) => void;
  zoneTypeConfig: Record<ZoneType, ZoneTypeConfig>;
}

// Create custom marker icons for each zone type
function createZoneIcon(color: string, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 32 : 24;
  const borderWidth = isSelected ? 3 : 2;

  return L.divIcon({
    className: "custom-zone-marker",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${borderWidth}px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        transition: all 0.2s ease;
        ${isSelected ? "transform: scale(1.2);" : ""}
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Component to handle map view changes
function MapController({
  center,
  zoom,
  selectedZone,
}: {
  center: [number, number];
  zoom: number;
  selectedZone: Zone | null;
}) {
  const map = useMap();
  const prevCenterRef = useRef<[number, number]>(center);

  useEffect(() => {
    // Only fly to new center if it changed (city switch)
    if (
      prevCenterRef.current[0] !== center[0] ||
      prevCenterRef.current[1] !== center[1]
    ) {
      map.flyTo(center, zoom, { duration: 1 });
      prevCenterRef.current = center;
    }
  }, [map, center, zoom]);

  useEffect(() => {
    if (selectedZone) {
      map.flyTo([selectedZone.lat, selectedZone.lng], 14, { duration: 0.5 });
    }
  }, [map, selectedZone]);

  return null;
}

export default function ZonesMap({
  zones,
  center,
  zoom,
  selectedZone,
  onZoneSelect,
  zoneTypeConfig,
}: ZonesMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-[600px]"
      style={{ background: "#1a1a1a" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <MapController center={center} zoom={zoom} selectedZone={selectedZone} />

      {zones.map((zone) => {
        const config = zoneTypeConfig[zone.type as ZoneType];
        const isSelected = selectedZone?.name === zone.name;

        return (
          <div key={zone.name}>
            {/* Radius circle */}
            <Circle
              center={[zone.lat, zone.lng]}
              radius={zone.radiusKm * 1000}
              pathOptions={{
                color: config.color,
                fillColor: config.color,
                fillOpacity: isSelected ? 0.25 : 0.1,
                weight: isSelected ? 2 : 1,
                dashArray: isSelected ? undefined : "5, 5",
              }}
              eventHandlers={{
                click: () => onZoneSelect(zone),
              }}
            />

            {/* Center marker */}
            <Marker
              position={[zone.lat, zone.lng]}
              icon={createZoneIcon(config.color, isSelected)}
              eventHandlers={{
                click: () => onZoneSelect(zone),
              }}
            >
              <Popup>
                <div className="min-w-[200px] p-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{config.icon}</span>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">
                        {zone.name}
                      </h3>
                      <p className="text-xs text-gray-500">{config.label}</p>
                    </div>
                  </div>
                  {zone.description && (
                    <p className="text-xs text-gray-600 mb-2">
                      {zone.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Priority: {zone.priority}/10</span>
                    <span>Radius: {zone.radiusKm}km</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {zone.businessTypes.slice(0, 4).map((bt) => (
                      <span
                        key={bt}
                        className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600 capitalize"
                      >
                        {bt}
                      </span>
                    ))}
                    {zone.businessTypes.length > 4 && (
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-500">
                        +{zone.businessTypes.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          </div>
        );
      })}
    </MapContainer>
  );
}
