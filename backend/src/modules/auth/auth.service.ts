import { prisma } from '../../lib/prisma.js';

export const authService = {
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        imageUrl: true,
        createdAt: true,
      },
    });

    return user;
  },
};
