import type { FastifyInstance } from "fastify";

export function registerCategoriesRoute(app: FastifyInstance) {
  app.get("/api/categories", async () => {
    const rows = app.db
      .prepare(
        `SELECT ec.category AS name, COUNT(*) AS count
         FROM event_categories ec
         JOIN events e ON e.id = ec.event_id
         WHERE e.removed_at IS NULL
         GROUP BY ec.category
         ORDER BY count DESC, name ASC`,
      )
      .all();

    return { categories: rows };
  });
}
