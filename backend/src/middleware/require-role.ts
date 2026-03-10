import { FastifyRequest, FastifyReply } from "fastify";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";

const roleHierarchy: Record<Role, number> = {
  SUPER_ADMIN: 4,
  CITY_ADMIN: 3,
  CONTRIBUTOR: 2,
  VIEWER: 1,
};

export function requireRole(minimumRole: Role) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.clerkUserId) {
      throw new UnauthorizedError();
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: request.clerkUserId },
    });

    if (!user) {
      throw new UnauthorizedError("User not found in system");
    }

    request.userId = user.id;

    if (roleHierarchy[user.role] < roleHierarchy[minimumRole]) {
      throw new ForbiddenError(
        `Role '${minimumRole}' or higher required`
      );
    }
  };
}
