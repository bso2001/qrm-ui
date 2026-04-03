<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: string = '';
  export let options: string[] = [];
  export let width: string = 'auto';
  export let color: string = '#00ff00';

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

<div 
  class="choice-container" 
  style="--width: {width}; --accent: {color}"
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

<style>
  .choice-container {
    display: flex;
    flex-direction: column;
    background-color: #000;
    color: var(--accent);
    padding: 8px 10px;
    border-radius: 2px;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.8);
    border: 1px solid #222;
    cursor: pointer;
    user-select: none;
    min-width: 60px;
    width: var(--width);
    transition: border-color 0.1s;
  }

  .choice-container:hover {
    border-color: #444;
  }

  .display {
    font-size: 16px;
    text-shadow: 0 0 8px var(--accent);
    font-family: 'Courier New', Courier, monospace;
    font-weight: bold;
    text-align: center;
    text-transform: uppercase;
  }

  .indicators {
    display: flex;
    justify-content: center;
    gap: 3px;
    margin-top: 4px;
  }

  .dot {
    width: 4px;
    height: 4px;
    background: #222;
    border-radius: 50%;
  }

  .dot.active {
    background: var(--accent);
    box-shadow: 0 0 4px var(--accent);
  }
</style>
