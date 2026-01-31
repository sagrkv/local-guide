import { Job } from "bullmq";
import { ScrapeJobType, LeadCategory, CreditTransactionType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { googleMapsScraper } from "../../modules/scraping/scrapers/google-maps.scraper.js";
import { googleSearchScraper } from "../../modules/scraping/scrapers/google-search.scraper.js";
import { perplexityClient } from "../../modules/scraping/utils/perplexity.js";
import { googlePlacesClient } from "../../modules/scraping/utils/google-places.js";
import { googlePlacesService } from "../../modules/scraping/scrapers/google-places.service.js";
import {
  qualificationService,
  QualificationResult,
} from "../../modules/qualification/qualification.service.js";
import { config } from "../../config.js";
import { forceFlushLogs } from "../../lib/api-logger.js";
import { creditsService } from "../../modules/credits/credits.service.js";
import type { LeadFilters } from "../../types/filters.js";
import {
  isLeadValid,
  parseFilters,
  getFilterSummary,
} from "../../utils/lead-filter.js";

export interface ScrapeJobData {
  jobId: string;
  type: ScrapeJobType;
  query: string;
  location?: string;
  category?: LeadCategory;
  regionId?: string;
  maxResults: number;
  /** Pre-scrape filters - users only pay for leads matching these criteria */
  filters?: LeadFilters;
  /** Rectangular bounds for custom map area scraping (alternative to zone-based discovery) */
  bounds?: {
    ne: { lat: number; lng: number };
    sw: { lat: number; lng: number };
  };
}

interface ProcessedBusiness {
  businessName: string;
  googlePlaceId?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  locality?: string;
  latitude?: number;
  longitude?: number;
  hasWebsite: boolean;
  rating?: number;
  reviewCount?: number;
  qualification?: QualificationResult;
  qualificationError?: string; // Error message if Lighthouse/qualification failed
}

export async function scrapeWorker(job: Job<ScrapeJobData>) {
  const { jobId, type, query, location, category, regionId, maxResults, filters: rawFilters, bounds } =
    job.data;

  console.log(`Starting scrape job ${jobId}: ${type} - ${query}`);

  // Parse and validate filters
  const filters = parseFilters(rawFilters);
  if (filters) {
    console.log(`[FILTERS] Active filters: ${getFilterSummary(filters)}`);
  }

  // Set job ID for API logging context
  googlePlacesClient.setScrapeJobId(jobId);
  googlePlacesService.setScrapeJobId(jobId);
  perplexityClient.setScrapeJobId(jobId);

  // Get the scrape job to find the user who created it (for multi-tenancy)
  const scrapeJob = await prisma.scrapeJob.findUnique({
    where: { id: jobId },
    select: { createdById: true },
  });

  if (!scrapeJob) {
    throw new Error(`Scrape job ${jobId} not found`);
  }

  const userId = scrapeJob.createdById;

  // Pre-scrape credit check - ensure user has at least some credits
  const currentBalance = await creditsService.getBalance(userId);
  if (currentBalance <= 0) {
    console.warn(`[SCRAPE] User ${userId} has no credits, failing job ${jobId}`);
    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorMessage: "Insufficient credits. Please add credits before scraping.",
      },
    });
    throw new Error("Insufficient credits to start scrape job");
  }

  console.log(`[SCRAPE] User ${userId} has ${currentBalance} credits available`);

  // Update job status to RUNNING
  await prisma.scrapeJob.update({
    where: { id: jobId },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    let results: ProcessedBusiness[] = [];
    let leadsCreated = 0;
    let leadsDuplicate = 0;
    let leadsSkipped = 0;
    let totalFound = 0; // Total leads discovered before filtering
    let matchedFilters = 0; // Leads that matched the user's filters
    let filteredOut = 0; // Leads that didn't match filters

    // Get region cities if regionId is provided
    let locations: string[] = location ? [location] : [];
    if (regionId) {
      const region = await prisma.scrapingRegion.findUnique({
        where: { id: regionId },
      });
      if (region && region.cities.length > 0) {
        locations = region.cities;
      }
    }

    // Validate we have locations to scrape
    if (locations.length === 0) {
      throw new Error(
        "No locations to scrape. Please provide a location or select a region with cities.",
      );
    }

    // Scrape based on type
    switch (type) {
      case "GOOGLE_MAPS":
        for (const loc of locations) {
          const mapResults = await googleMapsScraper.scrape(
            query,
            loc,
            maxResults,
          );
          results.push(...mapResults);

          // Update progress
          await job.updateProgress({
            location: loc,
            found: results.length,
          });
        }
        break;

      case "GOOGLE_SEARCH":
        for (const loc of locations) {
          const searchResults = await googleSearchScraper.scrape(
            query,
            loc,
            maxResults,
          );
          results.push(...searchResults);

          await job.updateProgress({
            location: loc,
            found: results.length,
          });
        }
        break;

      case "PERPLEXITY":
        const perplexityResults = await perplexityClient.searchBusinesses(
          query,
          locations[0],
        );
        results = perplexityResults.map((r) => ({
          businessName: r.name,
          email: r.email,
          phone: r.phone,
          website: r.website,
          address: r.address,
          city: r.city,
          hasWebsite: r.hasWebsite,
        }));
        break;

      case "DISCOVERY_PIPELINE":
        // HYBRID PIPELINE: Google Places API (Essentials) → Perplexity enrichment → Lighthouse qualification
        // This provides complete city coverage at lower cost

        // Validate Google Places API is configured (should have been checked in service, but double-check)
        if (!config.googlePlacesApiKey) {
          throw new Error(
            "DISCOVERY_PIPELINE requires Google Places API key. Please configure GOOGLE_PLACES_API_KEY environment variable.",
          );
        }

        // Check if bounds are provided (custom map area selection)
        if (bounds) {
          console.log(
            `[DISCOVERY_PIPELINE] Using bounds-based search (custom map area)`,
          );
          console.log(
            `[DISCOVERY_PIPELINE] Bounds: NE(${bounds.ne.lat}, ${bounds.ne.lng}) SW(${bounds.sw.lat}, ${bounds.sw.lng})`,
          );

          // Step 1: Search within bounds using grid-based approach
          const boundsSearchResults = await googlePlacesService.searchPlacesInArea(
            {
              query,
              bounds: {
                ne: { latitude: bounds.ne.lat, longitude: bounds.ne.lng },
                sw: { latitude: bounds.sw.lat, longitude: bounds.sw.lng },
              },
            },
            2, // 2km grid cells
            (progress) => {
              job.updateProgress({
                phase: "discovery",
                location: location || "Custom Area",
                gridPoint: progress.currentCell,
                totalGridPoints: progress.totalCells,
                businessesFound: progress.resultsFound,
              });
              console.log(
                `[DISCOVERY_PIPELINE] Grid ${progress.currentCell}/${progress.totalCells}: ${progress.resultsFound} businesses found`,
              );
            },
          );

          console.log(
            `[DISCOVERY_PIPELINE] Found ${boundsSearchResults.results.length} businesses in custom area`,
          );

          // Transform PlaceResult to the format expected by the rest of the pipeline
          const placesResults = boundsSearchResults.results.map((p) => ({
            placeId: p.placeId,
            name: p.name,
            address: p.address,
            latitude: p.location.latitude,
            longitude: p.location.longitude,
            types: p.types,
            businessStatus: p.businessStatus,
            websiteUri: p.website,
            phoneNumber: p.phone,
            rating: p.rating,
            reviewCount: p.reviewCount,
          }));

          // Step 1.5: Filter to only businesses WITH websites
          const businessesWithWebsites = placesResults.filter(
            (p) => p.websiteUri && p.websiteUri.length > 0,
          );
          const businessesWithoutWebsites =
            placesResults.length - businessesWithWebsites.length;

          console.log(
            `[DISCOVERY_PIPELINE] Filtered: ${businessesWithWebsites.length} have websites, ${businessesWithoutWebsites} skipped (no website)`,
          );

          leadsSkipped += businessesWithoutWebsites;

          await job.updateProgress({
            phase: "discovery_complete",
            location: location || "Custom Area",
            totalBusinesses: placesResults.length,
            withWebsites: businessesWithWebsites.length,
            withoutWebsites: businessesWithoutWebsites,
          });

          // Step 2: Qualify businesses with Lighthouse
          console.log(
            `[DISCOVERY_PIPELINE] Step 2: Qualifying ${businessesWithWebsites.length} businesses with Lighthouse...`,
          );

          let qualifiedCount = 0;
          for (const place of businessesWithWebsites) {
            if (results.length >= maxResults) {
              console.log(
                `[DISCOVERY_PIPELINE] Reached max results (${maxResults}), stopping`,
              );
              break;
            }

            try {
              const website = place.websiteUri!;
              console.log(
                `[DISCOVERY_PIPELINE] Qualifying ${place.name} (${website})...`,
              );

              const qualification = await qualificationService.qualifyBusiness({
                website,
                hasWebsite: true,
                businessName: place.name,
              });

              if (!qualification.isQualified) {
                console.log(
                  `[DISCOVERY_PIPELINE] Skipping ${place.name} - website is good (score: ${qualification.lighthouse?.performance})`,
                );
                leadsSkipped++;
                continue;
              }

              qualifiedCount++;

              await job.updateProgress({
                phase: "qualification",
                location: location || "Custom Area",
                qualified: qualifiedCount,
                total: Math.min(businessesWithWebsites.length, maxResults),
              });

              // Step 3: Enrich with Perplexity
              console.log(
                `[DISCOVERY_PIPELINE] Enriching ${place.name} with Perplexity...`,
              );

              const enriched = await perplexityClient.enrichFromGooglePlace({
                name: place.name,
                address: place.address,
                city: location || "Unknown",
              });

              const processedBusiness: ProcessedBusiness = {
                businessName: place.name,
                googlePlaceId: place.placeId,
                contactPerson: enriched.ownerName,
                email: enriched.email,
                phone: place.phoneNumber || enriched.phone,
                website: place.websiteUri || enriched.website || website,
                address: place.address,
                city: location,
                latitude: place.latitude,
                longitude: place.longitude,
                hasWebsite: true,
                rating: place.rating,
                reviewCount: place.reviewCount,
                qualification,
                qualificationError: qualification.error,
              };

              totalFound++;

              const filterResult = isLeadValid(processedBusiness, filters);
              if (!filterResult.isValid) {
                console.log(
                  `[DISCOVERY_PIPELINE] Filtered out ${place.name}: ${filterResult.filterReasons.join(", ")}`,
                );
                filteredOut++;
                continue;
              }

              matchedFilters++;

              // Check for duplicates
              let isDuplicate = false;
              if (processedBusiness.googlePlaceId) {
                const existingByPlaceId = await prisma.lead.findUnique({
                  where: { googlePlaceId: processedBusiness.googlePlaceId },
                });
                if (existingByPlaceId) {
                  isDuplicate = true;
                  leadsDuplicate++;
                }
              }

              if (!isDuplicate) {
                const existingByName = await prisma.lead.findFirst({
                  where: {
                    businessName: {
                      equals: processedBusiness.businessName,
                      mode: "insensitive",
                    },
                    city: processedBusiness.city
                      ? { equals: processedBusiness.city, mode: "insensitive" }
                      : undefined,
                  },
                });
                if (existingByName) {
                  isDuplicate = true;
                  leadsDuplicate++;
                }
              }

              if (!isDuplicate) {
                const createdLead = await prisma.lead.create({
                  data: {
                    user: { connect: { id: userId } },
                    businessName: processedBusiness.businessName,
                    googlePlaceId: processedBusiness.googlePlaceId,
                    contactPerson: processedBusiness.contactPerson,
                    email: processedBusiness.email,
                    phone: processedBusiness.phone,
                    website: processedBusiness.website,
                    address: processedBusiness.address,
                    city: processedBusiness.city,
                    state: processedBusiness.state,
                    locality: processedBusiness.locality,
                    latitude: processedBusiness.latitude,
                    longitude: processedBusiness.longitude,
                    category: category || "OTHER",
                    source: "GOOGLE_PLACES",
                    leadType:
                      qualification.reason === "NO_WEBSITE"
                        ? "NO_WEBSITE"
                        : "OUTDATED_WEBSITE",
                    hasWebsite: processedBusiness.hasWebsite,
                    scrapeJob: { connect: { id: jobId } },
                    lighthouseScore: qualification.lighthouse?.performance,
                    lighthouseSeo: qualification.lighthouse?.seo,
                    lighthouseAccessibility:
                      qualification.lighthouse?.accessibility,
                    lighthouseBestPractices:
                      qualification.lighthouse?.bestPractices,
                    websiteNeedsRedesign:
                      qualification.reason === "POOR_WEBSITE" ||
                      qualification.reason === "WEBSITE_UNREACHABLE",
                    score: qualification.score || 0,
                    prospectStatus: "LEAD",
                    qualificationError: processedBusiness.qualificationError,
                  },
                });
                leadsCreated++;

                console.log(
                  `[DISCOVERY_PIPELINE] Created lead: ${processedBusiness.businessName} (ID: ${createdLead.id})`,
                );

                await prisma.scrapeJob.update({
                  where: { id: jobId },
                  data: {
                    leadsFound: results.length + leadsSkipped + 1,
                    leadsCreated,
                    leadsDuplicate,
                    leadsSkipped,
                    totalFound,
                    matchedFilters,
                  },
                });
              }

              results.push(processedBusiness);

              await job.updateProgress({
                phase: "enriching",
                location: location || "Custom Area",
                currentBusiness: place.name,
                qualified: qualifiedCount,
                created: leadsCreated,
                duplicates: leadsDuplicate,
                skipped: leadsSkipped,
                filteredOut,
                matchedFilters,
                totalFound,
                total: Math.min(businessesWithWebsites.length, maxResults),
              });

              console.log(
                `[DISCOVERY_PIPELINE] Added ${place.name} (${qualification.reason}, score: ${qualification.score})`,
              );
            } catch (processError) {
              console.warn(
                `[DISCOVERY_PIPELINE] Failed to process ${place.name}:`,
                processError,
              );
            }
          }

          await job.updateProgress({
            phase: "complete",
            location: location || "Custom Area",
            qualified: results.length,
            skipped: leadsSkipped,
            filteredOut,
            matchedFilters,
            totalFound,
          });

          console.log(
            `[DISCOVERY_PIPELINE] Custom area: ${results.length} qualified, ${leadsSkipped} skipped, ${filteredOut} filtered out, ${matchedFilters} matched filters`,
          );
        } else {
          // Zone-based discovery (existing logic for supported cities)
          for (const loc of locations) {
            console.log(
              `[DISCOVERY_PIPELINE] Starting hybrid discovery for ${loc}...`,
            );

            // Step 1: Google Places API Discovery (complete city coverage via grid)
            console.log(
              `[DISCOVERY_PIPELINE] Step 1: Discovering businesses via Google Places API...`,
            );

            const placesResults =
              await googlePlacesClient.discoverBusinessesInCity(
                query,
                loc,
                (progress) => {
                  job.updateProgress({
                    phase: "discovery",
                    location: loc,
                    gridPoint: progress.gridPoint,
                    totalGridPoints: progress.totalPoints,
                    businessesFound: progress.businessesFound,
                  });
                  console.log(
                    `[DISCOVERY_PIPELINE] Grid ${progress.gridPoint}/${progress.totalPoints}: ${progress.businessesFound} businesses found`,
                  );
                },
                maxResults, // Stop early once we have enough businesses
              );

            console.log(
              `[DISCOVERY_PIPELINE] Found ${placesResults.length} businesses in ${loc}`,
            );

          // Step 1.5: Filter to only businesses WITH websites (from Google Places data)
          // This saves Perplexity API calls by filtering early
          const businessesWithWebsites = placesResults.filter(
            (p) => p.websiteUri && p.websiteUri.length > 0,
          );
          const businessesWithoutWebsites =
            placesResults.length - businessesWithWebsites.length;

          console.log(
            `[DISCOVERY_PIPELINE] Filtered: ${businessesWithWebsites.length} have websites, ${businessesWithoutWebsites} skipped (no website)`,
          );

          leadsSkipped += businessesWithoutWebsites;

          await job.updateProgress({
            phase: "discovery_complete",
            location: loc,
            totalBusinesses: placesResults.length,
            withWebsites: businessesWithWebsites.length,
            withoutWebsites: businessesWithoutWebsites,
          });

          // Step 2: Qualify businesses with Lighthouse (check website quality)
          // Only enrich with Perplexity AFTER qualification to save API costs
          console.log(
            `[DISCOVERY_PIPELINE] Step 2: Qualifying ${businessesWithWebsites.length} businesses with Lighthouse...`,
          );

          let qualifiedCount = 0;
          for (const place of businessesWithWebsites) {
            // Skip if we've hit maxResults
            if (results.length >= maxResults) {
              console.log(
                `[DISCOVERY_PIPELINE] Reached max results (${maxResults}), stopping`,
              );
              break;
            }

            try {
              // Use website from Google Places directly
              const website = place.websiteUri!;

              // Run Lighthouse qualification
              console.log(
                `[DISCOVERY_PIPELINE] Qualifying ${place.name} (${website})...`,
              );

              const qualification = await qualificationService.qualifyBusiness({
                website,
                hasWebsite: true,
                businessName: place.name,
              });

              // Skip businesses with good websites (they don't need us)
              if (!qualification.isQualified) {
                console.log(
                  `[DISCOVERY_PIPELINE] Skipping ${place.name} - website is good (score: ${qualification.lighthouse?.performance})`,
                );
                leadsSkipped++;
                continue;
              }

              qualifiedCount++;

              await job.updateProgress({
                phase: "qualification",
                location: loc,
                qualified: qualifiedCount,
                total: Math.min(businessesWithWebsites.length, maxResults),
              });

              // Step 3: Enrich with Perplexity ONLY for qualified leads
              // This saves API costs by only enriching businesses we'll actually use
              console.log(
                `[DISCOVERY_PIPELINE] Enriching ${place.name} with Perplexity...`,
              );

              const enriched = await perplexityClient.enrichFromGooglePlace({
                name: place.name,
                address: place.address,
                city: loc,
              });

              // Build the processed business data (including rating/reviews from Google Places)
              const processedBusiness: ProcessedBusiness = {
                businessName: place.name,
                googlePlaceId: place.placeId,
                contactPerson: enriched.ownerName,
                email: enriched.email,
                phone: place.phoneNumber || enriched.phone, // Google phone is more reliable
                website: place.websiteUri || enriched.website || website,
                address: place.address,
                city: loc,
                latitude: place.latitude,
                longitude: place.longitude,
                hasWebsite: true,
                rating: place.rating,
                reviewCount: place.reviewCount,
                qualification,
                qualificationError: qualification.error,
              };

              // Track total found
              totalFound++;

              // Apply user's pre-scrape filters
              const filterResult = isLeadValid(processedBusiness, filters);
              if (!filterResult.isValid) {
                console.log(
                  `[DISCOVERY_PIPELINE] Filtered out ${place.name}: ${filterResult.filterReasons.join(", ")}`,
                );
                filteredOut++;
                continue;
              }

              // Lead matches filters
              matchedFilters++;

              // SAVE LEAD IMMEDIATELY (incremental saving)
              // Check for duplicates first
              let isDuplicate = false;
              if (processedBusiness.googlePlaceId) {
                const existingByPlaceId = await prisma.lead.findUnique({
                  where: { googlePlaceId: processedBusiness.googlePlaceId },
                });
                if (existingByPlaceId) {
                  isDuplicate = true;
                  leadsDuplicate++;
                }
              }

              if (!isDuplicate) {
                // Check by name and city
                const existingByName = await prisma.lead.findFirst({
                  where: {
                    businessName: {
                      equals: processedBusiness.businessName,
                      mode: "insensitive",
                    },
                    city: processedBusiness.city
                      ? { equals: processedBusiness.city, mode: "insensitive" }
                      : undefined,
                  },
                });
                if (existingByName) {
                  isDuplicate = true;
                  leadsDuplicate++;
                }
              }

              if (!isDuplicate) {
                // Save the lead immediately
                const createdLead = await prisma.lead.create({
                  data: {
                    user: { connect: { id: userId } }, // Multi-tenancy: set owner to job creator
                    businessName: processedBusiness.businessName,
                    googlePlaceId: processedBusiness.googlePlaceId,
                    contactPerson: processedBusiness.contactPerson,
                    email: processedBusiness.email,
                    phone: processedBusiness.phone,
                    website: processedBusiness.website,
                    address: processedBusiness.address,
                    city: processedBusiness.city,
                    state: processedBusiness.state,
                    locality: processedBusiness.locality,
                    latitude: processedBusiness.latitude,
                    longitude: processedBusiness.longitude,
                    category: category || "OTHER",
                    source: processedBusiness.googlePlaceId
                      ? "GOOGLE_PLACES"
                      : "GOOGLE_MAPS",
                    leadType:
                      qualification.reason === "NO_WEBSITE"
                        ? "NO_WEBSITE"
                        : "OUTDATED_WEBSITE",
                    hasWebsite: processedBusiness.hasWebsite,
                    scrapeJob: { connect: { id: jobId } },
                    lighthouseScore: qualification.lighthouse?.performance,
                    lighthouseSeo: qualification.lighthouse?.seo,
                    lighthouseAccessibility:
                      qualification.lighthouse?.accessibility,
                    lighthouseBestPractices:
                      qualification.lighthouse?.bestPractices,
                    websiteNeedsRedesign:
                      qualification.reason === "POOR_WEBSITE" ||
                      qualification.reason === "WEBSITE_UNREACHABLE",
                    score: qualification.score || 0,
                    prospectStatus: "LEAD",
                    qualificationError: processedBusiness.qualificationError,
                  },
                });
                leadsCreated++;

                console.log(
                  `[DISCOVERY_PIPELINE] Created lead: ${processedBusiness.businessName} (ID: ${createdLead.id})`,
                );

                // Update job counts in real-time
                await prisma.scrapeJob.update({
                  where: { id: jobId },
                  data: {
                    leadsFound: results.length + leadsSkipped + 1,
                    leadsCreated,
                    leadsDuplicate,
                    leadsSkipped,
                    totalFound,
                    matchedFilters,
                  },
                });
              }

              // Add to results array for final count
              results.push(processedBusiness);

              // Update progress with current business name and filter stats
              await job.updateProgress({
                phase: "enriching",
                location: loc,
                currentBusiness: place.name,
                qualified: qualifiedCount,
                created: leadsCreated,
                duplicates: leadsDuplicate,
                skipped: leadsSkipped,
                filteredOut,
                matchedFilters,
                totalFound,
                total: Math.min(businessesWithWebsites.length, maxResults),
              });

              console.log(
                `[DISCOVERY_PIPELINE] Added ${place.name} (${qualification.reason}, score: ${qualification.score})`,
              );
            } catch (processError) {
              console.warn(
                `[DISCOVERY_PIPELINE] Failed to process ${place.name}:`,
                processError,
              );
              // Skip this business on error - don't add without proper qualification
            }
          }

          await job.updateProgress({
            phase: "complete",
            location: loc,
            qualified: results.length,
            skipped: leadsSkipped,
            filteredOut,
            matchedFilters,
            totalFound,
          });

          console.log(
            `[DISCOVERY_PIPELINE] ${loc}: ${results.length} qualified, ${leadsSkipped} skipped, ${filteredOut} filtered out, ${matchedFilters} matched filters`,
          );
          }
        }
        break;
    }

    // For DISCOVERY_PIPELINE, leads are already saved incrementally above
    // For other job types, we still need to save leads at the end
    if (type !== "DISCOVERY_PIPELINE") {
      for (const result of results) {
        // Track total found
        totalFound++;

        // Apply user's pre-scrape filters
        const filterResult = isLeadValid(result, filters);
        if (!filterResult.isValid) {
          console.log(
            `[${type}] Filtered out ${result.businessName}: ${filterResult.filterReasons.join(", ")}`,
          );
          filteredOut++;
          continue;
        }

        // Lead matches filters
        matchedFilters++;

        // Check for existing lead by googlePlaceId first (most reliable)
        if (result.googlePlaceId) {
          const existingByPlaceId = await prisma.lead.findUnique({
            where: { googlePlaceId: result.googlePlaceId },
          });

          if (existingByPlaceId) {
            leadsDuplicate++;
            continue;
          }
        }

        // Fallback: Check for existing lead with same name and city
        const existing = await prisma.lead.findFirst({
          where: {
            businessName: { equals: result.businessName, mode: "insensitive" },
            city: result.city
              ? { equals: result.city, mode: "insensitive" }
              : undefined,
          },
        });

        if (existing) {
          leadsDuplicate++;
          continue;
        }

        // Determine source and leadType based on job type and qualification
        let source:
          | "GOOGLE_MAPS"
          | "GOOGLE_SEARCH"
          | "PERPLEXITY"
          | "GOOGLE_PLACES" = "GOOGLE_MAPS";
        let leadType: "NO_WEBSITE" | "OUTDATED_WEBSITE" = result.hasWebsite
          ? "OUTDATED_WEBSITE"
          : "NO_WEBSITE";

        if (type === "PERPLEXITY") {
          source = "PERPLEXITY";
        } else if (type === "GOOGLE_SEARCH") {
          source = "GOOGLE_SEARCH";
        }

        // Create the lead as a PROSPECT (awaiting review)
        const createdLead = await prisma.lead.create({
          data: {
            user: { connect: { id: userId } }, // Multi-tenancy: set owner to job creator
            businessName: result.businessName,
            googlePlaceId: result.googlePlaceId,
            contactPerson: result.contactPerson,
            email: result.email,
            phone: result.phone,
            website: result.website,
            address: result.address,
            city: result.city,
            state: result.state,
            locality: result.locality,
            latitude: result.latitude,
            longitude: result.longitude,
            category: category || "OTHER",
            source,
            leadType,
            hasWebsite: result.hasWebsite,
            scrapeJob: { connect: { id: jobId } },
            // Include Lighthouse scores if available
            lighthouseScore: result.qualification?.lighthouse?.performance,
            lighthouseSeo: result.qualification?.lighthouse?.seo,
            lighthouseAccessibility:
              result.qualification?.lighthouse?.accessibility,
            lighthouseBestPractices:
              result.qualification?.lighthouse?.bestPractices,
            websiteNeedsRedesign:
              result.qualification?.reason === "POOR_WEBSITE" ||
              result.qualification?.reason === "WEBSITE_UNREACHABLE",
            // Add qualification score to lead score
            score: result.qualification?.score || 0,
            // Save directly as LEAD for immediate visibility
            prospectStatus: "LEAD",
            // Store qualification error if Lighthouse failed
            qualificationError: result.qualificationError,
          },
        });

        leadsCreated++;
        console.log(
          `[${type}] Created lead: ${result.businessName} (ID: ${createdLead.id})`,
        );
      }
    }

    // Consolidated credit deduction for all leads created in this job
    if (leadsCreated > 0) {
      try {
        await creditsService.deductCredits({
          userId,
          amount: leadsCreated,
          type: CreditTransactionType.LEAD_CHARGE,
          description: `Scrape job: ${leadsCreated} leads`,
          reference: jobId,
        });
        console.log(
          `[SCRAPE] Charged ${leadsCreated} credits for job ${jobId}`,
        );
      } catch (creditError) {
        console.error(
          `[SCRAPE] Failed to charge ${leadsCreated} credits for job ${jobId}:`,
          creditError,
        );
        // Note: Leads are already created at this point, so we log the error
        // but don't fail the job. Admin can manually adjust credits if needed.
      }
    }

    // Update job with results (including filter stats)
    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        leadsFound: results.length + leadsSkipped, // Qualified businesses before user filters
        leadsCreated,
        leadsDuplicate,
        leadsSkipped,
        totalFound, // Total leads discovered before any filtering
        matchedFilters, // Leads that matched user's pre-scrape filters
      },
    });

    const filterSummary = filters ? getFilterSummary(filters) : "none";
    console.log(
      `Scrape job ${jobId} completed: ${leadsCreated} leads created, ${leadsDuplicate} duplicates, ${leadsSkipped} skipped (good websites), ${filteredOut} filtered out (filters: ${filterSummary})`,
    );

    // Flush API logs and clear job context
    await forceFlushLogs();
    googlePlacesClient.setScrapeJobId(undefined);
    googlePlacesService.setScrapeJobId(undefined);
    perplexityClient.setScrapeJobId(undefined);

    return {
      leadsFound: results.length + leadsSkipped,
      leadsCreated,
      leadsDuplicate,
      leadsSkipped,
      totalFound,
      matchedFilters,
      filteredOut,
    };
  } catch (error) {
    console.error(`Scrape job ${jobId} failed:`, error);

    // Flush API logs and clear job context even on error
    await forceFlushLogs();
    googlePlacesClient.setScrapeJobId(undefined);
    googlePlacesService.setScrapeJobId(undefined);
    perplexityClient.setScrapeJobId(undefined);

    // Update job with error
    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined,
      },
    });

    throw error;
  }
}
