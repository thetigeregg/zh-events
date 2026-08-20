<script lang="ts">
  import { filters, toggleCategory } from "./filters.svelte.js";
  import type { CategoryFacet } from "../types.js";

  let { categories }: { categories: CategoryFacet[] } = $props();
</script>

<div class="chips">
  {#each categories as cat (cat.name)}
    <button
      class="chip"
      class:active={filters.categories.has(cat.name)}
      onclick={() => toggleCategory(cat.name)}
    >
      {cat.name} <span class="count">{cat.count}</span>
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
  .count {
    opacity: 0.7;
    font-size: 0.75em;
  }
</style>
