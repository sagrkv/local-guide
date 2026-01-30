/**
 * Grid Utility for Geographic Area Division
 *
 * Divides a bounding box into smaller cells for comprehensive
 * Google Places API coverage. Google Places returns max 20 results
 * per query, so dividing large areas into ~2km x 2km cells ensures
 * we capture all businesses in an area.
 */

import type { Bounds, GridCell, GridConfig, LatLng } from "../types/places.js";

// =============================================================================
// Constants
// =============================================================================

/**
 * Earth's radius in kilometers (WGS84 mean radius)
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Default cell size in kilometers
 * 2km works well for most urban areas - small enough to get comprehensive
 * coverage but large enough to minimize API calls
 */
const DEFAULT_CELL_SIZE_KM = 2;

/**
 * Minimum cell size to prevent excessive API calls
 */
const MIN_CELL_SIZE_KM = 0.5;

/**
 * Maximum cell size to ensure adequate coverage
 */
const MAX_CELL_SIZE_KM = 10;

// =============================================================================
// Coordinate Math Functions
// =============================================================================

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculate the distance between two points using the Haversine formula
 * Returns distance in kilometers
 */
export function haversineDistance(point1: LatLng, point2: LatLng): number {
  const lat1 = toRadians(point1.latitude);
  const lat2 = toRadians(point2.latitude);
  const deltaLat = toRadians(point2.latitude - point1.latitude);
  const deltaLng = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Calculate longitude offset for a given distance at a specific latitude
 * At higher latitudes, longitude degrees cover less distance
 */
function longitudeOffsetForDistance(
  latitudeDegrees: number,
  distanceKm: number,
): number {
  const latitudeRadians = toRadians(latitudeDegrees);
  // At the equator, 1 degree longitude = ~111km
  // This decreases as we move towards poles: distance = 111 * cos(latitude)
  const kmPerDegree = (Math.PI / 180) * EARTH_RADIUS_KM * Math.cos(latitudeRadians);
  return distanceKm / kmPerDegree;
}

/**
 * Calculate latitude offset for a given distance
 * Latitude degrees have relatively constant distance (~111km per degree)
 */
function latitudeOffsetForDistance(distanceKm: number): number {
  // 1 degree latitude = ~111km
  const kmPerDegree = (Math.PI / 180) * EARTH_RADIUS_KM;
  return distanceKm / kmPerDegree;
}

// =============================================================================
// Grid Division Functions
// =============================================================================

/**
 * Divide a bounding box into a grid of smaller cells
 *
 * @param bounds - The bounding box to divide (ne and sw corners)
 * @param cellSizeKm - Target cell size in kilometers (default: 2km)
 * @returns Grid configuration with all cells
 *
 * @example
 * ```typescript
 * const bounds = {
 *   ne: { latitude: 12.95, longitude: 77.65 },
 *   sw: { latitude: 12.90, longitude: 77.55 }
 * };
 * const grid = divideIntoGrid(bounds, 2);
 * // Returns ~6 cells covering the area
 * ```
 */
export function divideIntoGrid(
  bounds: Bounds,
  cellSizeKm: number = DEFAULT_CELL_SIZE_KM,
): GridConfig {
  // Validate and clamp cell size
  const clampedCellSize = Math.max(
    MIN_CELL_SIZE_KM,
    Math.min(MAX_CELL_SIZE_KM, cellSizeKm),
  );

  // Calculate the dimensions of the bounding box
  const { ne, sw } = bounds;

  // Calculate width and height in km
  const widthKm = haversineDistance(
    { latitude: (ne.latitude + sw.latitude) / 2, longitude: sw.longitude },
    { latitude: (ne.latitude + sw.latitude) / 2, longitude: ne.longitude },
  );

  const heightKm = haversineDistance(
    { latitude: sw.latitude, longitude: (ne.longitude + sw.longitude) / 2 },
    { latitude: ne.latitude, longitude: (ne.longitude + sw.longitude) / 2 },
  );

  // Calculate number of cells needed
  const cols = Math.max(1, Math.ceil(widthKm / clampedCellSize));
  const rows = Math.max(1, Math.ceil(heightKm / clampedCellSize));

  // Calculate actual cell dimensions in degrees
  const latStep = (ne.latitude - sw.latitude) / rows;
  const lngStep = (ne.longitude - sw.longitude) / cols;

  // Generate cells
  const cells: GridCell[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cellSw: LatLng = {
        latitude: sw.latitude + row * latStep,
        longitude: sw.longitude + col * lngStep,
      };

      const cellNe: LatLng = {
        latitude: sw.latitude + (row + 1) * latStep,
        longitude: sw.longitude + (col + 1) * lngStep,
      };

      const centerLat = (cellSw.latitude + cellNe.latitude) / 2;
      const centerLng = (cellSw.longitude + cellNe.longitude) / 2;

      cells.push({
        id: `cell_${row}_${col}`,
        bounds: { ne: cellNe, sw: cellSw },
        centerLat,
        centerLng,
        row,
        col,
      });
    }
  }

  return {
    bounds,
    cellSizeKm: clampedCellSize,
    cells,
    rows,
    cols,
    totalArea: widthKm * heightKm,
  };
}

/**
 * Get cells that overlap with a specific point
 * Useful for finding which cell a business belongs to
 */
export function getCellsContainingPoint(
  grid: GridConfig,
  point: LatLng,
): GridCell[] {
  return grid.cells.filter((cell) => {
    const { ne, sw } = cell.bounds;
    return (
      point.latitude >= sw.latitude &&
      point.latitude <= ne.latitude &&
      point.longitude >= sw.longitude &&
      point.longitude <= ne.longitude
    );
  });
}

