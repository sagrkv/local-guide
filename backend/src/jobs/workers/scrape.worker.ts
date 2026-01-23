import { Job } from "bullmq";
import { ScrapeJobType, LeadCategory } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { googleMapsScraper } from "../../modules/scraping/scrapers/google-maps.scraper.js";
import { googleSearchScraper } from "../../modules/scraping/scrapers/google-search.scraper.js";
import { perplexityClient } from "../../modules/scraping/utils/perplexity.js";
import { googlePlacesClient } from "../../modules/scraping/utils/google-places.js";
import {
  qualificationService,
  QualificationResult,
} from "../../modules/qualification/qualification.service.js";
import { config } from "../../config.js";
import { forceFlushLogs } from "../../lib/api-logger.js";

export interface ScrapeJobData {
  jobId: string;
  type: ScrapeJobType;
  query: string;
  location?: string;
  category?: LeadCategory;
  regionId?: string;
  maxResults: number;
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
  qualification?: QualificationResult;
  qualificationError?: string; // Error message if Lighthouse/qualification failed
}

export async function scrapeWorker(job: Job<ScrapeJobData>) {
  const { jobId, type, query, location, category, regionId, maxResults } =
    job.data;

  console.log(`Starting scrape job ${jobId}: ${type} - ${query}`);

  // Set job ID for API logging context
  googlePlacesClient.setScrapeJobId(jobId);
  perplexityClient.setScrapeJobId(jobId);

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

    // Get region cities if regionId is provided
    let locations: string[] = location ? [location] : [];
    if (regionId) {
      const region = await prisma.scrapingRegion.findUnique({
        where: { id: regionId },
      });
      if (region) {
        locations = region.cities;
      }
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

        for (const loc of locations) {
          console.log(
            `[DISCOVERY_PIPELINE] Starting hybrid discovery for ${loc}...`,
          );

          // Check if Google Places API is configured
          if (!config.googlePlacesApiKey) {
            console.warn(
              "[DISCOVERY_PIPELINE] Google Places API not configured, falling back to Google Maps scraping",
            );
            // Fallback to old method
            const mapResults = await googleMapsScraper.scrape(
              query,
              loc,
              maxResults,
            );
            for (const business of mapResults) {
              // Skip businesses without websites (not our target)
              if (!business.hasWebsite || !business.website) {
                console.log(
                  `[DISCOVERY_PIPELINE] Skipping ${business.businessName} - no website`,
                );
                leadsSkipped++;
                continue;
              }

              const qualification = await qualificationService.qualifyBusiness({
                website: business.website,
                hasWebsite: business.hasWebsite,
                businessName: business.businessName,
              });

              if (!qualification.isQualified) {
                leadsSkipped++;
                continue;
              }

              results.push({ ...business, qualification });
            }
            continue;
          }

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

              // Build the processed business data
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
                qualification,
                qualificationError: qualification.error,
              };

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
                await prisma.lead.create({
                  data: {
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
                    scrapeJobId: jobId,
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
                    prospectStatus: "PROSPECT",
                    qualificationError: processedBusiness.qualificationError,
                  },
                });
                leadsCreated++;

                // Update job counts in real-time
                await prisma.scrapeJob.update({
                  where: { id: jobId },
                  data: {
                    leadsFound: results.length + leadsSkipped + 1,
                    leadsCreated,
                    leadsDuplicate,
                    leadsSkipped,
                  },
                });
              }

              // Add to results array for final count
              results.push(processedBusiness);

              // Update progress with current business name
              await job.updateProgress({
                phase: "enriching",
                location: loc,
                currentBusiness: place.name,
                qualified: qualifiedCount,
                created: leadsCreated,
                duplicates: leadsDuplicate,
                skipped: leadsSkipped,
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
          });

          console.log(
            `[DISCOVERY_PIPELINE] ${loc}: ${results.length} qualified, ${leadsSkipped} skipped`,
          );
        }
        break;
    }

    // For DISCOVERY_PIPELINE, leads are already saved incrementally above
    // For other job types, we still need to save leads at the end
    if (type !== "DISCOVERY_PIPELINE") {
      for (const result of results) {
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
        await prisma.lead.create({
          data: {
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
            scrapeJobId: jobId,
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
            // Save as PROSPECT - user must review and promote to LEAD
            prospectStatus: "PROSPECT",
            // Store qualification error if Lighthouse failed
            qualificationError: result.qualificationError,
          },
        });

        leadsCreated++;
      }
    }

    // Update job with results
    await prisma.scrapeJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        leadsFound: results.length + leadsSkipped, // Total businesses found before filtering
        leadsCreated,
        leadsDuplicate,
        leadsSkipped,
      },
    });

    console.log(
      `Scrape job ${jobId} completed: ${leadsCreated} leads created, ${leadsDuplicate} duplicates, ${leadsSkipped} skipped (good websites)`,
    );

    // Flush API logs and clear job context
    await forceFlushLogs();
    googlePlacesClient.setScrapeJobId(undefined);
    perplexityClient.setScrapeJobId(undefined);

    return {
      leadsFound: results.length + leadsSkipped,
      leadsCreated,
      leadsDuplicate,
      leadsSkipped,
    };
  } catch (error) {
    console.error(`Scrape job ${jobId} failed:`, error);

    // Flush API logs and clear job context even on error
    await forceFlushLogs();
    googlePlacesClient.setScrapeJobId(undefined);
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
