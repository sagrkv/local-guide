"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Rectangle,
  FeatureGroup,
  useMap,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { useTheme } from "next-themes";
import L from "leaflet";
import "leaflet-draw";
import type { LatLng, MapBounds } from "./MapSelector";

// Import Leaflet and Leaflet-draw CSS
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

// Cell status types for visualization
export type CellStatus = "pending" | "in_progress" | "completed" | "error";

export interface GridCell {
  id: string;
  row: number;
  col: number;
  bounds: {
    ne: { lat: number; lng: number };
    sw: { lat: number; lng: number };
  };
  status: CellStatus;
}

// Status colors for grid cells
const CELL_STATUS_COLORS: Record<
  CellStatus,
  { fill: string; stroke: string; opacity: number }
> = {
  pending: { fill: "#6b7280", stroke: "#4b5563", opacity: 0.15 },
  in_progress: { fill: "#3b82f6", stroke: "#2563eb", opacity: 0.3 },
  completed: { fill: "#22c55e", stroke: "#16a34a", opacity: 0.25 },
  error: { fill: "#ef4444", stroke: "#dc2626", opacity: 0.25 },
};

interface LeafletMapProps {
  center: LatLng;
  zoom: number;
  bounds: MapBounds | null;
  externalBounds?: MapBounds | null; // Bounds from saved regions or city presets
  onBoundsChange: (bounds: MapBounds | null) => void;
  isDrawing: boolean;
  onDrawingChange: (isDrawing: boolean) => void;
  onStartDrawing?: () => void; // Callback when user clicks to start drawing
  cellStatuses?: Map<string, CellStatus>;
  showGridCells?: boolean;
}

// Component to sync map view with external bounds changes
function BoundsSync({ bounds }: { bounds: MapBounds | null }) {
  const map = useMap();
  const prevBoundsRef = useRef<string | null>(null);

  useEffect(() => {
    if (!bounds) return;

    // Create a unique key for the bounds to detect changes
    const boundsKey = `${bounds.sw.lat},${bounds.sw.lng},${bounds.ne.lat},${bounds.ne.lng}`;

    // Only fitBounds if bounds actually changed (prevents infinite loops)
    if (boundsKey !== prevBoundsRef.current) {
      prevBoundsRef.current = boundsKey;

      const leafletBounds = L.latLngBounds(
        [bounds.sw.lat, bounds.sw.lng],
        [bounds.ne.lat, bounds.ne.lng]
      );

      map.fitBounds(leafletBounds, {
        padding: [50, 50],
        animate: true,
        duration: 0.5,
      });
    }
  }, [map, bounds]);

  return null;
}

// Component to handle ESC key for canceling drawing
function EscKeyHandler({
  onCancel,
  isDrawing,
}: {
  onCancel: () => void;
  isDrawing: boolean;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawing) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, isDrawing]);

  return null;
}

// Drawing mode visual indicator
function DrawingModeIndicator({ isDrawing }: { isDrawing: boolean }) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (isDrawing) {
      container.style.cursor = "crosshair";
      container.classList.add("drawing-mode");
    } else {
      container.style.cursor = "";
      container.classList.remove("drawing-mode");
    }
    return () => {
      container.style.cursor = "";
      container.classList.remove("drawing-mode");
    };
  }, [map, isDrawing]);

  return null;
}

// Click-to-draw handler - enables drawing mode when clicking on empty map
function ClickToDrawHandler({
  bounds,
  isDrawing,
  onStartDrawing,
}: {
  bounds: MapBounds | null;
  isDrawing: boolean;
  onStartDrawing: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    // Only enable click-to-draw when no bounds selected and not already drawing
    if (bounds || isDrawing) return;

    const handleClick = () => {
      onStartDrawing();
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, bounds, isDrawing, onStartDrawing]);

  return null;
}

// Generate grid cells from bounds
function generateGridCells(bounds: MapBounds): GridCell[] {
  const CELL_SIZE_KM = 2;
  const { ne, sw } = bounds;

  const latDiff = ne.lat - sw.lat;
  const lngDiff = ne.lng - sw.lng;
  const avgLat = (ne.lat + sw.lat) / 2;

  const latKm = latDiff * 111;
  const lngKm = lngDiff * 111 * Math.cos((avgLat * Math.PI) / 180);

  const rows = Math.max(1, Math.ceil(latKm / CELL_SIZE_KM));
  const cols = Math.max(1, Math.ceil(lngKm / CELL_SIZE_KM));

  const latStep = latDiff / rows;
  const lngStep = lngDiff / cols;

  const cells: GridCell[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellSw = {
        lat: sw.lat + row * latStep,
        lng: sw.lng + col * lngStep,
      };
      const cellNe = {
        lat: sw.lat + (row + 1) * latStep,
        lng: sw.lng + (col + 1) * lngStep,
      };

      cells.push({
        id: `cell_${row}_${col}`,
        row,
        col,
        bounds: { ne: cellNe, sw: cellSw },
        status: "pending",
      });
    }
  }

  return cells;
}

