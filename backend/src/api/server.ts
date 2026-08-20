import Fastify from "fastify";
import type Database from "better-sqlite3";
import { registerCategoriesRoute } from "./routes/categories.js";
import { registerEventsRoute } from "./routes/events.js";
import { registerHealthRoute } from "./routes/health.js";
import { registerImagesRoute } from "./routes/images.js";
import { registerMetaRoute } from "./routes/meta.js";

declare module "fastify" {
  interface FastifyInstance {
    db: Database.Database;
  }
}

export function buildServer(db: Database.Database) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      transport:
        process.env.NODE_ENV === "production"
          ? undefined
          : { target: "pino-pretty", options: { colorize: true } },
    },
  });
  app.decorate("db", db);

  registerHealthRoute(app);
  registerEventsRoute(app);
  registerCategoriesRoute(app);
  registerMetaRoute(app);
  registerImagesRoute(app);

  return app;
}
