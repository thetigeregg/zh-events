-- Guidle emits one row per (event, date, showtime) — a recurring or
-- multi-showtime-per-day event shares the same `guidle_id` across several
-- occurrences that differ only in first_show/schedule. `id` is a synthetic
-- composite key ("<guidle_id>:<first_show>:<schedule>") so each occurrence
-- gets its own row instead of later showtimes silently overwriting earlier
-- ones on upsert.
CREATE TABLE IF NOT EXISTS events (
  id                TEXT PRIMARY KEY,
  guidle_id         INTEGER NOT NULL,
  generated_id      TEXT NOT NULL,
  title             TEXT NOT NULL,
  category_raw      TEXT NOT NULL,
  image_url         TEXT,
  image_hash        TEXT,
  detail_url        TEXT NOT NULL,
  first_show        TEXT NOT NULL,
  schedule          TEXT,
  venue             TEXT,
  lat               REAL,
  lng               REAL,
  advertisement     INTEGER NOT NULL DEFAULT 0,
  first_seen_at     TEXT NOT NULL,
  last_seen_at      TEXT NOT NULL,
  removed_at        TEXT,
  raw_json          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_first_show  ON events(first_show);
CREATE INDEX IF NOT EXISTS idx_events_active_date ON events(removed_at, first_show);
CREATE INDEX IF NOT EXISTS idx_events_guidle_id   ON events(guidle_id);

CREATE TABLE IF NOT EXISTS event_categories (
  event_id  TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category  TEXT NOT NULL,
  PRIMARY KEY (event_id, category)
);
CREATE INDEX IF NOT EXISTS idx_event_categories_category ON event_categories(category);

CREATE TABLE IF NOT EXISTS images (
  hash               TEXT PRIMARY KEY,
  source_url         TEXT NOT NULL,
  content_type       TEXT,
  cached_at          TEXT,
  last_requested_at  TEXT
);

CREATE TABLE IF NOT EXISTS poll_runs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at      TEXT NOT NULL,
  finished_at     TEXT,
  status          TEXT NOT NULL DEFAULT 'running',
  pages_fetched   INTEGER DEFAULT 0,
  events_seen     INTEGER DEFAULT 0,
  events_new      INTEGER DEFAULT 0,
  events_removed  INTEGER DEFAULT 0,
  error_message   TEXT
);
