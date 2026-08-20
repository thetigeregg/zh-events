import { SvelteMap } from "svelte/reactivity";
import type { EventItem } from "../types.js";

// Hidden by (title, venue), not the raw event id — a recurring event's
// occurrences each get a different backend id (see events API's group=event
// design), so hiding "today's" id would leave every other date of the same
// series visible. Title+venue is the same heuristic already used to group
// recurring events together, and stays stable across occurrences.
export interface HiddenEventInfo {
  title: string;
  translatedTitle: string | null;
  venue: string | null;
  imageUrl: string | null;
  detailUrl: string;
  firstShow: string;
  hiddenAt: string;
}

const STORAGE_KEY = "hiddenEvents";

export function hiddenEventKey(event: Pick<EventItem, "title" | "venue">): string {
  return `${event.title}::${event.venue ?? ""}`;
}

function loadHidden(): [string, HiddenEventInfo][] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return Object.entries(JSON.parse(raw) as Record<string, HiddenEventInfo>);
  } catch {
    return [];
  }
}

export const hiddenEvents = new SvelteMap<string, HiddenEventInfo>(loadHidden());

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(hiddenEvents)));
}

export function isHidden(event: Pick<EventItem, "title" | "venue">): boolean {
  return hiddenEvents.has(hiddenEventKey(event));
}

export function hideEvent(event: EventItem) {
  hiddenEvents.set(hiddenEventKey(event), {
    title: event.title,
    translatedTitle: event.translatedTitle,
    venue: event.venue,
    imageUrl: event.imageUrl,
    detailUrl: event.detailUrl,
    firstShow: event.firstShow,
    hiddenAt: new Date().toISOString(),
  });
  persist();
}

export function unhideEvent(key: string) {
  hiddenEvents.delete(key);
  persist();
}
