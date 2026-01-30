import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { savedRegionsService } from './saved-regions.service.js';

// Validation schemas
const createRegionSchema = z.object({
  name: z.string().min(1).max(100),
  southwestLat: z.number().min(-90).max(90),
  southwestLng: z.number().min(-180).max(180),
  northeastLat: z.number().min(-90).max(90),
  northeastLng: z.number().min(-180).max(180),
});

const updateRegionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(['lastUsed', 'timesUsed', 'createdAt', 'name']).default('lastUsed'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const idParamSchema = z.object({
  id: z.string().min(1),
});

export async function savedRegionsRoutes(fastify: FastifyInstance) {
  // All saved regions routes require authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // GET /api/saved-regions - List user's saved regions
  fastify.get('/', async (request, reply) => {
    const query = listQuerySchema.parse(request.query);
    const userId = request.user.userId;

    const result = await savedRegionsService.list({
      userId,
      limit: query.limit,
      offset: query.offset,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return result;
  });

  // GET /api/saved-regions/recent - Get recently used regions (for dropdown)
  fastify.get('/recent', async (request, reply) => {
    const userId = request.user.userId;
    const regions = await savedRegionsService.getRecentlyUsed(userId, 10);
    return { regions };
  });

  // GET /api/saved-regions/:id - Get a single saved region
  fastify.get('/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const userId = request.user.userId;

    const region = await savedRegionsService.getById(id, userId);

    if (!region) {
      return reply.status(404).send({ error: 'Saved region not found' });
    }

    return region;
  });

  // POST /api/saved-regions - Create new saved region
  fastify.post('/', async (request, reply) => {
    try {
      const body = createRegionSchema.parse(request.body);
      const userId = request.user.userId;

      const region = await savedRegionsService.create({
        userId,
        name: body.name,
        southwestLat: body.southwestLat,
        southwestLng: body.southwestLng,
        northeastLat: body.northeastLat,
        northeastLng: body.northeastLng,
      });

      return reply.status(201).send(region);
    } catch (error) {
      request.log.error(error, 'Failed to create saved region');

      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return reply.status(409).send({ error: 'A region with this name already exists' });
        }
        return reply.status(500).send({ error: 'Database error occurred' });
      }

      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }

      return reply.status(500).send({ error: 'An unexpected error occurred' });
    }
  });

  // PUT /api/saved-regions/:id - Update saved region name
  fastify.put('/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const body = updateRegionSchema.parse(request.body);
    const userId = request.user.userId;

    const region = await savedRegionsService.update(id, userId, {
      name: body.name,
    });

    if (!region) {
      return reply.status(404).send({ error: 'Saved region not found' });
    }

    return region;
  });

  // DELETE /api/saved-regions/:id - Delete a saved region
  fastify.delete('/:id', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const userId = request.user.userId;

    const deleted = await savedRegionsService.delete(id, userId);

    if (!deleted) {
      return reply.status(404).send({ error: 'Saved region not found' });
    }

    return { success: true, message: 'Region deleted successfully' };
  });

  // POST /api/saved-regions/:id/use - Mark region as used
  fastify.post('/:id/use', async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const userId = request.user.userId;

    const region = await savedRegionsService.markAsUsed(id, userId);

    if (!region) {
      return reply.status(404).send({ error: 'Saved region not found' });
    }

    return region;
  });
}
