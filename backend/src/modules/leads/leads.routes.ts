import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { leadsService } from './leads.service.js';

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
  stage: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).optional(),
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
  stage: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']).optional(),
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
  fastify.get('/', async (request, reply) => {
    const query = listQuerySchema.parse(request.query);
    const result = await leadsService.list(query);
    return result;
  });

  // Get lead by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const lead = await leadsService.getById(id);

    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    return lead;
  });

  // Create lead
  fastify.post('/', async (request, reply) => {
    const data = createLeadSchema.parse(request.body);
    const lead = await leadsService.create(data);
    return reply.status(201).send(lead);
  });

  // Update lead
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateLeadSchema.parse(request.body);

    const lead = await leadsService.update(id, data);

    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    return lead;
  });

  // Delete lead
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const deleted = await leadsService.delete(id);

    if (!deleted) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    return { message: 'Lead deleted successfully' };
  });

  // Move lead to new stage (with activity logging)
  fastify.patch('/:id/stage', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      stage: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']),
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
      stage: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']),
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

    const lead = await leadsService.addTags(id, tagIds);

    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    return lead;
  });

  // Remove tag from lead
  fastify.delete('/:id/tags/:tagId', async (request, reply) => {
    const { id, tagId } = request.params as { id: string; tagId: string };

    const lead = await leadsService.removeTag(id, tagId);

    if (!lead) {
      return reply.status(404).send({ error: 'Lead not found' });
    }

    return lead;
  });
}
