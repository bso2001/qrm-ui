<script lang="ts">
  export let value: any = '';
  export let label: string = '';
  export let width: string = 'auto';
  export let color: string = '#00ff00';
</script>

<div class="display-container" style="--width: {width}">
  {#if label}
    <span class="display-label">{label}</span>
  {/if}
  <div class="display" style="--accent: {color}">
    {value}
  </div>
</div>

<style>
  .display-container {
    display: flex;
    flex-direction: column;
    margin: 5px;
    width: var(--width);
  }

  .display {
    background-color: #000;
    color: var(--accent);
    padding: 10px;
    border-radius: 2px;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.8);
    font-size: 18px;
    text-shadow: 0 0 8px var(--accent);
    border: 1px solid #222;
    font-family: 'Courier New', Courier, monospace;
    min-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .display-label {
    font-size: 11px;
    color: #bbb;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 900;
    text-shadow: 0 1px 2px rgba(0,0,0,1);
  }
</style>
