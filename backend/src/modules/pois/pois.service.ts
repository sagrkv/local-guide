import { prisma } from '../../lib/prisma.js';
import { Prisma, POIStatus, POIPriority } from '@prisma/client';
import { slugify } from '../../utils/slugify.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ListPOIsFilters {
  cityId: string;
  status?: POIStatus;
  categoryId?: string;
  priority?: POIPriority;
  tags?: string; // comma-separated slugs
  search?: string;
  bounds?: { northLat: number; southLat: number; eastLng: number; westLng: number };
  page: number;
  limit: number;
  isPublic: boolean; // when true, force status=PUBLISHED
}

export interface CreatePOIData {
  cityId: string;
  name: string;
  categoryId: string;
  latitude: number;
  longitude: number;
  shortDescription?: string;
  longDescription?: string;
  googlePlaceId?: string;
  subcategory?: string;
  estimatedTimeToSpend?: string;
  bestTimeToVisit?: string;
  bestSeason?: string;
  entryFee?: string;
  openingHours?: Prisma.InputJsonValue;
  dressCode?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  address?: string;
  directionsNote?: string;
  nearestLandmark?: string;
  parkingAvailable?: boolean;
  wheelchairAccessible?: boolean;
  petFriendly?: boolean;
  wifiAvailable?: boolean;
  familyFriendly?: boolean;
  budgetFriendly?: boolean;
  localTip?: string;
  warningNote?: string;
  priority?: POIPriority;
  iconOverride?: string;
  colorOverride?: string;
  sortOrder?: number;
  tags?: string[]; // tag IDs
}

export interface UpdatePOIData {
  name?: string;
  shortDescription?: string;
  longDescription?: string;
  latitude?: number;
  longitude?: number;
  googlePlaceId?: string;
  categoryId?: string;
  subcategory?: string;
  estimatedTimeToSpend?: string;
  bestTimeToVisit?: string;
  bestSeason?: string;
  entryFee?: string;
  openingHours?: Prisma.InputJsonValue;
  dressCode?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  address?: string;
  directionsNote?: string;
  nearestLandmark?: string;
  parkingAvailable?: boolean;
  wheelchairAccessible?: boolean;
  petFriendly?: boolean;
  wifiAvailable?: boolean;
  familyFriendly?: boolean;
  budgetFriendly?: boolean;
  localTip?: string;
  warningNote?: string;
  priority?: POIPriority;
  iconOverride?: string;
  colorOverride?: string;
  sortOrder?: number;
  tags?: string[]; // tag IDs
}

// ---------------------------------------------------------------------------
// Shared includes
// ---------------------------------------------------------------------------

const poiListInclude = {
  category: true,
  tags: { include: { tag: true } },
  photos: {
    where: { isPrimary: true },
    take: 1,
  },
} satisfies Prisma.POIInclude;

const poiDetailInclude = {
  category: true,
  tags: { include: { tag: true } },
  photos: { orderBy: { sortOrder: 'asc' as const } },
  curatedBy: {
    select: { id: true, name: true, email: true },
  },
} satisfies Prisma.POIInclude;

// ---------------------------------------------------------------------------
// Quality score calculator
// ---------------------------------------------------------------------------

function calculateQualityScore(poi: {
  name?: string | null;
  longDescription?: string | null;
  shortDescription?: string | null;
  photos?: { id: string }[];
  openingHours?: Prisma.JsonValue;
  phone?: string | null;
  website?: string | null;
  localTip?: string | null;
  categoryId?: string | null;
  address?: string | null;
  entryFee?: string | null;
  bestTimeToVisit?: string | null;
  tags?: { tagId: string }[] | { tag: { id: string } }[];
}): number {
  let score = 0;

  if (poi.name) score += 10;
  if (poi.longDescription || poi.shortDescription) score += 10;
  if (poi.photos && poi.photos.length > 0) score += 15;
  if (poi.openingHours) score += 10;
  if (poi.phone || poi.website) score += 10;
  if (poi.localTip) score += 10;
  if (poi.categoryId) score += 5;
  if (poi.address) score += 10;
  if (poi.entryFee) score += 5;
  if (poi.bestTimeToVisit) score += 5;
  if (poi.tags && poi.tags.length > 0) score += 10;

  return score;
}

