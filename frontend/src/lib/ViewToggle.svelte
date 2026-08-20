<script lang="ts">
  import { filters } from "./filters.svelte.js";
</script>

<div class="toggle">
  <button class:active={filters.view === "board"} onclick={() => (filters.view = "board")}>
    Board
  </button>
  <button class:active={filters.view === "grid"} onclick={() => (filters.view = "grid")}>
    Grid
  </button>
</div>

<style>
  .toggle {
    display: flex;
    border: 1px solid #333;
    border-radius: 4px;
    overflow: hidden;
  }
  .toggle button {
    padding: 0.5rem 1rem;
    background: #111;
    color: #ccc;
    border: none;
    cursor: pointer;
  }
  .toggle button.active {
    background: #2563eb;
    color: #fff;
  }
</style>
