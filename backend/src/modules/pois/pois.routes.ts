import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { poisService, CreatePOIData, UpdatePOIData } from './pois.service.js';
import { success, paginated, error, ErrorCodes } from '../../lib/response.js';
import { auditService, AuditActions, AuditResources } from '../audit/audit.service.js';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const listPOIsQuerySchema = z.object({
  status: z.enum(['AI_SUGGESTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']).optional(),
  categoryId: z.string().optional(),
  priority: z.enum(['MUST_VISIT', 'RECOMMENDED', 'HIDDEN_GEM', 'OPTIONAL']).optional(),
  tags: z.string().optional(),
  search: z.string().optional(),
  northLat: z.coerce.number().optional(),
  southLat: z.coerce.number().optional(),
  eastLng: z.coerce.number().optional(),
  westLng: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const createPOISchema = z.object({
  cityId: z.string().min(1),
  name: z.string().min(1).max(255),
  categoryId: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  shortDescription: z.string().max(500).optional(),
  longDescription: z.string().optional(),
  googlePlaceId: z.string().optional(),
  subcategory: z.string().optional(),
  estimatedTimeToSpend: z.string().optional(),
  bestTimeToVisit: z.enum(['EARLY_MORNING', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'ANY_TIME']).optional(),
  bestSeason: z.enum(['SPRING', 'SUMMER', 'AUTUMN', 'WINTER', 'MONSOON', 'ALL_YEAR']).optional(),
  entryFee: z.string().optional(),
  openingHours: z.any().optional(),
  dressCode: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  address: z.string().optional(),
  directionsNote: z.string().optional(),
  nearestLandmark: z.string().optional(),
  parkingAvailable: z.boolean().optional(),
  wheelchairAccessible: z.boolean().optional(),
  petFriendly: z.boolean().optional(),
  wifiAvailable: z.boolean().optional(),
  familyFriendly: z.boolean().optional(),
  budgetFriendly: z.boolean().optional(),
  localTip: z.string().optional(),
  warningNote: z.string().optional(),
  priority: z.enum(['MUST_VISIT', 'RECOMMENDED', 'HIDDEN_GEM', 'OPTIONAL']).optional(),
  iconOverride: z.string().optional(),
  colorOverride: z.string().optional(),
  sortOrder: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
});

const updatePOISchema = z.object({
  name: z.string().min(1).max(255).optional(),
  shortDescription: z.string().max(500).optional(),
  longDescription: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  googlePlaceId: z.string().optional(),
  categoryId: z.string().optional(),
  subcategory: z.string().optional(),
  estimatedTimeToSpend: z.string().optional(),
  bestTimeToVisit: z.enum(['EARLY_MORNING', 'MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'ANY_TIME']).optional(),
  bestSeason: z.enum(['SPRING', 'SUMMER', 'AUTUMN', 'WINTER', 'MONSOON', 'ALL_YEAR']).optional(),
  entryFee: z.string().optional(),
  openingHours: z.any().optional(),
  dressCode: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  address: z.string().optional(),
  directionsNote: z.string().optional(),
  nearestLandmark: z.string().optional(),
  parkingAvailable: z.boolean().optional(),
  wheelchairAccessible: z.boolean().optional(),
  petFriendly: z.boolean().optional(),
  wifiAvailable: z.boolean().optional(),
  familyFriendly: z.boolean().optional(),
  budgetFriendly: z.boolean().optional(),
  localTip: z.string().optional(),
  warningNote: z.string().optional(),
  priority: z.enum(['MUST_VISIT', 'RECOMMENDED', 'HIDDEN_GEM', 'OPTIONAL']).optional(),
  iconOverride: z.string().optional(),
  colorOverride: z.string().optional(),
  sortOrder: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(['AI_SUGGESTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED']),
  rejectionReason: z.string().optional(),
});

const rejectSchema = z.object({
  reason: z.string().min(1),
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const geoJsonQuerySchema = z.object({
  category: z.string().optional(),
  priority: z.string().optional(),
  tags: z.string().optional(),
  northLat: z.coerce.number().optional(),
  southLat: z.coerce.number().optional(),
  eastLng: z.coerce.number().optional(),
  westLng: z.coerce.number().optional(),
});

// ---------------------------------------------------------------------------
// Helper: check admin role
// ---------------------------------------------------------------------------

function isAdmin(request: any): boolean {
  return request.user && request.user.role === 'ADMIN';
}

function requireAdminGuard(request: any, reply: any): boolean {
  if (!isAdmin(request)) {
    reply.status(403).send(error(ErrorCodes.FORBIDDEN, 'Admin access required'));
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function poisRoutes(fastify: FastifyInstance) {

  // =========================================================================
  // PUBLIC routes (no auth required)
  // =========================================================================

  // GET /cities/:cityId/pois - list POIs (public: only PUBLISHED, admin: all)
  fastify.get('/cities/:cityId/pois', async (request, reply) => {
    const { cityId } = request.params as { cityId: string };

    try {
      const query = listPOIsQuerySchema.parse(request.query);

      // Determine if requester is admin (auth is optional)
      let isPublic = true;
      try {
        await fastify.authenticate(request, reply);
        if ((request as any).user && isAdmin(request)) {
          isPublic = false;
        }
      } catch {
        // Not authenticated = public
      }

      const bounds =
        query.northLat !== undefined &&
        query.southLat !== undefined &&
        query.eastLng !== undefined &&
        query.westLng !== undefined
          ? {
              northLat: query.northLat,
              southLat: query.southLat,
              eastLng: query.eastLng,
              westLng: query.westLng,
            }
          : undefined;

      const result = await poisService.listPOIs({
        cityId,
        status: isPublic ? undefined : query.status,
        categoryId: query.categoryId,
        priority: query.priority,
        tags: query.tags,
        search: query.search,
        bounds,
        page: query.page,
        limit: query.limit,
        isPublic,
      });

      return paginated(result.pois, { page: query.page, limit: query.limit, total: result.total });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid query parameters'));
      }
      throw err;
    }
  });

  // GET /cities/:cityId/pois/random - random published POI
  fastify.get('/cities/:cityId/pois/random', async (request, reply) => {
    const { cityId } = request.params as { cityId: string };

    const poi = await poisService.getRandomPOI(cityId);
    if (!poi) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'No published POIs found'));
    }

    return success(poi);
  });

  // GET /cities/:slug/pois.geojson - GeoJSON FeatureCollection
  fastify.get('/cities/:slug/pois.geojson', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    try {
      const query = geoJsonQuerySchema.parse(request.query);

      const bounds =
        query.northLat !== undefined &&
        query.southLat !== undefined &&
        query.eastLng !== undefined &&
        query.westLng !== undefined
          ? {
              northLat: query.northLat,
              southLat: query.southLat,
              eastLng: query.eastLng,
              westLng: query.westLng,
            }
          : undefined;

      const geojson = await poisService.getGeoJSON(slug, {
        category: query.category,
        priority: query.priority,
        tags: query.tags,
        bounds,
      });

      if (!geojson) {
        return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'City not found'));
      }

      reply.header('Content-Type', 'application/geo+json');
      return geojson;
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid query parameters'));
      }
      throw err;
    }
  });

  // GET /cities/:cityId/pois/:slugOrId - get POI by slug or ID (public)
  fastify.get('/cities/:cityId/pois/:slugOrId', async (request, reply) => {
    const { cityId, slugOrId } = request.params as { cityId: string; slugOrId: string };

    // Try slug first, fall back to ID lookup
    let poi = await poisService.getPOIBySlug(cityId, slugOrId);
    if (!poi) {
      poi = await poisService.getPOIById(slugOrId);
    }
    if (!poi) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'POI not found'));
    }

    return success(poi);
  });

  // =========================================================================
  // ADMIN-ONLY routes (auth required)
  // =========================================================================

  // GET /cities/:cityId/pois/review-queue - review queue
  fastify.get('/cities/:cityId/pois/review-queue', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if (!requireAdminGuard(request, reply)) return;

    const { cityId } = request.params as { cityId: string };

    try {
      const query = paginationQuerySchema.parse(request.query);
      const result = await poisService.getReviewQueue(cityId, query.page, query.limit);

      return paginated(result.pois, { page: query.page, limit: query.limit, total: result.total });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid query parameters'));
      }
      throw err;
    }
  });

  // GET /cities/:cityId/pois/stats - pipeline stats
  fastify.get('/cities/:cityId/pois/stats', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if (!requireAdminGuard(request, reply)) return;

    const { cityId } = request.params as { cityId: string };
    const stats = await poisService.getPOIStats(cityId);

    return success(stats);
  });

  // GET /pois/:id - get POI by ID (admin)
  fastify.get('/pois/:id', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if (!requireAdminGuard(request, reply)) return;

    const { id } = request.params as { id: string };

    const poi = await poisService.getPOIById(id);
    if (!poi) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'POI not found'));
    }

    return success(poi);
  });

  // POST /pois - create POI (admin)
  fastify.post('/pois', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if (!requireAdminGuard(request, reply)) return;

    try {
      const data = createPOISchema.parse(request.body);
      const createData: CreatePOIData = {
        cityId: data.cityId,
        name: data.name,
        categoryId: data.categoryId,
        latitude: data.latitude,
        longitude: data.longitude,
        shortDescription: data.shortDescription,
        longDescription: data.longDescription,
        googlePlaceId: data.googlePlaceId,
        subcategory: data.subcategory,
        estimatedTimeToSpend: data.estimatedTimeToSpend,
        bestTimeToVisit: data.bestTimeToVisit,
        bestSeason: data.bestSeason,
        entryFee: data.entryFee,
        openingHours: data.openingHours,
        dressCode: data.dressCode,
        phone: data.phone,
        website: data.website,
        instagram: data.instagram,
        address: data.address,
        directionsNote: data.directionsNote,
        nearestLandmark: data.nearestLandmark,
        parkingAvailable: data.parkingAvailable,
        wheelchairAccessible: data.wheelchairAccessible,
        petFriendly: data.petFriendly,
        wifiAvailable: data.wifiAvailable,
        familyFriendly: data.familyFriendly,
        budgetFriendly: data.budgetFriendly,
        localTip: data.localTip,
        warningNote: data.warningNote,
        priority: data.priority,
        iconOverride: data.iconOverride,
        colorOverride: data.colorOverride,
        sortOrder: data.sortOrder,
        tags: data.tags,
      };

      const result = await poisService.createPOI(createData);

      if ('error' in result) {
        if (result.error === 'CITY_NOT_FOUND') {
          return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'City not found'));
        }
        if (result.error === 'CATEGORY_NOT_FOUND') {
          return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Category not found'));
        }
      }

      if ('poi' in result) {
        await auditService.logAction({
          userId: (request as any).user.userId,
          action: AuditActions.POI_CREATED,
          resource: AuditResources.POI,
          resourceId: result.poi.id,
          details: { name: result.poi.name, cityId: data.cityId },
        });

        return reply.status(201).send(success(result.poi));
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      throw err;
    }
  });

  // PATCH /pois/:id - update POI (admin)
  fastify.patch('/pois/:id', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if (!requireAdminGuard(request, reply)) return;

    const { id } = request.params as { id: string };

    try {
      const data = updatePOISchema.parse(request.body);
      const updateData: UpdatePOIData = { ...data };

      const poi = await poisService.updatePOI(id, updateData);

      if (!poi) {
        return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'POI not found'));
      }

      // Auto-recalculate quality score
      await poisService.recalculateQualityScore(id);

      await auditService.logAction({
        userId: (request as any).user.userId,
        action: AuditActions.POI_UPDATED,
        resource: AuditResources.POI,
        resourceId: id,
        details: { updatedFields: Object.keys(data) },
      });

      // Re-fetch with updated quality score
      const updated = await poisService.getPOIById(id);
      return success(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      throw err;
    }
  });

  // DELETE /pois/:id - delete POI (admin)
  fastify.delete('/pois/:id', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if (!requireAdminGuard(request, reply)) return;

    const { id } = request.params as { id: string };

    const deleted = await poisService.deletePOI(id);
    if (!deleted) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'POI not found'));
    }

    await auditService.logAction({
      userId: (request as any).user.userId,
      action: AuditActions.POI_ARCHIVED,
      resource: AuditResources.POI,
      resourceId: id,
    });

    return success({ message: 'POI deleted successfully' });
  });

  // PATCH /pois/:id/status - change status (admin)
  fastify.patch('/pois/:id/status', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if (!requireAdminGuard(request, reply)) return;

    const { id } = request.params as { id: string };

    try {
      const data = statusUpdateSchema.parse(request.body);
      const poi = await poisService.updatePOIStatus(
        id,
        data.status,
        (request as any).user.userId,
        data.rejectionReason,
      );

      if (!poi) {
        return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'POI not found'));
      }

      await auditService.logAction({
        userId: (request as any).user.userId,
        action: `POI_STATUS_${data.status}`,
        resource: AuditResources.POI,
        resourceId: id,
        details: { status: data.status, rejectionReason: data.rejectionReason },
      });

      return success(poi);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Invalid request body'));
      }
      throw err;
    }
  });

  // POST /pois/:id/approve - approve POI (admin)
  fastify.post('/pois/:id/approve', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if (!requireAdminGuard(request, reply)) return;

    const { id } = request.params as { id: string };

    const poi = await poisService.approvePOI(id, (request as any).user.userId);
    if (!poi) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'POI not found'));
    }

    await auditService.logAction({
      userId: (request as any).user.userId,
      action: AuditActions.POI_APPROVED,
      resource: AuditResources.POI,
      resourceId: id,
    });

    return success(poi);
  });

  // POST /pois/:id/reject - reject POI (admin)
  fastify.post('/pois/:id/reject', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if (!requireAdminGuard(request, reply)) return;

    const { id } = request.params as { id: string };

    try {
      const data = rejectSchema.parse(request.body);
      const poi = await poisService.rejectPOI(id, data.reason);

      if (!poi) {
        return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'POI not found'));
      }

      await auditService.logAction({
        userId: (request as any).user.userId,
        action: AuditActions.POI_REJECTED,
        resource: AuditResources.POI,
        resourceId: id,
        details: { reason: data.reason },
      });

      return success(poi);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send(error(ErrorCodes.VALIDATION_ERROR, 'Rejection reason is required'));
      }
      throw err;
    }
  });

  // POST /pois/:id/publish - publish POI (admin)
  fastify.post('/pois/:id/publish', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if (!requireAdminGuard(request, reply)) return;

    const { id } = request.params as { id: string };

    const result = await poisService.publishPOI(id);

    if ('error' in result) {
      if (result.error === 'NOT_FOUND') {
        return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'POI not found'));
      }
      if (result.error === 'VALIDATION_FAILED') {
        return reply.status(400).send(error(
          ErrorCodes.VALIDATION_ERROR,
          'POI cannot be published: ' + (result as any).details.join(', '),
        ));
      }
    }

    if ('poi' in result) {
      await auditService.logAction({
        userId: (request as any).user.userId,
        action: AuditActions.POI_PUBLISHED,
        resource: AuditResources.POI,
        resourceId: id,
      });

      return success(result.poi);
    }
  });
}
