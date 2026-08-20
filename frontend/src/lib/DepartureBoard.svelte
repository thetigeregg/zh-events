<script lang="ts">
  import { displayTitle } from "./language.svelte.js";
  import type { EventItem } from "../types.js";

  let { events }: { events: EventItem[] } = $props();

  const dayFormatter = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  let groups = $derived.by(() => {
    const map = new Map<string, EventItem[]>();
    for (const event of events) {
      const list = map.get(event.firstShow) ?? [];
      list.push(event);
      map.set(event.firstShow, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  });
</script>

<div class="board">
  {#each groups as [date, dayEvents] (date)}
    <div class="day-group">
      <div class="day-header">{dayFormatter.format(new Date(`${date}T00:00:00`))}</div>
      {#each dayEvents as event (event.id)}
        <a class="row" href={event.detailUrl} target="_blank" rel="noreferrer">
          <span class="time">{event.schedule ?? "—"}</span>
          <span class="title">{displayTitle(event)}</span>
          <span class="venue">{event.venue ?? ""}</span>
          <span class="categories">{event.categories.join(", ")}</span>
        </a>
      {/each}
    </div>
  {/each}
</div>

<style>
  .board {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .day-header {
    font-family: monospace;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--time-color);
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.3rem;
    margin-bottom: 0.4rem;
  }
  .row {
    display: grid;
    grid-template-columns: 5.5rem 1fr 1fr;
    gap: 0.75rem;
    padding: 0.45rem 0.2rem;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text);
    text-decoration: none;
  }
  .row:hover {
    background: var(--hover-bg);
  }
  .time {
    font-family: monospace;
    color: var(--time-color);
  }
  .title {
    font-weight: 600;
  }
  .venue {
    color: var(--text-muted);
  }
  .categories {
    grid-column: 2 / span 2;
    font-size: 0.75rem;
    color: var(--text-faint);
  }
</style>
