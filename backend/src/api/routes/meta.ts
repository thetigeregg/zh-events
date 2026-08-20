import type { FastifyInstance } from "fastify";
import { config } from "../../config.js";

interface PollRunRow {
  started_at: string;
  finished_at: string | null;
  status: string;
}

export function registerMetaRoute(app: FastifyInstance) {
  app.get("/api/meta", async () => {
    const lastRun = app.db
      .prepare(`SELECT started_at, finished_at, status FROM poll_runs ORDER BY id DESC LIMIT 1`)
      .get() as PollRunRow | undefined;

    const activeCount = app.db
      .prepare(`SELECT COUNT(*) AS count FROM events WHERE removed_at IS NULL`)
      .get() as { count: number };

    return {
      lastPollStartedAt: lastRun?.started_at ?? null,
      lastPollFinishedAt: lastRun?.finished_at ?? null,
      lastPollStatus: lastRun?.status ?? null,
      activeEventCount: activeCount.count,
      refreshIntervalDays: config.refreshIntervalDays,
    };
  });
}
