<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let value: any = '';
  export let label: string = '';
  export let width: string = 'auto';
  export let color: string = '#00ff00';
  export let fontSize: string = '16px';
  export let inherited: boolean = false;
  export let layout: 'row' | 'column' = 'column';

  const dispatch = createEventDispatcher();

  function handleChange(event: Event) {
    const newVal = (event.target as HTMLInputElement).value;
    dispatch('change', newVal);
  }
</script>

<div class="display-container {layout}" style="--width: {width}" class:inherited>
  {#if label}
    <span class="display-label">{label}</span>
  {/if}
  <input 
    type="text"
    class="display-input" 
    style="--accent: {color}; font-size: {fontSize}"
    value={typeof value === 'object' && value !== null ? JSON.stringify(value) : (value ?? '')}
    on:change={handleChange}
  />
</div>

<style>
  .display-container {
    display: flex;
    margin: 5px;
    width: var(--width);
    transition: opacity 0.2s;
    align-items: center;
  }

  .display-container.column {
    flex-direction: column;
    align-items: center;
  }

  .display-container.row {
    flex-direction: row;
    gap: 8px;
    justify-content: flex-end;
  }

  .display-container.inherited {
    opacity: 0.5;
  }

  .display-container.inherited:hover {
    opacity: 0.8;
  }
.display-input {
  background-color: var(--bg-input);
  color: var(--text-main);
  padding: 0 10px;
  border-radius: 4px;
  border: 1px solid var(--border-input);
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
  outline: none;
  transition: all 0.2s;
  font-weight: 500;
  min-width: 0;
  height: 34px;
  font-size: 0.9rem;
}

.display-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(77, 171, 247, 0.2);
}

.display-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  white-space: nowrap;
}


  .column .display-label {
    margin-bottom: 4px;
    text-align: center;
  }

  .row .display-label {
    margin-bottom: 0;
  }
</style>
