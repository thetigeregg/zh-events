import type { CategoriesResponse, EventsResponse, MetaResponse } from "./types.js";

export interface EventsQuery {
  search?: string;
  from?: string;
  to?: string;
  categories?: string[];
  group?: "day" | "event";
  page?: number;
  pageSize?: number;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} failed: HTTP ${res.status}`);
  return (await res.json()) as T;
}

export function fetchEvents(query: EventsQuery): Promise<EventsResponse> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.group) params.set("group", query.group);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  for (const category of query.categories ?? []) params.append("category", category);

  return getJson(`/api/events?${params.toString()}`);
}

export function fetchCategories(): Promise<CategoriesResponse> {
  return getJson("/api/categories");
}

export function fetchMeta(): Promise<MetaResponse> {
  return getJson("/api/meta");
}
