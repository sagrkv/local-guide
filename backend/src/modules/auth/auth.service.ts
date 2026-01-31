import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma.js';

export const authService = {
  /**
   * Legacy login with email/password
   * This is kept for backward compatibility during Clerk migration
   * New users should use Clerk authentication
   */
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return null;
    }

    // If user has no password (Clerk-only user), reject legacy login
    if (!user.password) {
      return null;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return null;
    }

    // Don't return password
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword };
  },

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        creditBalance: true,
        imageUrl: true,
        createdAt: true,
      },
    });

    return user;
  },

  /**
   * Legacy password change
   * This is kept for backward compatibility during Clerk migration
   * Clerk users should change password through Clerk's UI
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return false;
    }

    // If user has no password (Clerk-only user), reject password change
    if (!user.password) {
      return false;
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return false;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return true;
  },

  async createUser(data: { email: string; password: string; name: string; role?: 'ADMIN' | 'USER' }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  },
};
