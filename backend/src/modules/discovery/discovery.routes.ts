import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { discoveryService } from './discovery.service.js';
import { success, paginated, error, ErrorCodes } from '../../lib/response.js';
import { auditService, AuditActions, AuditResources } from '../audit/audit.service.js';

const listQuerySchema = z.object({
  cityId: z.string().optional(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createJobSchema = z.object({
  categorySlug: z.string().optional(),
  searchQuery: z.string().optional(),
});

export async function discoveryRoutes(fastify: FastifyInstance) {
  // All discovery routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /discovery-jobs — list jobs
  fastify.get('/discovery-jobs', async (request, reply) => {
    try {
      const query = listQuerySchema.parse(request.query);

      const result = await discoveryService.listJobs({
        cityId: query.cityId,
        status: query.status as any,
        page: query.page,
        limit: query.limit,
      });

      return paginated(result.data, {
        page: query.page,
        limit: query.limit,
        total: result.total,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid query parameters'));
      }
      throw err;
    }
  });

  // GET /discovery-jobs/:id — get job detail
  fastify.get('/discovery-jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const job = await discoveryService.getJobById(id);

    if (!job) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Discovery job not found'));
    }

    return success(job);
  });

  // POST /cities/:cityId/discover — create discovery job
  fastify.post('/cities/:cityId/discover', async (request, reply) => {
    try {
      const { cityId } = request.params as { cityId: string };
      const data = createJobSchema.parse(request.body);
      const user = (request as any).user;

      const job = await discoveryService.createJob({
        cityId,
        categorySlug: data.categorySlug,
        searchQuery: data.searchQuery,
        createdById: user.userId,
      });

      await auditService.logAction({
        userId: user.userId,
        action: AuditActions.DISCOVERY_JOB_STARTED,
        resource: AuditResources.DISCOVERY_JOB,
        resourceId: job.id,
        details: { cityId, categorySlug: data.categorySlug, searchQuery: data.searchQuery },
      });

      return reply.status(201).send(success(job));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      throw err;
    }
  });
}