// ---------------------------------------------------------------------------
// Helper: build Prisma-compatible unchecked create input
// ---------------------------------------------------------------------------

function buildUncheckedCreateInput(
  data: Omit<CreatePOIData, 'tags'>,
  slug: string,
): Prisma.POIUncheckedCreateInput {
  return {
    cityId: data.cityId,
    slug,
    name: data.name,
    categoryId: data.categoryId,
    latitude: data.latitude,
    longitude: data.longitude,
    shortDescription: data.shortDescription,
    longDescription: data.longDescription,
    googlePlaceId: data.googlePlaceId,
    subcategory: data.subcategory,
    estimatedTimeToSpend: data.estimatedTimeToSpend,
    bestTimeToVisit: data.bestTimeToVisit as any,
    bestSeason: data.bestSeason as any,
    entryFee: data.entryFee,
    openingHours: data.openingHours,
    dressCode: data.dressCode,
    phone: data.phone,
    website: data.website,
    instagram: data.instagram,
    address: data.address,
    directionsNote: data.directionsNote,
    nearestLandmark: data.nearestLandmark,
    parkingAvailable: data.parkingAvailable,
    wheelchairAccessible: data.wheelchairAccessible,
    petFriendly: data.petFriendly,
    wifiAvailable: data.wifiAvailable,
    familyFriendly: data.familyFriendly,
    budgetFriendly: data.budgetFriendly,
    localTip: data.localTip,
    warningNote: data.warningNote,
    priority: data.priority,
    iconOverride: data.iconOverride,
    colorOverride: data.colorOverride,
    sortOrder: data.sortOrder,
  };
}

