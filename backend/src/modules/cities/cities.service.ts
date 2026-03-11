import { prisma } from '../../lib/prisma.js';
import { Prisma, CityStatus } from '@prisma/client';

export interface ListCitiesFilters {
  status?: CityStatus;
  search?: string;
  page: number;
  limit: number;
}

export interface CreateCityData {
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  country?: string;
  state?: string;
  heroImageUrl?: string;
  ogImageUrl?: string;
  centerLat: number;
  centerLng: number;
  defaultZoom?: number;
  boundsNorthLat?: number;
  boundsSouthLat?: number;
  boundsEastLng?: number;
  boundsWestLng?: number;
  timezone?: string;
  currency?: string;
  language?: string;
  status?: CityStatus;
  sortOrder?: number;
}

export interface UpdateCityData {
  name?: string;
  slug?: string;
  tagline?: string;
  description?: string;
  country?: string;
  state?: string;
  heroImageUrl?: string;
  ogImageUrl?: string;
  centerLat?: number;
  centerLng?: number;
  defaultZoom?: number;
  boundsNorthLat?: number;
  boundsSouthLat?: number;
  boundsEastLng?: number;
  boundsWestLng?: number;
  timezone?: string;
  currency?: string;
  language?: string;
  sortOrder?: number;
}

export const citiesService = {
  async listCities(filters: ListCitiesFilters) {
    const { status, search, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.CityWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tagline: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [cities, total] = await Promise.all([
      prisma.city.findMany({
        where,
        include: {
          theme: true,
          _count: {
            select: {
              pois: true,
              itineraries: true,
              collections: true,
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.city.count({ where }),
    ]);

    return { cities, total };
  },

  async getCityBySlug(slug: string) {
    return prisma.city.findUnique({
      where: { slug },
      include: {
        theme: true,
        _count: {
          select: {
            pois: true,
            itineraries: true,
            collections: true,
          },
        },
      },
    });
  },

  async getCityById(id: string) {
    return prisma.city.findUnique({
      where: { id },
      include: {
        theme: true,
      },
    });
  },

  async getCityByName(name: string) {
    return prisma.city.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
  },

  async getCityBySlugExact(slug: string) {
    return prisma.city.findUnique({
      where: { slug },
      select: { id: true },
    });
  },

  async createCity(data: CreateCityData) {
    return prisma.city.create({
      data,
      include: {
        theme: true,
      },
    });
  },

  async updateCity(id: string, data: UpdateCityData) {
    try {
      return await prisma.city.update({
        where: { id },
        data,
        include: {
          theme: true,
        },
      });
    } catch (err) {
      if ((err as any).code === 'P2025') {
        return null;
      }
      throw err;
    }
  },

  async deleteCity(id: string) {
    // Check for POIs first
    const poiCount = await prisma.pOI.count({ where: { cityId: id } });

    if (poiCount > 0) {
      return { deleted: false, reason: 'CITY_HAS_POIS', poiCount };
    }

    try {
      await prisma.city.delete({ where: { id } });
      return { deleted: true };
    } catch (err) {
      if ((err as any).code === 'P2025') {
        return { deleted: false, reason: 'NOT_FOUND' };
      }
      throw err;
    }
  },

  async updateCityStatus(id: string, status: CityStatus) {
    try {
      return await prisma.city.update({
        where: { id },
        data: { status },
        include: {
          theme: true,
        },
      });
    } catch (err) {
      if ((err as any).code === 'P2025') {
        return null;
      }
      throw err;
    }
  },
};
