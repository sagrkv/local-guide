import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { randomUUID } from "crypto";

async function requestIdPlugin(fastify: FastifyInstance) {
  fastify.addHook("onRequest", async (request, reply) => {
    const requestId =
      (request.headers["x-request-id"] as string) || randomUUID();
    request.id = requestId;
    reply.header("x-request-id", requestId);
  });
}

export default fp(requestIdPlugin, { name: "request-id" });