// Individual grid cell component
function GridCellRect({ cell, status }: { cell: GridCell; status: CellStatus }) {
  const colors = CELL_STATUS_COLORS[status];

  return (
    <Rectangle
      bounds={[
        [cell.bounds.sw.lat, cell.bounds.sw.lng],
        [cell.bounds.ne.lat, cell.bounds.ne.lng],
      ]}
      pathOptions={{
        color: colors.stroke,
        weight: 0.5,
        fillColor: colors.fill,
        fillOpacity: colors.opacity,
        interactive: false,
      }}
    />
  );
}

// Grid cells overlay component
function GridCellsOverlay({
  bounds,
  cellStatuses,
}: {
  bounds: MapBounds;
  cellStatuses?: Map<string, CellStatus>;
}) {
  const cells = useMemo(() => generateGridCells(bounds), [bounds]);

  return (
    <>
      {cells.map((cell) => {
        const status = cellStatuses?.get(cell.id) || cell.status;
        return <GridCellRect key={cell.id} cell={cell} status={status} />;
      })}
    </>
  );
}

// Editable rectangle component using react-leaflet-draw
function EditableRectangle({
  bounds,
  onBoundsChange,
  isDrawing,
  onDrawingComplete,
}: {
  bounds: MapBounds | null;
  onBoundsChange: (bounds: MapBounds | null) => void;
  isDrawing: boolean;
  onDrawingComplete: () => void;
}) {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const rectangleRef = useRef<L.Rectangle | null>(null);
  const drawHandlerRef = useRef<L.Draw.Rectangle | null>(null);
  const map = useMap();

  // Programmatically enable rectangle drawing when isDrawing becomes true
  useEffect(() => {
    if (isDrawing) {
      // Create and enable the rectangle draw handler
      // Cast map to any because react-leaflet types don't match leaflet-draw types exactly
      const handler = new L.Draw.Rectangle(map as unknown as L.DrawMap, {
        shapeOptions: {
          color: "#FF9500",
          weight: 2,
          fillColor: "#FF9500",
          fillOpacity: 0.2,
        },
      });
      handler.enable();
      drawHandlerRef.current = handler;
    } else {
      // Disable the handler when not drawing
      if (drawHandlerRef.current) {
        drawHandlerRef.current.disable();
        drawHandlerRef.current = null;
      }
    }

    return () => {
      if (drawHandlerRef.current) {
        drawHandlerRef.current.disable();
        drawHandlerRef.current = null;
      }
    };
  }, [isDrawing, map]);

  // Add existing bounds as a rectangle when bounds change externally
  useEffect(() => {
    if (!featureGroupRef.current) return;

    // Clear existing layers
    featureGroupRef.current.clearLayers();
    rectangleRef.current = null;

    if (bounds) {
      // Create a new rectangle for the bounds
      const rectangle = L.rectangle(
        [
          [bounds.sw.lat, bounds.sw.lng],
          [bounds.ne.lat, bounds.ne.lng],
        ],
        {
          color: "#FF9500",
          weight: 2,
          fillColor: "#FF9500",
          fillOpacity: 0.15,
        }
      );

      rectangleRef.current = rectangle;
      featureGroupRef.current.addLayer(rectangle);
    }
  }, [bounds]);

  // Handle created shapes
  const handleCreated = useCallback(
    (e: L.DrawEvents.Created) => {
      const layer = e.layer;

      if (featureGroupRef.current) {
        // Clear previous shapes
        featureGroupRef.current.clearLayers();
        featureGroupRef.current.addLayer(layer);
      }

      if (layer instanceof L.Rectangle) {
        const latLngBounds = layer.getBounds();
        const newBounds: MapBounds = {
          ne: {
            lat: latLngBounds.getNorth(),
            lng: latLngBounds.getEast(),
          },
          sw: {
            lat: latLngBounds.getSouth(),
            lng: latLngBounds.getWest(),
          },
        };
        onBoundsChange(newBounds);
        rectangleRef.current = layer;
      }

      onDrawingComplete();
    },
    [onBoundsChange, onDrawingComplete]
  );

  // Handle edited shapes
  const handleEdited = useCallback(
    (e: L.DrawEvents.Edited) => {
      const layers = e.layers;
      layers.eachLayer((layer: L.Layer) => {
        if (layer instanceof L.Rectangle) {
          const latLngBounds = layer.getBounds();
          const newBounds: MapBounds = {
            ne: {
              lat: latLngBounds.getNorth(),
              lng: latLngBounds.getEast(),
            },
            sw: {
              lat: latLngBounds.getSouth(),
              lng: latLngBounds.getWest(),
            },
          };
          onBoundsChange(newBounds);
        }
      });
    },
    [onBoundsChange]
  );

  // Handle deleted shapes
  const handleDeleted = useCallback(() => {
    onBoundsChange(null);
    rectangleRef.current = null;
  }, [onBoundsChange]);

  return (
    <FeatureGroup ref={featureGroupRef}>
      <EditControl
        position="topright"
        onCreated={handleCreated}
        onEdited={handleEdited}
        onDeleted={handleDeleted}
        draw={{
          rectangle: isDrawing
            ? {
                shapeOptions: {
                  color: "#FF9500",
                  weight: 2,
                  fillColor: "#FF9500",
                  fillOpacity: 0.2,
                },
              }
            : false,
          polygon: false,
          circle: false,
          circlemarker: false,
          marker: false,
          polyline: false,
        }}
        edit={{
          edit: bounds !== null ? {} : false,
          remove: bounds !== null,
        }}
      />
    </FeatureGroup>
  );
}

