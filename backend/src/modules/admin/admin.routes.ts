import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { adminUsersService } from './admin-users.service.js';
import { adminAnalyticsService } from './admin-analytics.service.js';
import { prisma } from '../../lib/prisma.js';

// Validation schemas
const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  creditBalance: z.number().int().min(0).optional(),
});

const addCreditsSchema = z.object({
  amount: z.number().int().positive('Amount must be a positive integer'),
  reason: z.string().min(1, 'Reason is required'),
});

const deductCreditsSchema = z.object({
  amount: z.number().int().positive('Amount must be a positive integer'),
  reason: z.string().min(1, 'Reason is required'),
});

const daysQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});

const topUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * Admin middleware to check if user has ADMIN role
 */
function requireAdmin(request: any, reply: any, done: () => void) {
  if (request.user.role !== 'ADMIN') {
    reply.status(403).send({ error: 'Admin access required' });
    return;
  }
  done();
}

export async function adminRoutes(fastify: FastifyInstance) {
  // All admin routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // All admin routes require ADMIN role
  fastify.addHook('preHandler', requireAdmin);

  // ============================================
  // User Management Routes
  // ============================================

  // GET /api/admin/users - List all users with stats
  fastify.get('/users', async (request, reply) => {
    try {
      const query = listUsersQuerySchema.parse(request.query);
      const result = await adminUsersService.listUsers({
        search: query.search,
        page: query.page,
        limit: query.limit,
      });

      return {
        users: result.users,
        pagination: {
          total: result.total,
          page: query.page,
          limit: query.limit,
          totalPages: Math.ceil(result.total / query.limit),
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid query parameters', details: error.errors });
      }
      throw error;
    }
  });

  // GET /api/admin/users/:id - Get user details
  fastify.get('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = await adminUsersService.getUserDetails(id);

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return user;
  });

  // GET /api/admin/users/:id/activity - Get user activity data (sparkline, burn rate, etc.)
  fastify.get('/users/:id/activity', async (request, reply) => {
    const { id } = request.params as { id: string };

    const activity = await adminUsersService.getUserActivity(id);

    if (!activity) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return activity;
  });

  // PATCH /api/admin/users/:id - Update user
  fastify.patch('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const data = updateUserSchema.parse(request.body);

      const user = await adminUsersService.updateUser(id, data);

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return user;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid request body', details: error.errors });
      }
      throw error;
    }
  });

  // POST /api/admin/users/:id/credits - Add credits to user
  fastify.post('/users/:id/credits', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const data = addCreditsSchema.parse(request.body);

      const result = await adminUsersService.addCredits(
        id,
        data.amount,
        data.reason,
        request.user.userId
      );

      if (!result) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return {
        message: 'Credits added successfully',
        newBalance: result.newBalance,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid request body', details: error.errors });
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      throw error;
    }
  });

  // POST /api/admin/users/:id/credits/deduct - Deduct credits from user
  fastify.post('/users/:id/credits/deduct', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const data = deductCreditsSchema.parse(request.body);

      const result = await adminUsersService.deductCredits(
        id,
        data.amount,
        data.reason,
        request.user.userId
      );

      if (!result) {
        return reply.status(404).send({ error: 'User not found' });
      }

      return {
        message: 'Credits deducted successfully',
        newBalance: result.newBalance,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: 'Invalid request body', details: error.errors });
      }
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      throw error;
    }
  });

  // ============================================
  // Analytics Routes
  // ============================================

  // GET /api/admin/analytics/overview - Dashboard overview stats
  fastify.get('/analytics/overview', async () => {
    return adminAnalyticsService.getOverviewStats();
  });

  // GET /api/admin/analytics/users - User growth over time
  fastify.get('/analytics/users', async (request) => {
    const { days } = daysQuerySchema.parse(request.query);
    return adminAnalyticsService.getUserGrowth(days);
  });

  // GET /api/admin/analytics/usage - Credit usage over time
  fastify.get('/analytics/usage', async (request) => {
    const { days } = daysQuerySchema.parse(request.query);
    return adminAnalyticsService.getCreditUsage(days);
  });

  // GET /api/admin/analytics/leads - Lead growth over time
  fastify.get('/analytics/leads', async (request) => {
    const { days } = daysQuerySchema.parse(request.query);
    return adminAnalyticsService.getLeadGrowth(days);
  });

  // GET /api/admin/analytics/top-users - Top users by leads
  fastify.get('/analytics/top-users', async (request) => {
    const { limit } = topUsersQuerySchema.parse(request.query);
    return adminAnalyticsService.getTopUsersByLeads(limit);
  });

  // GET /api/admin/analytics/scrape-jobs - Scrape job statistics
  fastify.get('/analytics/scrape-jobs', async (request) => {
    const { days } = daysQuerySchema.parse(request.query);
    return adminAnalyticsService.getScrapeJobStats(days);
  });

  // GET /api/admin/analytics/categories - Category distribution
  fastify.get('/analytics/categories', async () => {
    return adminAnalyticsService.getCategoryDistribution();
  });

  // GET /api/admin/analytics/geography - Geographic distribution
  fastify.get('/analytics/geography', async () => {
    return adminAnalyticsService.getGeographicDistribution();
  });

  // ============================================
  // Saved Regions Routes (Admin view of all user-saved regions)
  // ============================================

  // GET /api/admin/saved-regions - List all saved regions across all users
  fastify.get('/saved-regions', async () => {
    const regions = await prisma.savedRegion.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { regions };
  });

  // ============================================
  // Job Monitor Routes (Admin view of all scrape jobs)
  // ============================================

  const jobsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
    userId: z.string().optional(),
  });

  // GET /api/admin/jobs - List all scrape jobs with owner info
  fastify.get('/jobs', async (request) => {
    const query = jobsQuerySchema.parse(request.query);
    const skip = (query.page - 1) * query.limit;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.userId) where.createdById = query.userId;

    const [jobs, total] = await Promise.all([
      prisma.scrapeJob.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          region: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.scrapeJob.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  });

  // GET /api/admin/jobs/stats - Get job statistics for admin dashboard
  fastify.get('/jobs/stats', async () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [total, pending, running, completed, failed, last24h] = await Promise.all([
      prisma.scrapeJob.count(),
      prisma.scrapeJob.count({ where: { status: 'PENDING' } }),
      prisma.scrapeJob.count({ where: { status: 'RUNNING' } }),
      prisma.scrapeJob.count({ where: { status: 'COMPLETED' } }),
      prisma.scrapeJob.count({ where: { status: 'FAILED' } }),
      prisma.scrapeJob.aggregate({
        where: {
          createdAt: { gte: oneDayAgo },
        },
        _count: true,
        _sum: { leadsCreated: true },
      }),
    ]);

    return {
      total,
      pending,
      running,
      completed,
      failed,
      last24h: {
        jobs: last24h._count,
        leadsCreated: last24h._sum.leadsCreated || 0,
      },
    };
  });

  // ============================================
  // Health Metrics Routes
  // ============================================

  // GET /api/admin/health-metrics - Get system health metrics
  fastify.get('/health-metrics', async () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get queue stats from scrape jobs
    const [activeJobs, pendingJobs, completedJobs, failedJobs] = await Promise.all([
      prisma.scrapeJob.count({ where: { status: 'RUNNING' } }),
      prisma.scrapeJob.count({ where: { status: 'PENDING' } }),
      prisma.scrapeJob.count({ where: { status: 'COMPLETED', updatedAt: { gte: oneDayAgo } } }),
      prisma.scrapeJob.count({ where: { status: 'FAILED', updatedAt: { gte: oneDayAgo } } }),
    ]);

    // Get API error rate from ApiCallLog (last 24h)
    let apiErrorRate = 0;
    let avgResponseTime = 0;
    try {
      const [totalCalls, failedCalls, responseTimeAgg] = await Promise.all([
        prisma.apiCallLog.count({ where: { createdAt: { gte: oneDayAgo } } }),
        prisma.apiCallLog.count({ where: { createdAt: { gte: oneDayAgo }, success: false } }),
        prisma.apiCallLog.aggregate({
          where: { createdAt: { gte: oneDayAgo } },
          _avg: { responseTimeMs: true },
        }),
      ]);
      apiErrorRate = totalCalls > 0 ? Math.round((failedCalls / totalCalls) * 100 * 10) / 10 : 0;
      avgResponseTime = Math.round(responseTimeAgg._avg.responseTimeMs || 0);
    } catch {
      // ApiCallLog might not exist
    }

    // System metrics
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    return {
      queue: {
        active: activeJobs,
        pending: pendingJobs,
        completed: completedJobs,
        failed: failedJobs,
      },
      system: {
        uptime: Math.floor(uptime),
        uptimeFormatted: formatUptime(uptime),
        memoryUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        memoryTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        memoryPercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      },
      api: {
        errorRate: apiErrorRate,
        avgResponseTime,
      },
    };
  });
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
