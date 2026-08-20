<script lang="ts">
  import { filters } from "./filters.svelte.js";
</script>

{#if filters.view === "grid"}
  <button
    class="chip"
    class:active={filters.groupRecurring}
    onclick={() => (filters.groupRecurring = !filters.groupRecurring)}
  >
    Group recurring events
  </button>
{/if}

<style>
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
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
</style>
