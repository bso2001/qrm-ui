<script lang="ts">
  import { songStore } from '../songStore';
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import Display from './Display.svelte';
  import Choice from './Choice.svelte';
  import { tonics, modes } from '../constants';

  export let loadedFilename = "";

  function webkitDir(node: HTMLInputElement) {
    node.setAttribute('webkitdirectory', '');
    node.setAttribute('directory', '');
    return {};
  }

  function handleDirSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      // Get the relative path or absolute path if available in this environment
      const path = (file as any).path || file.webkitRelativePath.split('/')[0] || file.name;
      $songStore.outputDir = path.substring(0, path.lastIndexOf('/')) || path;
    }
  }
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

  <!-- Body of the Card for Output Dir -->
  <div class="output-dir-row">
    <label class="dir-btn">
      OUTPUT DIR
      <input type="file" use:webkitDir hidden on:change={handleDirSelect} />
    </label>
    <Display bind:value={$songStore.outputDir} label="" width="100%" color="#ffaa00" fontSize="11px" />
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

  .output-dir-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--border-sub);
  }

  .dir-btn {
    background: var(--bg-sub);
    border: 1px solid var(--border-input);
    color: var(--text-main);
    cursor: pointer;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-radius: 6px;
    transition: all 0.2s ease;
    padding: 6px 12px;
    font-size: 0.75rem;
    white-space: nowrap;
  }

  .dir-btn:hover {
    background: var(--bg-hover);
    border-color: var(--accent);
    color: var(--accent);
  }

  :global(.header-controls .slider-container) {
    margin: 0 !important;
  }
</style>
