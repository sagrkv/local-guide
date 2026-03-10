import { FastifyInstance } from "fastify";
import { requireAuth } from "../../../plugins/clerk-auth.js";
import { requireRole } from "../../../middleware/require-role.js";
import { prisma } from "../../../lib/prisma.js";
import { success, successList } from "../../../lib/response.js";
import { NotFoundError } from "../../../lib/errors.js";

export default async function adminUsersRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", requireAuth);
  fastify.addHook("preHandler", requireRole("SUPER_ADMIN"));

  fastify.get("/users", async (request, reply) => {
    const { page = 1, pageSize = 20 } = request.query as {
      page?: number;
      pageSize?: number;
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
      }),
      prisma.user.count(),
    ]);

    return reply.send(successList(users, total, Number(page), Number(pageSize)));
  });

  fastify.get<{ Params: { id: string } }>("/users/:id", async (request, reply) => {
    const user = await prisma.user.findUnique({
      where: { id: request.params.id },
    });
    if (!user) throw new NotFoundError("User", request.params.id);
    return reply.send(success(user));
  });
}
