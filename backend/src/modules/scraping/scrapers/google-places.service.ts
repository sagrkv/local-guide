/**
 * Google Places API Service
 *
 * Implements Google Places API (New) Text Search with rectangular bounds.
 * Includes rate limiting (100 QPM), pagination, and comprehensive error handling.
 *
 * Reference: https://developers.google.com/maps/documentation/places/web-service/text-search
 */

import { config } from "../../../config.js";
import { logApiCall } from "../../../lib/api-logger.js";
import type {
  Bounds,
  GoogleTextSearchRequest,
  GoogleTextSearchResponse,
  PlaceResult,
  PlacesSearchParams,
  PlacesSearchResponse,
  RateLimiterConfig,
  RateLimiterState,
} from "../../../types/places.js";
import { divideIntoGrid, validateBounds } from "../../../utils/grid.js";

// =============================================================================
// Constants
// =============================================================================

const GOOGLE_PLACES_API_URL =
  "https://places.googleapis.com/v1/places:searchText";

/**
 * Default field mask for Place data
 * Includes essential fields for lead generation
 */
const DEFAULT_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
  "places.businessStatus",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.primaryType",
].join(",");

/**
 * Google Places API rate limits
 * - 100 requests per minute (QPM)
 * - No per-second limit documented, but we add one for safety
 */
const DEFAULT_RATE_LIMIT: RateLimiterConfig = {
  maxRequestsPerMinute: 100,
  maxRequestsPerSecond: 10, // Safety limit to avoid bursts
};

/**
 * Maximum results per request (Google Places limit)
 */
const MAX_RESULTS_PER_REQUEST = 20;

// =============================================================================
// Rate Limiter Class
// =============================================================================

class RateLimiter {
  private state: RateLimiterState = {
    requestsThisMinute: 0,
    minuteStartTime: Date.now(),
    requestsThisSecond: 0,
    secondStartTime: Date.now(),
  };

  constructor(private readonly config: RateLimiterConfig) {}

  /**
   * Wait until a request can be made within rate limits
   */
  async waitForSlot(): Promise<void> {
    const now = Date.now();

    // Reset minute counter if a minute has passed
    if (now - this.state.minuteStartTime >= 60000) {
      this.state.requestsThisMinute = 0;
      this.state.minuteStartTime = now;
    }

    // Reset second counter if a second has passed
    if (now - this.state.secondStartTime >= 1000) {
      this.state.requestsThisSecond = 0;
      this.state.secondStartTime = now;
    }

    // Check if we need to wait for minute limit
    if (this.state.requestsThisMinute >= this.config.maxRequestsPerMinute) {
      const waitTime = 60000 - (now - this.state.minuteStartTime);
      if (waitTime > 0) {
        await this.delay(waitTime);
        this.state.requestsThisMinute = 0;
        this.state.minuteStartTime = Date.now();
      }
    }

    // Check if we need to wait for second limit
    if (
      this.config.maxRequestsPerSecond &&
      this.state.requestsThisSecond >= this.config.maxRequestsPerSecond
    ) {
      const waitTime = 1000 - (now - this.state.secondStartTime);
      if (waitTime > 0) {
        await this.delay(waitTime);
        this.state.requestsThisSecond = 0;
        this.state.secondStartTime = Date.now();
      }
    }
  }

  /**
   * Record that a request was made
   */
  recordRequest(): void {
    this.state.requestsThisMinute++;
    this.state.requestsThisSecond++;
  }

