/**
 * Google Places API (New) Type Definitions
 *
 * Types for the Text Search API with rectangular bounds support.
 * Reference: https://developers.google.com/maps/documentation/places/web-service/text-search
 */

// =============================================================================
// Coordinate Types
// =============================================================================

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Bounds {
  ne: LatLng; // Northeast corner (high)
  sw: LatLng; // Southwest corner (low)
}

// =============================================================================
// Search Request Types
// =============================================================================

export interface PlacesSearchParams {
  query: string; // e.g., "restaurants", "dental clinic"
  bounds: Bounds;
  pageToken?: string;
  maxResultCount?: number; // Default: 20, Max: 20
}

/**
 * Google Places API (New) Text Search Request Body
 */
export interface GoogleTextSearchRequest {
  textQuery: string;
  maxResultCount?: number;
  pageToken?: string;
  locationRestriction?: {
    rectangle: {
      low: LatLng; // Southwest corner
      high: LatLng; // Northeast corner
    };
  };
  includedType?: string;
  strictTypeFiltering?: boolean;
  languageCode?: string;
  regionCode?: string;
}

// =============================================================================
// Search Response Types
// =============================================================================

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  location: LatLng;
  types: string[];
  businessStatus?: string;
  priceLevel?: string;
}

export interface PlacesSearchResponse {
  results: PlaceResult[];
  nextPageToken?: string;
  totalResultsAvailable?: number;
}

/**
 * Google Places API (New) Response Format
 */
export interface GoogleTextSearchResponse {
  places?: GooglePlaceResource[];
  nextPageToken?: string;
}

export interface GooglePlaceResource {
  id: string;
  displayName?: {
    text: string;
    languageCode?: string;
  };
  formattedAddress?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  types?: string[];
  businessStatus?: GoogleBusinessStatus;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: GooglePriceLevel;
  primaryType?: string;
  primaryTypeDisplayName?: {
    text: string;
    languageCode?: string;
  };
}

export type GoogleBusinessStatus =
  | "OPERATIONAL"
  | "CLOSED_TEMPORARILY"
  | "CLOSED_PERMANENTLY";

export type GooglePriceLevel =
  | "PRICE_LEVEL_UNSPECIFIED"
  | "PRICE_LEVEL_FREE"
  | "PRICE_LEVEL_INEXPENSIVE"
  | "PRICE_LEVEL_MODERATE"
  | "PRICE_LEVEL_EXPENSIVE"
  | "PRICE_LEVEL_VERY_EXPENSIVE";

// =============================================================================
// Grid Cell Types (for dividing search areas)
// =============================================================================

export interface GridCell {
  id: string; // Unique cell identifier
  bounds: Bounds;
  centerLat: number;
  centerLng: number;
  row: number;
  col: number;
}

export interface GridConfig {
  bounds: Bounds;
  cellSizeKm: number;
  cells: GridCell[];
  rows: number;
  cols: number;
  totalArea: number; // in km^2
}

// =============================================================================
// Rate Limiting Types
// =============================================================================

export interface RateLimiterConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerSecond?: number;
}

export interface RateLimiterState {
  requestsThisMinute: number;
  minuteStartTime: number;
  requestsThisSecond: number;
  secondStartTime: number;
}

// =============================================================================
// API Error Types
// =============================================================================

export interface PlacesApiError {
  code: number;
  message: string;
  status: string;
  details?: Array<{
    "@type": string;
    reason?: string;
    domain?: string;
    metadata?: Record<string, string>;
  }>;
}

export interface PlacesApiErrorResponse {
  error: PlacesApiError;
}
