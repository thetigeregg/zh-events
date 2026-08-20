import path from "node:path";
import type Database from "better-sqlite3";
import { config } from "../config.js";
import { fetchOffersCount, fetchSearchOffersPage } from "../guidle/client.js";
import { MAX_PAGES, OFFERS_PER_PAGE } from "../guidle/constants.js";
import type { GuidleOffer } from "../guidle/types.js";
import { logger } from "../logger.js";
import { syncTranslations } from "../translate/sync.js";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function imageHashFromUri(imageUri: string | undefined): string | null {
  if (!imageUri) return null;
  return path.basename(imageUri);
}

// Guidle shares one offer `id` across every occurrence of a recurring or
// multi-showtime event — a distinct row per (event, date, time) combination.
// This composite key is what actually identifies a single occurrence.
function occurrenceId(offer: GuidleOffer): string {
  return `${offer.id}:${offer.firstShow}:${offer.schedule ?? ""}`;
}

async function fetchAllOffers(): Promise<{ offers: GuidleOffer[]; pagesFetched: number }> {
  // The search-offers endpoint doesn't stop returning full pages once you'd
  // expect (observed: still 50 offers/page past page 500, well beyond what
  // offers-count reports as the real total) — so pagination is bounded by the
  // authoritative count rather than "an empty page came back."
  const count = await fetchOffersCount();
  const totalPages = Math.min(Math.ceil(count / OFFERS_PER_PAGE), MAX_PAGES);

  const offersByOccurrence = new Map<string, GuidleOffer>();
  let pagesFetched = 0;

  for (let page = 1; page <= totalPages; page++) {
    const response = await fetchSearchOffersPage(page);
    pagesFetched++;
    const offers = response.groups.flatMap((g) => g.offers);
    if (offers.length === 0) break;
    for (const offer of offers) offersByOccurrence.set(occurrenceId(offer), offer);
    if (pagesFetched % 10 === 0) {
      logger.info({ pagesFetched, totalPages }, "poll cycle progress");
    }
    await delay(config.guidlePageDelayMs);
  }

  return { offers: [...offersByOccurrence.values()], pagesFetched };
}

export async function runPollCycle(db: Database.Database): Promise<{ success: boolean }> {
  const startedAt = new Date().toISOString();
  const insertRun = db
    .prepare(
      `INSERT INTO poll_runs (started_at, status) VALUES (?, 'running')`,
    )
    .run(startedAt);
  const runId = insertRun.lastInsertRowid;

  let fetched: { offers: GuidleOffer[]; pagesFetched: number };
  try {
    fetched = await fetchAllOffers();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err }, "poll cycle failed during fetch, leaving existing data untouched");
    db.prepare(
      `UPDATE poll_runs SET finished_at = ?, status = 'error', error_message = ? WHERE id = ?`,
    ).run(new Date().toISOString(), message, runId);
    return { success: false };
  }

  try {
    await syncTranslations(db, fetched.offers);
  } catch (err) {
    logger.warn({ err }, "translation sync failed, continuing poll cycle without new translations");
  }

  const { offers, pagesFetched } = fetched;
  const now = new Date().toISOString();

  const upsertEvent = db.prepare(`
    INSERT INTO events (
      id, guidle_id, generated_id, title, category_raw, image_url, image_hash, detail_url,
      first_show, schedule, venue, lat, lng, advertisement,
      first_seen_at, last_seen_at, removed_at, raw_json
    ) VALUES (
      @id, @guidleId, @generatedId, @title, @categoryRaw, @imageUrl, @imageHash, @detailUrl,
      @firstShow, @schedule, @venue, @lat, @lng, @advertisement,
      @now, @now, NULL, @rawJson
    )
    ON CONFLICT(id) DO UPDATE SET
      generated_id = excluded.generated_id,
      title = excluded.title,
      category_raw = excluded.category_raw,
      image_url = excluded.image_url,
      image_hash = excluded.image_hash,
      detail_url = excluded.detail_url,
      venue = excluded.venue,
      lat = excluded.lat,
      lng = excluded.lng,
      advertisement = excluded.advertisement,
      last_seen_at = excluded.last_seen_at,
      removed_at = NULL,
      raw_json = excluded.raw_json
  `);

  const deleteCategories = db.prepare(`DELETE FROM event_categories WHERE event_id = ?`);
  const insertCategory = db.prepare(
    `INSERT OR IGNORE INTO event_categories (event_id, category) VALUES (?, ?)`,
  );
  const upsertImage = db.prepare(`
    INSERT INTO images (hash, source_url) VALUES (@hash, @sourceUrl)
    ON CONFLICT(hash) DO UPDATE SET source_url = excluded.source_url
  `);
  const getActiveIds = db.prepare(`SELECT id FROM events WHERE removed_at IS NULL`);
  const markRemoved = db.prepare(`UPDATE events SET removed_at = ? WHERE id = ?`);
  const countExisting = db.prepare(`SELECT 1 FROM events WHERE id = ?`);

  const commit = db.transaction((offers: GuidleOffer[]) => {
    const existingActiveIds = new Set(
      (getActiveIds.all() as { id: string }[]).map((r) => r.id),
    );
    let eventsNew = 0;

    for (const offer of offers) {
      const id = occurrenceId(offer);
      if (!countExisting.get(id)) eventsNew++;

      upsertEvent.run({
        id,
        guidleId: offer.id,
        generatedId: offer.generatedId,
        title: offer.title,
        categoryRaw: offer.category,
        imageUrl: offer.imageUrl ?? null,
        imageHash: imageHashFromUri(offer.imageUri),
        detailUrl: offer.url,
        firstShow: offer.firstShow,
        schedule: offer.schedule ?? null,
        venue: offer.textLine2 ?? null,
        lat: offer.lat ? Number.parseFloat(offer.lat) : null,
        lng: offer.lng ? Number.parseFloat(offer.lng) : null,
        advertisement: offer.advertisementOffer ? 1 : 0,
        now,
        rawJson: JSON.stringify(offer),
      });

      deleteCategories.run(id);
      for (const category of offer.category.split(",").map((c) => c.trim()).filter(Boolean)) {
        insertCategory.run(id, category);
      }

      const hash = imageHashFromUri(offer.imageUri);
      if (hash && offer.imageUrl) {
        upsertImage.run({ hash, sourceUrl: offer.imageUrl });
      }
    }

    const seenIds = new Set(offers.map(occurrenceId));
    let eventsRemoved = 0;
    for (const id of existingActiveIds) {
      if (!seenIds.has(id)) {
        markRemoved.run(now, id);
        eventsRemoved++;
      }
    }

    return { eventsNew, eventsRemoved };
  });

  const { eventsNew, eventsRemoved } = commit(offers);

  db.prepare(
    `UPDATE poll_runs SET finished_at = ?, status = 'success', pages_fetched = ?, events_seen = ?, events_new = ?, events_removed = ? WHERE id = ?`,
  ).run(new Date().toISOString(), pagesFetched, offers.length, eventsNew, eventsRemoved, runId);

  logger.info(
    { pagesFetched, eventsSeen: offers.length, eventsNew, eventsRemoved },
    "poll cycle completed",
  );
  return { success: true };
}
