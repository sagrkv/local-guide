"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MapPalette {
  primary: string;
  gold: string;
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
}

interface CityMapProps {
  center: [number, number]; // [lng, lat]
  zoom: number;
  pois?: GeoJSON.FeatureCollection;
  onMarkerClick?: (poiId: string, coordinates: [number, number]) => void;
  onMapReady?: (map: maplibregl.Map) => void;
  palette?: MapPalette;
  /** When set, POIs matching these IDs render at full opacity; others dim to 0.3 */
  highlightPoiIds?: Set<string> | null;
  /** When true, POIs with zone=day_trip are shown; otherwise they are hidden */
  showDayTrips?: boolean;
}

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")
  );
}

/** Blend two hex colors. ratio=0 → color1, ratio=1 → color2 */
function blend(color1: string, color2: string, ratio: number): string {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);
  return rgbToHex(
    r1 + (r2 - r1) * ratio,
    g1 + (g2 - g1) * ratio,
    b1 + (b2 - b1) * ratio,
  );
}

/** Make a color lighter by blending with white */
function lighten(hex: string, amount: number): string {
  return blend(hex, "#FFFFFF", amount);
}

// ---------------------------------------------------------------------------
// Derive map-specific colors from the cultural palette
// ---------------------------------------------------------------------------

function getMapColors(p: MapPalette) {
  return {
    land: p.bg,
    water: blend("#C4D8E8", p.primary, 0.12),
    waterway: blend("#B0C8DC", p.primary, 0.1),
    green: blend("#D0DCC0", p.bg, 0.35),
    park: blend("#C8D8B4", p.bg, 0.3),
    road: lighten(p.surface, 0.15),
    roadMajor: blend(p.surface, p.bg, 0.4),
    building: blend(p.surface, p.bg, 0.7),
    text: p.textMuted,
    textMajor: p.text,
    boundary: blend(p.gold, "#C8BCA0", 0.3),
    rail: lighten(p.textMuted, 0.5),
  };
}

const DEFAULT_PALETTE: MapPalette = {
  primary: "#4A6FA5",
  gold: "#C5A55A",
  bg: "#F5F0E8",
  surface: "#EBE5DA",
  text: "#5A5040",
  textMuted: "#8B8070",
};

// ---------------------------------------------------------------------------
// Apply cultural tint to the loaded map style
// ---------------------------------------------------------------------------

