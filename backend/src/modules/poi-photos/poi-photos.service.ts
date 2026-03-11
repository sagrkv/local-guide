import { prisma } from '../../lib/prisma.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AddPhotoData {
  url: string;
  caption?: string;
  source?: string;
  isPrimary?: boolean;
}

export interface UpdatePhotoData {
  url?: string;
  caption?: string;
  source?: string;
  isPrimary?: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const poiPhotosService = {
  async listPhotos(poiId: string) {
    return prisma.pOIPhoto.findMany({
      where: { poiId },
      orderBy: { sortOrder: 'asc' },
    });
  },

  async addPhoto(poiId: string, data: AddPhotoData) {
    // Verify POI exists
    const poi = await prisma.pOI.findUnique({ where: { id: poiId }, select: { id: true } });
    if (!poi) {
      return { error: 'POI_NOT_FOUND' as const };
    }

    // If this photo should be primary, unset previous primary
    if (data.isPrimary) {
      await prisma.pOIPhoto.updateMany({
        where: { poiId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    // Determine next sort order
    const maxSort = await prisma.pOIPhoto.findFirst({
      where: { poiId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const nextSortOrder = (maxSort?.sortOrder ?? -1) + 1;

    const photo = await prisma.pOIPhoto.create({
      data: {
        poiId,
        url: data.url,
        caption: data.caption,
        source: data.source,
        isPrimary: data.isPrimary ?? false,
        sortOrder: nextSortOrder,
      },
    });

    return { photo };
  },

  async updatePhoto(id: string, data: UpdatePhotoData) {
    // If setting as primary, unset others for same POI
    if (data.isPrimary) {
      const photo = await prisma.pOIPhoto.findUnique({ where: { id }, select: { poiId: true } });
      if (photo) {
        await prisma.pOIPhoto.updateMany({
          where: { poiId: photo.poiId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
    }

    try {
      return await prisma.pOIPhoto.update({
        where: { id },
        data,
      });
    } catch (err) {
      if ((err as any).code === 'P2025') {
        return null;
      }
      throw err;
    }
  },

  async deletePhoto(id: string) {
    try {
      await prisma.pOIPhoto.delete({ where: { id } });
      return true;
    } catch (err) {
      if ((err as any).code === 'P2025') {
        return false;
      }
      throw err;
    }
  },

  async reorderPhotos(poiId: string, photoIds: string[]) {
    // Verify all photo IDs belong to this POI
    const photos = await prisma.pOIPhoto.findMany({
      where: { poiId },
      select: { id: true },
    });

    const existingIds = new Set(photos.map((p) => p.id));
    const invalidIds = photoIds.filter((id) => !existingIds.has(id));

    if (invalidIds.length > 0) {
      return { error: 'INVALID_PHOTO_IDS' as const, invalidIds };
    }

    // Batch update sort orders
    await prisma.$transaction(
      photoIds.map((id, index) =>
        prisma.pOIPhoto.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return { success: true };
  },

  async setPrimary(id: string) {
    const photo = await prisma.pOIPhoto.findUnique({ where: { id }, select: { poiId: true } });
    if (!photo) return null;

    // Unset previous primary
    await prisma.pOIPhoto.updateMany({
      where: { poiId: photo.poiId, isPrimary: true },
      data: { isPrimary: false },
    });

    return prisma.pOIPhoto.update({
      where: { id },
      data: { isPrimary: true },
    });
  },
};
