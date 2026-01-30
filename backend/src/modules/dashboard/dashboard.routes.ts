import { FastifyInstance } from 'fastify';
import { dashboardService } from './dashboard.service.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // Get overview stats
  fastify.get('/stats', async (request) => {
    // Multi-tenancy: pass userId for data isolation
    const stats = await dashboardService.getStats(request.user.userId);
    return stats;
  });

  // Get pipeline counts by stage
  fastify.get('/pipeline', async (request) => {
    // Multi-tenancy: pass userId for data isolation
    const pipeline = await dashboardService.getPipelineCounts(request.user.userId);
    return pipeline;
  });

  // Get leads by category
  fastify.get('/by-category', async (request) => {
    // Multi-tenancy: pass userId for data isolation
    const categories = await dashboardService.getLeadsByCategory(request.user.userId);
    return categories;
  });

  // Get leads by source
  fastify.get('/by-source', async (request) => {
    // Multi-tenancy: pass userId for data isolation
    const sources = await dashboardService.getLeadsBySource(request.user.userId);
    return sources;
  });

  // Get recent activities
  fastify.get('/recent-activities', async (request) => {
    // Multi-tenancy: pass userId for data isolation
    const activities = await dashboardService.getRecentActivities(request.user.userId);
    return activities;
  });

  // Get leads created over time (last 30 days)
  fastify.get('/leads-over-time', async (request) => {
    // Multi-tenancy: pass userId for data isolation
    const data = await dashboardService.getLeadsOverTime(request.user.userId);
    return data;
  });

  // Get top performers (users with most won leads)
  fastify.get('/top-performers', async (request) => {
    // Multi-tenancy: pass userId for data isolation
    const performers = await dashboardService.getTopPerformers(request.user.userId);
    return performers;
  });

  // Get conversion rates
  fastify.get('/conversion-rates', async (request) => {
    // Multi-tenancy: pass userId for data isolation
    const rates = await dashboardService.getConversionRates(request.user.userId);
    return rates;
  });
}
