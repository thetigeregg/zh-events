<script lang="ts">
  import { displayTitle } from "./language.svelte.js";
  import { hideEvent } from "./hidden.svelte.js";
  import type { EventItem } from "../types.js";

  let { events }: { events: EventItem[] } = $props();

  function dateLine(event: EventItem): string {
    // event.lastShow is only ever set when the backend grouped this row
    // across multiple days (the "group recurring events" toggle) — a single
    // day's row (with 0+ same-day showtimes already merged) never has it.
    if (event.lastShow) {
      const range = event.lastShow !== event.firstShow ? `${event.firstShow} – ${event.lastShow}` : event.firstShow;
      const dates = event.occurrenceCount === 1 ? "1 date" : `${event.occurrenceCount} dates`;
      return `${range} · ${dates}`;
    }
    if (event.schedules.length > 0) return `${event.firstShow} · ${event.schedules.join(", ")}`;
    return event.firstShow;
  }
</script>

<div class="grid">
  {#each events as event (event.id)}
    <div class="card-wrap">
      <a class="card" href={event.detailUrl} target="_blank" rel="noreferrer">
        <div class="image" style:background-image={event.imageUrl ? `url(${event.imageUrl})` : undefined}>
          {#if !event.imageUrl}<span class="no-image">No image</span>{/if}
        </div>
        <div class="body">
          <div class="date">{dateLine(event)}</div>
          <div class="title">{displayTitle(event)}</div>
          <div class="venue">{event.venue ?? ""}</div>
        </div>
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

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
  }

  @media (max-width: 560px) {
    .grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.6rem;
    }
    .body {
      padding: 0.5rem;
    }
    .title {
      font-size: 0.9rem;
    }
    .venue,
    .date {
      font-size: 0.7rem;
    }
  }
  .card-wrap {
    position: relative;
  }
  .card {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    color: var(--text);
    text-decoration: none;
    background: var(--bg-elevated);
  }
  .card:hover {
    border-color: var(--accent);
  }
  .hide-btn {
    position: absolute;
    top: 0.4rem;
    right: 0.4rem;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.8rem;
    height: 1.8rem;
    border-radius: 999px;
    border: none;
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    cursor: pointer;
  }
  .hide-btn:hover {
    background: rgba(0, 0, 0, 0.8);
  }
  .hide-btn svg {
    width: 1rem;
    height: 1rem;
  }
  .image {
    aspect-ratio: 4 / 3;
    background-size: cover;
    background-position: center;
    background-color: var(--hover-bg);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .no-image {
    color: var(--text-faint);
    font-size: 0.8rem;
  }
  .body {
    padding: 0.6rem 0.7rem;
  }
  .date {
    font-family: monospace;
    font-size: 0.75rem;
    color: var(--time-color);
  }
  .title {
    font-weight: 600;
    margin: 0.2rem 0;
  }
  .venue {
    font-size: 0.8rem;
    color: var(--text-muted);
  }
</style>
