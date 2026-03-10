import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

interface LogActivityInput {
  userId: string;
  type: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
}

export async function logActivity(input: LogActivityInput) {
  return prisma.activityLog.create({
    data: {
      type: input.type,
      message: input.message,
      metadata: input.metadata,
      user: { connect: { id: input.userId } },
    },
  });
}

export async function getRecentActivity(userId?: string, limit = 20) {
  return prisma.activityLog.findMany({
    where: userId ? { userId } : {},
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}
