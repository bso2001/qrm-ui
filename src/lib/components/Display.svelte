<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: any = '';
  export let label: string = '';
  export let width: string = 'auto';
  export let color: string = '#00ff00';
  export let fontSize: string = '16px';

  const dispatch = createEventDispatcher();

  function handleChange(event: Event) {
    const newVal = (event.target as HTMLInputElement).value;
    dispatch('change', newVal);
  }
</script>

<div class="display-container" style="--width: {width}">
  {#if label}
    <span class="display-label">{label}</span>
  {/if}
  <input 
    type="text"
    class="display-input" 
    style="--accent: {color}; font-size: {fontSize}"
    value={typeof value === 'object' ? JSON.stringify(value) : value}
    on:change={handleChange}
  />
</div>

<style>
  .display-container {
    display: flex;
    flex-direction: column;
    margin: 5px;
    width: var(--width);
  }

  .display-input {
    background-color: #000;
    color: var(--accent);
    padding: 8px 10px;
    border-radius: 2px;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.8);
    text-shadow: 0 0 8px var(--accent);
    border: 1px solid #222;
    font-family: 'Courier New', Courier, monospace;
    width: 100%;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.1s;
    font-weight: bold;
    min-width: 0;
  }

  .display-input:focus {
    border-color: var(--accent);
  }

  .display-label {
    font-size: 11px;
    color: #eee;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 900;
    text-shadow: 0 1px 2px rgba(0,0,0,1);
  }
</style>
