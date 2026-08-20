<script lang="ts">
  import { onMount } from "svelte";
  import { fetchCategories, fetchEvents, fetchMeta } from "./api.js";
  import CategoryChips from "./lib/CategoryChips.svelte";
  import DateRangeChips from "./lib/DateRangeChips.svelte";
  import DepartureBoard from "./lib/DepartureBoard.svelte";
  import { dateRangeFor, filters } from "./lib/filters.svelte.js";
  import ImageGrid from "./lib/ImageGrid.svelte";
  import SearchBar from "./lib/SearchBar.svelte";
  import ThemeToggle from "./lib/ThemeToggle.svelte";
  import ViewToggle from "./lib/ViewToggle.svelte";
  import type { CategoryFacet, EventItem, MetaResponse } from "./types.js";

  let events = $state<EventItem[]>([]);
  let total = $state(0);
  let categories = $state<CategoryFacet[]>([]);
  let meta = $state<MetaResponse | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(() => {
    fetchCategories().then((r) => (categories = r.categories));
    fetchMeta().then((r) => (meta = r));
  });

  let debounceTimer: ReturnType<typeof setTimeout>;

  $effect(() => {
    // Track every filter field so this effect reruns on any change.
    const search = filters.search;
    const dateRange = filters.dateRange;
    const selectedCategories = [...filters.categories];

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loading = true;
      error = null;
      const { from, to } = dateRangeFor(dateRange);
      fetchEvents({ search: search || undefined, from, to, categories: selectedCategories, pageSize: 500 })
        .then((r) => {
          events = r.events;
          total = r.total;
        })
        .catch((err) => (error = err instanceof Error ? err.message : String(err)))
        .finally(() => (loading = false));
    }, 200);
  });
</script>

<main>
  <header>
    <div class="header-row">
      <h1>Zürich Events</h1>
      <ThemeToggle />
    </div>
    {#if meta}
      <div class="meta">
        {meta.activeEventCount} events tracked · last refreshed
        {meta.lastPollFinishedAt ? new Date(meta.lastPollFinishedAt).toLocaleString() : "never"}
      </div>
    {/if}
  </header>

  <div class="controls">
    <SearchBar />
    <DateRangeChips />
    <CategoryChips {categories} />
    <ViewToggle />
  </div>

  <div class="status">
    {#if loading}Loading…{:else}{total} events{/if}
    {#if error}<span class="error">{error}</span>{/if}
  </div>

  {#if filters.view === "board"}
    <DepartureBoard {events} />
  {:else}
    <ImageGrid {events} />
  {/if}
</main>

<style>
  main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1.5rem 1rem 4rem;
  }
  header {
    margin-bottom: 1.2rem;
  }
  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  h1 {
    margin: 0 0 0.2rem;
    font-size: 1.6rem;
  }
  .meta {
    color: var(--text-muted);
    font-size: 0.8rem;
  }
  .controls {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    margin-bottom: 1.2rem;
  }
  .status {
    color: var(--text-muted);
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }
  .error {
    color: var(--error);
    margin-left: 0.6rem;
  }
</style>
