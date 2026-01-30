import {
  Prisma,
  LeadStage,
  LeadCategory,
  LeadPriority,
  LeadSource,
  LeadType,
  ProspectStatus,
  ReminderStatus,
} from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

interface ListParams {
  userId: string; // Required for multi-tenancy
  page?: number;
  limit?: number;
  stage?: LeadStage;
  category?: LeadCategory;
  priority?: LeadPriority;
  assignedToId?: string;
  search?: string;
  city?: string;
  state?: string;
  hasWebsite?: boolean;
  minScore?: number;
  sortBy?: "createdAt" | "updatedAt" | "score" | "businessName";
  sortOrder?: "asc" | "desc";
}

interface CreateLeadData {
  userId: string; // Required for multi-tenancy - owner of the lead
  businessName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  category?: LeadCategory;
  priority?: LeadPriority;
  source?: LeadSource;
  leadType?: LeadType;
  notes?: string;
  assignedToId?: string;
  tags?: string[];
}

interface UpdateLeadData extends Partial<CreateLeadData> {
  stage?: LeadStage;
  score?: number;
  hasWebsite?: boolean;
  lighthouseScore?: number;
  lighthouseSeo?: number;
  websiteNeedsRedesign?: boolean;
  perplexityAnalysis?: string;
  nextFollowUpAt?: string;
}

export const leadsService = {
  async list(params: ListParams) {
    const {
      userId,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      ...filters
    } = params;
    const skip = (page - 1) * limit;

    // Build where clause - only show LEAD status (promoted prospects)
    // CRITICAL: Always filter by userId for multi-tenancy data isolation
    const where: Prisma.LeadWhereInput = {
      userId, // Multi-tenancy: users only see their own leads
      prospectStatus: ProspectStatus.LEAD,
    };

    if (filters.stage) where.stage = filters.stage;
    if (filters.category) where.category = filters.category;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.city)
      where.city = { contains: filters.city, mode: "insensitive" };
    if (filters.state)
      where.state = { contains: filters.state, mode: "insensitive" };
    if (filters.hasWebsite !== undefined) where.hasWebsite = filters.hasWebsite;
    if (filters.minScore !== undefined) where.score = { gte: filters.minScore };

    if (filters.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: "insensitive" } },
        { contactPerson: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          reminders: {
            where: {
              status: ReminderStatus.PENDING,
            },
            select: {
              id: true,
              remindAt: true,
            },
            orderBy: {
              remindAt: "asc",
            },
            take: 1,
          },
          _count: {
            select: { activities: true, reminders: true },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    // Transform tags structure
    const transformedLeads = leads.map((lead) => ({
      ...lead,
      tags: lead.tags.map((t) => t.tag),
      activitiesCount: lead._count.activities,
      pendingRemindersCount: lead._count.reminders,
      nextReminder: lead.reminders[0] || null,
    }));

    return {
      data: transformedLeads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string, userId: string) {
    // CRITICAL: Always include userId in query for multi-tenancy
    // Returns null if lead doesn't exist OR belongs to another user (prevents enumeration)
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        userId, // Multi-tenancy: users only see their own leads
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        tags: {
          include: { tag: true },
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        scrapeJob: {
          select: { id: true, type: true, query: true, createdAt: true },
        },
      },
    });

    if (!lead) return null;

    return {
      ...lead,
      tags: lead.tags.map((t) => t.tag),
    };
  },

  async create(data: CreateLeadData) {
    const { tags, userId, ...leadData } = data;

    // Calculate initial score
    const score = calculateLeadScore({
      ...leadData,
      hasWebsite: !!leadData.website,
    });

    const lead = await prisma.lead.create({
      data: {
        ...leadData,
        userId, // Multi-tenancy: set the owner of this lead
        hasWebsite: !!leadData.website,
        score,
        tags: tags?.length
          ? {
              create: tags.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    return {
      ...lead,
      tags: lead.tags.map((t) => t.tag),
    };
  },

  async update(id: string, userId: string, data: UpdateLeadData) {
    const { tags, nextFollowUpAt, ...updateData } = data;

    // CRITICAL: First verify the lead belongs to this user (prevents enumeration)
    const existingLead = await prisma.lead.findFirst({
      where: { id, userId },
    });
    if (!existingLead) {
      return null; // Return 404 (not 403) to prevent enumeration attacks
    }

    // Recalculate score if relevant fields changed
    let score: number | undefined;
    if (
      "category" in data ||
      "city" in data ||
      "email" in data ||
      "phone" in data ||
      "hasWebsite" in data ||
      "lighthouseScore" in data
    ) {
      score = calculateLeadScore({
        ...existingLead,
        ...updateData,
      });
    }

    try {
      const lead = await prisma.lead.update({
        where: { id },
        data: {
          ...updateData,
          score,
          nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt) : undefined,
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          tags: {
            include: { tag: true },
          },
        },
      });

      return {
        ...lead,
        tags: lead.tags.map((t) => t.tag),
      };
    } catch (error) {
      if ((error as any).code === "P2025") {
        return null;
      }
      throw error;
    }
  },

  async delete(id: string, userId: string) {
    // CRITICAL: Verify ownership before deletion (prevents enumeration)
    const lead = await prisma.lead.findFirst({
      where: { id, userId },
    });
    if (!lead) {
      return false; // Return 404 (not 403) to prevent enumeration attacks
    }

    try {
      await prisma.lead.delete({ where: { id } });
      return true;
    } catch (error) {
      if ((error as any).code === "P2025") {
        return false;
      }
      throw error;
    }
  },

  async changeStage(
    id: string,
    stage: LeadStage,
    userId: string,
    notes?: string,
  ) {
    // CRITICAL: Verify ownership before update (prevents enumeration)
    const lead = await prisma.lead.findFirst({ where: { id, userId } });
    if (!lead) return null;

    const previousStage = lead.stage;

    // Update lead and create activity in transaction
    const [updatedLead] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: {
          stage,
          lastContactedAt: new Date(),
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          tags: {
            include: { tag: true },
          },
        },
      }),
      prisma.activity.create({
        data: {
          type: "NOTE",
          title: `Stage changed from ${previousStage} to ${stage}`,
          description: notes,
          leadId: id,
          userId,
          completedAt: new Date(),
        },
      }),
    ]);

    return {
      ...updatedLead,
      tags: updatedLead.tags.map((t) => t.tag),
    };
  },

  async assign(id: string, assignedToId: string | null, userId: string) {
    // CRITICAL: Verify ownership before update (prevents enumeration)
    const lead = await prisma.lead.findFirst({
      where: { id, userId },
      include: { assignedTo: { select: { name: true } } },
    });
    if (!lead) return null;

    const previousAssignee = lead.assignedTo?.name || "Unassigned";

    let newAssigneeName = "Unassigned";
    if (assignedToId) {
      const newAssignee = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: { name: true },
      });
      newAssigneeName = newAssignee?.name || "Unknown";
    }

    const [updatedLead] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: { assignedToId },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          tags: {
            include: { tag: true },
          },
        },
      }),
      prisma.activity.create({
        data: {
          type: "NOTE",
          title: `Assigned from ${previousAssignee} to ${newAssigneeName}`,
          leadId: id,
          userId,
          completedAt: new Date(),
        },
      }),
    ]);

    return {
      ...updatedLead,
      tags: updatedLead.tags.map((t) => t.tag),
    };
  },

  async bulkChangeStage(leadIds: string[], stage: LeadStage, userId: string) {
    // CRITICAL: Only update leads that belong to this user
    const result = await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
        userId, // Multi-tenancy: users can only bulk update their own leads
      },
      data: { stage },
    });

    // Only create activities for leads that were actually updated
    // Get the IDs of leads that belong to this user
    const userLeads = await prisma.lead.findMany({
      where: { id: { in: leadIds }, userId },
      select: { id: true },
    });

    if (userLeads.length > 0) {
      await prisma.activity.createMany({
        data: userLeads.map((lead) => ({
          type: "NOTE" as const,
          title: `Stage changed to ${stage} (bulk update)`,
          leadId: lead.id,
          userId,
          completedAt: new Date(),
        })),
      });
    }

    return result;
  },

  async addTags(id: string, userId: string, tagIds: string[]) {
    // CRITICAL: Verify ownership before update (prevents enumeration)
    const lead = await prisma.lead.findFirst({ where: { id, userId } });
    if (!lead) return null;

    try {
      await prisma.tagOnLead.createMany({
        data: tagIds.map((tagId) => ({
          leadId: id,
          tagId,
        })),
        skipDuplicates: true,
      });

      return this.getById(id, userId);
    } catch (error) {
      if ((error as any).code === "P2025") {
        return null;
      }
      throw error;
    }
  },

  async removeTag(id: string, userId: string, tagId: string) {
    // CRITICAL: Verify ownership before update (prevents enumeration)
    const lead = await prisma.lead.findFirst({ where: { id, userId } });
    if (!lead) return null;

    try {
      await prisma.tagOnLead.delete({
        where: {
          leadId_tagId: { leadId: id, tagId },
        },
      });

      return this.getById(id, userId);
    } catch (error) {
      if ((error as any).code === "P2025") {
        return null;
      }
      throw error;
    }
  },
};

