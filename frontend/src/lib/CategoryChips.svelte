<script lang="ts">
  import { filters, toggleAllCategories, toggleCategory } from "./filters.svelte.js";
  import type { CategoryFacet } from "../types.js";

  let { categories }: { categories: CategoryFacet[] } = $props();

  let allSelected = $derived(
    categories.length > 0 && categories.every((cat) => filters.categories.has(cat.name)),
  );
</script>

<div class="chips">
  <button
    class="chip all-chip"
    class:active={allSelected}
    onclick={() => toggleAllCategories(categories.map((c) => c.name))}
  >
    <span class="label">All</span>
  </button>
  {#each categories as cat (cat.name)}
    <button
      class="chip"
      class:active={filters.categories.has(cat.name)}
      onclick={() => toggleCategory(cat.name)}
    >
      <span class="label">{cat.name}</span><span class="count">{cat.count}</span>
    </button>
  {/each}
</div>

<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.8rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--bg-elevated);
    color: var(--text-muted);
    cursor: pointer;
    font-size: 0.85rem;
  }
  .chip.active {
    background: var(--accent-green);
    border-color: var(--accent-green);
    color: #fff;
  }
  .all-chip {
    font-weight: 600;
  }
  .count {
    display: inline-flex;
    align-items: center;
    opacity: 0.7;
    font-size: 0.75em;
    line-height: 1;
  }
</style>
