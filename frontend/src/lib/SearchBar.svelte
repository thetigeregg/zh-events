<script lang="ts">
  import { filters } from "./filters.svelte.js";
</script>

<input
  class="search-bar"
  type="search"
  placeholder="Search title or venue…"
  bind:value={filters.search}
/>

<style>
  .search-bar {
    width: 100%;
    box-sizing: border-box;
    padding: 0.6rem 0.9rem;
    font-size: 1rem;
    border: 1px solid var(--border);
    background: var(--bg-elevated);
    color: var(--text);
    border-radius: 4px;
  }
</style>
