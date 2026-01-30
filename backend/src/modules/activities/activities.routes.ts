import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { activitiesService } from './activities.service.js';

// Zod validation schemas for activity operations
const activityTypeSchema = z.enum(['NOTE', 'CALL', 'EMAIL', 'MEETING', 'TASK']);

const createActivitySchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  type: activityTypeSchema,
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional(),
  outcome: z.string().max(1000).optional(),
  scheduledAt: z.string().datetime().optional(),
});

const createActivityForLeadSchema = z.object({
  type: activityTypeSchema,
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional(),
  outcome: z.string().max(1000).optional(),
  scheduledAt: z.string().datetime().optional(),
});

const updateActivitySchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  outcome: z.string().max(1000).optional(),
  scheduledAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  leadId: z.string().optional(),
  type: activityTypeSchema.optional(),
  upcoming: z.coerce.boolean().optional(),
});

const upcomingTasksQuerySchema = z.object({
  days: z.coerce.number().min(1).max(365).default(7),
});

export async function activitiesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/activities/tasks - Get upcoming tasks across all leads
  // Placed before /:id to avoid route collision
  fastify.get('/tasks', async (request) => {
    const { days } = upcomingTasksQuerySchema.parse(request.query);
    const activities = await activitiesService.getUpcomingTasks(request.user.userId, days);
    return {
      data: activities,
      meta: {
        days,
        count: activities.length,
      },
    };
  });

  // GET /api/activities - List activities with filtering
  fastify.get('/', async (request) => {
    const query = listQuerySchema.parse(request.query);
    const result = await activitiesService.list({
      ...query,
      userId: request.user.userId, // Multi-tenancy enforcement
    });
    return result;
  });

  // GET /api/activities/:id - Get activity by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const activity = await activitiesService.getById(id, request.user.userId);

    if (!activity) {
      return reply.status(404).send({ error: 'Activity not found' });
    }

    return activity;
  });

  // POST /api/activities - Create activity
  fastify.post('/', async (request, reply) => {
    const data = createActivitySchema.parse(request.body);
    const activity = await activitiesService.createActivity(
      request.user.userId,
      data.leadId,
      {
        type: data.type,
        title: data.title,
        description: data.description,
        outcome: data.outcome,
        scheduledAt: data.scheduledAt,
      }
    );

    if (!activity) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    return reply.status(201).send(activity);
  });

  // PATCH /api/activities/:id - Update activity
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateActivitySchema.parse(request.body);

    const activity = await activitiesService.update(id, request.user.userId, data);

    if (!activity) {
      return reply.status(404).send({ error: 'Activity not found' });
    }

    return activity;
  });

  // POST /api/activities/:id/complete - Mark activity as complete
  fastify.post('/:id/complete', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      outcome: z.string().max(1000).optional(),
    });

    const { outcome } = schema.parse(request.body);

    const activity = await activitiesService.complete(id, request.user.userId, outcome);

    if (!activity) {
      return reply.status(404).send({ error: 'Activity not found' });
    }

    return activity;
  });

  // DELETE /api/activities/:id - Delete activity
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const deleted = await activitiesService.delete(id, request.user.userId);

    if (!deleted) {
      return reply.status(404).send({ error: 'Activity not found' });
    }

    return { message: 'Activity deleted successfully' };
  });

  // Legacy route - kept for backward compatibility
  // GET /api/activities/lead/:leadId - Get activities for a specific lead
  fastify.get('/lead/:leadId', async (request) => {
    const { leadId } = request.params as { leadId: string };
    const query = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(50),
    }).parse(request.query);

    const result = await activitiesService.getActivitiesByLead(
      request.user.userId,
      leadId,
      query.page,
      query.limit
    );

    return result;
  });
}

/**
 * Nested routes for /api/leads/:leadId/activities
 * These are registered separately in the leads module
 */
export async function leadActivitiesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/leads/:leadId/activities - Get activities for a lead
  fastify.get('/', async (request) => {
    const { leadId } = request.params as { leadId: string };
    const query = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(50),
    }).parse(request.query);

    const result = await activitiesService.getActivitiesByLead(
      request.user.userId,
      leadId,
      query.page,
      query.limit
    );

    return result;
  });

  // POST /api/leads/:leadId/activities - Create activity for a lead
  fastify.post('/', async (request, reply) => {
    const { leadId } = request.params as { leadId: string };
    const data = createActivityForLeadSchema.parse(request.body);

    const activity = await activitiesService.createActivity(
      request.user.userId,
      leadId,
      {
        type: data.type,
        title: data.title,
        description: data.description,
        outcome: data.outcome,
        scheduledAt: data.scheduledAt,
      }
    );

    if (!activity) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    return reply.status(201).send(activity);
  });
}
