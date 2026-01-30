import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { adminUsersService } from './admin-users.service.js';
import { adminAnalyticsService } from './admin-analytics.service.js';

// Validation schemas
const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  role: z.enum(['ADMIN', 'SALES_REP']).optional(),
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
}
