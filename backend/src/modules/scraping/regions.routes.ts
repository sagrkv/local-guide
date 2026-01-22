import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { regionsService } from './regions.service.js';

const createRegionSchema = z.object({
  name: z.string().min(1).max(100),
  cities: z.array(z.string()).min(1),
  state: z.string().optional(),
  country: z.string().default('India'),
  isActive: z.boolean().default(true),
});

const updateRegionSchema = createRegionSchema.partial();

export async function regionsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // List all regions
  fastify.get('/', async (request, reply) => {
    const regions = await regionsService.list();
    return regions;
  });

  // Get region by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const region = await regionsService.getById(id);

    if (!region) {
      return reply.status(404).send({ error: 'Region not found' });
    }

    return region;
  });

  // Create region
  fastify.post('/', async (request, reply) => {
    const data = createRegionSchema.parse(request.body);

    const existingRegion = await regionsService.getByName(data.name);
    if (existingRegion) {
      return reply.status(400).send({ error: 'Region with this name already exists' });
    }

    const region = await regionsService.create(data);
    return reply.status(201).send(region);
  });

  // Update region
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateRegionSchema.parse(request.body);

    if (data.name) {
      const existingRegion = await regionsService.getByName(data.name);
      if (existingRegion && existingRegion.id !== id) {
        return reply.status(400).send({ error: 'Region with this name already exists' });
      }
    }

    const region = await regionsService.update(id, data);

    if (!region) {
      return reply.status(404).send({ error: 'Region not found' });
    }

    return region;
  });

  // Delete region
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const deleted = await regionsService.delete(id);

    if (!deleted) {
      return reply.status(404).send({ error: 'Region not found' });
    }

    return { message: 'Region deleted successfully' };
  });

  // Toggle region active status
  fastify.post('/:id/toggle', async (request, reply) => {
    const { id } = request.params as { id: string };

    const region = await regionsService.toggleActive(id);

    if (!region) {
      return reply.status(404).send({ error: 'Region not found' });
    }

    return region;
  });
}
