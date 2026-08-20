<script lang="ts">
  import { language, toggleShowTranslated } from "./language.svelte.js";
</script>

<button
  class="language-toggle"
  class:active={language.showTranslated}
  type="button"
  onclick={toggleShowTranslated}
  title={
    language.showTranslated
      ? "Showing translated titles — click to show original"
      : "Showing original titles — click to show translated"
  }
  aria-label="Toggle translated titles"
  aria-pressed={language.showTranslated}
>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
</button>

<style>
  .language-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.2rem;
    height: 2.2rem;
    flex-shrink: 0;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--bg-elevated);
    color: var(--text-muted);
    cursor: pointer;
  }
  .language-toggle.active {
    color: var(--accent);
    border-color: var(--accent);
  }
  .language-toggle:hover {
    border-color: var(--accent);
  }
  svg {
    width: 1.1rem;
    height: 1.1rem;
  }
</style>
