import type Database from "better-sqlite3";
import { config } from "../config.js";
import type { GuidleOffer } from "../guidle/types.js";
import { logger } from "../logger.js";
import { translateBatch } from "./client.js";

const BATCH_SIZE = 50; // DeepL's hard per-request text limit

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function syncTranslations(db: Database.Database, offers: GuidleOffer[]): Promise<void> {
  if (!config.deeplApiKey) return; // feature disabled, zero-config no-op

  const titles = new Set(offers.map((o) => o.title.trim()).filter(Boolean));
  const cached = new Set(
    (db.prepare(`SELECT source_text FROM translations`).all() as { source_text: string }[]).map(
      (r) => r.source_text,
    ),
  );
  const missing = [...titles].filter((t) => !cached.has(t));
  if (missing.length === 0) return;

  logger.info({ count: missing.length }, "translating new/changed titles");

  const upsert = db.prepare(`
    INSERT INTO translations (source_text, translated_text, target_lang, translated_at)
    VALUES (@sourceText, @translatedText, 'EN', @now)
    ON CONFLICT(source_text) DO UPDATE SET
      translated_text = excluded.translated_text,
      translated_at = excluded.translated_at
  `);

  for (let i = 0; i < missing.length; i += BATCH_SIZE) {
    const batch = missing.slice(i, i + BATCH_SIZE);
    const results = await translateBatch(batch);
    const now = new Date().toISOString();
    const commitBatch = db.transaction((entries: [string, string][]) => {
      for (const [sourceText, translatedText] of entries) {
        upsert.run({ sourceText, translatedText, now });
      }
    });
    commitBatch([...results.entries()]);
    if (i + BATCH_SIZE < missing.length) await delay(config.deeplBatchDelayMs);
  }

  logger.info({ count: missing.length }, "translation sync complete");
}
