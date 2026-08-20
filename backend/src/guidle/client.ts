import { config } from "../config.js";
import {
  GUIDLE_BASE_URL,
  MICROSITE_CR_ID,
  PAGE_OFFER_ID,
  PORTAL_ID,
  PORTAL_NAME,
  SECTION_ID,
} from "./constants.js";
import type { GuidleOffersCountResponse, GuidleSearchOffersResponse } from "./types.js";

// Guidle occasionally stalls on an individual request for well over a minute
// with no error — bound every call so a single bad page can't hang a whole
// poll cycle indefinitely.
const REQUEST_TIMEOUT_MS = 15_000;

export async function fetchSearchOffersPage(pageNumber: number): Promise<GuidleSearchOffersResponse> {
  const url = new URL(`${GUIDLE_BASE_URL}/api/rest/2.0/portals/search-offers/${PORTAL_ID}`);
  url.searchParams.set("portalName", PORTAL_NAME);
  url.searchParams.set("pageOfferId", PAGE_OFFER_ID);
  url.searchParams.set("sectionId", SECTION_ID);
  url.searchParams.set("currentPageNumber", String(pageNumber));
  url.searchParams.set("micrositeCrId", MICROSITE_CR_ID);
  url.searchParams.set("language", config.language);

  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) {
    throw new Error(`search-offers page ${pageNumber} failed: HTTP ${res.status}`);
  }
  return (await res.json()) as GuidleSearchOffersResponse;
}

export async function fetchOffersCount(): Promise<number> {
  const url = new URL(
    `${GUIDLE_BASE_URL}/api/rest/2.0/portals/offers-count/${PAGE_OFFER_ID}/${PORTAL_ID}/${SECTION_ID}`,
  );
  url.searchParams.set("language", config.language);

  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) {
    throw new Error(`offers-count failed: HTTP ${res.status}`);
  }
  const data = (await res.json()) as GuidleOffersCountResponse;
  return data.count;
}
