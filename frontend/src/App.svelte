<script lang="ts">
  import { onMount } from "svelte";
  import { fetchCategories, fetchEvents, fetchMeta } from "./api.js";
  import CategoryChips from "./lib/CategoryChips.svelte";
  import DateRangeChips from "./lib/DateRangeChips.svelte";
  import DepartureBoard from "./lib/DepartureBoard.svelte";
  import { dateRangeFor, filters } from "./lib/filters.svelte.js";
  import FiltersToggle from "./lib/FiltersToggle.svelte";
  import GroupToggle from "./lib/GroupToggle.svelte";
  import { isHidden } from "./lib/hidden.svelte.js";
  import HiddenEventsPage from "./lib/HiddenEventsPage.svelte";
  import HiddenEventsToggle from "./lib/HiddenEventsToggle.svelte";
  import ImageGrid from "./lib/ImageGrid.svelte";
  import LanguageToggle from "./lib/LanguageToggle.svelte";
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
  let page = $state<"events" | "hidden">("events");

  let visibleEvents = $derived(events.filter((e) => !isHidden(e)));

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
    const group = filters.view === "grid" && filters.groupRecurring ? "event" : "day";

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loading = true;
      error = null;
      const { from, to } = dateRangeFor(dateRange);
      fetchEvents({ search: search || undefined, from, to, categories: selectedCategories, group, pageSize: 500 })
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
  <div class="sticky-bar">
    <header>
      <div class="header-row">
        <h1>Zürich Events</h1>
        <div class="header-actions">
          <HiddenEventsToggle {page} onToggle={() => (page = page === "hidden" ? "events" : "hidden")} />
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
      {#if meta}
        <div class="meta">
          {meta.activeEventCount} events tracked · last refreshed
          {meta.lastPollFinishedAt ? new Date(meta.lastPollFinishedAt).toLocaleString() : "never"}
        </div>
      {/if}
    </header>

    {#if page === "events"}
      <div class="toolbar">
        <div class="search-wrap"><SearchBar /></div>
        <FiltersToggle />
      </div>
      <div class="view-row">
        <ViewToggle />
        <GroupToggle />
      </div>
    {/if}
  </div>

  {#if page === "hidden"}
    <HiddenEventsPage />
  {:else}
    {#if filters.filtersOpen}
      <div class="filters-panel">
        <div class="filter-section">
          <span class="filter-label">When</span>
          <DateRangeChips />
        </div>
        <div class="filter-section category-section">
          <span class="filter-label">Category</span>
          <CategoryChips {categories} />
        </div>
      </div>
    {/if}

    <div class="status">
      {#if loading}Loading…{:else}{visibleEvents.length} events{/if}
      {#if error}<span class="error">{error}</span>{/if}
    </div>

    {#if filters.view === "board"}
      <DepartureBoard events={visibleEvents} />
    {:else}
      <ImageGrid events={visibleEvents} />
    {/if}
  {/if}
</main>

<style>
  main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1rem 4rem;
  }
  .sticky-bar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg);
    padding-top: 1.5rem;
    padding-bottom: 0.7rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 0.8rem;
  }
  header {
    margin-bottom: 0.8rem;
  }
  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }
  .header-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  h1 {
    margin: 0 0 0.2rem;
    font-size: 1.6rem;
  }
  .meta {
    color: var(--text-muted);
    font-size: 0.8rem;
  }
  .toolbar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.6rem;
  }
  .search-wrap {
    flex: 1;
    min-width: 0;
  }
  .view-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .filters-panel {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    margin-bottom: 1.2rem;
  }
  .filter-section {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }
  .filter-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-faint);
  }
  .category-section {
    padding-top: 0.7rem;
    border-top: 1px solid var(--border-subtle);
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

  @media (max-width: 640px) {
    main {
      padding: 0 0.75rem 3rem;
    }
    .sticky-bar {
      padding-top: 1rem;
    }
    h1 {
      font-size: 1.25rem;
    }
    .meta {
      display: none;
    }
  }
</style>
