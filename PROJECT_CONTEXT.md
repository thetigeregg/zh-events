# Zürich Events Board — Project Context

## Goal

Build a self-hosted (Docker, running on a home NAS) web app that presents Zürich's
city event calendar in a more usable way than the official site. The official site
(zuerich.com's event calendar) has thousands of events and heavy filtering, but poor
discoverability — hard to scan, hard to get a "what's actually happening" view.

A working single-file HTML prototype already exists (attached separately, or ask the
user for `zurich-events.html`) that proves the approach: it fetches the underlying
data API directly from the browser and renders it as a searchable, filterable,
transit-departure-board-style list. This document is the research/context needed to
take that prototype and turn it into a proper deployed app with a real backend,
persistence, and more features.

The user will hand you a `.har` file (`zuri.har`) captured from their own browser
session on the official site — use it to verify/extend the findings below and to see
real example payloads.

## The data source

The official calendar (`https://www.zuerich.com/en/events-nightlife/event-calendar`)
does not host its own event data. It embeds a third-party widget from **Guidle**
(`microsite.guidle.com`), a Swiss B2B events/listings platform used by many Swiss
tourism sites. The widget loads inside an iframe and pulls data from Guidle's REST
API. All meaningful data (events, categories, filters, counts) comes from that API,
not from zuerich.com itself.

### Key finding: the API is effectively public

- CORS is wide open: responses include `Access-Control-Allow-Origin: *`.
- No auth token/API key is required for the read endpoints observed. There's a
  `JSESSIONID` cookie and an `X-Wizard-App` header on requests made by the widget,
  but these appear to be session/tracking artifacts of the embedded iframe, not
  access control — the endpoints are reachable as plain unauthenticated GETs.
- Responses are cached at the edge (`Cache-Control: max-age=900`, i.e. 15 minutes;
  `X-Cache: HIT` / `X-Cache-Group: api` headers from an nginx layer), so the data
  doesn't change faster than every ~15 minutes anyway — good news for a caching
  backend, since we don't need to hammer their servers.
- Be a polite citizen of someone else's infrastructure: cache aggressively on our
  side, poll infrequently (hourly is more than enough given their own 15-min cache),
  and don't parallelize page fetches aggressively.

### Identifiers seen in captured traffic

These look like they identify "Zürich tourism's events section" within Guidle's
multi-tenant platform. Treat them as fixed constants (confirm against the HAR):

| Name | Value seen | Used in |
|---|---|---|
| `portalName` | `microsite` | most endpoints |
| `pageOfferId` | `1172134252` | most endpoints |
| `sectionId` | `1096` | search/filters/count |
| `micrositeCrId` | `e8X87y` | most endpoints |
| portal id (path segment) | `658578869` | search-offers, offers-count, filters |
| `language` | `en` (also likely `de`, `fr`, `it` given Swiss context) | all endpoints |

### Endpoints observed

Base host: `https://microsite.guidle.com`

**1. Search offers (the main event list, paginated)**
```
GET /api/rest/2.0/portals/search-offers/{portalId}?portalName=microsite&pageOfferId={pageOfferId}&sectionId={sectionId}&currentPageNumber={n}&micrositeCrId={crId}&language=en
```
- `currentPageNumber` is 1-indexed. Each page returns **50 offers**.
- Response shape:
  ```json
  {
    "groups": [
      {
        "id": 1721636925,
        "label": "20. August 2026  | Thursday",
        "showGroup": true,
        "offers": [
          {
            "id": 1225054060,
            "title": "Event title",
            "imageUrl": "https://...cloudfront.net/....jpg",
            "imageUri": "/relative/path.jpg",
            "category": "This & That",
            "url": "https://microsite.guidle.com/hosted/template_portal/microsite/en/mr_e8X87y/slug_ID",
            "firstShow": "2026-08-20",
            "textLine2": "Venue name",
            "additionalCategoriesColor": "BBBBBD",
            "advertisementOffer": false,
            "generatedId": "5FMnBF",
            "lat": "47.3772565",
            "lng": "8.5397705",
            "schedule": "10:00 h"
          }
        ]
      }
    ]
  }
  ```
- Notes on fields:
  - `category` can be a **comma-separated list** (e.g. `"Classical,Small stage"`) —
    split on `,` when building category facets.
  - `schedule` is a free-text time string like `"10:00 h"` — not a full ISO
    datetime. `firstShow` is the date (`YYYY-MM-DD`). There's no explicit end
    time/date in this payload — multi-day or recurring events may need the detail
    page (`url`) to get more.
  - `lat`/`lng` are present as strings on (most) offers — usable for a map view.
  - Results appear to arrive pre-sorted chronologically (ascending from "today"),
    grouped by date server-side, matching the default `groupingAndSorting` sort
    (`"group": "date", "sort": "time", "used": true` — see filters endpoint below).
  - `advertisementOffer: false` — presumably `true` for sponsored/promoted listings;
    worth flagging or filtering these distinctly.

**2. Offers count**
```
GET /api/rest/2.0/portals/offers-count/{pageOfferId}/{portalId}/{sectionId}?language=en
GET /api/rest/2.0/portals/offers-count/{pageOfferId}/{portalId}/{sectionId}?currentPageNumber={n}&language=en
```
- Returns `{"count": 3195}` — total matching events for the current filter set.
- Total observed at capture time: **~3,195 events**. At 50/page that's ~64 pages.

**3. Filters metadata**
```
GET /api/rest/2.0/portals/filters/{pageOfferId}/{portalId}/{sectionId}?filtersOfferId={filtersOfferId}&micrositeCrId={crId}&language=en
```
- Describes what filter types the widget supports and their query param names:
  ```json
  {
    "filters": [
      {"type": "FREE_TEXT_SEARCH", "searchParameter": "search"},
      {"type": "CALENDAR"},
      {"type": "CITY", "name": "City", "searchParameter": "where"},
      {"type": "CATEGORY", "name": "Category", "searchParameter": "tagIds"},
      {"type": "LIST", "nodeId": 836863846, "name": "Type", "searchParameter": "filters"},
      {"type": "LIST", "nodeId": 279289161, "name": "Target groups", "searchParameter": "filters"},
      {"type": "LIST", "nodeId": 1225630995, "name": "Access for disabled people", "searchParameter": "filters"},
      {"type": "VENUE", "searchParameter": "addressIds"}
    ],
    "groupingAndSorting": [
      {"label": "Category", "group": "kind", "sort": "alphabetical"},
      {"label": "City", "group": "city", "sort": "alphabetical"},
      {"label": "Date", "group": "date", "sort": "time", "used": true},
      {"label": "Venue", "group": "venue", "sort": "relevance"}
    ],
    "layouts": ["MAP", "EXTENDED"]
  }
  ```
- This confirms the search-offers endpoint likely accepts additional query params
  we haven't captured directly yet: `search`, `where`, `tagIds`, `filters`
  (with a `nodeId`), `addressIds`. **The HAR only captured default/unfiltered
  requests** — none of these params appear in the captured URLs. If richer
  server-side filtering is wanted (rather than filtering client-side after
  fetching), these param names are the starting point to experiment with, but
  their exact value formats (e.g. how `tagIds` or `filters` expects multiple
  values, what a "CALENDAR" date-range param looks like) are **not confirmed
  from the HAR and need to be discovered** (e.g. by exercising the real site's UI
  with dev tools open, or trial and error against the API).
- `CATEGORY` filter values (the tag taxonomy / `tagIds`) weren't captured in this
  HAR — there's likely a dedicated endpoint or embedded config for the full tag
  list, given `CATEGORY` is `extendedFilter: true`. Worth checking network traffic
  when opening the category filter dropdown on the live site.

**4. Other endpoints seen (lower priority, subscription/misc widget plumbing)**
```
GET /api/rest/2.0/portals/page/{pageOfferId}?micrositeCrId={crId}&language=en
GET /api/rest/2.0/commons/user-data?language=en
GET /api/rest/1.0/subscription/timeRanges/en
GET /api/rest/1.0/subscription/periods/en
GET /api/rest/1.0/subscription/user-data?portalName=microsite&pageOfferId={pageOfferId}&language=en&micrositeCrId={crId}
```
These look related to a "subscribe to updates" feature of the widget and general
page/portal metadata — probably not needed for an events aggregator, but check the
HAR if any of this becomes relevant.

### What wasn't captured / needs further discovery

The HAR only covers: initial page load + "show more" clicked twice (i.e. pages 1–3,
default sort, no filters applied). Before building server-side filtering, someone
(user or agent, via browser dev tools on the live site) should capture what requests
look like when:
- A date range is picked (to learn the `CALENDAR` param format)
- A category is selected (`tagIds` — single ID? comma list? repeated params?)
- A free-text search is typed (`search` param — confirm it's server-side, not
  client-side in the widget)
- The full category/tag list (id → name mapping) is fetched

## What already exists (prototype)

A single-file HTML/JS prototype (`zurich-events.html`) already demonstrates the
concept end-to-end, entirely client-side (no backend):

- Fetches `search-offers` pages directly from the browser (works because CORS is
  open) — starts with ~8 pages (~400 events) on load, with a "load more" button
  for further pages, capped for safety.
- Fetches `offers-count` for a total count display.
- Client-side filtering: free-text search (title/venue/category), quick date-range
  chips (Today / Tomorrow / This weekend / Next 7 days / Next 30 days), category
  chips (built dynamically from the frequency of `category` values in whatever
  has been loaded so far, multi-select).
- Two views: a "departure board" list grouped by day (styled like a Swiss transit
  board — monospace time column, day headers) and an image grid.
- No persistence, no backend, no auth, no dedup logic, no timezone edge-case
  handling beyond basic `Europe/Zurich` display — it's a proof of concept, not
  production code.

This is a reasonable starting point for the frontend, but for a "real" deployed app
you'll likely want to rebuild the data layer properly (see below) and can decide
whether to keep, heavily rewrite, or discard the prototype's frontend code.

## Ideas for expanded functionality

Not prescriptive — the user will direct the actual architecture/scope with the
coding agent — but things that came up as plausible directions:

- **Real backend + cache/DB** instead of fetching Guidle live from the browser on
  every visit: poll periodically (their own cache refreshes every ~15 min, so
  polling more than hourly is pointless), store events in a local database, dedupe
  by `id`, and detect/handle events that disappear or change (cancellations,
  rescheduling).
- **Personal saved filters / preferences** — e.g. "always show me: free, outdoors,
  live music" — persisted per user rather than re-selected every visit.
- **Digest/notifications** — daily or weekly email, push, or RSS feed of upcoming
  matching events, so discovery doesn't require actively visiting the app.
- **ICS/calendar export** — subscribe to a filtered view as a calendar feed.
- **Map view** — `lat`/`lng` are available on most offers; a map-based browse mode
  could complement the list.
- **Historical archive / search** — since Guidle's own site presumably only shows
  upcoming events, keeping a local history could enable "what happened here before"
  type queries, or trend views (busiest weekends, most common categories, etc.).
- **Multi-language** — `language` param suggests `de`/`fr`/`it` are likely also
  available from the same API.
- **Better category taxonomy** — categories arrive as free-text comma-separated
  strings; normalizing/mapping them to a clean taxonomy would make filtering more
  reliable than string matching.

## Attribution / etiquette note

This data belongs to Guidle / zuerich.com, surfaced via a public but undocumented
API that isn't intended for third-party consumption. This is a personal-use
project, not a redistribution product — worth keeping it that way (no public
re-hosting of their images/content at scale, reasonable polling frequency, and
linking back to the original listing `url` for each event, as the prototype does).
