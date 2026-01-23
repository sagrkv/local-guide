import { config } from "../../../config.js";
import { logApiCall } from "../../../lib/api-logger.js";
import { prisma } from "../../../lib/prisma.js";
import {
  CITIES,
  Zone,
  BUSINESS_TYPE_QUERIES,
  getZonesForBusinessType,
  getAllZones,
  isCitySupported,
  getSupportedCities,
} from "../data/city-zones.js";

// Track current scrape job ID for logging
let currentScrapeJobId: string | undefined;

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  types: string[];
  businessStatus?: string;
  websiteUri?: string; // Website URL if available
  phoneNumber?: string; // Phone number from Google
  zone?: string; // Which zone this result came from
}

interface GooglePlaceResponse {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  types?: string[];
  businessStatus?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
}

export const googlePlacesClient = {
  /**
   * Set the current scrape job ID for logging
   */
  setScrapeJobId(jobId: string | undefined): void {
    currentScrapeJobId = jobId;
  },

  /**
   * Search for places in a zone using Google Places API (New)
   */
  async searchInZone(query: string, zone: Zone): Promise<PlaceResult[]> {
    const results: PlaceResult[] = [];
    const radiusMeters = zone.radiusKm * 1000;
    const startTime = Date.now();
    const endpoint = `places:searchText (${zone.name}, "${query}")`;

    if (!config.googlePlacesApiKey) {
      // Log the failed attempt even when API key is missing
      await logApiCall({
        provider: "GOOGLE_PLACES",
        endpoint,
        method: "POST",
        statusCode: 0,
        responseTimeMs: 0,
        success: false,
        scrapeJobId: currentScrapeJobId,
        error: "API key not configured",
      });
      throw new Error("Google Places API key not configured");
    }

    try {
      // Using Places API (New) - Text Search with location bias
      // Including websiteUri to filter businesses with websites (Enterprise SKU)
      const response = await fetch(
        "https://places.googleapis.com/v1/places:searchText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": config.googlePlacesApiKey,
            "X-Goog-FieldMask":
              "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.businessStatus,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber",
          },
          body: JSON.stringify({
            textQuery: query,
            maxResultCount: 20,
            locationBias: {
              circle: {
                center: {
                  latitude: zone.lat,
                  longitude: zone.lng,
                },
                radius: radiusMeters,
              },
            },
          }),
        },
      );

      const responseTimeMs = Date.now() - startTime;

      // Log the API call
      await logApiCall({
        provider: "GOOGLE_PLACES",
        endpoint,
        method: "POST",
        statusCode: response.status,
        responseTimeMs,
        success: response.ok,
        scrapeJobId: currentScrapeJobId,
        error: response.ok ? undefined : `HTTP ${response.status}`,
        metadata: {
          zone: zone.name,
          query,
          radiusMeters,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(
          `Google Places API error for zone ${zone.name}:`,
          response.status,
          error,
        );
        return [];
      }

      const data = (await response.json()) as {
        places?: GooglePlaceResponse[];
      };

      for (const place of data.places || []) {
        results.push({
          placeId: place.id,
          name: place.displayName?.text || "",
          address: place.formattedAddress || "",
          latitude: place.location?.latitude || 0,
          longitude: place.location?.longitude || 0,
          types: place.types || [],
          businessStatus: place.businessStatus,
          websiteUri: place.websiteUri,
          phoneNumber:
            place.nationalPhoneNumber || place.internationalPhoneNumber,
          zone: zone.name,
        });
      }
    } catch (error) {
      const responseTimeMs = Date.now() - startTime;

      // Log failed API call
      await logApiCall({
        provider: "GOOGLE_PLACES",
        endpoint,
        method: "POST",
        statusCode: 0,
        responseTimeMs,
        success: false,
        scrapeJobId: currentScrapeJobId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      console.error(`Error searching zone ${zone.name}:`, error);
    }

    return results;
  },

  /**
   * Smart discovery - searches zones by priority, SKIPS already-scraped zones
   *
   * @param businessType - Type of business to search (e.g., 'clinic', 'manufacturer')
   * @param city - City to search in
   * @param maxResults - Stop after finding this many results
   * @param onProgress - Callback for progress updates
   */
  async discoverBusinesses(
    businessType: string,
    city: string,
    maxResults: number = 25,
    onProgress?: (progress: {
      zone: string;
      zoneIndex: number;
      totalZones: number;
      businessesFound: number;
      skippedZones: number;
    }) => void,
  ): Promise<PlaceResult[]> {
    // Get zones that have this business type, sorted by priority
    let allZonesForType = getZonesForBusinessType(city, businessType);

    if (allZonesForType.length === 0) {
      console.warn(
        `No specific zones found for "${businessType}" in ${city}, falling back to all zones`,
      );
      // Fallback to all zones
      allZonesForType = getAllZones(city);
      if (allZonesForType.length === 0) {
        throw new Error(
          `City "${city}" is not supported for Google Places discovery. Supported cities: ${getSupportedCities().join(", ")}`,
        );
      }
    }

    // Get already-scraped zones for this business type in this city
    const scrapedZones = await prisma.zoneScrapeHistory.findMany({
      where: {
        city: city,
        businessType: businessType,
      },
      select: {
        zoneName: true,
      },
    });
    const scrapedZoneNames = new Set(scrapedZones.map((z) => z.zoneName));

    // Filter out already-scraped zones
    const zones = allZonesForType.filter((z) => !scrapedZoneNames.has(z.name));

    console.log(`[DISCOVERY] Searching for "${businessType}" in ${city}`);
    console.log(
      `[DISCOVERY] Total zones: ${allZonesForType.length}, Already scraped: ${scrapedZoneNames.size}, Remaining: ${zones.length}`,
    );

    if (zones.length === 0) {
      console.log(
        `[DISCOVERY] All ${allZonesForType.length} zones have been scraped for "${businessType}" in ${city}`,
      );
      console.log(
        `[DISCOVERY] TIP: To re-scrape, clear zone history or wait for new zones to be added`,
      );
      return [];
    }

    const allResults = new Map<string, PlaceResult>(); // Dedupe by placeId
    const targetResults = maxResults * 2; // Buffer for filtering
    const zonesScraped: { name: string; leadsFound: number }[] = [];

    // Get search queries for this business type
    const queries = BUSINESS_TYPE_QUERIES[businessType] || [businessType];

    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i];

      // Stop if we have enough results
      if (allResults.size >= targetResults) {
        console.log(
          `[DISCOVERY] Reached target of ${targetResults} businesses after ${i + 1} zones`,
        );
        break;
      }

      console.log(
        `[DISCOVERY] Searching zone ${i + 1}/${zones.length}: ${zone.name} (priority: ${zone.priority})`,
      );

      const zoneResultsBefore = allResults.size;

      // Search with each query variant
      for (const query of queries) {
        if (allResults.size >= targetResults) break;

        try {
          const results = await this.searchInZone(query, zone);

          for (const result of results) {
            if (!allResults.has(result.placeId)) {
              allResults.set(result.placeId, result);
            }
          }

          // Small delay between queries
          await delay(100);
        } catch (error) {
          console.error(`Error searching "${query}" in ${zone.name}:`, error);
        }
      }

      const zoneLeadsFound = allResults.size - zoneResultsBefore;
      zonesScraped.push({ name: zone.name, leadsFound: zoneLeadsFound });

      if (onProgress) {
        onProgress({
          zone: zone.name,
          zoneIndex: i + 1,
          totalZones: zones.length,
          businessesFound: allResults.size,
          skippedZones: scrapedZoneNames.size,
        });
      }

      // Delay between zones
      await delay(200);
    }

    // Record scraped zones in history
    for (const zone of zonesScraped) {
      try {
        await prisma.zoneScrapeHistory.upsert({
          where: {
            city_zoneName_businessType: {
              city: city,
              zoneName: zone.name,
              businessType: businessType,
            },
          },
          update: {
            leadsFound: zone.leadsFound,
            scrapedAt: new Date(),
            scrapeJobId: currentScrapeJobId,
          },
          create: {
            city: city,
            zoneName: zone.name,
            businessType: businessType,
            leadsFound: zone.leadsFound,
            scrapeJobId: currentScrapeJobId,
          },
        });
      } catch (error) {
        console.error(`Failed to record zone history for ${zone.name}:`, error);
      }
    }

    console.log(
      `[DISCOVERY] Complete: ${allResults.size} unique businesses found in ${city} (scraped ${zonesScraped.length} new zones)`,
    );
    return Array.from(allResults.values());
  },

  /**
   * Discover ALL types of businesses in a city (searches all zones)
   */
  async discoverAllBusinessTypes(
    city: string,
    maxResults: number = 50,
    onProgress?: (progress: {
      zone: string;
      zoneIndex: number;
      totalZones: number;
      businessesFound: number;
    }) => void,
  ): Promise<PlaceResult[]> {
    const zones = getAllZones(city);

    if (zones.length === 0) {
      console.error(`City ${city} not supported`);
      return [];
    }

    console.log(`[DISCOVERY-ALL] Searching all business types in ${city}`);
    console.log(`[DISCOVERY-ALL] Total zones: ${zones.length}`);

    const allResults = new Map<string, PlaceResult>();
    const targetResults = maxResults * 2;

    for (let i = 0; i < zones.length; i++) {
      const zone = zones[i];

      if (allResults.size >= targetResults) {
        console.log(`[DISCOVERY-ALL] Reached target after ${i} zones`);
        break;
      }

      console.log(
        `[DISCOVERY-ALL] Zone ${i + 1}/${zones.length}: ${zone.name} (${zone.type})`,
      );

      // Search each business type relevant to this zone
      for (const businessType of zone.businessTypes) {
        if (allResults.size >= targetResults) break;

        const queries = BUSINESS_TYPE_QUERIES[businessType] || [businessType];

        // Just use first query to save API calls
        const query = queries[0];

        try {
          const results = await this.searchInZone(query, zone);

          for (const result of results) {
            if (!allResults.has(result.placeId)) {
              allResults.set(result.placeId, result);
            }
          }

          await delay(100);
        } catch (error) {
          console.error(`Error in zone ${zone.name}:`, error);
        }
      }

      if (onProgress) {
        onProgress({
          zone: zone.name,
          zoneIndex: i + 1,
          totalZones: zones.length,
          businessesFound: allResults.size,
        });
      }

      await delay(200);
    }

    console.log(
      `[DISCOVERY-ALL] Complete: ${allResults.size} businesses found`,
    );
    return Array.from(allResults.values());
  },

  /**
   * Legacy method - kept for backwards compatibility
   * Now uses zone-based discovery internally
   */
  async discoverBusinessesInCity(
    query: string,
    city: string,
    onProgress?: (progress: {
      gridPoint: number;
      totalPoints: number;
      businessesFound: number;
    }) => void,
    maxResults?: number,
  ): Promise<PlaceResult[]> {
    // Map legacy query to business type
    const businessType = this.queryToBusinessType(query);

    return this.discoverBusinesses(
      businessType,
      city,
      maxResults || 25,
      onProgress
        ? (p) =>
            onProgress({
              gridPoint: p.zoneIndex,
              totalPoints: p.totalZones,
              businessesFound: p.businessesFound,
            })
        : undefined,
    );
  },

  /**
   * Map a search query to a business type
   */
  queryToBusinessType(query: string): string {
    const q = query.toLowerCase();

    // Direct mappings
    const mappings: Record<string, string> = {
      restaurants: "restaurant",
      restaurant: "restaurant",
      cafes: "cafe",
      cafe: "cafe",
      hotels: "hotel",
      hotel: "hotel",
      salons: "salon",
      salon: "salon",
      clinics: "clinic",
      clinic: "clinic",
      dental: "dental",
      dentist: "dental",
      gyms: "gym",
      gym: "gym",
      spas: "spa",
      spa: "spa",
      manufacturers: "manufacturer",
      manufacturer: "manufacturer",
      manufacturing: "manufacturer",
      exporters: "exporter",
      exporter: "exporter",
      warehouses: "warehouse",
      warehouse: "warehouse",
      engineering: "engineering",
      pharma: "pharma",
      pharmaceutical: "pharma",
      retail: "retail",
      education: "coaching",
      coaching: "coaching",
      school: "school",
      schools: "school",
    };

    return mappings[q] || q;
  },

  /**
   * Estimate cost for discovery
   */
  estimateCost(
    city: string,
    businessType?: string,
  ): {
    zones: number;
    estimatedApiCalls: number;
    estimatedCost: number;
  } {
    const zones = businessType
      ? getZonesForBusinessType(city, businessType)
      : getAllZones(city);

    // Each zone = 1-3 API calls depending on query variants
    const avgCallsPerZone = 2;
    const estimatedApiCalls = zones.length * avgCallsPerZone;

    // Text Search: $0.032 per request
    const estimatedCost = estimatedApiCalls * 0.032;

    return {
      zones: zones.length,
      estimatedApiCalls,
      estimatedCost: Math.round(estimatedCost * 100) / 100,
    };
  },

  /**
   * Check if a city is supported
   */
  isCitySupported,

  /**
   * Get list of supported cities
   */
  getSupportedCities,

  /**
   * Get zones for a city
   */
  getZones(city: string, businessType?: string) {
    if (businessType) {
      return getZonesForBusinessType(city, businessType);
    }
    return getAllZones(city);
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