export default function LeafletMap({
  center,
  zoom,
  bounds,
  externalBounds,
  onBoundsChange,
  isDrawing,
  onDrawingChange,
  onStartDrawing,
  cellStatuses,
  showGridCells = true,
}: LeafletMapProps) {
  const { theme } = useTheme();
  const isDark = theme !== "light";

  const handleDrawingComplete = useCallback(() => {
    onDrawingChange(false);
  }, [onDrawingChange]);

  const handleCancelDrawing = useCallback(() => {
    onDrawingChange(false);
  }, [onDrawingChange]);

  // Use external bounds for syncing view (from saved regions or city presets)
  const boundsToSync = externalBounds || bounds;

  // Select tile URL based on theme
  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const mapBackground = isDark ? "#1a1a1a" : "#f5f5f5";

  return (
    <>
      {/* Drawing mode CSS */}
      <style jsx global>{`
        .drawing-mode {
          box-shadow: inset 0 0 0 3px rgba(255, 149, 0, 0.5);
        }
        /* Hide only the draw tools section (we use custom Draw button) */
        .leaflet-draw-draw-rectangle,
        .leaflet-draw-draw-polygon,
        .leaflet-draw-draw-polyline,
        .leaflet-draw-draw-circle,
        .leaflet-draw-draw-marker,
        .leaflet-draw-draw-circlemarker {
          display: none !important;
        }
        /* Style the edit toolbar - keep it visible */
        .leaflet-draw-edit-edit,
        .leaflet-draw-edit-remove {
          background-color: ${isDark ? "#1f2937" : "#ffffff"} !important;
          border: 1px solid ${isDark ? "#374151" : "#d1d5db"} !important;
          width: 36px !important;
          height: 36px !important;
          line-height: 36px !important;
        }
        .leaflet-draw-edit-edit:hover,
        .leaflet-draw-edit-remove:hover {
          background-color: ${isDark ? "#374151" : "#f3f4f6"} !important;
        }
        /* Position edit toolbar correctly */
        .leaflet-draw-toolbar {
          margin-top: 60px !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        /* Style edit actions (Save/Cancel) */
        .leaflet-draw-actions {
          background: ${isDark ? "#1f2937" : "#ffffff"} !important;
          border: 1px solid ${isDark ? "#374151" : "#d1d5db"} !important;
          border-radius: 8px !important;
          padding: 4px !important;
        }
        .leaflet-draw-actions li {
          margin: 2px !important;
        }
        .leaflet-draw-actions a {
          background: ${isDark ? "#374151" : "#f3f4f6"} !important;
          color: ${isDark ? "#fff" : "#1f2937"} !important;
          border-radius: 4px !important;
          padding: 4px 8px !important;
          font-size: 12px !important;
        }
        .leaflet-draw-actions a:hover {
          background: ${isDark ? "#4b5563" : "#e5e7eb"} !important;
        }
      `}</style>

      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        className="w-full h-full"
        style={{ background: mapBackground }}
        zoomControl={true}
        attributionControl={false}
      >
        {/* Theme-aware tile layer */}
        <TileLayer
          url={tileUrl}
          maxZoom={19}
        />

        {/* Sync map view to external bounds */}
        <BoundsSync bounds={boundsToSync} />

        {/* Drawing mode indicator */}
        <DrawingModeIndicator isDrawing={isDrawing} />

        {/* ESC key handler */}
        <EscKeyHandler onCancel={handleCancelDrawing} isDrawing={isDrawing} />

        {/* Click-to-draw handler - auto-enables drawing when clicking empty map */}
        {onStartDrawing && (
          <ClickToDrawHandler
            bounds={bounds}
            isDrawing={isDrawing}
            onStartDrawing={onStartDrawing}
          />
        )}

        {/* Editable rectangle with react-leaflet-draw */}
        <EditableRectangle
          bounds={bounds}
          onBoundsChange={onBoundsChange}
          isDrawing={isDrawing}
          onDrawingComplete={handleDrawingComplete}
        />

        {/* Grid cells with status colors */}
        {bounds && showGridCells && (
          <GridCellsOverlay bounds={bounds} cellStatuses={cellStatuses} />
        )}
      </MapContainer>
    </>
  );
}

// Export utilities for external use
export { generateGridCells };
