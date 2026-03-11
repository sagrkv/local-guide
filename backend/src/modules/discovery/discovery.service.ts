import { prisma } from '../../lib/prisma.js';
import { DiscoveryJobStatus, Prisma } from '@prisma/client';

interface ListJobsFilters {
  cityId?: string;
  status?: DiscoveryJobStatus;
  page: number;
  limit: number;
}

interface CreateJobData {
  cityId: string;
  categorySlug?: string;
  searchQuery?: string;
  createdById: string;
}

interface UpdateJobCounts {
  candidatesFound?: number;
  approved?: number;
  rejected?: number;
  duplicatesSkipped?: number;
}

export const discoveryService = {
  async listJobs(filters: ListJobsFilters) {
    const { cityId, status, page, limit } = filters;

    const where: Prisma.DiscoveryJobWhereInput = {};
    if (cityId) where.cityId = cityId;
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.discoveryJob.findMany({
        where,
        include: {
          city: {
            select: { id: true, name: true, slug: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.discoveryJob.count({ where }),
    ]);

    return { data: jobs, total };
  },

  async getJobById(id: string) {
    return prisma.discoveryJob.findUnique({
      where: { id },
      include: {
        city: {
          select: { id: true, name: true, slug: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },

  async createJob(data: CreateJobData) {
    return prisma.discoveryJob.create({
      data: {
        cityId: data.cityId,
        categorySlug: data.categorySlug,
        searchQuery: data.searchQuery,
        createdById: data.createdById,
        status: 'PENDING',
      },
      include: {
        city: {
          select: { id: true, name: true, slug: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  },

  async updateJobStatus(id: string, status: DiscoveryJobStatus, errorMessage?: string) {
    const updateData: Prisma.DiscoveryJobUpdateInput = { status };

    if (status === 'RUNNING') {
      updateData.startedAt = new Date();
    }

    if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
      updateData.completedAt = new Date();
    }

    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }

    try {
      return await prisma.discoveryJob.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return null;
      }
      throw error;
    }
  },

  async updateJobCounts(id: string, counts: UpdateJobCounts) {
    const updateData: Prisma.DiscoveryJobUpdateInput = {};

    if (counts.candidatesFound !== undefined) {
      updateData.candidatesFound = { increment: counts.candidatesFound };
    }
    if (counts.approved !== undefined) {
      updateData.approved = { increment: counts.approved };
    }
    if (counts.rejected !== undefined) {
      updateData.rejected = { increment: counts.rejected };
    }
    if (counts.duplicatesSkipped !== undefined) {
      updateData.duplicatesSkipped = { increment: counts.duplicatesSkipped };
    }

    try {
      return await prisma.discoveryJob.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return null;
      }
      throw error;
    }
  },
};
