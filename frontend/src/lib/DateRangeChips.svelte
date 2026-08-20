<script lang="ts">
  import { filters } from "./filters.svelte.js";
  import type { DateRangePreset } from "../types.js";

  const options: { value: DateRangePreset; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "tomorrow", label: "Tomorrow" },
    { value: "weekend", label: "This weekend" },
    { value: "next7", label: "Next 7 days" },
    { value: "next30", label: "Next 30 days" },
    { value: "all", label: "All upcoming" },
  ];
</script>

<div class="chips">
  {#each options as opt (opt.value)}
    <button
      class="chip"
      class:active={filters.dateRange === opt.value}
      onclick={() => (filters.dateRange = opt.value)}
    >
      {opt.label}
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
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }
</style>
