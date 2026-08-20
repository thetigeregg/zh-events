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
  // "day" collapses multiple same-day showtimes of the same event into one
  // row (always desirable — nobody wants to see one title back-to-back).
  // "event" further collapses across days, one row per recurring event
  // (opt-in via the frontend's "group recurring events" toggle, since some
  // people do want to scan every date).
  group: z.enum(["day", "event"]).default("day"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(100),
});

// Unlikely to appear in real schedule text ("10:00 h"); safe GROUP_CONCAT separator.
const SCHEDULE_SEPARATOR = "||";

function todayInTimezone(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: config.timezone }).format(new Date());
}

interface DayGroupRow {
  guidle_id: number;
  first_show: string;
  title: string;
  category_raw: string;
  image_hash: string | null;
  detail_url: string;
  venue: string | null;
  lat: number | null;
  lng: number | null;
  advertisement: number;
  schedules_raw: string | null;
  translated_title: string | null;
}

interface EventGroupRow {
  guidle_id: number;
  first_show: string;
  last_show: string;
  occurrence_count: number;
  title: string;
  category_raw: string;
  image_hash: string | null;
  detail_url: string;
  venue: string | null;
  lat: number | null;
  lng: number | null;
  advertisement: number;
  translated_title: string | null;
}

// Guidle mints a distinct guidle_id for every dated occurrence of a
// recurring event (confirmed empirically — e.g. a weekly karaoke night has
// 12 different guidle_ids across 12 Saturdays). There's no shared "series
// id" in the source data, so cross-day grouping keys on (title, venue) as a
// heuristic instead — the only signal that actually ties recurring
// occurrences together.

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

    // Filtering happens on raw per-occurrence rows (this WHERE clause), before
    // either grouping level aggregates on top of it.
    const whereClause = conditions.join(" AND ");
    const offset = (q.page - 1) * q.pageSize;
    const groupByCols = q.group === "day" ? "guidle_id, first_show" : "title, venue";

    const totalRow = app.db
      .prepare(
        `SELECT COUNT(*) AS total FROM (
           SELECT 1 FROM events WHERE ${whereClause} GROUP BY ${groupByCols}
         )`,
      )
      .get(params) as { total: number };

    let events: unknown[];

    if (q.group === "day") {
      const rows = app.db
        .prepare(
          `WITH grouped AS (
             SELECT
               guidle_id,
               first_show,
               MIN(title) AS title,
               MIN(category_raw) AS category_raw,
               MIN(image_hash) AS image_hash,
               MIN(detail_url) AS detail_url,
               MIN(venue) AS venue,
               MIN(lat) AS lat,
               MIN(lng) AS lng,
               MAX(advertisement) AS advertisement,
               GROUP_CONCAT(schedule, '${SCHEDULE_SEPARATOR}') AS schedules_raw
             FROM events
             WHERE ${whereClause}
             GROUP BY guidle_id, first_show
           )
           SELECT grouped.*, translations.translated_text AS translated_title
           FROM grouped
           LEFT JOIN translations ON translations.source_text = grouped.title
           ORDER BY first_show ASC, schedules_raw ASC
           LIMIT @limit OFFSET @offset`,
        )
        .all({ ...params, limit: q.pageSize, offset }) as DayGroupRow[];

      events = rows.map((row) => ({
        id: `${row.guidle_id}:${row.first_show}`,
        guidleId: row.guidle_id,
        title: row.title,
        translatedTitle: row.translated_title,
        categories: row.category_raw.split(",").map((c) => c.trim()).filter(Boolean),
        imageUrl: row.image_hash ? `/api/images/${row.image_hash}` : null,
        detailUrl: row.detail_url,
        firstShow: row.first_show,
        lastShow: null,
        schedules: row.schedules_raw
          ? [...new Set(row.schedules_raw.split(SCHEDULE_SEPARATOR))].sort()
          : [],
        occurrenceCount: row.schedules_raw ? row.schedules_raw.split(SCHEDULE_SEPARATOR).length : 1,
        venue: row.venue,
        lat: row.lat,
        lng: row.lng,
        advertisement: Boolean(row.advertisement),
      }));
    } else {
      // ROW_NUMBER picks one whole, real, internally-consistent row per
      // (title, venue) group — the earliest upcoming occurrence — rather
      // than mixing MIN() across columns independently, so the returned
      // image/detail_url/etc. always belong together as they did on Guidle.
      const rows = app.db
        .prepare(
          `WITH ranked AS (
             SELECT *,
               ROW_NUMBER() OVER (PARTITION BY title, venue ORDER BY first_show ASC, schedule ASC) AS rn,
               COUNT(*) OVER (PARTITION BY title, venue) AS occurrence_count,
               MAX(first_show) OVER (PARTITION BY title, venue) AS last_show
             FROM events
             WHERE ${whereClause}
           )
           SELECT ranked.guidle_id, ranked.first_show, ranked.last_show, ranked.occurrence_count,
                  ranked.title, ranked.category_raw, ranked.image_hash, ranked.detail_url,
                  ranked.venue, ranked.lat, ranked.lng, ranked.advertisement,
                  translations.translated_text AS translated_title
           FROM ranked
           LEFT JOIN translations ON translations.source_text = ranked.title
           WHERE ranked.rn = 1
           ORDER BY ranked.first_show ASC
           LIMIT @limit OFFSET @offset`,
        )
        .all({ ...params, limit: q.pageSize, offset }) as EventGroupRow[];

      events = rows.map((row) => ({
        id: String(row.guidle_id),
        guidleId: row.guidle_id,
        title: row.title,
        translatedTitle: row.translated_title,
        categories: row.category_raw.split(",").map((c) => c.trim()).filter(Boolean),
        imageUrl: row.image_hash ? `/api/images/${row.image_hash}` : null,
        detailUrl: row.detail_url,
        firstShow: row.first_show,
        lastShow: row.last_show,
        schedules: [],
        occurrenceCount: row.occurrence_count,
        venue: row.venue,
        lat: row.lat,
        lng: row.lng,
        advertisement: Boolean(row.advertisement),
      }));
    }

    return {
      events,
      page: q.page,
      pageSize: q.pageSize,
      total: totalRow.total,
    };
  });
}
