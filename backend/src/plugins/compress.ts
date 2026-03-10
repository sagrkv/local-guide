import { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import compress from "@fastify/compress";

async function compressPlugin(fastify: FastifyInstance) {
  await fastify.register(compress, { global: true });
}

export default fp(compressPlugin, { name: "compress" });
