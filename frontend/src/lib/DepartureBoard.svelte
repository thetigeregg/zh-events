<script lang="ts">
  import { displayTitle } from "./language.svelte.js";
  import { hideEvent } from "./hidden.svelte.js";
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
        <div class="row-wrap">
          <a class="row" href={event.detailUrl} target="_blank" rel="noreferrer">
            <span class="time">{event.schedules.length > 0 ? event.schedules.join(", ") : "—"}</span>
            <span class="title">{displayTitle(event)}</span>
            <span class="venue">{event.venue ?? ""}</span>
            <span class="categories">{event.categories.join(", ")}</span>
          </a>
          <button class="hide-btn" onclick={() => hideEvent(event)} title="Hide this event" aria-label="Hide this event">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
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
  .row-wrap {
    position: relative;
  }
  .row {
    display: grid;
    grid-template-columns: 5.5rem 1fr 1fr;
    gap: 0.75rem;
    padding: 0.45rem 2.2rem 0.45rem 0.2rem;
    border-bottom: 1px solid var(--border-subtle);
    color: var(--text);
    text-decoration: none;
  }
  .row:hover {
    background: var(--hover-bg);
  }
  .hide-btn {
    position: absolute;
    top: 0.3rem;
    right: 0.1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.8rem;
    height: 1.8rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--bg-elevated);
    color: var(--text-muted);
    cursor: pointer;
  }
  .hide-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .hide-btn svg {
    width: 0.95rem;
    height: 0.95rem;
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

  @media (max-width: 560px) {
    .row {
      grid-template-columns: 1fr;
      gap: 0.15rem;
      padding: 0.6rem 2.2rem 0.6rem 0.2rem;
    }
    .categories {
      grid-column: 1;
    }
    .hide-btn {
      top: 0.5rem;
    }
  }
</style>
