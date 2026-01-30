import { FastifyInstance } from "fastify";
import { z } from "zod";
import { scrapingService } from "./scraping.service.js";
import { prisma } from "../../lib/prisma.js";
import {
  getApiStats,
  getRecentApiCalls,
  type ApiProvider,
} from "../../lib/api-logger.js";
import {
  CITIES,
  BUSINESS_TYPE_QUERIES,
  type ZoneType,
} from "./data/city-zones.js";
import { perplexityClient } from "./utils/perplexity.js";
import { scanTechStack } from "./utils/tech-stack-scanner.js";

/**
 * Schema for pre-scrape filters.
 * Users only pay credits for leads matching these criteria.
 */
const leadFiltersSchema = z
  .object({
    /** Filter by website presence (true = must have, false = must not have, undefined = any) */
    hasWebsite: z.boolean().optional(),
    /** Filter by email presence (true = must have, false = must not have, undefined = any) */
    hasEmail: z.boolean().optional(),
    /** Filter by phone presence (true = must have, false = must not have, undefined = any) */
    hasPhone: z.boolean().optional(),
    /** Minimum Google rating (1-5 stars) */
    minRating: z.number().min(1).max(5).optional(),
    /** Minimum number of Google reviews */
    minReviews: z.number().min(0).int().optional(),
  })
  .optional();

/** Schema for geographic bounds (map selection) */
const boundsSchema = z.object({
  ne: z.object({ lat: z.number(), lng: z.number() }),
  sw: z.object({ lat: z.number(), lng: z.number() }),
});

const createJobSchema = z.object({
  type: z.enum([
    "GOOGLE_SEARCH",
    "GOOGLE_MAPS",
    "PERPLEXITY",
    "DISCOVERY_PIPELINE",
  ]),
  query: z.string().min(1),
  location: z.string().optional(),
  /** Geographic bounds for map-based scraping */
  bounds: boundsSchema.optional(),
  category: z
    .enum([
      "STARTUP",
      "RESTAURANT",
      "HOTEL",
      "ECOMMERCE",
      "SALON",
      "CLINIC",
      "GYM",
      "RETAIL",
      "EDUCATION",
      "REAL_ESTATE",
      "AGENCY",
      "OTHER",
    ])
    .optional(),
  regionId: z.string().optional(),
  maxResults: z.number().min(1).max(100).default(25),
  /** Pre-scrape filters - users only pay for leads matching these criteria */
  filters: leadFiltersSchema,
});

const listQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  status: z
    .enum(["PENDING", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"])
    .optional(),
  type: z
    .enum(["GOOGLE_SEARCH", "GOOGLE_MAPS", "PERPLEXITY", "DISCOVERY_PIPELINE"])
    .optional(),
});

