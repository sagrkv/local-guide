import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { categoriesService } from './categories.service.js';
import { slugify } from '../../utils/slugify.js';
import { success, paginated, error, ErrorCodes } from '../../lib/response.js';
import { auditService, AuditResources } from '../audit/audit.service.js';

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  emoji: z.string().max(10).optional(),
  isGlobal: z.boolean().optional(),
  cityId: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(100).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  emoji: z.string().max(10).optional(),
  isGlobal: z.boolean().optional(),
  cityId: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cityId: z.string().optional(),
  isGlobal: z.coerce.string().transform((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }).optional(),
});

export async function categoriesRoutes(fastify: FastifyInstance) {
  // GET / — list all categories (public)
  fastify.get('/', async (request) => {
    const query = listQuerySchema.parse(request.query);

    const { categories, total } = await categoriesService.listCategories({
      cityId: query.cityId,
      isGlobal: query.isGlobal as boolean | undefined,
      page: query.page,
      limit: query.limit,
    });

    return paginated(categories, { page: query.page, limit: query.limit, total });
  });

  // POST / — create category (admin only)
  fastify.post('/', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const userRequest = request as any;
    const data = createCategorySchema.parse(request.body);

    const slug = slugify(data.name);

    const category = await categoriesService.createCategory({
      name: data.name,
      slug,
      icon: data.icon,
      color: data.color,
      emoji: data.emoji,
      isGlobal: data.isGlobal,
      cityId: data.cityId,
      sortOrder: data.sortOrder,
    });

    await auditService.logAction({
      userId: userRequest.user.userId,
      action: 'CATEGORY_CREATED',
      resource: AuditResources.CATEGORY,
      resourceId: category.id,
      details: { name: data.name, slug, isGlobal: data.isGlobal },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.status(201).send(success(category));
  });

  // PATCH /:id — update category (admin only)
  fastify.patch('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const userRequest = request as any;
    const { id } = request.params as { id: string };
    const data = updateCategorySchema.parse(request.body);

    const updateData: Record<string, unknown> = { ...data };

    // If name is being updated, regenerate slug
    if (data.name) {
      updateData.slug = slugify(data.name);
    }

    const category = await categoriesService.updateCategory(id, updateData);

    if (!category) {
      return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Category not found'));
    }

    await auditService.logAction({
      userId: userRequest.user.userId,
      action: 'CATEGORY_UPDATED',
      resource: AuditResources.CATEGORY,
      resourceId: id,
      details: { updatedFields: Object.keys(data) },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return success(category);
  });

  // DELETE /:id — delete category (admin only)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate],
  }, async (request, reply) => {
    const userRequest = request as any;
    const { id } = request.params as { id: string };

    const result = await categoriesService.deleteCategory(id);

    if (!result.deleted) {
      if (result.reason === 'NOT_FOUND') {
        return reply.status(404).send(error(ErrorCodes.NOT_FOUND, 'Category not found'));
      }
      if (result.reason === 'CATEGORY_HAS_POIS') {
        return reply.status(409).send(error(
          ErrorCodes.CONFLICT,
          `Cannot delete category: ${result.poiCount} POI(s) still assigned. Remove or reassign them first.`,
        ));
      }
    }

    await auditService.logAction({
      userId: userRequest.user.userId,
      action: 'CATEGORY_DELETED',
      resource: AuditResources.CATEGORY,
      resourceId: id,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return success({ message: 'Category deleted successfully' });
  });
}

// Separate route plugin for city-specific categories endpoint
export async function cityCategoriesRoutes(fastify: FastifyInstance) {
  // GET /cities/:cityId/categories — categories for a specific city (public)
  fastify.get('/cities/:cityId/categories', async (request) => {
    const { cityId } = request.params as { cityId: string };

    const categories = await categoriesService.getCategoriesForCity(cityId);

    return success(categories);
  });
}
