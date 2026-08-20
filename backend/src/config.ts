import path from "node:path";

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid value for ${name}: "${raw}" (expected a positive integer)`);
  }
  return parsed;
}

const dataDir = process.env.DATA_DIR ?? "/data";

export const config = {
  port: intFromEnv("PORT", 3000),
  dataDir,
  dbPath: path.join(dataDir, "events.db"),
  imagesDir: path.join(dataDir, "images"),
  timezone: process.env.TZ ?? "Europe/Zurich",
  refreshIntervalDays: intFromEnv("REFRESH_INTERVAL_DAYS", 1),
  guidlePageDelayMs: intFromEnv("GUIDLE_PAGE_DELAY_MS", 300),
  language: process.env.LANGUAGE ?? "en",
  deeplApiKey: process.env.DEEPL_API_KEY || null,
  deeplBatchDelayMs: intFromEnv("DEEPL_BATCH_DELAY_MS", 300),
};