// Lead scoring function
function calculateLeadScore(
  lead: Partial<{
    category: LeadCategory;
    city: string;
    state: string;
    email: string;
    phone: string;
    hasWebsite: boolean;
    lighthouseScore: number;
    source: LeadSource;
  }>,
): number {
  let score = 0;

  // Category scoring (25-30 points)
  const categoryScores: Record<string, number> = {
    STARTUP: 30,
    ECOMMERCE: 28,
    AGENCY: 25,
    RESTAURANT: 22,
    HOTEL: 22,
    SALON: 20,
    CLINIC: 20,
    GYM: 18,
    RETAIL: 18,
    EDUCATION: 16,
    REAL_ESTATE: 16,
    OTHER: 10,
  };
  score += categoryScores[lead.category || "OTHER"] || 10;

  // Priority city scoring (15-20 points)
  const priorityCities = [
    "bangalore",
    "bengaluru",
    "hyderabad",
    "mumbai",
    "delhi",
    "pune",
    "chennai",
  ];
  if (
    lead.city &&
    priorityCities.some((c) => lead.city!.toLowerCase().includes(c))
  ) {
    score += 20;
  } else if (lead.city) {
    score += 10;
  }

  // Contact info scoring (20 points)
  if (lead.email) score += 10;
  if (lead.phone) score += 10;

  // Website status scoring (10-15 points)
  if (!lead.hasWebsite) {
    score += 10; // No website = opportunity
  } else if (lead.lighthouseScore !== undefined && lead.lighthouseScore < 50) {
    score += 15; // Poor website = bigger opportunity
  }

  // Source scoring (10 points)
  if (lead.source === "WEBSITE_CONTACT") {
    score += 10; // Inbound lead
  }

  return Math.min(score, 100);
}
