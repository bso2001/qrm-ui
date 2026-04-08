<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: number = 0;
  export let min: number = 0;
  export let max: number = 100;
  export let step: number = 1;
  export let label: string = '';
  export let inherited: boolean = false;
  export let compact: boolean = false;

  const dispatch = createEventDispatcher();

  function handleInput(event: Event) {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val)) {
      value = val;
      dispatch('change', value);
    }
  }
</script>

<div class="slider-container" class:inherited class:compact>
  {#if label}
    <div class="header">
      <span class="value">{value % 1 === 0 ? value : value.toFixed(2)}</span>
      <span class="label">{label}</span>
    </div>
  {/if}
  
  <input 
    type="range"
    class="slider"
    {min}
    {max}
    {step}
    {value}
    on:input={handleInput}
    on:change={handleInput}
    disabled={typeof value !== 'number'}
  />
</div>

<style>
  .slider-container {
    display: flex;
    flex-direction: column;
    margin: 8px 12px;
    min-width: 120px;
    transition: opacity 0.2s;
  }

  .slider-container.compact {
    margin: 4px 6px;
    min-width: 90px;
  }

  .slider-container.inherited {
    opacity: 0.5;
  }

  .slider-container.inherited:hover {
    opacity: 0.8;
  }

  .header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .compact .header {
    margin-bottom: 4px;
  }

  .label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .compact .label {
    font-size: 0.65rem;
  }

  .value {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-main);
    background: var(--bg-hover);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid var(--border-sub);
  }

  .compact .value {
    font-size: 0.75rem;
    padding: 1px 4px;
  }

  .slider {
    -webkit-appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--border-input);
    outline: none;
    opacity: 0.9;
    transition: opacity .2s;
  }

  .slider:hover {
    opacity: 1;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: transform 0.1s;
  }

  .compact .slider::-webkit-slider-thumb {
    width: 12px;
    height: 12px;
  }

  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }

  .slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    border: none;
    transition: transform 0.1s;
  }

  .compact .slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
  }

  .slider::-moz-range-thumb:hover {
    transform: scale(1.15);
  }
  
  .slider:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>