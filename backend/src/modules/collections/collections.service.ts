import { prisma } from '../../lib/prisma.js';
import { ContentStatus, Prisma } from '@prisma/client';
import { slugify } from '../../utils/slugify.js';

interface ListCollectionsFilters {
  status?: ContentStatus;
  page: number;
  limit: number;
}

interface CreateCollectionData {
  cityId: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  createdById: string;
}

interface UpdateCollectionData {
  title?: string;
  description?: string;
  coverImageUrl?: string;
  status?: ContentStatus;
  sortOrder?: number;
}

interface AddItemData {
  poiId: string;
  order: number;
  note?: string;
}

const poiSelectForItem = {
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

export const collectionsService = {
  async listCollections(cityId: string, filters: ListCollectionsFilters) {
    const { status, page, limit } = filters;

    const where: Prisma.CollectionWhereInput = { cityId };
    if (status) {
      where.status = status;
    } else {
      where.status = 'PUBLISHED';
    }

    const skip = (page - 1) * limit;

    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        include: {
          _count: {
            select: { items: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      prisma.collection.count({ where }),
    ]);

    return { data: collections, total };
  },

  async getCollectionBySlug(cityId: string, slug: string) {
    return prisma.collection.findUnique({
      where: { cityId_slug: { cityId, slug } },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            poi: { select: poiSelectForItem },
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });
  },

  async getCollectionById(id: string) {
    return prisma.collection.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            poi: { select: poiSelectForItem },
          },
        },
        _count: {
          select: { items: true },
        },
      },
    });
  },

  async createCollection(data: CreateCollectionData) {
    const slug = slugify(data.title);

    return prisma.collection.create({
      data: {
        cityId: data.cityId,
        title: data.title,
        slug,
        description: data.description,
        coverImageUrl: data.coverImageUrl,
        createdById: data.createdById,
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
  },

  async updateCollection(id: string, data: UpdateCollectionData) {
    const updateData: Prisma.CollectionUpdateInput = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
      updateData.slug = slugify(data.title);
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.coverImageUrl !== undefined) updateData.coverImageUrl = data.coverImageUrl;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    try {
      return await prisma.collection.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: { items: true },
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

  async deleteCollection(id: string) {
    try {
      await prisma.collection.delete({ where: { id } });
      return true;
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return false;
      }
      throw error;
    }
  },

  async addItem(collectionId: string, data: AddItemData) {
    // Validate POI exists
    const poi = await prisma.pOI.findUnique({
      where: { id: data.poiId },
      select: { id: true },
    });

    if (!poi) {
      throw new Error('POI not found');
    }

    // Prevent duplicate POI in same collection
    const existingItem = await prisma.collectionItem.findUnique({
      where: { collectionId_poiId: { collectionId, poiId: data.poiId } },
    });

    if (existingItem) {
      throw new Error('POI already exists in this collection');
    }

    return prisma.collectionItem.create({
      data: {
        collectionId,
        poiId: data.poiId,
        order: data.order,
        note: data.note,
      },
      include: {
        poi: { select: poiSelectForItem },
      },
    });
  },

  async removeItem(itemId: string) {
    const item = await prisma.collectionItem.findUnique({
      where: { id: itemId },
      select: { collectionId: true, order: true },
    });

    if (!item) {
      return false;
    }

    await prisma.$transaction(async (tx) => {
      await tx.collectionItem.delete({ where: { id: itemId } });

      // Reorder remaining items to close the gap
      const remainingItems = await tx.collectionItem.findMany({
        where: { collectionId: item.collectionId },
        orderBy: { order: 'asc' },
        select: { id: true },
      });

      for (let i = 0; i < remainingItems.length; i++) {
        await tx.collectionItem.update({
          where: { id: remainingItems[i].id },
          data: { order: i + 1 },
        });
      }
    });

    return true;
  },

  async reorderItems(collectionId: string, itemIds: string[]) {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < itemIds.length; i++) {
        await tx.collectionItem.update({
          where: { id: itemIds[i] },
          data: { order: i + 1 },
        });
      }
    });

    return prisma.collectionItem.findMany({
      where: { collectionId },
      orderBy: { order: 'asc' },
      include: {
        poi: { select: poiSelectForItem },
      },
    });
  },
};
