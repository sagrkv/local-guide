import { prisma } from '../../lib/prisma.js';

interface CreateRegionData {
  name: string;
  cities: string[];
  state?: string;
  country?: string;
  isActive?: boolean;
}

interface UpdateRegionData {
  name?: string;
  cities?: string[];
  state?: string;
  country?: string;
  isActive?: boolean;
}

export const regionsService = {
  async list() {
    return prisma.scrapingRegion.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { scrapeJobs: true },
        },
      },
    });
  },

  async getById(id: string) {
    return prisma.scrapingRegion.findUnique({
      where: { id },
      include: {
        _count: {
          select: { scrapeJobs: true },
        },
      },
    });
  },

  async getByName(name: string) {
    return prisma.scrapingRegion.findUnique({
      where: { name },
    });
  },

  async create(data: CreateRegionData) {
    return prisma.scrapingRegion.create({
      data,
      include: {
        _count: {
          select: { scrapeJobs: true },
        },
      },
    });
  },

  async update(id: string, data: UpdateRegionData) {
    try {
      return await prisma.scrapingRegion.update({
        where: { id },
        data,
        include: {
          _count: {
            select: { scrapeJobs: true },
          },
        },
      });
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return null;
      }
      throw error;
    }
  },

  async delete(id: string) {
    try {
      await prisma.scrapingRegion.delete({ where: { id } });
      return true;
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return false;
      }
      throw error;
    }
  },

  async toggleActive(id: string) {
    const region = await prisma.scrapingRegion.findUnique({ where: { id } });
    if (!region) return null;

    return prisma.scrapingRegion.update({
      where: { id },
      data: { isActive: !region.isActive },
      include: {
        _count: {
          select: { scrapeJobs: true },
        },
      },
    });
  },

  async getActiveRegions() {
    return prisma.scrapingRegion.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  },
};
