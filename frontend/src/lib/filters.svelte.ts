import type { DateRangePreset, ViewMode } from "../types.js";

export const filters = $state({
  search: "",
  dateRange: "next7" as DateRangePreset,
  categories: new Set<string>(),
  view: "board" as ViewMode,
});

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
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
