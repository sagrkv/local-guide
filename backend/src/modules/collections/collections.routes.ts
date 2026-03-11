import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { collectionsService } from './collections.service.js';
import { success, paginated, error, ErrorCodes } from '../../lib/response.js';
import { auditService, AuditActions, AuditResources } from '../audit/audit.service.js';

const listQuerySchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createCollectionSchema = z.object({
  cityId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
});

const updateCollectionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  sortOrder: z.number().int().optional(),
});

const addItemSchema = z.object({
  poiId: z.string().min(1),
  order: z.number().int().min(1),
  note: z.string().optional(),
});

const reorderItemsSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1),
});

export async function collectionsRoutes(fastify: FastifyInstance) {
  // ============================================
  // Public Routes
  // ============================================

  // GET /cities/:cityId/collections — list collections for a city
  fastify.get('/cities/:cityId/collections', async (request, reply) => {
    try {
      const { cityId } = request.params as { cityId: string };
      const query = listQuerySchema.parse(request.query);

      const result = await collectionsService.listCollections(cityId, {
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

  // GET /cities/:cityId/collections/:slug — get collection with items
  fastify.get('/cities/:cityId/collections/:slug', async (request, reply) => {
    const { cityId, slug } = request.params as { cityId: string; slug: string };

    const collection = await collectionsService.getCollectionBySlug(cityId, slug);

    if (!collection) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Collection not found'));
    }

    return success(collection);
  });

  // ============================================
  // Admin Routes
  // ============================================

  // GET /collections/:id — get by ID (admin)
  fastify.get('/collections/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const collection = await collectionsService.getCollectionById(id);

    if (!collection) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Collection not found'));
    }

    return success(collection);
  });

  // POST /collections — create collection (admin)
  fastify.post('/collections', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = createCollectionSchema.parse(request.body);
      const user = (request as any).user;

      const collection = await collectionsService.createCollection({
        cityId: data.cityId,
        title: data.title,
        description: data.description,
        coverImageUrl: data.coverImageUrl,
        createdById: user.userId,
      });

      await auditService.logAction({
        userId: user.userId,
        action: AuditActions.COLLECTION_CREATED,
        resource: AuditResources.COLLECTION,
        resourceId: collection.id,
        details: { title: data.title, cityId: data.cityId },
      });

      return reply.status(201).send(success(collection));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      throw err;
    }
  });

  // PATCH /collections/:id — update collection (admin)
  fastify.patch('/collections/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateCollectionSchema.parse(request.body);
      const user = (request as any).user;

      const collection = await collectionsService.updateCollection(id, data as any);

      if (!collection) {
        return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Collection not found'));
      }

      await auditService.logAction({
        userId: user.userId,
        action: AuditActions.COLLECTION_UPDATED,
        resource: AuditResources.COLLECTION,
        resourceId: id,
        details: { updatedFields: Object.keys(data) },
      });

      return success(collection);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      throw err;
    }
  });

  // DELETE /collections/:id — delete collection (admin)
  fastify.delete('/collections/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;

    const deleted = await collectionsService.deleteCollection(id);

    if (!deleted) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Collection not found'));
    }

    await auditService.logAction({
      userId: user.userId,
      action: 'COLLECTION_DELETED',
      resource: AuditResources.COLLECTION,
      resourceId: id,
    });

    return success({ message: 'Collection deleted successfully' });
  });

  // POST /collections/:id/items — add item (admin)
  fastify.post('/collections/:id/items', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = addItemSchema.parse(request.body);
      const user = (request as any).user;

      const item = await collectionsService.addItem(id, {
        poiId: data.poiId,
        order: data.order,
        note: data.note,
      });

      await auditService.logAction({
        userId: user.userId,
        action: 'COLLECTION_ITEM_ADDED',
        resource: AuditResources.COLLECTION,
        resourceId: id,
        details: { itemId: item.id, poiId: data.poiId, order: data.order },
      });

      return reply.status(201).send(success(item));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      if (err instanceof Error && err.message === 'POI not found') {
        return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'POI not found'));
      }
      if (err instanceof Error && err.message === 'POI already exists in this collection') {
        return reply.status(409).send(error(ErrorCodes.CONFLICT, 'POI already exists in this collection'));
      }
      throw err;
    }
  });

  // DELETE /collection-items/:id — remove item (admin)
  fastify.delete('/collection-items/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;

    const deleted = await collectionsService.removeItem(id);

    if (!deleted) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Collection item not found'));
    }

    await auditService.logAction({
      userId: user.userId,
      action: 'COLLECTION_ITEM_REMOVED',
      resource: AuditResources.COLLECTION,
      resourceId: id,
    });

    return success({ message: 'Item removed successfully' });
  });

  // POST /collections/:id/items/reorder — reorder items (admin)
  fastify.post('/collections/:id/items/reorder', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { itemIds } = reorderItemsSchema.parse(request.body);
      const user = (request as any).user;

      const items = await collectionsService.reorderItems(id, itemIds);

      await auditService.logAction({
        userId: user.userId,
        action: 'COLLECTION_ITEMS_REORDERED',
        resource: AuditResources.COLLECTION,
        resourceId: id,
        details: { itemIds },
      });

      return success(items);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      throw err;
    }
  });
}
