<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: string = '';
  export let options: string[] = [];
  export let width: string = 'auto';
  export let color: string = '#00ff00';
  export let inherited: boolean = false;
  export let label: string = '';
  export let layout: 'row' | 'column' = 'column';
  export let fontSize: string = '0.95rem';

  const dispatch = createEventDispatcher();

  function next() {
    const currentIndex = options.indexOf(value);
    const nextIndex = (currentIndex + 1) % options.length;
    value = options[nextIndex];
    dispatch('change', value);
  }

  function prev(e: MouseEvent) {
    e.preventDefault();
    const currentIndex = options.indexOf(value);
    const nextIndex = (currentIndex - 1 + options.length) % options.length;
    value = options[nextIndex];
    dispatch('change', value);
  }
</script>

<div class="choice-container {layout}" style="--width: {width}; --accent: {color}; --font-size: {fontSize}" class:inherited>
  {#if label}
    <span class="choice-label">{label}</span>
  {/if}
  
  <div 
    class="choice-box" 
    on:click={next}
    on:contextmenu={prev}
  >
    <div class="display">
      {value}
    </div>
    <div class="indicators">
      {#each options as opt}
        <div class="dot" class:active={opt === value}></div>
      {/each}
    </div>
  </div>
</div>

<style>
  .choice-container {
    display: flex;
    margin: 5px;
    width: var(--width);
    transition: opacity 0.2s;
    align-items: center;
  }

  .choice-container.column {
    flex-direction: column;
    align-items: center;
  }

  .choice-container.row {
    flex-direction: row;
    gap: 8px;
    justify-content: flex-end;
  }

  .choice-container.inherited {
    opacity: 0.5;
  }

  .choice-container.inherited:hover {
    opacity: 0.8;
  }

  .choice-box {
    background-color: var(--bg-input);
    color: var(--text-main);
    padding: 0 8px;
    border-radius: 4px;
    border: 1px solid var(--border-input);
    cursor: pointer;
    user-select: none;
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 34px;
    position: relative;
  }

  .choice-box:hover {
    border-color: var(--text-muted);
    background-color: var(--bg-hover);
  }

  .display {
    font-size: var(--font-size, 0.95rem);
    font-weight: 600;
    text-align: center;
    line-height: 1;
    margin-top: -4px;
  }

  .indicators {
    display: flex;
    justify-content: center;
    gap: 3px;
    position: absolute;
    bottom: 5px;
    left: 0;
    right: 0;
  }

  .dot {
    width: 4px;
    height: 4px;
    background: var(--border-input);
    border-radius: 50%;
    transition: background-color 0.2s;
  }

  .dot.active {
    background: var(--accent);
  }

  .choice-label {
    font-size: 0.7rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
    white-space: nowrap;
  }

  .column .choice-label {
    margin-bottom: 4px;
    text-align: center;
  }

  .row .choice-label {
    margin-bottom: 0;
  }
</style>
