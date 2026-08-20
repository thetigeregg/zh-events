<script lang="ts">
  import { hiddenEvents } from "./hidden.svelte.js";

  let { page, onToggle }: { page: "events" | "hidden"; onToggle: () => void } = $props();
</script>

<button
  class="hidden-toggle"
  class:active={page === "hidden"}
  type="button"
  onclick={onToggle}
  title={page === "hidden" ? "Back to events" : "View hidden events"}
  aria-label={page === "hidden" ? "Back to events" : "View hidden events"}
>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
  {#if hiddenEvents.size > 0}
    <span class="badge">{hiddenEvents.size}</span>
  {/if}
</button>

<style>
  .hidden-toggle {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.2rem;
    height: 2.2rem;
    flex-shrink: 0;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--bg-elevated);
    color: var(--text);
    cursor: pointer;
  }
  .hidden-toggle.active {
    color: var(--accent);
    border-color: var(--accent);
  }
  .hidden-toggle:hover {
    border-color: var(--accent);
  }
  svg {
    width: 1.1rem;
    height: 1.1rem;
  }
  .badge {
    position: absolute;
    top: -0.3rem;
    right: -0.3rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.15rem;
    height: 1.15rem;
    padding: 0 0.25rem;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    font-size: 0.65rem;
    font-weight: 600;
  }
</style>
