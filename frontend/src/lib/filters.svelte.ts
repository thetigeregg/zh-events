import type { DateRangePreset, ViewMode } from "../types.js";

// Filter chips (date range + category) default open on a wide viewport where
// they don't cost much vertical space, and default collapsed behind a
// "Filters" toggle on a narrow one, where a dozen-plus category chips would
// push every event below the fold before the user sees anything.
const MOBILE_BREAKPOINT_QUERY = "(max-width: 640px)";

export const filters = $state({
  search: "",
  dateRange: "next7" as DateRangePreset,
  categories: new Set<string>(),
  view: "grid" as ViewMode,
  // Only meaningful (and only shown) in grid view — the departure board is
  // inherently a day-by-day listing, where grouping a recurring event across
  // its many days would fight the view's own purpose.
  groupRecurring: true,
  filtersOpen: !window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches,
});

export function toggleFilters() {
  filters.filtersOpen = !filters.filtersOpen;
}

export function activeFilterCount(): number {
  let count = filters.categories.size;
  if (filters.dateRange !== "next7") count++;
  return count;
}

function toDateString(d: Date): string {
  // Use local date components, not toISOString() — that converts to UTC,
  // which is off by a day for any timezone ahead of UTC (e.g. Europe/Zurich)
  // once local midnight has already passed UTC midnight.
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function dateRangeFor(preset: DateRangePreset): { from?: string; to?: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (preset) {
    case "today":
      return { from: toDateString(today), to: toDateString(today) };
    case "tomorrow": {
      const tomorrow = addDays(today, 1);
      return { from: toDateString(tomorrow), to: toDateString(tomorrow) };
    }
    case "weekend": {
      const day = today.getDay(); // 0 = Sunday
      const daysUntilSaturday = (6 - day + 7) % 7;
      const saturday = addDays(today, daysUntilSaturday);
      const sunday = addDays(saturday, 1);
      return { from: toDateString(saturday), to: toDateString(sunday) };
    }
    case "next7":
      return { from: toDateString(today), to: toDateString(addDays(today, 7)) };
    case "next30":
      return { from: toDateString(today), to: toDateString(addDays(today, 30)) };
    case "all":
      return { from: toDateString(today) };
  }
}

export function toggleCategory(category: string) {
  if (filters.categories.has(category)) {
    filters.categories.delete(category);
  } else {
    filters.categories.add(category);
  }
}
