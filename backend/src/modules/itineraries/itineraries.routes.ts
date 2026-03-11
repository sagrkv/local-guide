import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { itinerariesService } from './itineraries.service.js';
import { success, paginated, error, ErrorCodes } from '../../lib/response.js';
import { auditService, AuditActions, AuditResources } from '../audit/audit.service.js';

const listQuerySchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createItinerarySchema = z.object({
  cityId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  duration: z.string().min(1),
  coverImageUrl: z.string().url().optional(),
  difficulty: z.string().optional(),
  estimatedBudget: z.string().optional(),
});

const updateItinerarySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  duration: z.string().min(1).optional(),
  coverImageUrl: z.string().url().optional().nullable(),
  difficulty: z.string().optional().nullable(),
  estimatedBudget: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  sortOrder: z.number().int().optional(),
});

const addStopSchema = z.object({
  poiId: z.string().min(1),
  order: z.number().int().min(1),
  timeOfDay: z.enum(['EARLY_MORNING', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'ANY_TIME']).optional(),
  duration: z.string().optional(),
  note: z.string().optional(),
  transportToNext: z.enum(['WALK', 'BICYCLE', 'AUTO_RICKSHAW', 'TAXI', 'BUS', 'METRO', 'TRAIN', 'BOAT', 'CABLE_CAR', 'NONE']).optional(),
  transportNote: z.string().optional(),
});

const updateStopSchema = z.object({
  timeOfDay: z.enum(['EARLY_MORNING', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'ANY_TIME']).optional(),
  duration: z.string().optional(),
  note: z.string().optional(),
  transportToNext: z.enum(['WALK', 'BICYCLE', 'AUTO_RICKSHAW', 'TAXI', 'BUS', 'METRO', 'TRAIN', 'BOAT', 'CABLE_CAR', 'NONE']).optional(),
  transportNote: z.string().optional(),
});

const reorderStopsSchema = z.object({
  stopIds: z.array(z.string().min(1)).min(1),
});

export async function itinerariesRoutes(fastify: FastifyInstance) {
  // ============================================
  // Public Routes
  // ============================================

  // GET /cities/:cityId/itineraries — list itineraries for a city
  fastify.get('/cities/:cityId/itineraries', async (request, reply) => {
    try {
      const { cityId } = request.params as { cityId: string };
      const query = listQuerySchema.parse(request.query);

      const result = await itinerariesService.listItineraries(cityId, {
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

  // GET /cities/:cityId/itineraries/:slug — get itinerary with stops
  fastify.get('/cities/:cityId/itineraries/:slug', async (request, reply) => {
    const { cityId, slug } = request.params as { cityId: string; slug: string };

    const itinerary = await itinerariesService.getItineraryBySlug(cityId, slug);

    if (!itinerary) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Itinerary not found'));
    }

    return success(itinerary);
  });

  // ============================================
  // Admin Routes
  // ============================================

  // GET /itineraries/:id — get by ID (admin)
  fastify.get('/itineraries/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const itinerary = await itinerariesService.getItineraryById(id);

    if (!itinerary) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Itinerary not found'));
    }

    return success(itinerary);
  });

  // POST /itineraries — create itinerary (admin)
  fastify.post('/itineraries', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const data = createItinerarySchema.parse(request.body);
      const user = (request as any).user;

      const itinerary = await itinerariesService.createItinerary({
        cityId: data.cityId,
        title: data.title,
        description: data.description,
        duration: data.duration,
        coverImageUrl: data.coverImageUrl,
        difficulty: data.difficulty,
        estimatedBudget: data.estimatedBudget,
        createdById: user.userId,
      });

      await auditService.logAction({
        userId: user.userId,
        action: AuditActions.ITINERARY_CREATED,
        resource: AuditResources.ITINERARY,
        resourceId: itinerary.id,
        details: { title: data.title, cityId: data.cityId },
      });

      return reply.status(201).send(success(itinerary));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      throw err;
    }
  });

  // PATCH /itineraries/:id — update itinerary (admin)
  fastify.patch('/itineraries/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateItinerarySchema.parse(request.body);
      const user = (request as any).user;

      const itinerary = await itinerariesService.updateItinerary(id, data as any);

      if (!itinerary) {
        return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Itinerary not found'));
      }

      await auditService.logAction({
        userId: user.userId,
        action: AuditActions.ITINERARY_UPDATED,
        resource: AuditResources.ITINERARY,
        resourceId: id,
        details: { updatedFields: Object.keys(data) },
      });

      return success(itinerary);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      throw err;
    }
  });

  // DELETE /itineraries/:id — delete itinerary (admin)
  fastify.delete('/itineraries/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;

    const deleted = await itinerariesService.deleteItinerary(id);

    if (!deleted) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Itinerary not found'));
    }

    await auditService.logAction({
      userId: user.userId,
      action: 'ITINERARY_DELETED',
      resource: AuditResources.ITINERARY,
      resourceId: id,
    });

    return success({ message: 'Itinerary deleted successfully' });
  });

  // POST /itineraries/:id/stops — add stop (admin)
  fastify.post('/itineraries/:id/stops', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = addStopSchema.parse(request.body);
      const user = (request as any).user;

      const stop = await itinerariesService.addStop(id, {
        poiId: data.poiId,
        order: data.order,
        timeOfDay: data.timeOfDay,
        duration: data.duration,
        note: data.note,
        transportToNext: data.transportToNext,
        transportNote: data.transportNote,
      });

      await auditService.logAction({
        userId: user.userId,
        action: 'ITINERARY_STOP_ADDED',
        resource: AuditResources.ITINERARY,
        resourceId: id,
        details: { stopId: stop.id, poiId: data.poiId, order: data.order },
      });

      return reply.status(201).send(success(stop));
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      if (err instanceof Error && err.message === 'POI not found') {
        return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'POI not found'));
      }
      if (err instanceof Error && err.message === 'POI must be PUBLISHED or APPROVED') {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'POI must be PUBLISHED or APPROVED'));
      }
      throw err;
    }
  });

  // PATCH /itinerary-stops/:id — update stop (admin)
  fastify.patch('/itinerary-stops/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const data = updateStopSchema.parse(request.body);
      const user = (request as any).user;

      const stop = await itinerariesService.updateStop(id, data);

      if (!stop) {
        return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Itinerary stop not found'));
      }

      await auditService.logAction({
        userId: user.userId,
        action: 'ITINERARY_STOP_UPDATED',
        resource: AuditResources.ITINERARY,
        resourceId: id,
        details: { updatedFields: Object.keys(data) },
      });

      return success(stop);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      throw err;
    }
  });

  // DELETE /itinerary-stops/:id — remove stop (admin)
  fastify.delete('/itinerary-stops/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = (request as any).user;

    const deleted = await itinerariesService.removeStop(id);

    if (!deleted) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Itinerary stop not found'));
    }

    await auditService.logAction({
      userId: user.userId,
      action: 'ITINERARY_STOP_REMOVED',
      resource: AuditResources.ITINERARY,
      resourceId: id,
    });

    return success({ message: 'Stop removed successfully' });
  });

  // POST /itineraries/:id/stops/reorder — reorder stops (admin)
  fastify.post('/itineraries/:id/stops/reorder', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { stopIds } = reorderStopsSchema.parse(request.body);
      const user = (request as any).user;

      const stops = await itinerariesService.reorderStops(id, stopIds);

      await auditService.logAction({
        userId: user.userId,
        action: 'ITINERARY_STOPS_REORDERED',
        resource: AuditResources.ITINERARY,
        resourceId: id,
        details: { stopIds },
      });

      return success(stops);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      throw err;
    }
  });
}