  /**
   * Get current rate limit status
   */
  getStatus(): {
    requestsThisMinute: number;
    requestsRemaining: number;
    resetsIn: number;
  } {
    const now = Date.now();
    const resetsIn = Math.max(0, 60000 - (now - this.state.minuteStartTime));

    return {
      requestsThisMinute: this.state.requestsThisMinute,
      requestsRemaining:
        this.config.maxRequestsPerMinute - this.state.requestsThisMinute,
      resetsIn,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// =============================================================================
// Google Places Service
// =============================================================================

/**
 * Google Places API Service
 *
 * Provides methods for searching places with rectangular bounds,
 * automatic rate limiting, and pagination support.
 */
export class GooglePlacesService {
  private rateLimiter: RateLimiter;
  private scrapeJobId?: string;

  constructor(rateLimitConfig: RateLimiterConfig = DEFAULT_RATE_LIMIT) {
    this.rateLimiter = new RateLimiter(rateLimitConfig);
  }

  /**
   * Set the current scrape job ID for logging
   */
  setScrapeJobId(jobId: string | undefined): void {
    this.scrapeJobId = jobId;
  }

  /**
   * Check if the Google Places API is configured
   */
  isConfigured(): boolean {
    return Boolean(config.googlePlacesApiKey);
  }

  /**
   * Search for places within rectangular bounds
   *
   * @param params - Search parameters including query and bounds
   * @returns Search results with optional pagination token
   *
   * @example
   * ```typescript
   * const service = new GooglePlacesService();
   * const results = await service.searchPlaces({
   *   query: "restaurants",
   *   bounds: {
   *     ne: { latitude: 12.95, longitude: 77.65 },
   *     sw: { latitude: 12.90, longitude: 77.55 }
   *   }
   * });
   * ```
   */
  async searchPlaces(params: PlacesSearchParams): Promise<PlacesSearchResponse> {
    // Validate API key
    if (!config.googlePlacesApiKey) {
      await this.logFailedCall(
        "searchPlaces",
        "Google Places API key not configured",
      );
      throw new Error("Google Places API key not configured");
    }

    // Validate bounds
    const boundsValidation = validateBounds(params.bounds);
    if (!boundsValidation.valid) {
      const errorMsg = `Invalid bounds: ${boundsValidation.errors.join(", ")}`;
      await this.logFailedCall("searchPlaces", errorMsg);
      throw new Error(errorMsg);
    }

    // Wait for rate limit slot
    await this.rateLimiter.waitForSlot();

    const startTime = Date.now();
    const endpoint = `places:searchText ("${params.query}")`;

    try {
      // Build request body
      const requestBody: GoogleTextSearchRequest = {
        textQuery: params.query,
        maxResultCount: Math.min(
          params.maxResultCount || MAX_RESULTS_PER_REQUEST,
          MAX_RESULTS_PER_REQUEST,
        ),
        locationRestriction: {
          rectangle: {
            low: params.bounds.sw, // Southwest = low point
            high: params.bounds.ne, // Northeast = high point
          },
        },
      };

      // Add page token if provided
      if (params.pageToken) {
        requestBody.pageToken = params.pageToken;
      }

      // Make API request
      const response = await fetch(GOOGLE_PLACES_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": config.googlePlacesApiKey,
          "X-Goog-FieldMask": DEFAULT_FIELD_MASK,
        },
        body: JSON.stringify(requestBody),
      });

      // Record the request for rate limiting
      this.rateLimiter.recordRequest();

      const responseTimeMs = Date.now() - startTime;

      // Log the API call
      await logApiCall({
        provider: "GOOGLE_PLACES",
        endpoint,
        method: "POST",
        statusCode: response.status,
        responseTimeMs,
        success: response.ok,
        scrapeJobId: this.scrapeJobId,
        error: response.ok ? undefined : `HTTP ${response.status}`,
        metadata: {
          query: params.query,
          boundsNe: params.bounds.ne,
          boundsSw: params.bounds.sw,
          hasPageToken: Boolean(params.pageToken),
        },
      });

      // Handle error responses
      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage: string;

        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage =
            errorJson.error?.message || `HTTP ${response.status}: ${errorBody}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${errorBody}`;
        }

        throw new Error(`Google Places API error: ${errorMessage}`);
      }

      // Parse response
      const data = (await response.json()) as GoogleTextSearchResponse;

      // Transform to our format
      const results: PlaceResult[] = (data.places || []).map((place) =>
        this.transformPlaceResource(place),
      );

      return {
        results,
        nextPageToken: data.nextPageToken,
        totalResultsAvailable: results.length,
      };
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      // Log failed API call if not already logged
      if (!(error instanceof Error && error.message.includes("Google Places API error"))) {
        await logApiCall({
          provider: "GOOGLE_PLACES",
          endpoint,
          method: "POST",
          statusCode: 0,
          responseTimeMs,
          success: false,
          scrapeJobId: this.scrapeJobId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      throw error;
    }
  }

  /**
   * Search for places across an entire area by dividing into grid cells
   *
   * This method automatically divides large areas into smaller cells
   * and searches each cell to ensure comprehensive coverage.
   *
   * @param params - Search parameters
   * @param cellSizeKm - Size of each grid cell (default: 2km)
   * @param onProgress - Optional callback for progress updates
   * @returns Combined results from all cells (deduplicated)
   */
  async searchPlacesInArea(
    params: Omit<PlacesSearchParams, "pageToken">,
    cellSizeKm: number = 2,
    onProgress?: (progress: {
      currentCell: number;
      totalCells: number;
      resultsFound: number;
    }) => void,
  ): Promise<PlacesSearchResponse> {
    // Divide the area into grid cells
    const grid = divideIntoGrid(params.bounds, cellSizeKm);

    const allResults = new Map<string, PlaceResult>(); // Dedupe by placeId

    for (let i = 0; i < grid.cells.length; i++) {
      const cell = grid.cells[i];

      try {
        // Search this cell
        let hasMoreResults = true;
        let pageToken: string | undefined;

        while (hasMoreResults) {
          const response = await this.searchPlaces({
            query: params.query,
            bounds: cell.bounds,
            maxResultCount: params.maxResultCount,
            pageToken,
          });

          // Add results (dedupe by placeId)
          for (const result of response.results) {
            if (!allResults.has(result.placeId)) {
              allResults.set(result.placeId, result);
            }
          }

          // Check for more pages
          if (response.nextPageToken) {
            pageToken = response.nextPageToken;
            // Google requires a short delay between pagination requests
            await this.delay(200);
          } else {
            hasMoreResults = false;
          }
        }

        // Report progress
        if (onProgress) {
          onProgress({
            currentCell: i + 1,
            totalCells: grid.cells.length,
            resultsFound: allResults.size,
          });
        }

        // Small delay between cells
        await this.delay(100);
      } catch (error) {
        // Log error but continue with other cells
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `[GooglePlacesService] Error searching cell ${cell.id}: ${errorMessage}`,
        );
      }
    }

    return {
      results: Array.from(allResults.values()),
      totalResultsAvailable: allResults.size,
    };
  }

  /**
   * Get all pages of results for a single search
   *
   * @param params - Search parameters
   * @returns All results across all pages
   */
  async searchPlacesAllPages(
    params: Omit<PlacesSearchParams, "pageToken">,
  ): Promise<PlaceResult[]> {
    const allResults: PlaceResult[] = [];
    let pageToken: string | undefined;
    let hasMoreResults = true;

    while (hasMoreResults) {
      const response = await this.searchPlaces({
        ...params,
        pageToken,
      });

      allResults.push(...response.results);

      if (response.nextPageToken) {
        pageToken = response.nextPageToken;
        // Google requires a short delay between pagination requests
        await this.delay(200);
      } else {
        hasMoreResults = false;
      }
    }

    return allResults;
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(): {
    requestsThisMinute: number;
    requestsRemaining: number;
    resetsIn: number;
  } {
    return this.rateLimiter.getStatus();
  }

  /**
   * Estimate the cost of searching an area
   */
  estimateCost(
    bounds: Bounds,
    cellSizeKm: number = 2,
    queriesPerCell: number = 1,
  ): {
    cells: number;
    estimatedApiCalls: number;
    estimatedCostUsd: number;
    estimatedTimeMinutes: number;
  } {
    const grid = divideIntoGrid(bounds, cellSizeKm);
    const estimatedApiCalls = grid.cells.length * queriesPerCell;

    // Assume average 1.5 pages per cell due to pagination
    const adjustedApiCalls = Math.ceil(estimatedApiCalls * 1.5);

    // $0.032 per Text Search request
    const estimatedCostUsd = adjustedApiCalls * 0.032;

    // Estimate time based on rate limits (100 QPM) plus delays
    const timePerRequest = 60 / 100; // seconds per request at max rate
    const delayTime = grid.cells.length * 0.1; // 100ms delay between cells
    const estimatedTimeMinutes =
      (adjustedApiCalls * timePerRequest + delayTime) / 60;

    return {
      cells: grid.cells.length,
      estimatedApiCalls: adjustedApiCalls,
      estimatedCostUsd: Math.round(estimatedCostUsd * 100) / 100,
      estimatedTimeMinutes: Math.round(estimatedTimeMinutes * 10) / 10,
    };
  }

  // =============================================================================
  // Private Helper Methods
  // =============================================================================

  /**
   * Transform Google Place resource to our PlaceResult format
   */
  private transformPlaceResource(place: NonNullable<GoogleTextSearchResponse["places"]>[number]): PlaceResult {
    return {
      placeId: place.id,
      name: place.displayName?.text || "",
      address: place.formattedAddress || "",
      phone: place.nationalPhoneNumber || place.internationalPhoneNumber,
      website: place.websiteUri,
      rating: place.rating,
      reviewCount: place.userRatingCount,
      location: {
        latitude: place.location?.latitude || 0,
        longitude: place.location?.longitude || 0,
      },
      types: place.types || [],
      businessStatus: place.businessStatus,
      priceLevel: place.priceLevel,
    };
  }

  /**
   * Log a failed API call when we can't make the actual request
   */
  private async logFailedCall(endpoint: string, error: string): Promise<void> {
    await logApiCall({
      provider: "GOOGLE_PLACES",
      endpoint,
      method: "POST",
      statusCode: 0,
      responseTimeMs: 0,
      success: false,
      scrapeJobId: this.scrapeJobId,
      error,
    });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

/**
 * Default Google Places service instance
 */
export const googlePlacesService = new GooglePlacesService();

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Search for places within bounds (convenience function)
 */
export async function searchPlaces(
  params: PlacesSearchParams,
): Promise<PlacesSearchResponse> {
  return googlePlacesService.searchPlaces(params);
}

/**
 * Search an entire area with grid division (convenience function)
 */
export async function searchPlacesInArea(
  params: Omit<PlacesSearchParams, "pageToken">,
  cellSizeKm?: number,
  onProgress?: (progress: {
    currentCell: number;
    totalCells: number;
    resultsFound: number;
  }) => void,
): Promise<PlacesSearchResponse> {
  return googlePlacesService.searchPlacesInArea(params, cellSizeKm, onProgress);
}

/**
 * Estimate search cost (convenience function)
 */
export function estimateSearchCost(
  bounds: Bounds,
  cellSizeKm?: number,
  queriesPerCell?: number,
): {
  cells: number;
  estimatedApiCalls: number;
  estimatedCostUsd: number;
  estimatedTimeMinutes: number;
} {
  return googlePlacesService.estimateCost(bounds, cellSizeKm, queriesPerCell);
}
