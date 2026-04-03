<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: number = 0;
  export let min: number = 0;
  export let max: number = 100;
  export let label: string = '';
  export let size: number = 50;

  const dispatch = createEventDispatcher();

  let dragging = false;
  let startY: number;
  let startValue: number;

  $: rotation = ((value - min) / (max - min)) * 270 - 135;

  function handleMouseDown(event: MouseEvent) {
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
</script>

<div class="knob-container" style="--size: {size}px">
  <div 
    class="knob" 
    on:mousedown={handleMouseDown}
    style="transform: rotate({rotation}deg)"
  ></div>
  {#if label}
    <span class="label">{label}</span>
  {/if}
</div>

<style>
  .knob-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 10px;
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

  .knob::after {
    content: "";
    position: absolute;
    top: 5px;
    left: 50%;
    width: 2px;
    height: 10px;
    background-color: #fff;
    transform: translateX(-50%);
    border-radius: 1px;
  }

  .label {
    font-size: 10px;
    margin-top: 8px;
    color: #bbb;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    font-weight: 900;
    text-shadow: 0 1px 2px rgba(0,0,0,1);
  }
</style>
