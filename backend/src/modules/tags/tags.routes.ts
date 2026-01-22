import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { tagsService } from './tags.service.js';

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366f1'),
});

const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function tagsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', fastify.authenticate);

  // List all tags
  fastify.get('/', async (request, reply) => {
    const tags = await tagsService.list();
    return tags;
  });

  // Get tag by ID with lead count
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const tag = await tagsService.getById(id);

    if (!tag) {
      return reply.status(404).send({ error: 'Tag not found' });
    }

    return tag;
  });

  // Create tag
  fastify.post('/', async (request, reply) => {
    const data = createTagSchema.parse(request.body);

    const existingTag = await tagsService.getByName(data.name);
    if (existingTag) {
      return reply.status(400).send({ error: 'Tag with this name already exists' });
    }

    const tag = await tagsService.create(data);
    return reply.status(201).send(tag);
  });

  // Update tag
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateTagSchema.parse(request.body);

    if (data.name) {
      const existingTag = await tagsService.getByName(data.name);
      if (existingTag && existingTag.id !== id) {
        return reply.status(400).send({ error: 'Tag with this name already exists' });
      }
    }

    const tag = await tagsService.update(id, data);

    if (!tag) {
      return reply.status(404).send({ error: 'Tag not found' });
    }

    return tag;
  });

  // Delete tag
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const deleted = await tagsService.delete(id);

    if (!deleted) {
      return reply.status(404).send({ error: 'Tag not found' });
    }

    return { message: 'Tag deleted successfully' };
  });
}
