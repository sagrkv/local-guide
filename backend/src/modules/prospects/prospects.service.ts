import { prisma } from "../../lib/prisma.js";
import { Prisma, ProspectStatus, LeadCategory } from "@prisma/client";

interface ProspectFilters {
  userId: string; // Required for multi-tenancy
  page?: number;
  limit?: number;
  scrapeJobId?: string;
  city?: string;
  category?: string;
  hasWebsite?: boolean;
  minScore?: number;
  maxScore?: number;
  search?: string;
  sortBy?: "createdAt" | "score" | "businessName" | "city";
  sortOrder?: "asc" | "desc";
  dateFrom?: string;
  dateTo?: string;
}

export const prospectsService = {
  async list(filters: ProspectFilters) {
    const {
      userId,
      page = 1,
      limit = 50,
      scrapeJobId,
      city,
      category,
      hasWebsite,
      minScore,
      maxScore,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      dateFrom,
      dateTo,
    } = filters;

    // CRITICAL: Always filter by userId for multi-tenancy data isolation
    const where: Prisma.LeadWhereInput = {
      userId, // Multi-tenancy: users only see their own prospects
      prospectStatus: ProspectStatus.PROSPECT,
      ...(scrapeJobId && { scrapeJobId }),
      ...(city && { city: { equals: city, mode: "insensitive" } }),
      ...(category && { category: category as LeadCategory }),
      ...(hasWebsite !== undefined && { hasWebsite }),
      ...(minScore !== undefined && { score: { gte: minScore } }),
      ...(maxScore !== undefined && {
        score: { ...(minScore !== undefined ? { gte: minScore } : {}), lte: maxScore },
      }),
      ...(search && {
        OR: [
          { businessName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
      ...(dateTo && {
        createdAt: {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          lte: new Date(dateTo),
        },
      }),
    };

    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          scrapeJob: {
            select: { id: true, query: true, location: true, createdAt: true },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string, userId: string) {
    // CRITICAL: Always include userId check for multi-tenancy (prevents enumeration)
    return prisma.lead.findFirst({
      where: { id, userId },
      include: {
        scrapeJob: {
          select: { id: true, query: true, location: true, createdAt: true },
        },
      },
    });
  },

  async promote(id: string, userId: string) {
    // CRITICAL: Verify ownership before update (prevents enumeration)
    const prospect = await prisma.lead.findFirst({ where: { id, userId } });
    if (!prospect) return null;

    return prisma.lead.update({
      where: { id },
      data: {
        prospectStatus: ProspectStatus.LEAD,
        promotedAt: new Date(),
        promotedById: userId,
        reviewedAt: new Date(),
        stage: "NEW",
      },
    });
  },

  async markNotInterested(id: string, userId: string, reason?: string) {
    // CRITICAL: Verify ownership before update (prevents enumeration)
    const prospect = await prisma.lead.findFirst({ where: { id, userId } });
    if (!prospect) return null;

    return prisma.lead.update({
      where: { id },
      data: {
        prospectStatus: ProspectStatus.NOT_INTERESTED,
        reviewedAt: new Date(),
        notInterestedReason: reason,
      },
    });
  },

  async archive(id: string, userId: string) {
    // CRITICAL: Verify ownership before update (prevents enumeration)
    const prospect = await prisma.lead.findFirst({ where: { id, userId } });
    if (!prospect) return null;

    return prisma.lead.update({
      where: { id },
      data: { prospectStatus: ProspectStatus.ARCHIVED },
    });
  },

  async delete(id: string, userId: string) {
    // CRITICAL: Verify ownership before deletion (prevents enumeration)
    const prospect = await prisma.lead.findFirst({ where: { id, userId } });
    if (!prospect) return null;

    return prisma.lead.delete({
      where: { id },
    });
  },

  async bulkPromote(ids: string[], userId: string) {
    // CRITICAL: Only update prospects that belong to this user
    return prisma.lead.updateMany({
      where: {
        id: { in: ids },
        userId, // Multi-tenancy: users can only bulk update their own prospects
        prospectStatus: ProspectStatus.PROSPECT,
      },
      data: {
        prospectStatus: ProspectStatus.LEAD,
        promotedAt: new Date(),
        promotedById: userId,
        reviewedAt: new Date(),
        stage: "NEW",
      },
    });
  },

  async bulkDelete(ids: string[], userId: string) {
    // CRITICAL: Only delete prospects that belong to this user
    return prisma.lead.deleteMany({
      where: {
        id: { in: ids },
        userId, // Multi-tenancy: users can only bulk delete their own prospects
        prospectStatus: ProspectStatus.PROSPECT,
      },
    });
  },

  async bulkMarkNotInterested(ids: string[], userId: string, reason?: string) {
    // CRITICAL: Only update prospects that belong to this user
    return prisma.lead.updateMany({
      where: {
        id: { in: ids },
        userId, // Multi-tenancy: users can only bulk update their own prospects
        prospectStatus: ProspectStatus.PROSPECT,
      },
      data: {
        prospectStatus: ProspectStatus.NOT_INTERESTED,
        reviewedAt: new Date(),
        notInterestedReason: reason,
      },
    });
  },

  async getStats(userId: string) {
    // CRITICAL: All stats should be filtered by userId for multi-tenancy
    const userFilter = { userId };

    const [
      totalProspects,
      totalLeads,
      totalNotInterested,
      totalArchived,
      byCategory,
      byScrapeJob,
    ] = await Promise.all([
      prisma.lead.count({ where: { ...userFilter, prospectStatus: ProspectStatus.PROSPECT } }),
      prisma.lead.count({ where: { ...userFilter, prospectStatus: ProspectStatus.LEAD } }),
      prisma.lead.count({ where: { ...userFilter, prospectStatus: ProspectStatus.NOT_INTERESTED } }),
      prisma.lead.count({ where: { ...userFilter, prospectStatus: ProspectStatus.ARCHIVED } }),
      prisma.lead.groupBy({
        by: ["category"],
        where: { ...userFilter, prospectStatus: ProspectStatus.PROSPECT },
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ["scrapeJobId"],
        where: {
          ...userFilter,
          prospectStatus: ProspectStatus.PROSPECT,
          scrapeJobId: { not: null },
        },
        _count: true,
        orderBy: { _count: { scrapeJobId: "desc" } },
        take: 10,
      }),
    ]);

    return {
      counts: {
        prospects: totalProspects,
        leads: totalLeads,
        notInterested: totalNotInterested,
        archived: totalArchived,
      },
      byCategory,
      byScrapeJob,
    };
  },

  async getCities(userId: string) {
    // CRITICAL: Only get cities from this user's prospects
    const cities = await prisma.lead.findMany({
      where: {
        userId, // Multi-tenancy: only this user's data
        prospectStatus: ProspectStatus.PROSPECT,
        city: { not: null },
      },
      distinct: ["city"],
      select: { city: true },
      orderBy: { city: "asc" },
    });
    return cities.map((c) => c.city).filter(Boolean);
  },
};
