import { prisma } from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';

export interface ListCategoriesFilters {
  cityId?: string;
  isGlobal?: boolean;
  page: number;
  limit: number;
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  emoji?: string;
  isGlobal?: boolean;
  cityId?: string;
  sortOrder?: number;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  icon?: string;
  color?: string;
  emoji?: string;
  isGlobal?: boolean;
  cityId?: string;
  sortOrder?: number;
}

export const categoriesService = {
  async listCategories(filters: ListCategoriesFilters) {
    const { cityId, isGlobal, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {};

    if (cityId && typeof isGlobal === 'undefined') {
      // For a city context, return global + city-specific
      where.OR = [
        { isGlobal: true },
        { cityId },
      ];
    } else {
      if (typeof isGlobal === 'boolean') {
        where.isGlobal = isGlobal;
      }
      if (cityId) {
        where.cityId = cityId;
      }
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: {
          _count: {
            select: { pois: true },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.category.count({ where }),
    ]);

    return { categories, total };
  },

  async getCategoryById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { pois: true },
        },
      },
    });
  },

  async getCategoryBySlugAndCity(slug: string, cityId: string | null) {
    return prisma.category.findUnique({
      where: {
        slug_cityId: {
          slug,
          cityId: cityId ?? '',
        },
      },
      select: { id: true },
    });
  },

  async createCategory(data: CreateCategoryData) {
    return prisma.category.create({
      data,
      include: {
        _count: {
          select: { pois: true },
        },
      },
    });
  },

  async updateCategory(id: string, data: UpdateCategoryData) {
    try {
      return await prisma.category.update({
        where: { id },
        data,
        include: {
          _count: {
            select: { pois: true },
          },
        },
      });
    } catch (err) {
      if ((err as any).code === 'P2025') {
        return null;
      }
      throw err;
    }
  },

  async deleteCategory(id: string) {
    // Check for POIs first
    const poiCount = await prisma.pOI.count({ where: { categoryId: id } });

    if (poiCount > 0) {
      return { deleted: false, reason: 'CATEGORY_HAS_POIS', poiCount };
    }

    try {
      await prisma.category.delete({ where: { id } });
      return { deleted: true };
    } catch (err) {
      if ((err as any).code === 'P2025') {
        return { deleted: false, reason: 'NOT_FOUND' };
      }
      throw err;
    }
  },

  async getCategoriesForCity(cityId: string) {
    return prisma.category.findMany({
      where: {
        OR: [
          { isGlobal: true },
          { cityId },
        ],
      },
      include: {
        _count: {
          select: { pois: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  },
};
