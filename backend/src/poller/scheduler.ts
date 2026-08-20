import type Database from "better-sqlite3";
import { config } from "../config.js";
import { logger } from "../logger.js";
import { runPollCycle } from "./poll.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const RETRY_DELAY_MS = 60_000;

export function startScheduler(db: Database.Database): void {
  const intervalMs = config.refreshIntervalDays * DAY_MS;

  async function cycle() {
    let nextDelay = intervalMs;
    try {
      const { success } = await runPollCycle(db);
      if (!success) nextDelay = RETRY_DELAY_MS;
    } catch (err) {
      logger.error({ err }, "unexpected error running poll cycle");
      nextDelay = RETRY_DELAY_MS;
    } finally {
      setTimeout(cycle, nextDelay);
    }
  }

  // Fire immediately so a fresh DB isn't empty, then reschedule N days after
  // each successful cycle *finishes* (or after a short backoff on failure) —
  // avoids overlapping runs if a cycle runs long.
  void cycle();
}
