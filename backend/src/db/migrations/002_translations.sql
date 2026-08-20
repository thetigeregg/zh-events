-- Generic translation cache, keyed by the exact source text (not by event
-- id). Dedupes translation work both across a recurring event's many
-- occurrence rows (same title repeated) and across unrelated events that
-- happen to share exact title text.
CREATE TABLE IF NOT EXISTS translations (
  source_text     TEXT PRIMARY KEY,
  translated_text TEXT NOT NULL,
  target_lang     TEXT NOT NULL DEFAULT 'EN',
  translated_at   TEXT NOT NULL
);
