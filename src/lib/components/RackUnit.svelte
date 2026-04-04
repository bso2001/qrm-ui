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

<div class="rack-unit" class:sub-module={subModule}>
  {#if title}
    <div class="module-header">
      <div class="header-left">
        {#if showNav}
          <div class="nav-controls">
            <button class="nav-btn prev" on:click={() => dispatch('prev')} title="Previous">&larr;</button>
            <button class="nav-btn next" on:click={() => dispatch('next')} title="Next">&rarr;</button>
          </div>
        {/if}
        <span class="title-text">{title}</span>
      </div>
      
      <div class="header-right">
        {#if navLabel}
          <span class="nav-label">{navLabel}</span>
        {/if}
        
        <div class="action-controls">
          {#if showInsert}
            <div class="insert-group">
              <button class="action-btn insert-btn" on:click={() => dispatch('insert', 'start')} title="Insert at Start">&lt;</button>
              <button class="action-btn insert-btn" on:click={() => dispatch('insert', 'current')} title="Insert at Current Position">^</button>
              <button class="action-btn insert-btn" on:click={() => dispatch('insert', 'end')} title="Insert at End">&gt;</button>
            </div>
          {/if}
          {#if showDelete}
            <button class="action-btn delete-btn" on:click={() => dispatch('delete')} title="Delete">×</button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  <div class="content">
    <slot />
  </div>
</div>

<style>
  .rack-unit {
    background: linear-gradient(135deg, #333 0%, #222 50%, #111 100%);
    border: 1px solid #444;
    border-bottom: 2px solid #000;
    margin-bottom: 20px;
    padding: 20px;
    position: relative;
    box-shadow: 0 4px 8px rgba(0,0,0,0.6);
    display: flex;
    flex-direction: column;
    border-radius: 2px;
  }

  .sub-module {
    background: #252525;
    margin: 10px auto 20px auto; /* Centered horizontally */
    width: 95%; /* Take up most of the width */
    padding: 15px;
  }

  .module-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #333;
    padding-bottom: 8px;
    width: 100%;
  }

  .header-left, .header-right {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .title-text {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #eee;
    font-weight: 900;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  }

  .nav-controls {
    display: flex;
    gap: 4px;
  }

  .nav-label {
    font-size: 10px;
    color: var(--accent, #00ff00);
    text-shadow: 0 0 8px var(--accent, #00ff00);
    font-weight: bold;
    letter-spacing: 1px;
    background: rgba(0,0,0,0.4);
    padding: 2px 8px;
    border-radius: 10px;
    border: 1px solid #333;
  }

  /* Nav Buttons Style */
  .nav-btn {
    width: 24px;
    height: 24px;
    background: linear-gradient(to bottom, #333, #111);
    border: 1px solid #444;
    color: var(--accent, #00ff00);
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.5);
    transition: all 0.1s;
  }
  .nav-btn:hover {
    background: #222;
    border-color: var(--accent, #00ff00);
    box-shadow: 0 0 10px var(--accent, #00ff00);
    transform: scale(1.1);
  }
  .nav-btn:active {
    transform: scale(0.95);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.8);
  }

  .action-controls {
    display: flex;
    gap: 8px;
    margin-left: 10px;
  }

  .action-btn {
    width: 22px;
    height: 22px;
    background: #111;
    border: 1px solid #444;
    color: #888;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.1s;
    line-height: 1;
  }

  .insert-group {
    display: flex;
    gap: 2px;
    background: #0a0a0a;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 2px;
  }

  .insert-group .action-btn {
    border: none;
    background: transparent;
    width: 20px;
    height: 20px;
  }

  .insert-btn:hover {
    background: #222;
    color: #00ff00;
  }

  .delete-btn:hover {
    border-color: #ff3333;
    color: #ff3333;
    box-shadow: 0 0 10px rgba(255,51,51,0.3);
  }

  .content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center; /* Center content horizontally */
  }
</style>
