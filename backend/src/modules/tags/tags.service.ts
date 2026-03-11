import { prisma } from '../../lib/prisma.js';

interface CreateTagData {
  name: string;
  slug: string;
  color?: string;
}

interface UpdateTagData {
  name?: string;
  slug?: string;
  color?: string;
}

export const tagsService = {
  async list() {
    return prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { pois: true },
        },
      },
    });
  },

  async getById(id: string) {
    return prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { pois: true },
        },
      },
    });
  },

  async getByName(name: string) {
    return prisma.tag.findUnique({
      where: { name },
    });
  },

  async create(data: CreateTagData) {
    return prisma.tag.create({
      data,
      include: {
        _count: {
          select: { pois: true },
        },
      },
    });
  },

  async update(id: string, data: UpdateTagData) {
    try {
      return await prisma.tag.update({
        where: { id },
        data,
        include: {
          _count: {
            select: { pois: true },
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
      await prisma.tag.delete({ where: { id } });
      return true;
    } catch (error) {
      if ((error as any).code === 'P2025') {
        return false;
      }
      throw error;
    }
  },
};
