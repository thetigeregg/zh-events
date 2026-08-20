import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { config } from "../../config.js";

const querySchema = z.object({
  search: z.string().trim().min(1).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.union([z.string(), z.array(z.string())]).optional(),
  includeAdvertisements: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v !== "false"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(100),
});

function todayInTimezone(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: config.timezone }).format(new Date());
}

interface EventRow {
  id: string;
  title: string;
  category_raw: string;
  image_hash: string | null;
  detail_url: string;
  first_show: string;
  schedule: string | null;
  venue: string | null;
  lat: number | null;
  lng: number | null;
  advertisement: number;
}

export function registerEventsRoute(app: FastifyInstance) {
  app.get("/api/events", async (request, reply) => {
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "invalid query", details: parsed.error.flatten() });
    }
    const q = parsed.data;
    const categories = q.category ? (Array.isArray(q.category) ? q.category : [q.category]) : [];

    const conditions: string[] = ["removed_at IS NULL"];
    const params: Record<string, unknown> = {};

    const from = q.from ?? todayInTimezone();
    conditions.push("first_show >= @from");
    params.from = from;

    if (q.to) {
      conditions.push("first_show <= @to");
      params.to = q.to;
    }

    if (q.search) {
      conditions.push("(title LIKE @search OR venue LIKE @search)");
      params.search = `%${q.search}%`;
    }

    if (q.includeAdvertisements === false) {
      conditions.push("advertisement = 0");
    }

    if (categories.length > 0) {
      const placeholders = categories.map((_, i) => `@cat${i}`).join(", ");
      conditions.push(
        `id IN (SELECT event_id FROM event_categories WHERE category IN (${placeholders}))`,
      );
      categories.forEach((c, i) => (params[`cat${i}`] = c));
    }

    const whereClause = conditions.join(" AND ");
    const offset = (q.page - 1) * q.pageSize;

    const totalRow = app.db
      .prepare(`SELECT COUNT(*) AS total FROM events WHERE ${whereClause}`)
      .get(params) as { total: number };

    const rows = app.db
      .prepare(
        `SELECT id, title, category_raw, image_hash, detail_url, first_show, schedule, venue, lat, lng, advertisement
         FROM events WHERE ${whereClause}
         ORDER BY first_show ASC, schedule ASC
         LIMIT @limit OFFSET @offset`,
      )
      .all({ ...params, limit: q.pageSize, offset }) as EventRow[];

    return {
      events: rows.map((row) => ({
        id: row.id,
        title: row.title,
        categories: row.category_raw.split(",").map((c) => c.trim()).filter(Boolean),
        imageUrl: row.image_hash ? `/api/images/${row.image_hash}` : null,
        detailUrl: row.detail_url,
        firstShow: row.first_show,
        schedule: row.schedule,
        venue: row.venue,
        lat: row.lat,
        lng: row.lng,
        advertisement: Boolean(row.advertisement),
      })),
      page: q.page,
      pageSize: q.pageSize,
      total: totalRow.total,
    };
  });
}
