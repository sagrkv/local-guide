import { FastifyInstance } from 'fastify';
import { dashboardService } from './dashboard.service.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // Get overview stats
  fastify.get('/stats', async (request) => {
    const stats = await dashboardService.getStats((request as any).user.userId);
    return stats;
  });

  // Get POI counts by status
  fastify.get('/poi-status', async (request) => {
    const statusCounts = await dashboardService.getPOIStatusCounts((request as any).user.userId);
    return statusCounts;
  });

  // Get POIs by category
  fastify.get('/by-category', async (request) => {
    const categories = await dashboardService.getPOIsByCategory((request as any).user.userId);
    return categories;
  });

  // Get recent discovery jobs
  fastify.get('/recent-jobs', async (request) => {
    const jobs = await dashboardService.getRecentDiscoveryJobs((request as any).user.userId);
    return jobs;
  });
}
