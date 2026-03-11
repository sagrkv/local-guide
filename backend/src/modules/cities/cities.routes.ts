import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { CityStatus } from '@prisma/client';
import { citiesService } from './cities.service.js';
import { slugify } from '../../utils/slugify.js';
import { success, paginated, error, ErrorCodes } from '../../lib/response.js';
import { auditService, AuditActions, AuditResources } from '../audit/audit.service.js';

const createCitySchema = z.object({
  name: z.string().min(1).max(200),
  tagline: z.string().max(500).optional(),
  description: z.string().optional(),
  country: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  heroImageUrl: z.string().url().optional(),
  ogImageUrl: z.string().url().optional(),
  centerLat: z.number().min(-90).max(90),
  centerLng: z.number().min(-180).max(180),
  defaultZoom: z.number().int().min(1).max(20).optional(),
  boundsNorthLat: z.number().min(-90).max(90).optional(),
  boundsSouthLat: z.number().min(-90).max(90).optional(),
  boundsEastLng: z.number().min(-180).max(180).optional(),
  boundsWestLng: z.number().min(-180).max(180).optional(),
  timezone: z.string().max(100).optional(),
  currency: z.string().max(10).optional(),
  language: z.string().max(10).optional(),
  status: z.nativeEnum(CityStatus).optional(),
  sortOrder: z.number().int().optional(),
});

const updateCitySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  tagline: z.string().max(500).optional(),
  description: z.string().optional(),
  country: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  heroImageUrl: z.string().url().optional(),
  ogImageUrl: z.string().url().optional(),
  centerLat: z.number().min(-90).max(90).optional(),
  centerLng: z.number().min(-180).max(180).optional(),
  defaultZoom: z.number().int().min(1).max(20).optional(),
  boundsNorthLat: z.number().min(-90).max(90).optional(),
  boundsSouthLat: z.number().min(-90).max(90).optional(),
  boundsEastLng: z.number().min(-180).max(180).optional(),
  boundsWestLng: z.number().min(-180).max(180).optional(),
  timezone: z.string().max(100).optional(),
  currency: z.string().max(10).optional(),
  language: z.string().max(10).optional(),
  sortOrder: z.number().int().optional(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(CityStatus),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(CityStatus).optional(),
  search: z.string().optional(),
});

export async function citiesRoutes(fastify: FastifyInstance) {
  // GET / — list cities (public gets only PUBLISHED, admin sees all)
  fastify.get('/', async (request, reply) => {
    const query = listQuerySchema.parse(request.query);
    const userRequest = request as any;

    // If no authenticated user, force PUBLISHED only
    let statusFilter = query.status;
    if (!userRequest.user) {
      statusFilter = CityStatus.PUBLISHED;
    }

    const { cities, total } = await citiesService.listCities({
      status: statusFilter,
      search: query.search,
      page: query.page,
      limit: query.limit,
    });

    return paginated(cities, { page: query.page, limit: query.limit, total });
  });

  // GET /:slug — get city by slug (public)
  fastify.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const city = await citiesService.getCityBySlug(slug);

    if (!city) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'City not found'));
    }

    return success(city);
  });

  // POST / — create city (admin only)
  fastify.post('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const userRequest = request as any;
    const data = createCitySchema.parse(request.body);

    const slug = slugify(data.name);

    // Check slug uniqueness
    const existing = await citiesService.getCityBySlugExact(slug);
    if (existing) {
      return reply.status(409).send(error(ErrorCodes.CONFLICT, 'A city with this name already exists'));
    }

    const city = await citiesService.createCity({
      name: data.name,
      slug,
      tagline: data.tagline,
      description: data.description,
      country: data.country,
      state: data.state,
      heroImageUrl: data.heroImageUrl,
      ogImageUrl: data.ogImageUrl,
      centerLat: data.centerLat,
      centerLng: data.centerLng,
      defaultZoom: data.defaultZoom,
      boundsNorthLat: data.boundsNorthLat,
      boundsSouthLat: data.boundsSouthLat,
      boundsEastLng: data.boundsEastLng,
      boundsWestLng: data.boundsWestLng,
      timezone: data.timezone,
      currency: data.currency,
      language: data.language,
      status: data.status,
      sortOrder: data.sortOrder,
    });

    await auditService.logAction({
      userId: userRequest.user.userId,
      action: AuditActions.CITY_CREATED,
      resource: AuditResources.CITY,
      resourceId: city.id,
      details: { name: data.name, slug },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.status(201).send(success(city));
  });

  // PATCH /:id — update city (admin only)
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const userRequest = request as any;
    const { id } = request.params as { id: string };
    const data = updateCitySchema.parse(request.body);

    const updateData: Record<string, unknown> = { ...data };

    // If name is being updated, regenerate slug
    if (data.name) {
      const newSlug = slugify(data.name);
      const existing = await citiesService.getCityBySlugExact(newSlug);
      if (existing && existing.id !== id) {
        return reply.status(409).send(error(ErrorCodes.CONFLICT, 'A city with this name already exists'));
      }
      updateData.slug = newSlug;
    }

    const city = await citiesService.updateCity(id, updateData);

    if (!city) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'City not found'));
    }

    await auditService.logAction({
      userId: userRequest.user.userId,
      action: AuditActions.CITY_UPDATED,
      resource: AuditResources.CITY,
      resourceId: id,
      details: { updatedFields: Object.keys(data) },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return success(city);
  });

  // DELETE /:id — delete city (admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const userRequest = request as any;
    const { id } = request.params as { id: string };

    const result = await citiesService.deleteCity(id);

    if (!result.deleted) {
      if (result.reason === 'NOT_FOUND') {
        return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'City not found'));
      }
      if (result.reason === 'CITY_HAS_POIS') {
        return reply.status(409).send(error(
          ErrorCodes.CONFLICT,
          `Cannot delete city: ${result.poiCount} POI(s) still assigned. Remove or reassign them first.`,
        ));
      }
    }

    await auditService.logAction({
      userId: userRequest.user.userId,
      action: 'CITY_DELETED',
      resource: AuditResources.CITY,
      resourceId: id,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return success({ message: 'City deleted successfully' });
  });

  // PATCH /:id/status — update city status (admin only)
  fastify.patch('/:id/status', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const userRequest = request as any;
    const { id } = request.params as { id: string };
    const { status } = updateStatusSchema.parse(request.body);

    const city = await citiesService.updateCityStatus(id, status);

    if (!city) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'City not found'));
    }

    const actionMap: Record<string, string> = {
      PUBLISHED: AuditActions.CITY_PUBLISHED,
      ARCHIVED: AuditActions.CITY_ARCHIVED,
      DRAFT: AuditActions.CITY_UPDATED,
    };

    await auditService.logAction({
      userId: userRequest.user.userId,
      action: actionMap[status] || AuditActions.CITY_UPDATED,
      resource: AuditResources.CITY,
      resourceId: id,
      details: { newStatus: status },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return success(city);
  });
}
