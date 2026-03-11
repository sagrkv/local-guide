import { prisma } from '../../lib/prisma.js';

interface ListUsersParams {
  search?: string;
  page: number;
  limit: number;
}

interface UserWithStats {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    curatedPOIs: number;
    discoveryJobs: number;
    createdItineraries: number;
    createdCollections: number;
  };
}

interface UserDetails extends UserWithStats {
  recentDiscoveryJobs: {
    id: string;
    status: string;
    source: string;
    candidatesFound: number;
    createdAt: Date;
  }[];
}

interface UpdateUserData {
  isActive?: boolean;
  name?: string;
  role?: 'ADMIN' | 'CURATOR' | 'VIEWER';
}

export const adminUsersService = {
  /**
   * List all users with stats (paginated)
   */
  async listUsers(params: ListUsersParams): Promise<{
    users: UserWithStats[];
    total: number;
  }> {
    const { search, page, limit } = params;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              curatedPOIs: true,
              discoveryJobs: true,
              createdItineraries: true,
              createdCollections: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  },

  /**
   * Get user details with recent activity
   */
  async getUserDetails(userId: string): Promise<UserDetails | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            curatedPOIs: true,
            discoveryJobs: true,
            createdItineraries: true,
            createdCollections: true,
          },
        },
        discoveryJobs: {
          select: {
            id: true,
            status: true,
            source: true,
            candidatesFound: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      ...user,
      recentDiscoveryJobs: user.discoveryJobs,
    };
  },

  /**
   * Update user details (admin action)
   */
  async updateUser(userId: string, data: UpdateUserData): Promise<UserWithStats | null> {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return null;
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            curatedPOIs: true,
            discoveryJobs: true,
            createdItineraries: true,
            createdCollections: true,
          },
        },
      },
    });

    return user;
  },
};
