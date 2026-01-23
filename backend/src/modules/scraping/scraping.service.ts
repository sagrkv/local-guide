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

interface ListJobsParams {
  page?: number;
  limit?: number;
  status?: ScrapeJobStatus;
  type?: ScrapeJobType;
}

interface CreateJobData {
  type: ScrapeJobType;
  query: string;
  location?: string;
  category?: LeadCategory;
  regionId?: string;
  maxResults?: number;
  userId: string;
}

export const scrapingService = {
  async listJobs(params: ListJobsParams) {
    const { page = 1, limit = 20, ...filters } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ScrapeJobWhereInput = {};

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

  async getJobById(id: string) {
    const dbJob = await prisma.scrapeJob.findUnique({
      where: { id },
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
    const { userId, maxResults, ...jobData } = data;

    // Validate that we have a location or region
    if (!jobData.location && !jobData.regionId) {
      throw new Error(
        "Either location or regionId is required to start a scrape job.",
      );
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

    // Create the job record
    const job = await prisma.scrapeJob.create({
      data: {
        ...jobData,
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
        category: job.category,
        regionId: job.regionId,
        maxResults,
      });
    }

    return job;
  },

  async cancelJob(id: string) {
    const job = await prisma.scrapeJob.findUnique({ where: { id } });
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
    const job = await prisma.scrapeJob.findUnique({ where: { id } });
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

  async getStats() {
    const [total, pending, running, completed, failed] = await Promise.all([
      prisma.scrapeJob.count(),
      prisma.scrapeJob.count({ where: { status: "PENDING" } }),
      prisma.scrapeJob.count({ where: { status: "RUNNING" } }),
      prisma.scrapeJob.count({ where: { status: "COMPLETED" } }),
      prisma.scrapeJob.count({ where: { status: "FAILED" } }),
    ]);

    // Get total leads created from scraping
    const leadsFromScraping = await prisma.lead.count({
      where: { scrapeJobId: { not: null } },
    });

    // Get last 24h stats
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const last24h = await prisma.scrapeJob.aggregate({
      where: { createdAt: { gte: oneDayAgo } },
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
