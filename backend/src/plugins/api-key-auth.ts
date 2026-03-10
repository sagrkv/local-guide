import { FastifyRequest, FastifyReply } from "fastify";
import { config } from "../lib/config.js";
import { UnauthorizedError } from "../lib/errors.js";

export async function requireApiKey(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const apiKey = request.headers["x-api-key"] as string | undefined;
  if (!config.API_KEY) {
    // API key auth not configured, skip
    return;
  }
  if (!apiKey || apiKey !== config.API_KEY) {
    throw new UnauthorizedError("Invalid API key");
  }
}
