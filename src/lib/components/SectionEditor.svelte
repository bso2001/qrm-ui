<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { songStore } from '../songStore';
  import Display from './Display.svelte';
  import Choice from './Choice.svelte';
  import { tonics, modes } from '../constants';

  export let sectionIndex: number;

  $: currentSection = $songStore?.sections?.[sectionIndex] || {};

  const dispatch = createEventDispatcher();
</script>

<div class="section-editor">
  <div class="editor-header">
    <div class="title-group">
        <h2 class="section-title">SECTION <span class="bracket">[</span>
          <div class="input-sizer" data-value={currentSection.name || 'Untitled'}>
            <input 
                class="name-input highlight" 
                bind:value={currentSection.name} 
                placeholder="Untitled"
                on:input={() => $songStore = $songStore}
                size="1"
            />
          </div>
        <span class="bracket">]</span></h2>
    </div>
    
    <div class="header-controls">
        <Display 
            value={currentSection.nMeasures} 
            label="BARS" 
            width="100px" 
            layout="row" 
            on:change={(e) => {
                currentSection.nMeasures = parseInt(e.detail) || 4;
                $songStore = $songStore;
            }}
        />
    </div>
  </div>

  <div class="editor-grid">
    <div class="grouped-box">
      <span class="box-label">DEFAULTS</span>
      
      <div style="display: flex; gap: 8px; align-items: flex-end; padding-top: 5px; flex-wrap: wrap;">
        <Choice 
          value={currentSection.key?.tonic || $songStore.key?.tonic || 'C'} 
          inherited={!currentSection.key}
          options={tonics}
          on:change={(e) => {
            if (!currentSection.key) currentSection.key = { ...($songStore.key || {tonic: 'C', mode: 'major'}) };
            currentSection.key.tonic = e.detail;
            $songStore = $songStore;
          }}
          width="50px" 
        />
        <Choice 
          value={currentSection.key?.mode || $songStore.key?.mode || 'major'} 
          inherited={!currentSection.key}
          options={modes}
          on:change={(e) => {
            if (!currentSection.key) currentSection.key = { ...($songStore.key || {tonic: 'C', mode: 'major'}) };
            currentSection.key.mode = e.detail;
            $songStore = $songStore;
          }}
          width="100px" 
        />
        
        <div style="margin-left: 10px;">
            <Display 
                value="{currentSection.meter?.numerator || $songStore.meter?.numerator || 4}/{currentSection.meter?.denominator || $songStore.meter?.denominator || 4}" 
                label=""
                inherited={!currentSection.meter}
                on:change={(e) => {
                    const [n, d] = e.detail.split('/');
                    currentSection.meter = { numerator: parseInt(n) || 4, denominator: parseInt(d) || 4 };
                    $songStore = $songStore;
                }}
                width="75px" 
            />
        </div>

        <div style="margin-left: 10px; flex: 1; min-width: 200px;">
            <Display 
                value={(currentSection.chords || $songStore.chords || []).join(' ')} 
                label="CHORDS"
                inherited={!currentSection.chords}
                on:change={(e) => {
                    const val = e.detail.trim();
                    if (val) {
                        currentSection.chords = val.split(/[,\s]+/).filter(c => c);
                    } else {
                        delete currentSection.chords;
                    }
                    $songStore = $songStore;
                }}
                width="100%" 
                layout="row"
            />
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .section-editor {
    background: var(--bg-card);
    border: 1px solid var(--border-main);
    border-radius: 8px;
    padding: 12px 20px;
    margin-bottom: 16px;
    box-shadow: var(--shadow-sm);
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 700;
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
    font-size: 1.1rem;
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

  .header-controls {
    display: flex;
    gap: 15px;
    align-items: flex-end;
  }

  .editor-grid {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .grouped-box {
    display: flex;
    flex-direction: column;
    background: var(--bg-sub);
    padding: 15px;
    border-radius: 6px;
    border: 1px solid var(--border-main);
    position: relative;
    gap: 10px;
  }

  .box-label {
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

  .inner-label {
    font-size: 10px;
    color: var(--text-muted);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 700;
    text-align: center;
  }

  .chords-area {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .chords-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
  }

  .chord-sequence {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    background: var(--bg-sub);
    padding: 12px;
    border-radius: 6px;
    border: 1px solid var(--border-main);
    align-items: center;
  }

  .chord-tag {
    background: var(--bg-input);
    color: var(--accent);
    border: 1px solid var(--border-input);
    padding: 4px 12px;
    font-size: 1rem;
    border-radius: 4px;
    font-weight: 600;
    box-shadow: var(--shadow-sm);
  }

  .add-chord-btn {
    background: transparent;
    border: 1px dashed var(--border-input);
    color: var(--text-muted);
    width: 32px;
    height: 32px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .add-chord-btn:hover {
    border-style: solid;
    border-color: var(--accent);
    color: var(--accent);
  }
</style>
