import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { auditService } from './audit.service.js';

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  userId: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  success: z.coerce.boolean().optional(),
});

export async function auditRoutes(fastify: FastifyInstance) {
  // All audit routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // Admin-only check for all routes
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.user.role !== 'ADMIN') {
      return reply.status(403).send({ error: 'Admin access required' });
    }
  });

  // List audit logs with filtering and pagination
  fastify.get('/', async (request) => {
    const query = listQuerySchema.parse(request.query);

    const filters = {
      userId: query.userId,
      action: query.action,
      resource: query.resource,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      success: query.success,
      page: query.page,
      limit: query.limit,
    };

    return auditService.getAuditLogs(filters);
  });

  // Get available filter options (for UI dropdowns)
  fastify.get('/filters', async () => {
    const [actions, resources] = await Promise.all([
      auditService.getDistinctActions(),
      auditService.getDistinctResources(),
    ]);

    return {
      actions,
      resources,
    };
  });

  // Get single audit log by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const log = await auditService.getById(id);

    if (!log) {
      return reply.status(404).send({ error: 'Audit log not found' });
    }

    return log;
  });
}
