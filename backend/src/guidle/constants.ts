// Identifiers for "Zurich tourism's events section" within Guidle's multi-tenant
// platform. Confirmed against a captured HAR (see PROJECT_CONTEXT.md) — fixed
// constants, not expected to change.
export const GUIDLE_BASE_URL = "https://microsite.guidle.com";
export const PORTAL_NAME = "microsite";
export const PAGE_OFFER_ID = "1172134252";
export const SECTION_ID = "1096";
export const MICROSITE_CR_ID = "e8X87y";
export const PORTAL_ID = "658578869";

export const OFFERS_PER_PAGE = 50;
// Safety cap so a runaway/looping response can't cause an unbounded fetch.
export const MAX_PAGES = 150;
