<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let title: string = '';
  export let subModule: boolean = false;
  export let showNav: boolean = false;
  export let navLabel: string = '';
  export let showInsert: boolean = false;
  export let showDelete: boolean = false;

  const dispatch = createEventDispatcher();
</script>

<div class="card" class:sub-module={subModule}>
  {#if title || $$slots['header-left-extra'] || $$slots['header-right-extra']}
    <div class="card-header">
      <div class="header-left">
        {#if showNav}
          <div class="nav-controls">
            <button class="icon-btn" on:click={() => dispatch('prev')} title="Previous">❮</button>
            <button class="icon-btn" on:click={() => dispatch('next')} title="Next">❯</button>
          </div>
        {/if}
        {#if title}
          <h3 class="title-text">{title}</h3>
        {/if}
        <slot name="header-left-extra" />
      </div>
      
      <div class="header-right">
        <slot name="header-right-extra" />
        {#if navLabel}
          <span class="nav-label">{navLabel}</span>
        {/if}
        
        <div class="action-controls">
          {#if showInsert}
            <div class="insert-group">
              <button class="icon-btn text-btn" on:click={() => dispatch('insert', 'start')} title="Insert at Start">Start</button>
              <button class="icon-btn" on:click={() => dispatch('insert', 'current')} title="Insert Here">+</button>
              <button class="icon-btn text-btn" on:click={() => dispatch('insert', 'end')} title="Insert at End">End</button>
            </div>
          {/if}
          {#if showDelete}
            <button class="icon-btn delete-btn" on:click={() => dispatch('delete')} title="Delete">✕</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  <div class="card-content">
    <slot />
  </div>
</div>

<style>
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border-main);
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--text-main);
  }

  .sub-module {
    background: var(--bg-sub);
    padding: 16px;
    border-color: var(--border-sub);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .card-header:last-child {
    margin-bottom: 0;
  }

  .card-content:empty {
    display: none;
  }

  .header-left, .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .title-text {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-heading);
  }

  .nav-label {
    font-size: 0.85rem;
    color: var(--text-muted);
    font-weight: 500;
    background: var(--bg-main);
    padding: 4px 10px;
    border-radius: 12px;
  }

  .action-controls, .nav-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .insert-group {
    display: flex;
    gap: 4px;
    background: var(--bg-main);
    padding: 4px;
    border-radius: 6px;
  }

  .icon-btn {
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    width: 28px;
    height: 28px;
    font-size: 14px;
    transition: all 0.2s ease;
  }

  .icon-btn.text-btn {
    width: auto;
    padding: 0 8px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .icon-btn:hover {
    background: var(--bg-hover);
    color: var(--text-heading);
  }

  .delete-btn:hover {
    background: #ffe3e3;
    color: #e03131;
  }

  :global(body.dark) .delete-btn:hover {
    background: #4d1515;
    color: #ff6b6b;
  }

  .card-content {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }
</style>
