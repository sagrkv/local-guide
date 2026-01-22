import { FastifyInstance } from 'fastify';
import { dashboardService } from './dashboard.service.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // Get overview stats
  fastify.get('/stats', async (request, reply) => {
    const stats = await dashboardService.getStats();
    return stats;
  });

  // Get pipeline counts by stage
  fastify.get('/pipeline', async (request, reply) => {
    const pipeline = await dashboardService.getPipelineCounts();
    return pipeline;
  });

  // Get leads by category
  fastify.get('/by-category', async (request, reply) => {
    const categories = await dashboardService.getLeadsByCategory();
    return categories;
  });

  // Get leads by source
  fastify.get('/by-source', async (request, reply) => {
    const sources = await dashboardService.getLeadsBySource();
    return sources;
  });

  // Get recent activities
  fastify.get('/recent-activities', async (request, reply) => {
    const activities = await dashboardService.getRecentActivities();
    return activities;
  });

  // Get leads created over time (last 30 days)
  fastify.get('/leads-over-time', async (request, reply) => {
    const data = await dashboardService.getLeadsOverTime();
    return data;
  });

  // Get top performers (users with most won leads)
  fastify.get('/top-performers', async (request, reply) => {
    const performers = await dashboardService.getTopPerformers();
    return performers;
  });

  // Get conversion rates
  fastify.get('/conversion-rates', async (request, reply) => {
    const rates = await dashboardService.getConversionRates();
    return rates;
  });
}
