<script lang="ts">
  import { songStore } from '../songStore';
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import Display from './Display.svelte';
  import Choice from './Choice.svelte';
  import { tonics, modes } from '../constants';

  export let loadedFilename = "";
</script>

<Card title="SONG">
  <div slot="header-left-extra">
    <Display bind:value={$songStore.name} label="" width="220px" fontSize="14px" />
  </div>

  <div slot="header-right-extra" class="header-controls">
    <div class="filename-display" title={loadedFilename}>
      {loadedFilename || ''}
    </div>

    <Slider bind:value={$songStore.tempo} min={40} max={240} label="Tempo" compact={true} />
    
    <div class="header-group">
      <span class="group-label">DEFAULT</span>
      <div class="group-content">
        <Choice 
          value={$songStore.key?.tonic || 'C'} 
          options={tonics} 
          on:change={(e) => {
            if (!$songStore.key) $songStore.key = { tonic: 'C', mode: 'major' };
            $songStore.key.tonic = e.detail;
            $songStore = $songStore;
          }}
          width="45px" 
        />
        <Choice 
          value={$songStore.key?.mode || 'major'} 
          options={modes} 
          on:change={(e) => {
            if (!$songStore.key) $songStore.key = { tonic: 'C', mode: 'major' };
            $songStore.key.mode = e.detail;
            $songStore = $songStore;
          }}
          width="80px" 
        />
        <Display 
          value="{$songStore.meter?.numerator || 4}/{$songStore.meter?.denominator || 4}" 
          label=""
          on:change={(e) => {
            const [n, d] = e.detail.split('/');
            $songStore.meter = { numerator: parseInt(n) || 4, denominator: parseInt(d) || 4 };
            $songStore = $songStore;
          }}
          width="60px" 
        />
      </div>
    </div>
  </div>
</Card>

<style>
  .header-controls {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .header-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--bg-sub);
    padding: 2px 8px 4px 8px;
    border-radius: 4px;
    border: 1px solid var(--border-main);
    gap: 2px;
  }

  .group-label {
    font-size: 8px;
    color: var(--text-muted);
    font-weight: bold;
    letter-spacing: 1px;
  }

  .group-content {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .filename-display {
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--text-muted);
    font-family: monospace;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :global(.header-controls .slider-container) {
    margin: 0 !important;
  }
</style>
