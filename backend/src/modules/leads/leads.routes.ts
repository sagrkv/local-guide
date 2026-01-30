import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { leadsService } from './leads.service.js';
import { activitiesService } from '../activities/activities.service.js';

const createLeadSchema = z.object({
  businessName: z.string().min(1),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('India'),
  category: z.enum(['STARTUP', 'RESTAURANT', 'HOTEL', 'ECOMMERCE', 'SALON', 'CLINIC', 'GYM', 'RETAIL', 'EDUCATION', 'REAL_ESTATE', 'AGENCY', 'OTHER']).default('OTHER'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  source: z.enum(['GOOGLE_SEARCH', 'GOOGLE_MAPS', 'WEBSITE_CONTACT', 'REFERRAL', 'MANUAL', 'PERPLEXITY']).default('MANUAL'),
  leadType: z.enum(['NO_WEBSITE', 'OUTDATED_WEBSITE', 'CONTACT_FORM', 'REFERRAL', 'MANUAL']).default('MANUAL'),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateLeadSchema = createLeadSchema.partial().extend({
  stage: z.enum(['NEW', 'CONTACTED', 'INTERESTED', 'CLOSED']).optional(),
  score: z.number().min(0).max(100).optional(),
  hasWebsite: z.boolean().optional(),
  lighthouseScore: z.number().min(0).max(100).optional(),
  lighthouseSeo: z.number().min(0).max(100).optional(),
  websiteNeedsRedesign: z.boolean().optional(),
  perplexityAnalysis: z.string().optional(),
  nextFollowUpAt: z.string().datetime().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  stage: z.enum(['NEW', 'CONTACTED', 'INTERESTED', 'CLOSED']).optional(),
  category: z.enum(['STARTUP', 'RESTAURANT', 'HOTEL', 'ECOMMERCE', 'SALON', 'CLINIC', 'GYM', 'RETAIL', 'EDUCATION', 'REAL_ESTATE', 'AGENCY', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().optional(),
  search: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  hasWebsite: z.coerce.boolean().optional(),
  minScore: z.coerce.number().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'score', 'businessName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export async function leadsRoutes(fastify: FastifyInstance) {
  // Add auth to all routes
  fastify.addHook('preHandler', fastify.authenticate);

  // List leads with filtering and pagination
  fastify.get('/', async (request) => {
    const query = listQuerySchema.parse(request.query);
    const result = await leadsService.list({
      ...query,
      userId: request.user.userId, // Multi-tenancy enforcement
    });
    return result;
  });

  // Get lead by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const lead = await leadsService.getById(id, request.user.userId);

    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    return lead;
  });

  // Create lead
  fastify.post('/', async (request, reply) => {
    const data = createLeadSchema.parse(request.body);
    const lead = await leadsService.create({
      userId: request.user.userId, // Multi-tenancy: set owner
      businessName: data.businessName,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      website: data.website,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      category: data.category,
      priority: data.priority,
      source: data.source,
      leadType: data.leadType,
      notes: data.notes,
      assignedToId: data.assignedToId,
      tags: data.tags,
    });
    return reply.status(201).send(lead);
  });

  // Update lead
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateLeadSchema.parse(request.body);

    const lead = await leadsService.update(id, request.user.userId, data);

    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    return lead;
  });

  // Delete lead
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const deleted = await leadsService.delete(id, request.user.userId);

    if (!deleted) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    return { message: 'Lead deleted successfully' };
  });

  // Move lead to new stage (with activity logging)
  fastify.patch('/:id/stage', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      stage: z.enum(['NEW', 'CONTACTED', 'INTERESTED', 'CLOSED']),
      notes: z.string().optional(),
    });

    const { stage, notes } = schema.parse(request.body);

    const lead = await leadsService.changeStage(id, stage, request.user.userId, notes);

    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    return lead;
  });

  // Assign lead to user
  fastify.post('/:id/assign', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      userId: z.string().nullable(),
    });

    const { userId } = schema.parse(request.body);

    const lead = await leadsService.assign(id, userId, request.user.userId);

    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    return lead;
  });

  // Bulk operations
  fastify.post('/bulk/stage', async (request, reply) => {
    const schema = z.object({
      leadIds: z.array(z.string()).min(1),
      stage: z.enum(['NEW', 'CONTACTED', 'INTERESTED', 'CLOSED']),
    });

    const { leadIds, stage } = schema.parse(request.body);

    const result = await leadsService.bulkChangeStage(leadIds, stage, request.user.userId);

    return { updated: result.count };
  });

  // Add tags to lead
  fastify.post('/:id/tags', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      tagIds: z.array(z.string()).min(1),
    });

    const { tagIds } = schema.parse(request.body);

    // Multi-tenancy: pass userId for data isolation
    const lead = await leadsService.addTags(id, request.user.userId, tagIds);

    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    return lead;
  });

  // Remove tag from lead
  fastify.delete('/:id/tags/:tagId', async (request, reply) => {
    const { id, tagId } = request.params as { id: string; tagId: string };

    // Multi-tenancy: pass userId for data isolation
    const lead = await leadsService.removeTag(id, request.user.userId, tagId);

    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    return lead;
  });

  // === Activity routes nested under leads ===
  // GET /api/leads/:id/activities - Get activities for a specific lead
  fastify.get('/:id/activities', async (request) => {
    const { id } = request.params as { id: string };
    const query = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(50),
    }).parse(request.query);

    const result = await activitiesService.getActivitiesByLead(
      request.user.userId,
      id,
      query.page,
      query.limit
    );

    return result;
  });

  // POST /api/leads/:id/activities - Create activity for a specific lead
  fastify.post('/:id/activities', async (request, reply) => {
    const { id } = request.params as { id: string };
    const activitySchema = z.object({
      type: z.enum(['NOTE', 'CALL', 'EMAIL', 'MEETING', 'TASK']),
      title: z.string().min(1, 'Title is required').max(255),
      description: z.string().max(5000).optional(),
      outcome: z.string().max(1000).optional(),
      scheduledAt: z.string().datetime().optional(),
    });

    const data = activitySchema.parse(request.body);

    const activity = await activitiesService.createActivity(
      request.user.userId,
      id,
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
