import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { success } from "../lib/response.js";

export default async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async (_request, reply) => {
    let dbStatus = "ok";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "error";
    }

    return reply.send(
      success({
        status: "ok",
        timestamp: new Date().toISOString(),
        database: dbStatus,
      })
    );
  });
}
