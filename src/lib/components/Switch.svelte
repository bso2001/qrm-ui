<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let on: boolean = false;
  export let label: string = '';

  const dispatch = createEventDispatcher();

  function toggle() {
    on = !on;
    dispatch('change', on);
  }
</script>

<div class="switch-container">
  <div class="switch" class:on on:click={toggle}>
    <div class="switch-handle"></div>
  </div>
  {#if label}
    <span class="label">{label}</span>
  {/if}
</div>

<style>
  .switch-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 10px;
    user-select: none;
  }

  .switch {
    width: 20px;
    height: 40px;
    background: #111;
    border-radius: 2px;
    position: relative;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.8);
    cursor: pointer;
    border: 1px solid #333;
  }

  .switch-handle {
    position: absolute;
    top: 5px;
    left: 2px;
    width: 14px;
    height: 18px;
    background: linear-gradient(to bottom, #777, #444);
    border-radius: 2px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.5);
    transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .switch.on .switch-handle {
    transform: translateY(12px);
    background: linear-gradient(to bottom, #444, #777);
  }

  .label {
    font-size: 10px;
    margin-top: 8px;
    color: #bbb;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    font-weight: 900;
    text-shadow: 0 1px 2px rgba(0,0,0,1);
    text-align: center;
  }
</style>
