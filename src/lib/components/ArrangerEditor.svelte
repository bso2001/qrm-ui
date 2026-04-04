<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { songStore } from '../songStore';
  import Card from './Card.svelte';
  import Display from './Display.svelte';
  import Choice from './Choice.svelte';
  import { tonics, modes } from '../constants';

  export let selectedArrangerIndex: number;

  $: currentSection = $songStore?.arranger?.[selectedArrangerIndex] || {};

  const dispatch = createEventDispatcher();
</script>

<div class="arranger-editor">
  <div class="editor-header">
    <div class="title-group">
        <h2 class="section-title">Timeline Editor</h2>
        <span class="nav-label">Editing Section {selectedArrangerIndex + 1}</span>
    </div>
    
    <div class="header-controls">
        <Display bind:value={currentSection.name} label="Section Name" width="200px" />
        <Display bind:value={currentSection.nMeasures} label="Bars" width="60px" />
    </div>
  </div>

  <div class="editor-grid">
    <div class="grouped-box">
      <span class="box-label">GLOBAL HARMONY</span>
      
      <div style="display: flex; gap: 8px; align-items: flex-end;">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <span class="inner-label">KEY</span>
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
        </div>
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
                label="METER"
                inherited={!currentSection.meter}
                on:change={(e) => {
                    const [n, d] = e.detail.split('/');
                    currentSection.meter = { numerator: parseInt(n) || 4, denominator: parseInt(d) || 4 };
                    $songStore = $songStore;
                }}
                width="75px" 
            />
        </div>
      </div>
    </div>

    {#if currentSection.chords}
        <div class="chords-area">
            <span class="chords-label">Global Chords for this Section</span>
            <div class="chord-sequence">
                {#each currentSection.chords as chord}
                    <span class="chord-tag">{chord}</span>
                {/each}
                <button class="add-chord-btn">+</button>
            </div>
        </div>
    {/if}
  </div>
</div>

<style>
  .arranger-editor {
    background: var(--bg-card);
    border: 1px solid var(--border-main);
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: var(--shadow-sm);
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border-sub);
    padding-bottom: 15px;
  }

  .section-title {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    color: var(--text-heading);
  }

  .nav-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
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