import { ScrapeJobStatus, ScrapeJobType, LeadCategory, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { scrapeQueue } from '../../jobs/queue.js';
import { lighthouseAnalyzer } from './utils/lighthouse.js';
import { perplexityClient } from './utils/perplexity.js';

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
        orderBy: { createdAt: 'desc' },
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
    return prisma.scrapeJob.findUnique({
      where: { id },
      include: {
        region: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        leads: {
          take: 20,
          orderBy: { score: 'desc' },
          select: {
            id: true,
            businessName: true,
            email: true,
            phone: true,
            website: true,
            city: true,
            score: true,
            stage: true,
          },
        },
      },
    });
  },

  async createJob(data: CreateJobData) {
    const { userId, maxResults, ...jobData } = data;

    // For queue-based scrapers (Google Maps, Google Search), check if Redis is available
    const requiresQueue = jobData.type === 'GOOGLE_MAPS' || jobData.type === 'GOOGLE_SEARCH';
    if (requiresQueue && !scrapeQueue) {
      throw new Error('Scraping queue not available. Redis is not configured. Only Perplexity scraping is available.');
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
      await scrapeQueue.add('scrape', {
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

    if (job.status !== 'PENDING' && job.status !== 'RUNNING') {
      return job;
    }

    return prisma.scrapeJob.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });
  },

  async retryJob(id: string, userId: string) {
    const job = await prisma.scrapeJob.findUnique({ where: { id } });
    if (!job || job.status !== 'FAILED') return null;

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

  async updateJobStatus(id: string, status: ScrapeJobStatus, results?: {
    leadsFound?: number;
    leadsCreated?: number;
    leadsDuplicate?: number;
    errorMessage?: string;
    errorStack?: string;
  }) {
    return prisma.scrapeJob.update({
      where: { id },
      data: {
        status,
        ...results,
        startedAt: status === 'RUNNING' ? new Date() : undefined,
        completedAt: ['COMPLETED', 'FAILED', 'CANCELLED'].includes(status) ? new Date() : undefined,
      },
    });
  },

  async getStats() {
    const [total, pending, running, completed, failed] = await Promise.all([
      prisma.scrapeJob.count(),
      prisma.scrapeJob.count({ where: { status: 'PENDING' } }),
      prisma.scrapeJob.count({ where: { status: 'RUNNING' } }),
      prisma.scrapeJob.count({ where: { status: 'COMPLETED' } }),
      prisma.scrapeJob.count({ where: { status: 'FAILED' } }),
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
      };
    } catch (error) {
      return {
        url,
        error: 'Failed to analyze website',
        lighthouse: null,
        needsRedesign: null,
      };
    }
  },

  async perplexitySearch(query: string, location?: string) {
    try {
      const results = await perplexityClient.searchBusinesses(query, location);
      return { results };
    } catch (error) {
      return {
        results: [],
        error: 'Failed to search with Perplexity',
      };
    }
  },
};
