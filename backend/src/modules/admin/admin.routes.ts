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
  role: z.enum(['ADMIN', 'CURATOR', 'VIEWER']).optional(),
});

const daysQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
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

  // GET /users - List all users with stats
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

  // GET /users/:id - Get user details
  fastify.get('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = await adminUsersService.getUserDetails(id);

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return user;
  });

  // PATCH /users/:id - Update user
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

  // ============================================
  // Analytics Routes
  // ============================================

  // GET /analytics/overview - Dashboard overview stats
  fastify.get('/analytics/overview', async () => {
    return adminAnalyticsService.getOverviewStats();
  });

  // GET /analytics/users - User growth over time
  fastify.get('/analytics/users', async (request) => {
    const { days } = daysQuerySchema.parse(request.query);
    return adminAnalyticsService.getUserGrowth(days);
  });

  // ============================================
  // Health Metrics Routes
  // ============================================

  // GET /health-metrics - Get system health metrics
  fastify.get('/health-metrics', async () => {
    // System metrics
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    return {
      system: {
        uptime: Math.floor(uptime),
        uptimeFormatted: formatUptime(uptime),
        memoryUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        memoryTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        memoryPercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
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
