<script lang="ts">
  import { displayTitle } from "./language.svelte.js";
  import { hiddenEvents, unhideEvent } from "./hidden.svelte.js";
</script>

<div class="hidden-page">
  {#if hiddenEvents.size === 0}
    <p class="empty">No hidden events. Use the eye icon on any event card to hide it.</p>
  {:else}
    <div class="list">
      {#each [...hiddenEvents.entries()].sort((a, b) => b[1].hiddenAt.localeCompare(a[1].hiddenAt)) as [key, info] (key)}
        <div class="item">
          <div class="thumb" style:background-image={info.imageUrl ? `url(${info.imageUrl})` : undefined}>
            {#if !info.imageUrl}<span class="no-image">No image</span>{/if}
          </div>
          <div class="info">
            <div class="title">{displayTitle(info)}</div>
            <div class="meta">{info.venue ?? ""}{info.venue ? " · " : ""}{info.firstShow}</div>
          </div>
          <button class="unhide-btn" onclick={() => unhideEvent(key)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Unhide
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .empty {
    color: var(--text-muted);
    padding: 2rem 0;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.6rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--bg-elevated);
  }
  .thumb {
    width: 4rem;
    height: 4rem;
    flex-shrink: 0;
    border-radius: 4px;
    background-size: cover;
    background-position: center;
    background-color: var(--hover-bg);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .no-image {
    color: var(--text-faint);
    font-size: 0.65rem;
    text-align: center;
  }
  .info {
    flex: 1;
    min-width: 0;
  }
  .title {
    font-weight: 600;
    color: var(--text);
  }
  .meta {
    font-size: 0.8rem;
    color: var(--text-muted);
  }
  .unhide-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
    padding: 0.4rem 0.7rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
    font-size: 0.85rem;
  }
  .unhide-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
  .unhide-btn svg {
    width: 1rem;
    height: 1rem;
  }
</style>
