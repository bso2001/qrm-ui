<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let title: string = '';
  export let subModule: boolean = false;
  export let showNav: boolean = false;
  export let navLabel: string = '';

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
        {:else}
          <div class="screw"></div>
        {/if}
        <span class="title-text">{title}</span>
      </div>
      
      <div class="header-right">
        {#if navLabel}
          <span class="nav-label">{navLabel}</span>
        {/if}
        {#if !showNav}
          <div class="screw"></div>
        {/if}
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
    margin-left: 40px;
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

  /* Screw Heads */
  .screw {
    width: 8px;
    height: 8px;
    background: radial-gradient(circle, #888, #444);
    border-radius: 50%;
    box-shadow: inset 0 1px 1px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.5);
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

  .content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }
</style>