export async function scrapingRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.authenticate);

  // List scrape jobs
  fastify.get("/jobs", async (request, reply) => {
    const query = listQuerySchema.parse(request.query);
    // Multi-tenancy: pass userId for data isolation
    const result = await scrapingService.listJobs({ ...query, userId: request.user.userId });
    return result;
  });

  // Get scrape job by ID
  fastify.get("/jobs/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    // Multi-tenancy: pass userId for data isolation (returns 404 if not owned)
    const job = await scrapingService.getJobById(id, request.user.userId);

    if (!job) {
      return reply.status(404).send({ error: "Scrape job not found" });
    }

    return job;
  });

  // Create and start a new scrape job
  fastify.post("/jobs", async (request, reply) => {
    const data = createJobSchema.parse(request.body);

    const job = await scrapingService.createJob({
      type: data.type,
      query: data.query,
      location: data.location,
      bounds: data.bounds as { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } } | undefined,
      category: data.category,
      regionId: data.regionId,
      maxResults: data.maxResults,
      filters: data.filters,
      userId: request.user.userId,
    });

    return reply.status(201).send(job);
  });

  // Cancel a running scrape job
  fastify.post("/jobs/:id/cancel", async (request, reply) => {
    const { id } = request.params as { id: string };

    // Multi-tenancy: pass userId for data isolation (returns 404 if not owned)
    const job = await scrapingService.cancelJob(id, request.user.userId);

    if (!job) {
      return reply.status(404).send({ error: "Scrape job not found" });
    }

    return job;
  });

  // Retry a failed scrape job
  fastify.post("/jobs/:id/retry", async (request, reply) => {
    const { id } = request.params as { id: string };

    const job = await scrapingService.retryJob(id, request.user.userId);

    if (!job) {
      return reply
        .status(404)
        .send({ error: "Scrape job not found or not in failed state" });
    }

    return job;
  });

  // Get scraping statistics
  fastify.get("/stats", async (request, reply) => {
    // Multi-tenancy: pass userId for data isolation
    const stats = await scrapingService.getStats(request.user.userId);
    return stats;
  });

  // Analyze a single website (for manual analysis)
  fastify.post("/analyze-website", async (request, reply) => {
    const schema = z.object({
      url: z.string().url(),
    });

    const { url } = schema.parse(request.body);

    const analysis = await scrapingService.analyzeWebsite(url);
    return analysis;
  });

  // Search for leads using Perplexity
  fastify.post("/perplexity-search", async (request, reply) => {
    const schema = z.object({
      query: z.string().min(1),
      location: z.string().optional(),
    });

    const data = schema.parse(request.body);

    const results = await scrapingService.perplexitySearch(
      data.query,
      data.location,
    );
    return results;
  });

  // ===== Website Analysis =====

  // Rerun Lighthouse analysis on a prospect/lead
  fastify.post("/analyze/lighthouse", async (request, reply) => {
    const schema = z.object({
      leadId: z.string(),
    });

    const { leadId } = schema.parse(request.body);

    // CRITICAL: Verify ownership for multi-tenancy (returns 404 if not owned)
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, userId: request.user.userId },
    });

    if (!lead) {
      return reply.status(404).send({ error: "Lead not found" });
    }

    if (!lead.website) {
      return reply
        .status(400)
        .send({ error: "Lead has no website to analyze" });
    }

    // Import and run Lighthouse
    const { lighthouseAnalyzer } = await import("./utils/lighthouse.js");

    try {
      const results = await lighthouseAnalyzer.analyze(lead.website);

      // Build update data
      const updateData: Record<string, unknown> = {
        lighthouseScore: results.performance,
        lighthouseSeo: results.seo,
        lighthouseAccessibility: results.accessibility,
        lighthouseBestPractices: results.bestPractices,
        websiteNeedsRedesign: results.performance < 70 || results.seo < 70,
        qualificationError: null, // Clear any previous error
      };

      // If the website redirected to a different URL, update it
      if (results.redirected && results.finalUrl) {
        updateData.website = results.finalUrl;
        console.log(
          `[Lighthouse] Updating lead website URL from ${lead.website} to ${results.finalUrl}`,
        );
      }

      // If domain is parked/expired, mark it in the notes
      if (
        results.domainStatus === "parked" ||
        results.domainStatus === "expired"
      ) {
        updateData.qualificationError = results.statusMessage;
        updateData.hasWebsite = false; // Mark as no usable website
      }

      // Update the lead with new scores
      await prisma.lead.update({
        where: { id: leadId },
        data: updateData,
      });

      return {
        success: true,
        results,
        redirected: results.redirected,
        finalUrl: results.finalUrl,
        domainStatus: results.domainStatus,
        statusMessage: results.statusMessage,
        originalUrl: lead.website,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Analysis failed";

      // Save the error to the lead
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          qualificationError: `Lighthouse failed: ${errorMessage}`,
        },
      });

      return reply.status(500).send({
        error: `Lighthouse analysis failed: ${errorMessage}`,
        success: false,
      });
    }
  });

  // Detect technology stack of a website using Playwright scanner
  fastify.post("/analyze/tech-stack", async (request, reply) => {
    const schema = z.object({
      leadId: z.string().optional(),
      url: z.string().optional(),
    });

    const data = schema.parse(request.body);

    let url = data.url;
    let leadId = data.leadId;

    // If leadId provided, get the website URL
    if (leadId) {
      // CRITICAL: Verify ownership for multi-tenancy (returns 404 if not owned)
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, userId: request.user.userId },
      });

      if (!lead) {
        return reply.status(404).send({ error: "Lead not found" });
      }

      if (!lead.website) {
        return reply
          .status(400)
          .send({ error: "Lead has no website to analyze" });
      }

      url = lead.website;
    }

    if (!url) {
      return reply
        .status(400)
        .send({ error: "Either leadId or url is required" });
    }

    try {
      // Use Playwright-based scanner for accurate tech stack detection
      const scanResult = await scanTechStack(url);

      // Transform to the expected response format
      const techStack = {
        cms: scanResult.cms,
        framework: scanResult.framework,
        hosting: scanResult.hosting,
        ecommerce: scanResult.ecommerce,
        analytics: scanResult.analytics,
        marketing: scanResult.marketing,
        security: scanResult.security,
        mobile: {
          isResponsive: scanResult.mobile.isResponsive,
          hasMobileApp: null, // Can't detect this via scanning
        },
        performance: {
          estimatedLoadTime: `${Math.round(scanResult.performance.loadTimeMs / 1000)}s`,
          issues: scanResult.performance.issues,
        },
        seoTools: [], // Would need deeper analysis
        socialIntegrations: scanResult.socialIntegrations,
        paymentGateways: scanResult.otherTechnologies.filter((t) =>
          ["Razorpay", "PayPal", "Stripe"].includes(t),
        ),
        chatbots: scanResult.chatbots,
        otherTechnologies: [
          ...scanResult.jsLibraries,
          ...scanResult.cssFrameworks,
          ...scanResult.fonts,
          ...scanResult.otherTechnologies.filter(
            (t) => !["Razorpay", "PayPal", "Stripe"].includes(t),
          ),
        ],
        recommendations: scanResult.recommendations,
      };

      // If leadId was provided, save the tech stack to salesIntelligence
      if (leadId) {
        const lead = await prisma.lead.findUnique({
          where: { id: leadId },
          select: { salesIntelligence: true },
        });

        const existingIntelligence =
          (lead?.salesIntelligence as Record<string, unknown>) || {};

        await prisma.lead.update({
          where: { id: leadId },
          data: {
            salesIntelligence: {
              ...existingIntelligence,
              techStack,
              techStackAnalyzedAt: new Date().toISOString(),
            },
          },
        });
      }

      return techStack;
    } catch (error) {
      console.error("Tech stack scan failed:", error);
      return reply.status(500).send({
        error:
          error instanceof Error ? error.message : "Failed to scan website",
      });
    }
  });

  // ===== API Call Logs =====

  // Get API call statistics
  fastify.get("/api-logs/stats", async (request, reply) => {
    const querySchema = z.object({
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      provider: z
        .enum(["GOOGLE_PLACES", "PERPLEXITY", "GOOGLE_MAPS", "LIGHTHOUSE"])
        .optional(),
      scrapeJobId: z.string().optional(),
    });

    const query = querySchema.parse(request.query);
    const stats = await getApiStats({
      startDate: query.startDate,
      endDate: query.endDate,
      provider: query.provider as ApiProvider,
      scrapeJobId: query.scrapeJobId,
    });

    return stats;
  });

  // Get recent API calls
  fastify.get("/api-logs/recent", async (request, reply) => {
    const querySchema = z.object({
      limit: z.coerce.number().min(1).max(500).default(100),
    });

    const query = querySchema.parse(request.query);
    const logs = await getRecentApiCalls(query.limit);

    return { logs };
  });

  // ===== Zones Data =====

  // Get all zones data for visualization
  fastify.get("/zones", async (request, reply) => {
    const querySchema = z.object({
      city: z.string().optional(),
      type: z
        .enum([
          "COMMERCIAL",
          "INDUSTRIAL",
          "TOURIST",
          "MEDICAL",
          "EDUCATION",
          "MIXED",
        ])
        .optional(),
    });

    const query = querySchema.parse(request.query);

    let cities = CITIES;

    if (query.city) {
      cities = cities.filter(
        (c) => c.name.toLowerCase() === query.city!.toLowerCase(),
      );
    }

    const result = cities.map((city) => {
      let zones = city.zones;

      if (query.type) {
        zones = zones.filter((z) => z.type === query.type);
      }

      return {
        name: city.name,
        state: city.state,
        zones: zones.map((zone) => ({
          name: zone.name,
          lat: zone.lat,
          lng: zone.lng,
          radiusKm: zone.radiusKm,
          type: zone.type,
          businessTypes: zone.businessTypes,
          priority: zone.priority,
          description: zone.description,
        })),
        totalZones: zones.length,
        zonesByType: {
          COMMERCIAL: zones.filter((z) => z.type === "COMMERCIAL").length,
          INDUSTRIAL: zones.filter((z) => z.type === "INDUSTRIAL").length,
          TOURIST: zones.filter((z) => z.type === "TOURIST").length,
          MEDICAL: zones.filter((z) => z.type === "MEDICAL").length,
          EDUCATION: zones.filter((z) => z.type === "EDUCATION").length,
          MIXED: zones.filter((z) => z.type === "MIXED").length,
        },
      };
    });

    return {
      cities: result,
      businessTypes: Object.keys(BUSINESS_TYPE_QUERIES),
      summary: {
        totalCities: result.length,
        totalZones: result.reduce((acc, c) => acc + c.totalZones, 0),
      },
    };
  });

  // Get zones summary statistics
  fastify.get("/zones/summary", async (request, reply) => {
    const summary = CITIES.map((city) => ({
      name: city.name,
      state: city.state,
      totalZones: city.zones.length,
      zonesByType: {
        COMMERCIAL: city.zones.filter((z) => z.type === "COMMERCIAL").length,
        INDUSTRIAL: city.zones.filter((z) => z.type === "INDUSTRIAL").length,
        TOURIST: city.zones.filter((z) => z.type === "TOURIST").length,
        MEDICAL: city.zones.filter((z) => z.type === "MEDICAL").length,
        EDUCATION: city.zones.filter((z) => z.type === "EDUCATION").length,
        MIXED: city.zones.filter((z) => z.type === "MIXED").length,
      },
      topZones: city.zones
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 5)
        .map((z) => ({ name: z.name, priority: z.priority, type: z.type })),
    }));

    return {
      cities: summary,
      totalZones: CITIES.reduce((acc, c) => acc + c.zones.length, 0),
      businessTypes: Object.keys(BUSINESS_TYPE_QUERIES).length,
    };
  });

  // ===== Zone Scrape History =====

  // Get zone scrape history (which zones have been scraped for which business types)
  fastify.get("/zones/history", async (request, reply) => {
    const querySchema = z.object({
      city: z.string().optional(),
      businessType: z.string().optional(),
    });

    const query = querySchema.parse(request.query);

    const where: Record<string, string> = {};
    if (query.city) where.city = query.city;
    if (query.businessType) where.businessType = query.businessType;

    const history = await prisma.zoneScrapeHistory.findMany({
      where,
      orderBy: { scrapedAt: "desc" },
      include: {
        scrapeJob: {
          select: {
            id: true,
            query: true,
            status: true,
          },
        },
      },
    });

    // Group by city and businessType for summary
    const summary = history.reduce(
      (acc, h) => {
        const key = `${h.city}|${h.businessType}`;
        if (!acc[key]) {
          acc[key] = {
            city: h.city,
            businessType: h.businessType,
            zonesScraped: 0,
            totalLeadsFound: 0,
            lastScrapedAt: h.scrapedAt,
          };
        }
        acc[key].zonesScraped++;
        acc[key].totalLeadsFound += h.leadsFound;
        if (h.scrapedAt > acc[key].lastScrapedAt) {
          acc[key].lastScrapedAt = h.scrapedAt;
        }
        return acc;
      },
      {} as Record<
        string,
        {
          city: string;
          businessType: string;
          zonesScraped: number;
          totalLeadsFound: number;
          lastScrapedAt: Date;
        }
      >,
    );

    return {
      history,
      summary: Object.values(summary),
      totalRecords: history.length,
    };
  });

  // Reset zone history for a specific city/businessType combo (allows re-scraping)
  fastify.delete("/zones/history", async (request, reply) => {
    const querySchema = z.object({
      city: z.string().optional(),
      businessType: z.string().optional(),
    });

    const query = querySchema.parse(request.query);

    // Build where clause - if nothing specified, delete all
    const where: Record<string, string> = {};
    if (query.city) where.city = query.city;
    if (query.businessType) where.businessType = query.businessType;

    const deleted = await prisma.zoneScrapeHistory.deleteMany({
      where,
    });

    const message =
      query.city && query.businessType
        ? `Reset zone history for "${query.businessType}" in ${query.city}`
        : query.city
          ? `Reset all zone history for ${query.city}`
          : query.businessType
            ? `Reset zone history for "${query.businessType}" in all cities`
            : "Reset all zone history";

    return {
      success: true,
      message,
      deletedCount: deleted.count,
    };
  });

  // ===== Enhanced Perplexity Features =====

  // Deep research a prospect for sales intelligence
  fastify.post("/perplexity/deep-research", async (request, reply) => {
    const schema = z.object({
      prospectId: z.string().optional(),
      business: z
        .object({
          name: z.string(),
          address: z.string().optional(),
          city: z.string().optional(),
          website: z.string().optional(),
          category: z.string().optional(),
        })
        .optional(),
    });

    const data = schema.parse(request.body);

    // If prospectId provided, look up the prospect
    let businessData = data.business;
    if (data.prospectId) {
      // CRITICAL: Verify ownership for multi-tenancy (returns 404 if not owned)
      const prospect = await prisma.lead.findFirst({
        where: { id: data.prospectId, userId: request.user.userId },
      });
      if (!prospect) {
        return reply.status(404).send({ error: "Prospect not found" });
      }
      businessData = {
        name: prospect.businessName,
        address: prospect.address || undefined,
        city: prospect.city || undefined,
        website: prospect.website || undefined,
        category: prospect.category || undefined,
      };
    }

    if (!businessData || !businessData.name) {
      return reply.status(400).send({
        error: "Either prospectId or business data with name required",
      });
    }

    const research = await perplexityClient.deepResearch({
      name: businessData.name,
      address: businessData.address,
      city: businessData.city,
      website: businessData.website,
      category: businessData.category,
    });

    // If prospectId was provided, save the analysis to the prospect
    if (data.prospectId) {
      // Build the structured salesIntelligence object (excluding rawAnalysis)
      // Use JSON.parse/stringify to ensure Prisma Json compatibility
      const salesIntelligence = JSON.parse(
        JSON.stringify({
          decisionMakers: research.decisionMakers,
          companySize: research.companySize,
          estimatedRevenue: research.estimatedRevenue,
          foundedYear: research.foundedYear,
          industry: research.industry,
          specializations: research.specializations,
          painPoints: research.painPoints,
          webServiceNeeds: research.webServiceNeeds,
          recentNews: research.recentNews,
          competitorWebsites: research.competitorWebsites,
          personalizedPitch: research.personalizedPitch,
          researchedAt: new Date().toISOString(),
        }),
      );

      await prisma.lead.update({
        where: { id: data.prospectId },
        data: {
          perplexityAnalysis: research.rawAnalysis,
          salesIntelligence,
          // Update contact info if found and not already set
          ...(research.email && { email: research.email }),
          ...(research.phone && { phone: research.phone }),
          ...(research.ownerName && { contactPerson: research.ownerName }),
        },
      });
    }

    return research;
  });

  // Find decision makers for a business
  fastify.post("/perplexity/decision-makers", async (request, reply) => {
    const schema = z.object({
      prospectId: z.string().optional(),
      business: z
        .object({
          name: z.string(),
          city: z.string().optional(),
          website: z.string().optional(),
        })
        .optional(),
    });

    const data = schema.parse(request.body);

    let businessData = data.business;
    if (data.prospectId) {
      // CRITICAL: Verify ownership for multi-tenancy (returns 404 if not owned)
      const prospect = await prisma.lead.findFirst({
        where: { id: data.prospectId, userId: request.user.userId },
      });
      if (!prospect) {
        return reply.status(404).send({ error: "Prospect not found" });
      }
      businessData = {
        name: prospect.businessName,
        city: prospect.city || undefined,
        website: prospect.website || undefined,
      };
    }

    if (!businessData || !businessData.name) {
      return reply.status(400).send({
        error: "Either prospectId or business data with name required",
      });
    }

    const decisionMakers = await perplexityClient.findDecisionMakers({
      name: businessData.name,
      city: businessData.city,
      website: businessData.website,
    });

    return { decisionMakers };
  });

  // Generate personalized outreach email
  fastify.post("/perplexity/generate-email", async (request, reply) => {
    const schema = z.object({
      prospectId: z.string().optional(),
      business: z
        .object({
          name: z.string(),
          ownerName: z.string().optional(),
          website: z.string().optional(),
          painPoints: z.array(z.string()).optional(),
          webServiceNeeds: z.array(z.string()).optional(),
          lighthouseScore: z.number().optional(),
        })
        .optional(),
    });

    const data = schema.parse(request.body);

    let businessData = data.business;
    if (data.prospectId) {
      // CRITICAL: Verify ownership for multi-tenancy (returns 404 if not owned)
      const prospect = await prisma.lead.findFirst({
        where: { id: data.prospectId, userId: request.user.userId },
      });
      if (!prospect) {
        return reply.status(404).send({ error: "Prospect not found" });
      }
      businessData = {
        name: prospect.businessName,
        ownerName: prospect.contactPerson || undefined,
        website: prospect.website || undefined,
        lighthouseScore: prospect.lighthouseScore || undefined,
      };
    }

    if (!businessData || !businessData.name) {
      return reply.status(400).send({
        error: "Either prospectId or business data with name required",
      });
    }

    const email = await perplexityClient.generateOutreachEmail({
      name: businessData.name,
      ownerName: businessData.ownerName,
      website: businessData.website,
      painPoints: businessData.painPoints,
      webServiceNeeds: businessData.webServiceNeeds,
      lighthouseScore: businessData.lighthouseScore,
    });

    if (!email) {
      return reply.status(500).send({ error: "Failed to generate email" });
    }

    return email;
  });
}
