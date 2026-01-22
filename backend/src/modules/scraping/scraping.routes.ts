import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { scrapingService } from './scraping.service.js';

const createJobSchema = z.object({
  type: z.enum(['GOOGLE_SEARCH', 'GOOGLE_MAPS', 'PERPLEXITY']),
  query: z.string().min(1),
  location: z.string().optional(),
  category: z.enum(['STARTUP', 'RESTAURANT', 'HOTEL', 'ECOMMERCE', 'SALON', 'CLINIC', 'GYM', 'RETAIL', 'EDUCATION', 'REAL_ESTATE', 'AGENCY', 'OTHER']).optional(),
  regionId: z.string().optional(),
  maxResults: z.number().min(1).max(100).default(25),
});

const listQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  type: z.enum(['GOOGLE_SEARCH', 'GOOGLE_MAPS', 'PERPLEXITY']).optional(),
});

export async function scrapingRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // List scrape jobs
  fastify.get('/jobs', async (request, reply) => {
    const query = listQuerySchema.parse(request.query);
    const result = await scrapingService.listJobs(query);
    return result;
  });

  // Get scrape job by ID
  fastify.get('/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = await scrapingService.getJobById(id);

    if (!job) {
      return reply.status(404).send({ error: 'Scrape job not found' });
    }

    return job;
  });

  // Create and start a new scrape job
  fastify.post('/jobs', async (request, reply) => {
    const data = createJobSchema.parse(request.body);

    const job = await scrapingService.createJob({
      type: data.type,
      query: data.query,
      location: data.location,
      category: data.category,
      regionId: data.regionId,
      maxResults: data.maxResults,
      userId: request.user.userId,
    });

    return reply.status(201).send(job);
  });

  // Cancel a running scrape job
  fastify.post('/jobs/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };

    const job = await scrapingService.cancelJob(id);

    if (!job) {
      return reply.status(404).send({ error: 'Scrape job not found' });
    }

    return job;
  });

  // Retry a failed scrape job
  fastify.post('/jobs/:id/retry', async (request, reply) => {
    const { id } = request.params as { id: string };

    const job = await scrapingService.retryJob(id, request.user.userId);

    if (!job) {
      return reply.status(404).send({ error: 'Scrape job not found or not in failed state' });
    }

    return job;
  });

  // Get scraping statistics
  fastify.get('/stats', async (request, reply) => {
    const stats = await scrapingService.getStats();
    return stats;
  });

  // Analyze a single website (for manual analysis)
  fastify.post('/analyze-website', async (request, reply) => {
    const schema = z.object({
      url: z.string().url(),
    });

    const { url } = schema.parse(request.body);

    const analysis = await scrapingService.analyzeWebsite(url);
    return analysis;
  });

  // Search for leads using Perplexity
  fastify.post('/perplexity-search', async (request, reply) => {
    const schema = z.object({
      query: z.string().min(1),
      location: z.string().optional(),
    });

    const data = schema.parse(request.body);

    const results = await scrapingService.perplexitySearch(data.query, data.location);
    return results;
  });
}
