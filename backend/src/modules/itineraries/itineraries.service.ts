import { prisma } from '../../lib/prisma.js';
import { ContentStatus, Prisma } from '@prisma/client';
import { slugify } from '../../utils/slugify.js';

interface ListItinerariesFilters {
  status?: ContentStatus;
  page: number;
  limit: number;
}

interface CreateItineraryData {
  cityId: string;
  title: string;
  description?: string;
  duration: string;
  coverImageUrl?: string;
  difficulty?: string;
  estimatedBudget?: string;
  createdById: string;
}

interface UpdateItineraryData {
  title?: string;
  description?: string;
  duration?: string;
  coverImageUrl?: string;
  difficulty?: string;
  estimatedBudget?: string;
  status?: ContentStatus;
  sortOrder?: number;
}

interface AddStopData {
  poiId: string;
  order: number;
  timeOfDay?: string;
  duration?: string;
  note?: string;
  transportToNext?: string;
  transportNote?: string;
}

interface UpdateStopData {
  timeOfDay?: string;
  duration?: string;
  note?: string;
  transportToNext?: string;
  transportNote?: string;
}

const poiSelectForStop = {
  id: true,
  name: true,
  slug: true,
  latitude: true,
  longitude: true,
  shortDescription: true,
  photos: {
    where: { isPrimary: true },
    take: 1,
    select: {
      id: true,
      url: true,
      caption: true,
    },
  },
} as const;

export const itinerariesService = {
  async listItineraries(cityId: string, filters: ListItinerariesFilters) {
    const { status, page, limit } = filters;

    const where: Prisma.ItineraryWhereInput = { cityId };
    if (status) {
      where.status = status;
    } else {
      where.status = 'PUBLISHED';
    }

    const skip = (page - 1) * limit;

    const [itineraries, total] = await Promise.all([
      prisma.itinerary.findMany({
        where,
        include: {
          _count: {
            select: { stops: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      prisma.itinerary.count({ where }),
    ]);

    return { data: itineraries, total };
  },

  async getItineraryBySlug(cityId: string, slug: string) {
    return prisma.itinerary.findUnique({
      where: { cityId_slug: { cityId, slug } },
      include: {
        stops: {
          orderBy: { order: 'asc' },
          include: {
            poi: { select: poiSelectForStop },
          },
        },
        _count: {
          select: { stops: true },
        },
      },
    });
  },

  async getItineraryById(id: string) {
    return prisma.itinerary.findUnique({
      where: { id },
      include: {
        stops: {
          orderBy: { order: 'asc' },
          include: {
            poi: { select: poiSelectForStop },
          },
        },
        _count: {
          select: { stops: true },
        },
      },
    });
  },

  async createItinerary(data: CreateItineraryData) {
    const slug = slugify(data.title);

    return prisma.itinerary.create({
      data: {
        cityId: data.cityId,
        title: data.title,
        slug,
        description: data.description,
        duration: data.duration,
        coverImageUrl: data.coverImageUrl,
        difficulty: data.difficulty,
        estimatedBudget: data.estimatedBudget,
        createdById: data.createdById,
      },
      include: {
        _count: {
          select: { stops: true },
        },
      },
    });
  },

  async updateItinerary(id: string, data: UpdateItineraryData) {
    const updateData: Prisma.ItineraryUpdateInput = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
      updateData.slug = slugify(data.title);
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.coverImageUrl !== undefined) updateData.coverImageUrl = data.coverImageUrl;
    if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
    if (data.estimatedBudget !== undefined) updateData.estimatedBudget = data.estimatedBudget;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    try {
      return await prisma.itinerary.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: { stops: true },
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

  async deleteItinerary(id: string) {
    try {
      await prisma.itinerary.delete({ where: { id } });
      return true;
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return false;
      }
      throw error;
    }
  },

  async addStop(itineraryId: string, data: AddStopData) {
    // Validate POI exists and is PUBLISHED or APPROVED
    const poi = await prisma.pOI.findUnique({
      where: { id: data.poiId },
      select: { id: true, status: true },
    });

    if (!poi) {
      throw new Error('POI not found');
    }

    if (poi.status !== 'PUBLISHED' && poi.status !== 'APPROVED') {
      throw new Error('POI must be PUBLISHED or APPROVED');
    }

    return prisma.itineraryStop.create({
      data: {
        itineraryId,
        poiId: data.poiId,
        order: data.order,
        timeOfDay: (data.timeOfDay as any) || 'ANY_TIME',
        duration: data.duration,
        note: data.note,
        transportToNext: (data.transportToNext as any) || 'NONE',
        transportNote: data.transportNote,
      },
      include: {
        poi: { select: poiSelectForStop },
      },
    });
  },

  async updateStop(stopId: string, data: UpdateStopData) {
    const updateData: Prisma.ItineraryStopUpdateInput = {};

    if (data.timeOfDay !== undefined) updateData.timeOfDay = data.timeOfDay as any;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.note !== undefined) updateData.note = data.note;
    if (data.transportToNext !== undefined) updateData.transportToNext = data.transportToNext as any;
    if (data.transportNote !== undefined) updateData.transportNote = data.transportNote;

    try {
      return await prisma.itineraryStop.update({
        where: { id: stopId },
        data: updateData,
        include: {
          poi: { select: poiSelectForStop },
        },
      });
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return null;
      }
      throw error;
    }
  },

  async removeStop(stopId: string) {
    // Get the stop before deleting to know its itinerary and order
    const stop = await prisma.itineraryStop.findUnique({
      where: { id: stopId },
      select: { itineraryId: true, order: true },
    });

    if (!stop) {
      return false;
    }

    await prisma.$transaction(async (tx) => {
      // Delete the stop
      await tx.itineraryStop.delete({ where: { id: stopId } });

      // Reorder remaining stops to close the gap
      const remainingStops = await tx.itineraryStop.findMany({
        where: { itineraryId: stop.itineraryId },
        orderBy: { order: 'asc' },
        select: { id: true },
      });

      for (let i = 0; i < remainingStops.length; i++) {
        await tx.itineraryStop.update({
          where: { id: remainingStops[i].id },
          data: { order: i + 1 },
        });
      }
    });

    return true;
  },

  async reorderStops(itineraryId: string, stopIds: string[]) {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < stopIds.length; i++) {
        await tx.itineraryStop.update({
          where: { id: stopIds[i] },
          data: { order: i + 1 },
        });
      }
    });

    return prisma.itineraryStop.findMany({
      where: { itineraryId },
      orderBy: { order: 'asc' },
      include: {
        poi: { select: poiSelectForStop },
      },
    });
  },
};
