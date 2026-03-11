import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { poiPhotosService, AddPhotoData } from './poi-photos.service.js';
import { success, error, ErrorCodes } from '../../lib/response.js';
import { auditService, AuditResources } from '../audit/audit.service.js';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const addPhotoSchema = z.object({
  url: z.string().url().min(1),
  caption: z.string().max(500).optional(),
  source: z.string().max(255).optional(),
  isPrimary: z.boolean().optional(),
});

const updatePhotoSchema = z.object({
  url: z.string().url().optional(),
  caption: z.string().max(500).optional(),
  source: z.string().max(255).optional(),
  isPrimary: z.boolean().optional(),
});

const reorderPhotosSchema = z.object({
  photoIds: z.array(z.string().min(1)).min(1),
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function poiPhotosRoutes(fastify: FastifyInstance) {

  // GET /pois/:poiId/photos - list photos (public)
  fastify.get('/pois/:poiId/photos', async (request) => {
    const { poiId } = request.params as { poiId: string };
    const photos = await poiPhotosService.listPhotos(poiId);
    return success(photos);
  });

  // POST /pois/:poiId/photos - add photo (admin)
  fastify.post('/pois/:poiId/photos', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if ((request as any).user.role !== 'ADMIN') {
      return reply.status(403).send(error(ErrorCodes.FORBIDDEN, 'Admin access required'));
    }

    const { poiId } = request.params as { poiId: string };

    try {
      const parsed = addPhotoSchema.parse(request.body);
      const data: AddPhotoData = {
        url: parsed.url,
        caption: parsed.caption,
        source: parsed.source,
        isPrimary: parsed.isPrimary,
      };

      const result = await poiPhotosService.addPhoto(poiId, data);

      if ('error' in result) {
        return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'POI not found'));
      }

      await auditService.logAction({
        userId: (request as any).user.userId,
        action: 'PHOTO_ADDED',
        resource: AuditResources.POI,
        resourceId: poiId,
        details: { photoId: result.photo.id, url: data.url },
      });

      return reply.status(201).send(success(result.photo));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      throw err;
    }
  });

  // PATCH /photos/:id - update photo (admin)
  fastify.patch('/photos/:id', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if ((request as any).user.role !== 'ADMIN') {
      return reply.status(403).send(error(ErrorCodes.FORBIDDEN, 'Admin access required'));
    }

    const { id } = request.params as { id: string };

    try {
      const data = updatePhotoSchema.parse(request.body);
      const photo = await poiPhotosService.updatePhoto(id, data);

      if (!photo) {
        return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Photo not found'));
      }

      await auditService.logAction({
        userId: (request as any).user.userId,
        action: 'PHOTO_UPDATED',
        resource: AuditResources.POI,
        resourceId: photo.poiId,
        details: { photoId: id, updatedFields: Object.keys(data) },
      });

      return success(photo);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      throw err;
    }
  });

  // DELETE /photos/:id - delete photo (admin)
  fastify.delete('/photos/:id', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if ((request as any).user.role !== 'ADMIN') {
      return reply.status(403).send(error(ErrorCodes.FORBIDDEN, 'Admin access required'));
    }

    const { id } = request.params as { id: string };

    const deleted = await poiPhotosService.deletePhoto(id);
    if (!deleted) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Photo not found'));
    }

    await auditService.logAction({
      userId: (request as any).user.userId,
      action: 'PHOTO_DELETED',
      resource: AuditResources.POI,
      details: { photoId: id },
    });

    return success({ message: 'Photo deleted successfully' });
  });

  // POST /pois/:poiId/photos/reorder - reorder photos (admin)
  fastify.post('/pois/:poiId/photos/reorder', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if ((request as any).user.role !== 'ADMIN') {
      return reply.status(403).send(error(ErrorCodes.FORBIDDEN, 'Admin access required'));
    }

    const { poiId } = request.params as { poiId: string };

    try {
      const data = reorderPhotosSchema.parse(request.body);
      const result = await poiPhotosService.reorderPhotos(poiId, data.photoIds);

      if ('error' in result) {
        return reply.status(400).send(error(
          ErrorCodes.VALIDATION_ERROR,
          `Invalid photo IDs: ${result.invalidIds.join(', ')}`,
        ));
      }

      await auditService.logAction({
        userId: (request as any).user.userId,
        action: 'PHOTOS_REORDERED',
        resource: AuditResources.POI,
        resourceId: poiId,
        details: { photoIds: data.photoIds },
      });

      return success({ message: 'Photos reordered successfully' });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      throw err;
    }
  });
}