function buildUncheckedUpdateInput(
  data: Omit<UpdatePOIData, 'tags'>,
  slug?: string,
): Prisma.POIUncheckedUpdateInput {
  const input: Prisma.POIUncheckedUpdateInput = {};

  if (data.name !== undefined) input.name = data.name;
  if (slug !== undefined) input.slug = slug;
  if (data.shortDescription !== undefined) input.shortDescription = data.shortDescription;
  if (data.longDescription !== undefined) input.longDescription = data.longDescription;
  if (data.latitude !== undefined) input.latitude = data.latitude;
  if (data.longitude !== undefined) input.longitude = data.longitude;
  if (data.googlePlaceId !== undefined) input.googlePlaceId = data.googlePlaceId;
  if (data.categoryId !== undefined) input.categoryId = data.categoryId;
  if (data.subcategory !== undefined) input.subcategory = data.subcategory;
  if (data.estimatedTimeToSpend !== undefined) input.estimatedTimeToSpend = data.estimatedTimeToSpend;
  if (data.bestTimeToVisit !== undefined) input.bestTimeToVisit = data.bestTimeToVisit as any;
  if (data.bestSeason !== undefined) input.bestSeason = data.bestSeason as any;
  if (data.entryFee !== undefined) input.entryFee = data.entryFee;
  if (data.openingHours !== undefined) input.openingHours = data.openingHours;
  if (data.dressCode !== undefined) input.dressCode = data.dressCode;
  if (data.phone !== undefined) input.phone = data.phone;
  if (data.website !== undefined) input.website = data.website;
  if (data.instagram !== undefined) input.instagram = data.instagram;
  if (data.address !== undefined) input.address = data.address;
  if (data.directionsNote !== undefined) input.directionsNote = data.directionsNote;
  if (data.nearestLandmark !== undefined) input.nearestLandmark = data.nearestLandmark;
  if (data.parkingAvailable !== undefined) input.parkingAvailable = data.parkingAvailable;
  if (data.wheelchairAccessible !== undefined) input.wheelchairAccessible = data.wheelchairAccessible;
  if (data.petFriendly !== undefined) input.petFriendly = data.petFriendly;
  if (data.wifiAvailable !== undefined) input.wifiAvailable = data.wifiAvailable;
  if (data.familyFriendly !== undefined) input.familyFriendly = data.familyFriendly;
  if (data.budgetFriendly !== undefined) input.budgetFriendly = data.budgetFriendly;
  if (data.localTip !== undefined) input.localTip = data.localTip;
  if (data.warningNote !== undefined) input.warningNote = data.warningNote;
  if (data.priority !== undefined) input.priority = data.priority;
  if (data.iconOverride !== undefined) input.iconOverride = data.iconOverride;
  if (data.colorOverride !== undefined) input.colorOverride = data.colorOverride;
  if (data.sortOrder !== undefined) input.sortOrder = data.sortOrder;

  return input;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const poisService = {
  calculateQualityScore,

  async listPOIs(filters: ListPOIsFilters) {
    const {
      cityId,
      status,
      categoryId,
      priority,
      tags,
      search,
      bounds,
      page,
      limit,
      isPublic,
    } = filters;

    const skip = (page - 1) * limit;
    const where: Prisma.POIWhereInput = { cityId };

    // Public consumers only see PUBLISHED
    if (isPublic) {
      where.status = 'PUBLISHED';
    } else if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (priority) {
      where.priority = priority;
    }

    // Tag filtering by slugs
    if (tags) {
      const tagSlugs = tags.split(',').map((s) => s.trim()).filter(Boolean);
      if (tagSlugs.length > 0) {
        where.tags = {
          some: {
            tag: { slug: { in: tagSlugs } },
          },
        };
      }
    }

    // Full-text search on name + description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { longDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Geo bounds
    if (bounds) {
      where.latitude = { gte: bounds.southLat, lte: bounds.northLat };
      where.longitude = { gte: bounds.westLng, lte: bounds.eastLng };
    }

    const [pois, total] = await Promise.all([
      prisma.pOI.findMany({
        where,
        include: poiListInclude,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.pOI.count({ where }),
    ]);

    return { pois, total };
  },

  async getPOIBySlug(cityId: string, slug: string) {
    return prisma.pOI.findUnique({
      where: { cityId_slug: { cityId, slug } },
      include: poiDetailInclude,
    });
  },

  async getPOIById(id: string) {
    return prisma.pOI.findUnique({
      where: { id },
      include: poiDetailInclude,
    });
  },

  async createPOI(data: CreatePOIData) {
    // Validate city exists
    const city = await prisma.city.findUnique({ where: { id: data.cityId }, select: { id: true } });
    if (!city) {
      return { error: 'CITY_NOT_FOUND' as const };
    }

    // Validate category exists
    const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } });
    if (!category) {
      return { error: 'CATEGORY_NOT_FOUND' as const };
    }

    // Generate slug and ensure uniqueness
    const baseSlug = slugify(data.name);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.pOI.findUnique({ where: { cityId_slug: { cityId: data.cityId, slug } }, select: { id: true } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const { tags: tagIds, ...rest } = data;
    const createInput = buildUncheckedCreateInput(rest, slug);

    // Add tag relations if provided
    if (tagIds && tagIds.length > 0) {
      (createInput as any).tags = { create: tagIds.map((tagId) => ({ tagId })) };
    }

    const poi = await prisma.pOI.create({
      data: createInput,
      include: poiDetailInclude,
    });

    // Calculate and set quality score
    const qualityScore = calculateQualityScore({
      ...poi,
      bestTimeToVisit: poi.bestTimeToVisit,
    });

    const updated = await prisma.pOI.update({
      where: { id: poi.id },
      data: { qualityScore },
      include: poiDetailInclude,
    });

    return { poi: updated };
  },

  async updatePOI(id: string, data: UpdatePOIData) {
    const { tags: tagIds, ...rest } = data;

    try {
      // If name changes, regenerate slug
      let newSlug: string | undefined;
      if (rest.name) {
        const existing = await prisma.pOI.findUnique({ where: { id }, select: { cityId: true } });
        if (existing) {
          const baseSlug = slugify(rest.name);
          let slug = baseSlug;
          let counter = 1;
          while (true) {
            const conflict = await prisma.pOI.findUnique({
              where: { cityId_slug: { cityId: existing.cityId, slug } },
              select: { id: true },
            });
            if (!conflict || conflict.id === id) break;
            slug = `${baseSlug}-${counter}`;
            counter++;
          }
          newSlug = slug;
        }
      }

      // Update tags if provided
      if (tagIds !== undefined) {
        await prisma.tagsOnPOIs.deleteMany({ where: { poiId: id } });
        if (tagIds.length > 0) {
          await prisma.tagsOnPOIs.createMany({
            data: tagIds.map((tagId) => ({ poiId: id, tagId })),
          });
        }
      }

      const updateInput = buildUncheckedUpdateInput(rest, newSlug);

      const poi = await prisma.pOI.update({
        where: { id },
        data: updateInput,
        include: poiDetailInclude,
      });

      return poi;
    } catch (err) {
      if ((err as any).code === 'P2025') {
        return null;
      }
      throw err;
    }
  },

  async deletePOI(id: string) {
    try {
      await prisma.pOI.delete({ where: { id } });
      return true;
    } catch (err) {
      if ((err as any).code === 'P2025') {
        return false;
      }
      throw err;
    }
  },

  async updatePOIStatus(
    id: string,
    status: POIStatus,
    userId?: string,
    rejectionReason?: string,
  ) {
    const updateData: Prisma.POIUncheckedUpdateInput = { status };

    if (status === 'APPROVED') {
      updateData.humanApprovedAt = new Date();
      if (userId) {
        updateData.curatedById = userId;
      }
    }

    if (status === 'ARCHIVED' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    try {
      return await prisma.pOI.update({
        where: { id },
        data: updateData,
        include: poiDetailInclude,
      });
    } catch (err) {
      if ((err as any).code === 'P2025') {
        return null;
      }
      throw err;
    }
  },

  async getReviewQueue(cityId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where: Prisma.POIWhereInput = {
      cityId,
      status: { in: ['AI_SUGGESTED', 'UNDER_REVIEW'] },
    };

    const [pois, total] = await Promise.all([
      prisma.pOI.findMany({
        where,
        include: poiListInclude,
        orderBy: { qualityScore: 'desc' },
        skip,
        take: limit,
      }),
      prisma.pOI.count({ where }),
    ]);

    return { pois, total };
  },

  async approvePOI(id: string, userId: string) {
    try {
      return await prisma.pOI.update({
        where: { id },
        data: {
          status: 'APPROVED',
          humanApprovedAt: new Date(),
          curatedById: userId,
        },
        include: poiDetailInclude,
      });
    } catch (err) {
      if ((err as any).code === 'P2025') {
        return null;
      }
      throw err;
    }
  },

  async rejectPOI(id: string, rejectionReason: string) {
    try {
      return await prisma.pOI.update({
        where: { id },
        data: {
          status: 'ARCHIVED',
          rejectionReason,
        },
        include: poiDetailInclude,
      });
    } catch (err) {
      if ((err as any).code === 'P2025') {
        return null;
      }
      throw err;
    }
  },

  async publishPOI(id: string) {
    const poi = await prisma.pOI.findUnique({
      where: { id },
      include: { photos: true },
    });

    if (!poi) {
      return { error: 'NOT_FOUND' as const };
    }

    // Validate publish requirements
    const errors: string[] = [];
    if (!poi.name) errors.push('name is required');
    if (!poi.categoryId) errors.push('categoryId is required');
    if (poi.latitude === null || poi.latitude === undefined) errors.push('latitude is required');
    if (poi.longitude === null || poi.longitude === undefined) errors.push('longitude is required');
    if (poi.photos.length === 0) errors.push('at least 1 photo is required');

    if (errors.length > 0) {
      return { error: 'VALIDATION_FAILED' as const, details: errors };
    }

    const updated = await prisma.pOI.update({
      where: { id },
      data: { status: 'PUBLISHED' },
      include: poiDetailInclude,
    });

    return { poi: updated };
  },

  async getPOIStats(cityId: string) {
    const statuses: POIStatus[] = ['AI_SUGGESTED', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'];

    const counts = await Promise.all(
      statuses.map(async (status) => {
        const count = await prisma.pOI.count({ where: { cityId, status } });
        return { status, count };
      }),
    );

    const total = counts.reduce((sum, c) => sum + c.count, 0);

    return { cityId, total, byStatus: counts };
  },

  async getRandomPOI(cityId: string) {
    const count = await prisma.pOI.count({ where: { cityId, status: 'PUBLISHED' } });
    if (count === 0) return null;

    const skip = Math.floor(Math.random() * count);

    const pois = await prisma.pOI.findMany({
      where: { cityId, status: 'PUBLISHED' },
      include: poiDetailInclude,
      skip,
      take: 1,
    });

    return pois[0] ?? null;
  },

  async recalculateQualityScore(id: string) {
    const poi = await prisma.pOI.findUnique({
      where: { id },
      include: { photos: { select: { id: true } }, tags: { select: { tagId: true } } },
    });

    if (!poi) return null;

    const score = calculateQualityScore({
      ...poi,
      bestTimeToVisit: poi.bestTimeToVisit,
    });

    return prisma.pOI.update({
      where: { id },
      data: { qualityScore: score },
      select: { id: true, qualityScore: true },
    });
  },

  // GeoJSON for published POIs
  async getGeoJSON(
    citySlug: string,
    filters?: { category?: string; priority?: string; tags?: string; bounds?: { northLat: number; southLat: number; eastLng: number; westLng: number } },
  ) {
    const city = await prisma.city.findUnique({ where: { slug: citySlug }, select: { id: true } });
    if (!city) return null;

    const where: Prisma.POIWhereInput = {
      cityId: city.id,
      status: 'PUBLISHED',
    };

    if (filters?.category) {
      where.category = { slug: filters.category };
    }

    if (filters?.priority) {
      where.priority = filters.priority as POIPriority;
    }

    if (filters?.tags) {
      const tagSlugs = filters.tags.split(',').map((s) => s.trim()).filter(Boolean);
      if (tagSlugs.length > 0) {
        where.tags = { some: { tag: { slug: { in: tagSlugs } } } };
      }
    }

    if (filters?.bounds) {
      where.latitude = { gte: filters.bounds.southLat, lte: filters.bounds.northLat };
      where.longitude = { gte: filters.bounds.westLng, lte: filters.bounds.eastLng };
    }

    const pois = await prisma.pOI.findMany({
      where,
      include: {
        category: true,
        photos: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return {
      type: 'FeatureCollection' as const,
      features: pois.map((poi) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [poi.longitude, poi.latitude],
        },
        properties: {
          id: poi.id,
          name: poi.name,
          slug: poi.slug,
          shortDescription: poi.shortDescription,
          category: poi.category.slug,
          categoryIcon: poi.category.icon,
          categoryColor: poi.category.color,
          priority: poi.priority,
          primaryPhotoUrl: poi.photos.find((p) => p.isPrimary)?.url ?? poi.photos[0]?.url ?? null,
          estimatedTimeToSpend: poi.estimatedTimeToSpend,
        },
      })),
    };
  },
};
