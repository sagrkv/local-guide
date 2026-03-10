import { config } from "./lib/config.js";
import { buildApp } from "./app.js";
import { prisma } from "./lib/prisma.js";

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    console.log(`Server running on http://${config.HOST}:${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    await prisma.$disconnect();
    process.exit(1);
  }

  const shutdown = async () => {
    console.log("Shutting down...");
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start();
