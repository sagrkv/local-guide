import { prisma } from '../../lib/prisma.js';

interface CreateSavedRegionParams {
  userId: string;
  name: string;
  southwestLat: number;
  southwestLng: number;
  northeastLat: number;
  northeastLng: number;
}

interface UpdateSavedRegionParams {
  name?: string;
}

interface ListSavedRegionsParams {
  userId: string;
  limit?: number;
  offset?: number;
  sortBy?: 'lastUsed' | 'timesUsed' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export const savedRegionsService = {
  /**
   * List all saved regions for a user
   */
  async list(params: ListSavedRegionsParams) {
    const {
      userId,
      limit = 50,
      offset = 0,
      sortBy = 'lastUsed',
      sortOrder = 'desc'
    } = params;

    const [regions, total] = await Promise.all([
      prisma.savedRegion.findMany({
        where: { userId },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      }),
      prisma.savedRegion.count({ where: { userId } }),
    ]);

    return {
      regions,
      total,
      limit,
      offset,
    };
  },

  /**
   * Get a single saved region by ID
   * Returns null if not found or doesn't belong to user
   */
  async getById(id: string, userId: string) {
    const region = await prisma.savedRegion.findFirst({
      where: { id, userId },
    });

    return region;
  },

  /**
   * Create a new saved region
   */
  async create(params: CreateSavedRegionParams) {
    const { userId, name, southwestLat, southwestLng, northeastLat, northeastLng } = params;

    // Validate region name
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Region name is required');
    }
    if (trimmedName.length > 100) {
      throw new Error('Region name must be 100 characters or less');
    }

    // Validate coordinate bounds
    if (southwestLat < -90 || southwestLat > 90) {
      throw new Error('Southwest latitude must be between -90 and 90');
    }
    if (northeastLat < -90 || northeastLat > 90) {
      throw new Error('Northeast latitude must be between -90 and 90');
    }
    if (southwestLng < -180 || southwestLng > 180) {
      throw new Error('Southwest longitude must be between -180 and 180');
    }
    if (northeastLng < -180 || northeastLng > 180) {
      throw new Error('Northeast longitude must be between -180 and 180');
    }

    // Validate coordinate order (southwest must be less than northeast)
    if (southwestLat >= northeastLat) {
      throw new Error('Invalid region bounds: southwest latitude must be less than northeast latitude');
    }
    if (southwestLng >= northeastLng) {
      throw new Error('Invalid region bounds: southwest longitude must be less than northeast longitude');
    }

    // Validate region size (not too small or too large)
    const latDiff = northeastLat - southwestLat;
    const lngDiff = northeastLng - southwestLng;
    if (latDiff < 0.001 || lngDiff < 0.001) {
      throw new Error('Region is too small. Please select a larger area.');
    }
    if (latDiff > 10 || lngDiff > 10) {
      throw new Error('Region is too large. Please select a smaller area.');
    }

    const region = await prisma.savedRegion.create({
      data: {
        userId,
        name: trimmedName,
        southwestLat,
        southwestLng,
        northeastLat,
        northeastLng,
      },
    });

    return region;
  },

  /**
   * Update a saved region's name
   */
  async update(id: string, userId: string, params: UpdateSavedRegionParams) {
    // First verify the region belongs to the user
    const existing = await prisma.savedRegion.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    const updateData: Record<string, unknown> = {};
    if (params.name !== undefined) {
      updateData.name = params.name.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return existing;
    }

    const region = await prisma.savedRegion.update({
      where: { id },
      data: updateData,
    });

    return region;
  },

  /**
   * Delete a saved region
   */
  async delete(id: string, userId: string): Promise<boolean> {
    // First verify the region belongs to the user
    const existing = await prisma.savedRegion.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return false;
    }

    await prisma.savedRegion.delete({
      where: { id },
    });

    return true;
  },

  /**
   * Mark a region as used (updates lastUsed and increments timesUsed)
   */
  async markAsUsed(id: string, userId: string) {
    // First verify the region belongs to the user
    const existing = await prisma.savedRegion.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    const region = await prisma.savedRegion.update({
      where: { id },
      data: {
        lastUsed: new Date(),
        timesUsed: { increment: 1 },
      },
    });

    return region;
  },

  /**
   * Get the most frequently used regions for a user
   */
  async getMostUsed(userId: string, limit: number = 5) {
    const regions = await prisma.savedRegion.findMany({
      where: { userId },
      orderBy: { timesUsed: 'desc' },
      take: limit,
    });

    return regions;
  },

  /**
   * Get the most recently used regions for a user
   */
  async getRecentlyUsed(userId: string, limit: number = 5) {
    const regions = await prisma.savedRegion.findMany({
      where: { userId },
      orderBy: { lastUsed: 'desc' },
      take: limit,
    });

    return regions;
  },
};
