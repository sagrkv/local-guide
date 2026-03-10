import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

interface CreateAuditLogInput {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
}

export async function createAuditLog(input: CreateAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      ...(input.userId ? { user: { connect: { id: input.userId } } } : {}),
    },
  });
}

interface QueryAuditLogsInput {
  entity?: string;
  entityId?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}

export async function queryAuditLogs(input: QueryAuditLogsInput) {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const where = {
    ...(input.entity ? { entity: input.entity } : {}),
    ...(input.entityId ? { entityId: input.entityId } : {}),
    ...(input.userId ? { userId: input.userId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data, total, page, pageSize };
}
