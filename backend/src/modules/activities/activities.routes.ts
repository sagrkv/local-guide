import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { activitiesService } from './activities.service.js';

const createActivitySchema = z.object({
  leadId: z.string(),
  type: z.enum(['NOTE', 'CALL', 'EMAIL', 'MEETING', 'TASK']),
  title: z.string().min(1),
  description: z.string().optional(),
  outcome: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

const updateActivitySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  outcome: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  leadId: z.string().optional(),
  type: z.enum(['NOTE', 'CALL', 'EMAIL', 'MEETING', 'TASK']).optional(),
  userId: z.string().optional(),
  upcoming: z.coerce.boolean().optional(),
});

export async function activitiesRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // List activities
  fastify.get('/', async (request, reply) => {
    const query = listQuerySchema.parse(request.query);
    const result = await activitiesService.list(query);
    return result;
  });

  // Get activity by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const activity = await activitiesService.getById(id);

    if (!activity) {
      return reply.status(404).send({ error: 'Activity not found' });
    }

    return activity;
  });

  // Create activity
  fastify.post('/', async (request, reply) => {
    const data = createActivitySchema.parse(request.body);
    const activity = await activitiesService.create({
      leadId: data.leadId,
      type: data.type,
      title: data.title,
      description: data.description,
      outcome: data.outcome,
      scheduledAt: data.scheduledAt,
      userId: request.user.userId,
    });
    return reply.status(201).send(activity);
  });

  // Update activity
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateActivitySchema.parse(request.body);

    const activity = await activitiesService.update(id, data);

    if (!activity) {
      return reply.status(404).send({ error: 'Activity not found' });
    }

    return activity;
  });

  // Mark activity as complete
  fastify.post('/:id/complete', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      outcome: z.string().optional(),
    });

    const { outcome } = schema.parse(request.body);

    const activity = await activitiesService.complete(id, outcome);

    if (!activity) {
      return reply.status(404).send({ error: 'Activity not found' });
    }

    return activity;
  });

  // Delete activity
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const deleted = await activitiesService.delete(id);

    if (!deleted) {
      return reply.status(404).send({ error: 'Activity not found' });
    }

    return { message: 'Activity deleted successfully' };
  });

  // Get upcoming tasks for current user
  fastify.get('/my/upcoming', async (request, reply) => {
    const activities = await activitiesService.getUpcomingForUser(request.user.userId);
    return activities;
  });

  // Get activities for a specific lead
  fastify.get('/lead/:leadId', async (request, reply) => {
    const { leadId } = request.params as { leadId: string };
    const query = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(50),
    }).parse(request.query);

    const result = await activitiesService.list({
      ...query,
      leadId,
    });

    return result;
  });
}
