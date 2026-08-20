export interface EventItem {
  id: string;
  title: string;
  translatedTitle: string | null;
  categories: string[];
  imageUrl: string | null;
  detailUrl: string;
  firstShow: string;
  schedule: string | null;
  venue: string | null;
  lat: number | null;
  lng: number | null;
  advertisement: boolean;
}

export interface EventsResponse {
  events: EventItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CategoryFacet {
  name: string;
  count: number;
}

export interface CategoriesResponse {
  categories: CategoryFacet[];
}

export interface MetaResponse {
  lastPollStartedAt: string | null;
  lastPollFinishedAt: string | null;
  lastPollStatus: string | null;
  activeEventCount: number;
  refreshIntervalDays: number;
}

export type ViewMode = "board" | "grid";

export type DateRangePreset = "today" | "tomorrow" | "weekend" | "next7" | "next30" | "all";