function tintMapLayers(map: maplibregl.Map, palette: MapPalette) {
  const c = getMapColors(palette);
  const style = map.getStyle();
  if (!style?.layers) return;

  for (const layer of style.layers) {
    const id = layer.id.toLowerCase();

    try {
      // Background
      if (layer.type === "background") {
        map.setPaintProperty(layer.id, "background-color", c.land);
        continue;
      }

      // Water fills
      if (
        layer.type === "fill" &&
        id.includes("water") &&
        !id.includes("way")
      ) {
        map.setPaintProperty(layer.id, "fill-color", c.water);
        map.setPaintProperty(layer.id, "fill-opacity", 0.7);
        continue;
      }

      // Waterways (rivers, streams)
      if (layer.type === "line" && id.includes("waterway")) {
        map.setPaintProperty(layer.id, "line-color", c.waterway);
        map.setPaintProperty(layer.id, "line-opacity", 0.5);
        continue;
      }

      // Parks, green areas
      if (
        layer.type === "fill" &&
        (id.includes("park") || id.includes("green") || id.includes("forest"))
      ) {
        map.setPaintProperty(layer.id, "fill-color", c.park);
        map.setPaintProperty(layer.id, "fill-opacity", 0.5);
        continue;
      }

      // Landcover (grass, wood, etc.)
      if (layer.type === "fill" && id.includes("landcover")) {
        map.setPaintProperty(layer.id, "fill-color", c.green);
        map.setPaintProperty(layer.id, "fill-opacity", 0.35);
        continue;
      }

      // Landuse
      if (layer.type === "fill" && id.includes("landuse")) {
        map.setPaintProperty(layer.id, "fill-color", c.green);
        map.setPaintProperty(layer.id, "fill-opacity", 0.2);
        continue;
      }

      // Buildings
      if (layer.type === "fill" && id.includes("building")) {
        map.setPaintProperty(layer.id, "fill-color", c.building);
        map.setPaintProperty(layer.id, "fill-opacity", 0.3);
        continue;
      }

      // Roads — major
      if (
        layer.type === "line" &&
        (id.includes("highway") ||
          id.includes("trunk") ||
          id.includes("primary") ||
          id.includes("motorway"))
      ) {
        map.setPaintProperty(layer.id, "line-color", c.roadMajor);
        map.setPaintProperty(layer.id, "line-opacity", 0.6);
        continue;
      }

      // Roads — minor (secondary, tertiary, residential, path, service)
      if (
        layer.type === "line" &&
        (id.includes("road") ||
          id.includes("secondary") ||
          id.includes("tertiary") ||
          id.includes("minor") ||
          id.includes("service") ||
          id.includes("path") ||
          id.includes("street") ||
          id.includes("transit") ||
          id.includes("transportation"))
      ) {
        map.setPaintProperty(layer.id, "line-color", c.road);
        map.setPaintProperty(layer.id, "line-opacity", 0.4);
        continue;
      }

      // Railway
      if (layer.type === "line" && id.includes("rail")) {
        map.setPaintProperty(layer.id, "line-color", c.rail);
        map.setPaintProperty(layer.id, "line-opacity", 0.25);
        continue;
      }

      // Boundaries
      if (layer.type === "line" && id.includes("boundary")) {
        map.setPaintProperty(layer.id, "line-color", c.boundary);
        map.setPaintProperty(layer.id, "line-opacity", 0.25);
        continue;
      }

      // Text labels — major places
      if (
        layer.type === "symbol" &&
        (id.includes("place") || id.includes("city") || id.includes("town"))
      ) {
        map.setPaintProperty(layer.id, "text-color", c.textMajor);
        map.setPaintProperty(layer.id, "text-opacity", 0.7);
        continue;
      }

      // Text labels — everything else
      if (layer.type === "symbol") {
        map.setPaintProperty(layer.id, "text-color", c.text);
        map.setPaintProperty(layer.id, "text-opacity", 0.5);
        continue;
      }
    } catch {
      // Some properties may not be settable — skip silently
    }
  }

  // Hide overly-detailed layers for a cleaner look
  const hidePatterns = [
    "housenumber",
    "poi_",
    "aeroway",
    "aerodrome",
    "ferry",
  ];
  for (const layer of style.layers) {
    for (const pattern of hidePatterns) {
      if (layer.id.toLowerCase().includes(pattern)) {
        try {
          map.setLayoutProperty(layer.id, "visibility", "none");
        } catch {
          // skip
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CityMap({
  center,
  zoom,
  pois,
  onMarkerClick,
  onMapReady,
  palette,
  highlightPoiIds,
  showDayTrips,
}: CityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const effectivePalette = palette || DEFAULT_PALETTE;

  const handleMarkerClick = useCallback(
    (poiId: string, coordinates: [number, number]) => {
      onMarkerClick?.(poiId, coordinates);
    },
    [onMarkerClick],
  );

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center,
      zoom,
      attributionControl: {},
      maxZoom: 18,
      minZoom: 3,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );

    // Apply cultural tinting once style loads
    map.on("style.load", () => {
      tintMapLayers(map, effectivePalette);
    });

    mapRef.current = map;
    onMapReady?.(map);

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-tint when palette changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    tintMapLayers(map, effectivePalette);
  }, [effectivePalette]);

  // Update center/zoom when props change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center, zoom, duration: 1200 });
  }, [center, zoom]);

  // Manage POI data source and layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const mc = getMapColors(effectivePalette);

    const applyData = () => {
      // Remove old layers/source
      const layerIds = [
        "poi-clusters",
        "poi-cluster-count",
        "poi-must-visit",
        "poi-must-visit-glow",
        "poi-recommended",
        "poi-hidden-gem",
        "poi-default",
        "poi-hidden-gem-star",
      ];
      for (const id of layerIds) {
        if (map.getLayer(id)) map.removeLayer(id);
      }
      if (map.getSource("pois")) map.removeSource("pois");

      if (!pois || !pois.features || pois.features.length === 0) return;

      map.addSource("pois", {
        type: "geojson",
        data: pois,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      const gold = effectivePalette.gold;
      const primary = effectivePalette.primary;

      // Cluster circles — warm gold tone
      map.addLayer({
        id: "poi-clusters",
        type: "circle",
        source: "pois",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            gold,
            10,
            lighten(gold, 0.15),
            30,
            lighten(gold, 0.3),
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            10,
            24,
            30,
            32,
          ],
          "circle-stroke-width": 2.5,
          "circle-stroke-color": lighten(gold, 0.6),
          "circle-opacity": 0.9,
        },
      });

      // Cluster count labels
      map.addLayer({
        id: "poi-cluster-count",
        type: "symbol",
        source: "pois",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
          "text-font": ["Noto Sans Bold"],
        },
        paint: {
          "text-color": mc.textMajor,
        },
      });

      // MUST_VISIT — large, prominent with outer glow
      map.addLayer({
        id: "poi-must-visit-glow",
        type: "circle",
        source: "pois",
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          ["==", ["get", "priority"], "MUST_VISIT"],
        ],
        paint: {
          "circle-radius": 16,
          "circle-color": primary,
          "circle-opacity": 0.15,
          "circle-blur": 0.8,
        },
      });

      map.addLayer({
        id: "poi-must-visit",
        type: "circle",
        source: "pois",
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          ["==", ["get", "priority"], "MUST_VISIT"],
        ],
        paint: {
          "circle-radius": 9,
          "circle-color": primary,
          "circle-stroke-width": 2.5,
          "circle-stroke-color": lighten(primary, 0.7),
          "circle-opacity": 0.95,
        },
      });

      // RECOMMENDED — medium
      map.addLayer({
        id: "poi-recommended",
        type: "circle",
        source: "pois",
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          ["==", ["get", "priority"], "RECOMMENDED"],
        ],
        paint: {
          "circle-radius": 7,
          "circle-color": gold,
          "circle-stroke-width": 2,
          "circle-stroke-color": lighten(gold, 0.6),
          "circle-opacity": 0.9,
        },
      });

      // HIDDEN_GEM — small, subtle
      map.addLayer({
        id: "poi-hidden-gem",
        type: "circle",
        source: "pois",
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          ["==", ["get", "priority"], "HIDDEN_GEM"],
        ],
        paint: {
          "circle-radius": 5,
          "circle-color": blend(gold, primary, 0.3),
          "circle-stroke-width": 1.5,
          "circle-stroke-color": lighten(gold, 0.5),
          "circle-opacity": 0.85,
        },
      });

      // Default markers
      map.addLayer({
        id: "poi-default",
        type: "circle",
        source: "pois",
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          ["!=", ["get", "priority"], "MUST_VISIT"],
          ["!=", ["get", "priority"], "RECOMMENDED"],
          ["!=", ["get", "priority"], "HIDDEN_GEM"],
        ],
        paint: {
          "circle-radius": 5.5,
          "circle-color": blend(gold, mc.text, 0.4),
          "circle-stroke-width": 1.5,
          "circle-stroke-color": lighten(gold, 0.55),
          "circle-opacity": 0.8,
        },
      });

      // Star indicator for hidden gems
      map.addLayer({
        id: "poi-hidden-gem-star",
        type: "symbol",
        source: "pois",
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          ["==", ["get", "priority"], "HIDDEN_GEM"],
        ],
        layout: {
          "text-field": "\u2605",
          "text-size": 7,
          "text-offset": [0, -0.1],
          "text-allow-overlap": true,
          "text-font": ["Noto Sans Bold"],
        },
        paint: {
          "text-color": lighten(gold, 0.7),
        },
      });

      // ------- Interactions -------

      const hoverPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12,
        className: "poi-hover-popup",
      });

      const poiLayers = [
        "poi-must-visit",
        "poi-recommended",
        "poi-hidden-gem",
        "poi-default",
      ];

      poiLayers.forEach((layerId) => {
        map.on("mouseenter", layerId, (e) => {
          map.getCanvas().style.cursor = "pointer";
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const coords = (feature.geometry as GeoJSON.Point)
              .coordinates as [number, number];
            const name = feature.properties?.name || "Unknown place";
            const bg = effectivePalette.surface;
            const text = effectivePalette.text;
            const border = effectivePalette.gold;
            hoverPopup
              .setLngLat(coords)
              .setHTML(
                `<div style="padding:5px 10px;font-size:13px;font-weight:600;color:${text};background:${bg};border:1.5px solid ${border};border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.1);font-family:var(--c-font-body, sans-serif);">${name}</div>`,
              )
              .addTo(map);
          }
        });

        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
          hoverPopup.remove();
        });

        map.on("click", layerId, (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const coords = (feature.geometry as GeoJSON.Point)
              .coordinates as [number, number];
            const poiId =
              feature.properties?.slug || feature.properties?.id || "";
            hoverPopup.remove();
            handleMarkerClick(poiId, coords);
          }
        });
      });

      // Click on cluster to zoom in
      map.on("click", "poi-clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["poi-clusters"],
        });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id;
        const source = map.getSource("pois") as maplibregl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId).then((zoomLevel) => {
          map.easeTo({
            center: (features[0].geometry as GeoJSON.Point)
              .coordinates as [number, number],
            zoom: zoomLevel,
          });
        });
      });

      map.on("mouseenter", "poi-clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "poi-clusters", () => {
        map.getCanvas().style.cursor = "";
      });
    };

    if (map.isStyleLoaded()) {
      applyData();
    } else {
      map.on("load", applyData);
    }
  }, [pois, handleMarkerClick, effectivePalette]);

  // Apply highlight / day-trip filtering via paint opacity
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const poiLayers = [
      "poi-must-visit",
      "poi-must-visit-glow",
      "poi-recommended",
      "poi-hidden-gem",
      "poi-default",
      "poi-hidden-gem-star",
    ];

    for (const layerId of poiLayers) {
      if (!map.getLayer(layerId)) continue;

      try {
        const isText = layerId === "poi-hidden-gem-star";
        const opacityProp = isText ? "text-opacity" : "circle-opacity";

        // Build an expression: if highlightPoiIds is set, matched = full, rest = dim
        // Also hide day_trip POIs unless showDayTrips is on
        if (highlightPoiIds && highlightPoiIds.size > 0) {
          const ids = Array.from(highlightPoiIds);
          const expr: maplibregl.ExpressionSpecification = [
            "case",
            // Hide day_trip when toggle off
            ["all", ["==", ["get", "zone"], "day_trip"], ["literal", !showDayTrips]],
            0,
            // Highlighted ids get full opacity
            ["in", ["get", "id"], ["literal", ids]],
            isText ? 1 : 0.95,
            // Everything else dims
            isText ? 0.15 : 0.25,
          ];
          map.setPaintProperty(layerId, opacityProp, expr);
        } else if (!showDayTrips) {
          // No mood filter, just hide day_trip
          const expr: maplibregl.ExpressionSpecification = [
            "case",
            ["==", ["get", "zone"], "day_trip"],
            0,
            isText ? 1 : 0.9,
          ];
          map.setPaintProperty(layerId, opacityProp, expr);
        } else {
          // Show everything — day trips at slightly lower opacity
          const expr: maplibregl.ExpressionSpecification = [
            "case",
            ["==", ["get", "zone"], "day_trip"],
            isText ? 0.7 : 0.6,
            isText ? 1 : 0.9,
          ];
          map.setPaintProperty(layerId, opacityProp, expr);
        }
      } catch {
        // Layer may not exist yet
      }
    }
  }, [highlightPoiIds, showDayTrips]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: 300 }}>
      <div ref={containerRef} className="w-full h-full" />
      {/* Subtle vignette overlay for illustrative feel */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.06) 100%)",
        }}
      />
    </div>
  );
}
