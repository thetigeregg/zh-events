import fs from "node:fs/promises";
import path from "node:path";
import type Database from "better-sqlite3";
import sharp from "sharp";
import { config } from "../config.js";

// Guidle image basenames look like "<40-hex-char-hash>_<digits>.<ext>" — strict
// allowlist so the :hash route param can never be used for path traversal.
export const IMAGE_HASH_PATTERN = /^[a-f0-9]+_[0-9]+\.(jpg|jpeg|png|webp)$/i;

// Guidle source images vary wildly in size — most are a few hundred KB to a
// couple MB, but some are untouched full-resolution camera originals (one
// observed at 27MB, 8256x5504). We only ever display these as list/grid
// thumbnails, so resize+re-encode once on first fetch rather than caching
// (and repeatedly serving) the original bytes.
const MAX_WIDTH = 800;
const JPEG_QUALITY = 82;

interface ImageRow {
  hash: string;
  source_url: string;
  content_type: string | null;
  cached_at: string | null;
}

export interface CachedImage {
  data: Buffer;
  contentType: string;
}

export type ImageResult =
  | { kind: "ok"; image: CachedImage }
  | { kind: "not_found" }
  | { kind: "upstream_error" };

export async function getOrFetchImage(db: Database.Database, hash: string): Promise<ImageResult> {
  const row = db.prepare(`SELECT * FROM images WHERE hash = ?`).get(hash) as ImageRow | undefined;
  if (!row) return { kind: "not_found" };

  db.prepare(`UPDATE images SET last_requested_at = ? WHERE hash = ?`).run(
    new Date().toISOString(),
    hash,
  );

  const filePath = path.join(config.imagesDir, hash);

  if (row.cached_at) {
    try {
      const data = await fs.readFile(filePath);
      return { kind: "ok", image: { data, contentType: row.content_type ?? "image/jpeg" } };
    } catch {
      // Fall through and re-fetch if the on-disk file went missing.
    }
  }

  const res = await fetch(row.source_url);
  if (!res.ok) return { kind: "upstream_error" };

  const original = Buffer.from(await res.arrayBuffer());
  let data: Buffer;
  const contentType = "image/jpeg";
  try {
    data = await sharp(original)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .rotate() // apply EXIF orientation, then strip metadata on encode
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
  } catch {
    // Fall back to the original bytes if sharp can't decode this file
    // (unexpected format) rather than failing the request outright.
    data = original;
  }

  await fs.mkdir(config.imagesDir, { recursive: true });
  await fs.writeFile(filePath, data);

  db.prepare(`UPDATE images SET content_type = ?, cached_at = ? WHERE hash = ?`).run(
    contentType,
    new Date().toISOString(),
    hash,
  );

  return { kind: "ok", image: { data, contentType } };
}
