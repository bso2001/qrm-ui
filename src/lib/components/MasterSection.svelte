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

  async function handleDirPick() {
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await (window as any).showDirectoryPicker();
        $songStore.outputDir = handle.name;
      } catch (err) {
        // User cancelled
      }
    } else {
      // Fallback to hidden input click
      const input = document.getElementById('dir-input');
      if (input) input.click();
    }
  }

  function handleDirSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      const firstFile = files[0];
      const path = (firstFile as any).path || firstFile.webkitRelativePath.split('/')[0] || firstFile.name;
      $songStore.outputDir = path;
    }
  }
</script>

<Card title="">
  <div slot="header-left-extra" class="title-group">
    <h2 class="song-title">SONG <span class="bracket">[</span>
      <div class="input-sizer" data-value={$songStore.name || 'Untitled'}>
        <input 
            class="name-input highlight" 
            bind:value={$songStore.name} 
            placeholder="Untitled"
            size="1"
        />
      </div>
    <span class="bracket">]</span></h2>
  </div>

  <div slot="header-right-extra" class="header-controls">
    <div class="filename-display" title={loadedFilename}>
      {loadedFilename || ''}
    </div>

    <Slider bind:value={$songStore.tempo} min={40} max={240} label="Tempo" compact={true} />
    
    <div class="header-group">
      <span class="group-label">DEFAULTS</span>
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
        <Display 
          value={($songStore.chords || []).join(' ')} 
          label="CHORDS"
          on:change={(e) => {
            const val = e.detail.trim();
            if (val) {
              $songStore.chords = val.split(/[,\s]+/).filter(c => c);
            } else {
              delete $songStore.chords;
            }
            $songStore = $songStore;
          }}
          width="120px" 
        />
      </div>
    </div>
  </div>

  <!-- Body of the Card for Output Dir -->
  <div class="output-dir-row">
    <button class="dir-btn" on:click={handleDirPick}>
      OUTPUT DIR
    </button>
    <input 
      id="dir-input"
      type="file" 
      use:webkitDir 
      hidden 
      on:change={handleDirSelect} 
    />
    <Display 
      value={$songStore.outputDir} 
      label="" 
      width="100%" 
      color="#ffaa00" 
      fontSize="11px" 
      on:change={(e) => {
        $songStore.outputDir = e.detail;
        $songStore = $songStore;
      }}
    />
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
    padding: 10px 8px 4px 8px;
    border-radius: 4px;
    border: 1px solid var(--border-main);
    position: relative;
    gap: 2px;
  }

  .group-label {
    position: absolute;
    top: -8px;
    left: 10px;
    font-size: 9px;
    color: var(--text-muted);
    background: var(--bg-card);
    padding: 0 5px;
    font-weight: bold;
    letter-spacing: 1.2px;
    border: 1px solid var(--border-main);
    border-radius: 4px;
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

  .song-title {
    font-size: 1.2rem;
    font-weight: 800;
    margin: 0;
    color: var(--text-heading);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .input-sizer {
    display: inline-grid;
    align-items: center;
  }

  .input-sizer::after,
  .name-input {
    min-width: 0;
    grid-area: 1 / 1;
    font-family: monospace;
    font-weight: 800;
    font-size: 1.2rem;
    padding: 0;
    margin: 0;
    resize: none;
    background: none;
    appearance: none;
    border: none;
    text-align: center;
  }

  .name-input {
    width: 100%;
    color: var(--accent);
    outline: none;
  }

  .input-sizer::after {
    width: auto;
    content: attr(data-value);
    visibility: hidden;
    white-space: pre;
  }

  .name-input:focus {
    background: var(--bg-sub);
    border-radius: 4px;
    box-shadow: 0 0 0 2px var(--bg-sub); /* Faux padding for focus */
  }

  .bracket {
    color: var(--text-muted);
    font-family: monospace;
    font-weight: 400;
  }

  .highlight {
    color: var(--accent);
    font-family: monospace;
    font-weight: 800;
  }

  :global(.header-controls .slider-container) {
    margin: 0 !important;
  }
</style>
