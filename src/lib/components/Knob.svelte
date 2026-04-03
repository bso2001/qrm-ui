<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: any = 0;
  export let min: number = 0;
  export let max: number = 100;
  export let label: string = '';
  export let size: number = 30; // Standardized to velocity size

  const dispatch = createEventDispatcher();

  let dragging = false;
  let startY: number;
  let startValue: number;

  $: numericValue = typeof value === 'number' ? value : 0;
  $: rotation = ((numericValue - min) / (max - min)) * 270 - 135;

  function handleMouseDown(event: MouseEvent) {
    if (typeof value !== 'number') return;
    dragging = true;
    startY = event.clientY;
    startValue = value;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleMouseMove(event: MouseEvent) {
    if (!dragging) return;
    const deltaY = startY - event.clientY;
    const range = max - min;
    const sensitivity = 0.5;
    let newValue = startValue + (deltaY * range * 0.01 * sensitivity);
    newValue = Math.max(min, Math.min(max, newValue));
    value = newValue;
    dispatch('change', value);
  }

  function handleMouseUp() {
    dragging = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }

  function handleInputChange(event: Event) {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val)) {
      value = Math.max(min, Math.min(max, val));
      dispatch('change', value);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (typeof value !== 'number') return;
    let step = event.shiftKey ? 10 : 1;
    if (max - min <= 1.0) step = event.shiftKey ? 0.1 : 0.01;

    if (event.key === 'ArrowUp') {
      value = Math.min(max, value + step);
      dispatch('change', value);
      event.preventDefault();
    } else if (event.key === 'ArrowDown') {
      value = Math.max(min, value - step);
      dispatch('change', value);
      event.preventDefault();
    }
  }
</script>

<div class="knob-container" style="--size: {size}px">
  <div 
    class="knob" 
    on:mousedown={handleMouseDown}
    class:disabled={typeof value !== 'number'}
    style="transform: rotate({rotation}deg)"
  ></div>
  <input 
    type="text"
    class="value-readout" 
    value={typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(2)) : 'ARR'}
    on:change={handleInputChange}
    on:keydown={handleKeyDown}
    disabled={typeof value !== 'number'}
  />
  {#if label}
    <span class="label">{label}</span>
  {/if}
</div>

<style>
  .knob-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 8px;
    user-select: none;
  }

  .knob {
    width: var(--size);
    height: var(--size);
    background: radial-gradient(circle, #555 0%, #222 70%);
    border-radius: 50%;
    border: 2px solid #444;
    position: relative;
    cursor: ns-resize;
    box-shadow: 0 4px 6px rgba(0,0,0,0.5);
    transition: transform 0.05s linear;
  }

  .knob.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .knob::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 50%;
    width: 2px;
    height: 8px;
    background-color: #fff;
    transform: translateX(-50%);
    border-radius: 1px;
  }

  .value-readout {
    margin-top: 6px;
    background: #000;
    color: var(--accent, #00ff00);
    font-size: 13px; /* INCREASED */
    padding: 3px 6px;
    border-radius: 2px;
    width: 55px;
    text-align: center;
    font-family: 'Courier New', Courier, monospace;
    border: 1px solid #333;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);
    text-shadow: 0 0 5px var(--accent, #00ff00);
    font-weight: bold;
    outline: none;
  }

  .value-readout:focus {
    border-color: var(--accent, #00ff00);
  }

  .label {
    font-size: 11px; /* INCREASED */
    margin-top: 8px;
    color: #bbb;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 900;
    text-shadow: 0 1px 2px rgba(0,0,0,1);
  }
</style>
