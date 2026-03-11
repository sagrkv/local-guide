import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { themesService, UpsertThemeData } from './themes.service.js';
import { citiesService } from '../cities/cities.service.js';
import { success, error, ErrorCodes } from '../../lib/response.js';
import { auditService, AuditResources } from '../audit/audit.service.js';

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

const upsertThemeSchema = z.object({
  themePresetId: z.string().max(50).optional(),
  colorPrimary: z.string().regex(hexColorRegex, 'Invalid hex color').optional(),
  colorSecondary: z.string().regex(hexColorRegex, 'Invalid hex color').optional(),
  colorAccent: z.string().regex(hexColorRegex, 'Invalid hex color').optional(),
  colorBackground: z.string().regex(hexColorRegex, 'Invalid hex color').optional(),
  colorText: z.string().regex(hexColorRegex, 'Invalid hex color').optional(),
  displayFontUrl: z.string().url().optional(),
  displayFontFamily: z.string().max(200).optional(),
  bodyFontUrl: z.string().url().optional(),
  bodyFontFamily: z.string().max(200).optional(),
  logoUrl: z.string().url().optional(),
  emblemUrl: z.string().url().optional(),
  backgroundPatternUrl: z.string().url().optional(),
  mapStyleJson: z.record(z.unknown()).optional(),
  mapTileUrl: z.string().url().optional(),
  iconPack: z.string().max(50).optional(),
});

export async function themesRoutes(fastify: FastifyInstance) {
  // GET /cities/:cityId/theme — get theme (public)
  fastify.get('/cities/:cityId/theme', async (request, reply) => {
    const { cityId } = request.params as { cityId: string };

    // Verify city exists
    const city = await citiesService.getCityById(cityId);
    if (!city) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'City not found'));
    }

    const theme = await themesService.getThemeByCityId(cityId);
    return success(theme);
  });

  // PUT /cities/:cityId/theme — create/update theme (admin only)
  fastify.put('/cities/:cityId/theme', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const userRequest = request as any;

    if (userRequest.user.role !== 'ADMIN') {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Not found'));
    }

    const { cityId } = request.params as { cityId: string };
    const parsed = upsertThemeSchema.parse(request.body);

    // Verify city exists
    const city = await citiesService.getCityById(cityId);
    if (!city) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'City not found'));
    }

    const data: UpsertThemeData = {
      ...parsed,
      mapStyleJson: parsed.mapStyleJson as Prisma.InputJsonValue | undefined,
    };

    const theme = await themesService.upsertTheme(cityId, data);

    await auditService.logAction({
      userId: userRequest.user.userId,
      action: 'THEME_UPSERTED',
      resource: AuditResources.CITY,
      resourceId: cityId,
      details: { updatedFields: Object.keys(data) },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return success(theme);
  });
}
