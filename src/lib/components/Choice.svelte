<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: string = '';
  export let options: string[] = [];
  export let width: string = 'auto';
  export let color: string = '#00ff00';
  export let inherited: boolean = false;

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
  class:inherited
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
    background-color: var(--bg-input);
    color: var(--text-main);
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid var(--border-input);
    cursor: pointer;
    user-select: none;
    min-width: 60px;
    width: var(--width);
    transition: all 0.2s;
  }

  .choice-container.inherited {
    opacity: 0.5;
  }

  .choice-container.inherited:hover {
    opacity: 0.8;
  }

  .choice-container:hover {
    border-color: var(--text-muted);
    background-color: var(--bg-hover);
  }

  .display {
    font-size: 1rem;
    font-weight: 500;
    text-align: center;
  }

  .indicators {
    display: flex;
    justify-content: center;
    gap: 4px;
    margin-top: 6px;
  }

  .dot {
    width: 6px;
    height: 6px;
    background: var(--border-input);
    border-radius: 50%;
    transition: background-color 0.2s;
  }

  .dot.active {
    background: var(--accent);
  }
</style>