/**
 * Expand bounds by a certain percentage (useful for overlap)
 */
export function expandBounds(bounds: Bounds, expansionPercent: number): Bounds {
  const latDiff = bounds.ne.latitude - bounds.sw.latitude;
  const lngDiff = bounds.ne.longitude - bounds.sw.longitude;
  const latExpansion = latDiff * (expansionPercent / 100);
  const lngExpansion = lngDiff * (expansionPercent / 100);

  return {
    ne: {
      latitude: bounds.ne.latitude + latExpansion,
      longitude: bounds.ne.longitude + lngExpansion,
    },
    sw: {
      latitude: bounds.sw.latitude - latExpansion,
      longitude: bounds.sw.longitude - lngExpansion,
    },
  };
}

/**
 * Calculate the center point of a bounding box
 */
export function getBoundsCenter(bounds: Bounds): LatLng {
  return {
    latitude: (bounds.ne.latitude + bounds.sw.latitude) / 2,
    longitude: (bounds.ne.longitude + bounds.sw.longitude) / 2,
  };
}

/**
 * Calculate the area of a bounding box in square kilometers
 */
export function getBoundsAreaKm2(bounds: Bounds): number {
  const { ne, sw } = bounds;

  const widthKm = haversineDistance(
    { latitude: (ne.latitude + sw.latitude) / 2, longitude: sw.longitude },
    { latitude: (ne.latitude + sw.latitude) / 2, longitude: ne.longitude },
  );

  const heightKm = haversineDistance(
    { latitude: sw.latitude, longitude: (ne.longitude + sw.longitude) / 2 },
    { latitude: ne.latitude, longitude: (ne.longitude + sw.longitude) / 2 },
  );

  return widthKm * heightKm;
}

/**
 * Estimate the number of API calls needed to cover an area
 * Based on cell size and assuming one call per cell per query
 */
export function estimateApiCalls(
  bounds: Bounds,
  cellSizeKm: number = DEFAULT_CELL_SIZE_KM,
  queriesPerCell: number = 1,
): {
  cells: number;
  apiCalls: number;
  areaKm2: number;
  estimatedCostUsd: number;
} {
  const grid = divideIntoGrid(bounds, cellSizeKm);
  const cells = grid.cells.length;
  const apiCalls = cells * queriesPerCell;

  // Google Places Text Search pricing: $0.032 per call
  const costPerCall = 0.032;
  const estimatedCostUsd = apiCalls * costPerCall;

  return {
    cells,
    apiCalls,
    areaKm2: grid.totalArea,
    estimatedCostUsd: Math.round(estimatedCostUsd * 100) / 100,
  };
}

/**
 * Create bounds from a center point and radius
 */
export function boundsFromCenterAndRadius(
  center: LatLng,
  radiusKm: number,
): Bounds {
  const latOffset = latitudeOffsetForDistance(radiusKm);
  const lngOffset = longitudeOffsetForDistance(center.latitude, radiusKm);

  return {
    ne: {
      latitude: center.latitude + latOffset,
      longitude: center.longitude + lngOffset,
    },
    sw: {
      latitude: center.latitude - latOffset,
      longitude: center.longitude - lngOffset,
    },
  };
}

/**
 * Merge overlapping bounds into a single bounds
 */
export function mergeBounds(boundsList: Bounds[]): Bounds {
  if (boundsList.length === 0) {
    throw new Error("Cannot merge empty bounds list");
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const bounds of boundsList) {
    minLat = Math.min(minLat, bounds.sw.latitude);
    maxLat = Math.max(maxLat, bounds.ne.latitude);
    minLng = Math.min(minLng, bounds.sw.longitude);
    maxLng = Math.max(maxLng, bounds.ne.longitude);
  }

  return {
    ne: { latitude: maxLat, longitude: maxLng },
    sw: { latitude: minLat, longitude: minLng },
  };
}

/**
 * Check if two bounds intersect
 */
export function boundsIntersect(bounds1: Bounds, bounds2: Bounds): boolean {
  return !(
    bounds1.ne.longitude < bounds2.sw.longitude ||
    bounds2.ne.longitude < bounds1.sw.longitude ||
    bounds1.ne.latitude < bounds2.sw.latitude ||
    bounds2.ne.latitude < bounds1.sw.latitude
  );
}

/**
 * Validate bounds are properly formatted
 */
export function validateBounds(bounds: Bounds): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check latitude range (-90 to 90)
  if (bounds.ne.latitude < -90 || bounds.ne.latitude > 90) {
    errors.push("Northeast latitude must be between -90 and 90");
  }
  if (bounds.sw.latitude < -90 || bounds.sw.latitude > 90) {
    errors.push("Southwest latitude must be between -90 and 90");
  }

  // Check longitude range (-180 to 180)
  if (bounds.ne.longitude < -180 || bounds.ne.longitude > 180) {
    errors.push("Northeast longitude must be between -180 and 180");
  }
  if (bounds.sw.longitude < -180 || bounds.sw.longitude > 180) {
    errors.push("Southwest longitude must be between -180 and 180");
  }

  // Check that NE is actually northeast of SW
  if (bounds.ne.latitude < bounds.sw.latitude) {
    errors.push("Northeast latitude must be greater than southwest latitude");
  }
  if (bounds.ne.longitude < bounds.sw.longitude) {
    errors.push("Northeast longitude must be greater than southwest longitude");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
