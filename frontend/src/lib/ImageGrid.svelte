<script lang="ts">
  import type { EventItem } from "../types.js";

  let { events }: { events: EventItem[] } = $props();
</script>

<div class="grid">
  {#each events as event (event.id)}
    <a class="card" href={event.detailUrl} target="_blank" rel="noreferrer">
      <div class="image" style:background-image={event.imageUrl ? `url(${event.imageUrl})` : undefined}>
        {#if !event.imageUrl}<span class="no-image">No image</span>{/if}
      </div>
      <div class="body">
        <div class="date">{event.firstShow} · {event.schedule ?? "—"}</div>
        <div class="title">{event.title}</div>
        <div class="venue">{event.venue ?? ""}</div>
      </div>
    </a>
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
  }
  .card {
    display: flex;
    flex-direction: column;
    border: 1px solid #222;
    border-radius: 6px;
    overflow: hidden;
    color: #eee;
    text-decoration: none;
    background: #111;
  }
  .card:hover {
    border-color: #444;
  }
  .image {
    aspect-ratio: 4 / 3;
    background-size: cover;
    background-position: center;
    background-color: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .no-image {
    color: #555;
    font-size: 0.8rem;
  }
  .body {
    padding: 0.6rem 0.7rem;
  }
  .date {
    font-family: monospace;
    font-size: 0.75rem;
    color: #f59e0b;
  }
  .title {
    font-weight: 600;
    margin: 0.2rem 0;
  }
  .venue {
    font-size: 0.8rem;
    color: #999;
  }
</style>
