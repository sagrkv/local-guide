import {
  ScrapeJobStatus,
  ScrapeJobType,
  LeadCategory,
  Prisma,
} from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { scrapeQueue } from "../../jobs/queue.js";
import { lighthouseAnalyzer } from "./utils/lighthouse.js";
import { perplexityClient } from "./utils/perplexity.js";
import type { LeadFilters } from "../../types/filters.js";

interface ListJobsParams {
  userId: string; // Required for multi-tenancy
  page?: number;
  limit?: number;
  status?: ScrapeJobStatus;
  type?: ScrapeJobType;
}

/** Geographic bounds for map-based scraping */
interface Bounds {
  ne: { lat: number; lng: number };
  sw: { lat: number; lng: number };
}

interface CreateJobData {
  type: ScrapeJobType;
  query: string;
  location?: string;
  /** Geographic bounds for map-based scraping */
  bounds?: Bounds;
  category?: LeadCategory;
  regionId?: string;
  maxResults?: number;
  /** Pre-scrape filters - users only pay for leads matching these criteria */
  filters?: LeadFilters;
  userId: string;
}

export const scrapingService = {
  async listJobs(params: ListJobsParams) {
    const { userId, page = 1, limit = 20, ...filters } = params;
    const skip = (page - 1) * limit;

    // CRITICAL: Always filter by userId for multi-tenancy data isolation
    const where: Prisma.ScrapeJobWhereInput = {
      createdById: userId, // Multi-tenancy: users only see their own jobs
    };

    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;

    const [jobs, total] = await Promise.all([
      prisma.scrapeJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          region: {
            select: { id: true, name: true, cities: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
          _count: {
            select: { leads: true },
          },
        },
      }),
      prisma.scrapeJob.count({ where }),
    ]);

    return {
      data: jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getJobById(id: string, userId: string) {
    // CRITICAL: Always include userId check for multi-tenancy (prevents enumeration)
    const dbJob = await prisma.scrapeJob.findFirst({
      where: {
        id,
        createdById: userId, // Multi-tenancy: users only see their own jobs
      },
      include: {
        region: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        leads: {
          take: 20,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            businessName: true,
            email: true,
            phone: true,
            website: true,
            city: true,
            score: true,
            stage: true,
            createdAt: true,
          },
        },
      },
    });

    if (!dbJob) return null;

    // Get BullMQ job progress if job is running
    let progress = null;
    if (dbJob.status === "RUNNING" && scrapeQueue) {
      try {
        const bullJob = await scrapeQueue.getJob(id);
        if (bullJob) {
          progress = await bullJob.progress;
        }
      } catch (e) {
        // Ignore errors fetching progress
      }
    }

    return {
      ...dbJob,
      progress,
    };
  },

  async createJob(data: CreateJobData) {
    const { userId, maxResults, filters, bounds, ...jobData } = data;

    // Validate that we have a location, bounds, or region
    if (!jobData.location && !bounds && !jobData.regionId) {
      throw new Error(
        "Either location, bounds, or regionId is required to start a scrape job.",
      );
    }

    // If bounds provided, convert to a location string for storage
    // The actual bounds will be passed to the queue job
    if (bounds && !jobData.location) {
      // Create a location string from bounds center for display purposes
      const centerLat = (bounds.ne.lat + bounds.sw.lat) / 2;
      const centerLng = (bounds.ne.lng + bounds.sw.lng) / 2;
      jobData.location = `Map Area (${centerLat.toFixed(4)}, ${centerLng.toFixed(4)})`;
    }

    // If regionId provided, validate it exists and has cities
    if (jobData.regionId) {
      const region = await prisma.scrapingRegion.findUnique({
        where: { id: jobData.regionId },
      });
      if (!region) {
        throw new Error(`Region with id ${jobData.regionId} not found.`);
      }
      if (!region.cities || region.cities.length === 0) {
        throw new Error(`Region "${region.name}" has no cities configured.`);
      }
    }

    // All job types require Redis queue
    if (!scrapeQueue) {
      throw new Error(
        "Scraping queue not available. Redis is not configured. Please configure REDIS_URL environment variable.",
      );
    }

    // Validate API keys based on job type
    if (jobData.type === "DISCOVERY_PIPELINE") {
      // DISCOVERY_PIPELINE requires Google Places API
      const { config } = await import("../../config.js");
      if (!config.googlePlacesApiKey) {
        throw new Error(
          "DISCOVERY_PIPELINE requires Google Places API. Please configure GOOGLE_PLACES_API_KEY environment variable, or use GOOGLE_MAPS job type instead.",
        );
      }
    }

    if (jobData.type === "PERPLEXITY") {
      const { config } = await import("../../config.js");
      if (!config.perplexityApiKey) {
        throw new Error(
          "PERPLEXITY job type requires Perplexity API. Please configure PERPLEXITY_API_KEY environment variable.",
        );
      }
    }

    // Create the job record with filters stored as JSON
    const job = await prisma.scrapeJob.create({
      data: {
        ...jobData,
        filters: filters ? (filters as Prisma.InputJsonValue) : undefined,
        createdById: userId,
      },
      include: {
        region: true,
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    // Add to the queue for background processing
    if (scrapeQueue) {
      await scrapeQueue.add("scrape", {
        jobId: job.id,
        type: job.type,
        query: job.query,
        location: job.location,
        bounds, // Pass bounds for map-based scraping
        category: job.category,
        regionId: job.regionId,
        maxResults,
        filters, // Pass filters to worker
      });
    }

    return job;
  },

  async cancelJob(id: string, userId: string) {
    // CRITICAL: Verify ownership before cancellation (prevents enumeration)
    const job = await prisma.scrapeJob.findFirst({
      where: { id, createdById: userId },
    });
    if (!job) return null;

    if (job.status !== "PENDING" && job.status !== "RUNNING") {
      return job;
    }

    return prisma.scrapeJob.update({
      where: { id },
      data: {
        status: "CANCELLED",
        completedAt: new Date(),
      },
    });
  },

  async retryJob(id: string, userId: string) {
    // CRITICAL: Verify ownership before retry (prevents enumeration)
    const job = await prisma.scrapeJob.findFirst({
      where: { id, createdById: userId },
    });
    if (!job || job.status !== "FAILED") return null;

    // Create a new job with the same parameters
    return this.createJob({
      type: job.type,
      query: job.query,
      location: job.location || undefined,
      category: job.category || undefined,
      regionId: job.regionId || undefined,
      maxResults: 25,
      userId,
    });
  },

  async updateJobStatus(
    id: string,
    status: ScrapeJobStatus,
    results?: {
      leadsFound?: number;
      leadsCreated?: number;
      leadsDuplicate?: number;
      errorMessage?: string;
      errorStack?: string;
    },
  ) {
    return prisma.scrapeJob.update({
      where: { id },
      data: {
        status,
        ...results,
        startedAt: status === "RUNNING" ? new Date() : undefined,
        completedAt: ["COMPLETED", "FAILED", "CANCELLED"].includes(status)
          ? new Date()
          : undefined,
      },
    });
  },

  async getStats(userId: string) {
    // CRITICAL: All stats should be filtered by userId for multi-tenancy
    const userFilter = { createdById: userId };
    const leadUserFilter = { userId };

    const [total, pending, running, completed, failed] = await Promise.all([
      prisma.scrapeJob.count({ where: userFilter }),
      prisma.scrapeJob.count({ where: { ...userFilter, status: "PENDING" } }),
      prisma.scrapeJob.count({ where: { ...userFilter, status: "RUNNING" } }),
      prisma.scrapeJob.count({ where: { ...userFilter, status: "COMPLETED" } }),
      prisma.scrapeJob.count({ where: { ...userFilter, status: "FAILED" } }),
    ]);

    // Get total leads created from scraping (for this user)
    const leadsFromScraping = await prisma.lead.count({
      where: { ...leadUserFilter, scrapeJobId: { not: null } },
    });

    // Get last 24h stats (for this user)
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const last24h = await prisma.scrapeJob.aggregate({
      where: { ...userFilter, createdAt: { gte: oneDayAgo } },
      _sum: { leadsCreated: true },
      _count: true,
    });

    return {
      total,
      pending,
      running,
      completed,
      failed,
      leadsFromScraping,
      last24h: {
        jobs: last24h._count,
        leadsCreated: last24h._sum.leadsCreated || 0,
      },
    };
  },

  async analyzeWebsite(url: string) {
    try {
      const lighthouse = await lighthouseAnalyzer.analyze(url);
      return {
        url,
        lighthouse,
        needsRedesign: lighthouse.performance < 50 || lighthouse.seo < 50,
        error: null,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to analyze website";
      return {
        url,
        error: errorMessage,
        lighthouse: null,
        needsRedesign: null,
      };
    }
  },

  async perplexitySearch(query: string, location?: string) {
    // Let errors propagate to caller for proper handling
    const results = await perplexityClient.searchBusinesses(query, location);
    return { results, error: null };
  },
};
