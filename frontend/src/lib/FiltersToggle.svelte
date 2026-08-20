<script lang="ts">
  import { activeFilterCount, filters, toggleFilters } from "./filters.svelte.js";
</script>

<button
  class="filters-toggle"
  class:active={filters.filtersOpen}
  type="button"
  onclick={toggleFilters}
  aria-expanded={filters.filtersOpen}
>
  Filters
  {#if activeFilterCount() > 0}
    <span class="badge">{activeFilterCount()}</span>
  {/if}
  <svg
    class="chevron"
    class:open={filters.filtersOpen}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
</button>

<style>
  .filters-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.6rem 0.9rem;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--bg-elevated);
    color: var(--text);
    cursor: pointer;
    font-size: 0.9rem;
    white-space: nowrap;
  }
  .filters-toggle.active {
    border-color: var(--accent);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.2rem;
    height: 1.2rem;
    padding: 0 0.3rem;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    font-size: 0.7rem;
    font-weight: 600;
  }
  .chevron {
    width: 1rem;
    height: 1rem;
    transition: transform 0.15s ease;
  }
  .chevron.open {
    transform: rotate(180deg);
  }
</style>
