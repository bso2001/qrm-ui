<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { songStore, resolveParam, getParamLevel } from '../songStore';
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import Display from './Display.svelte';
  import Choice from './Choice.svelte';
  import { voiceTypes } from '../constants';

  export let partIndex: number;
  export let sectionIndex: number;

  $: part = $songStore?.parts?.[partIndex] || {};
  $: performance = part?.performances?.[sectionIndex] || {};

  const dispatch = createEventDispatcher();
</script>

<Card 
  title="" 
  subModule={true}
  showDelete={$songStore?.parts?.length > 1}
  on:delete={() => dispatch('delete')}
>
  <div slot="header-left-extra" class="title-group">
    <h3 class="part-title">PART <span class="bracket">[</span>
      <div class="input-sizer" data-value={part.name || 'Untitled'}>
        <input 
            class="name-input highlight" 
            bind:value={part.name} 
            placeholder="Untitled"
            on:input={() => $songStore = $songStore}
            size="1"
        />
      </div>
    <span class="bracket">]</span></h3>
  </div>

  <div class="part-compact">
    <!-- Top Row: Identity and File -->
    <div class="top-row">
        <Choice 
            value={part.type || 'chordal'} 
            label="MODE"
            options={voiceTypes}
            on:change={(e) => {
                part.type = e.detail;
                $songStore = $songStore;
            }}
            width="90px" 
        />
        <Display 
            value={part.range ? part.range.join('-') : 'C1-C8'} 
            label="RANGE" 
            width="100px" 
            on:change={(e) => {
                part.range = e.detail.split('-').map(s => s.trim());
                $songStore = $songStore;
            }}
        />
        <Display 
            value={performance.file} 
            label="MIDI FILE" 
            width="180px" 
            color="#aaa" 
            fontSize="11px" 
            on:change={(e) => {
                performance.file = e.detail;
                $songStore = $songStore;
            }}
        />
        
        <Display 
            value={(resolveParam($songStore, sectionIndex, partIndex, 'chords') || []).join(' ')} 
            label="CHORDS"
            inherited={getParamLevel($songStore, sectionIndex, partIndex, 'chords') !== 'performance'}
            on:change={(e) => {
                const val = e.detail.trim();
                if (val) {
                    performance.chords = val.split(/[,\s]+/).filter(c => c);
                } else {
                    delete performance.chords;
                }
                $songStore = $songStore;
            }}
            width="120px" 
        />
        
        <Display 
            value={part.duration} 
            label="DURATION" 
            width="70px" 
            color="#00ffff" 
            on:change={(e) => {
                part.duration = e.detail;
                $songStore = $songStore;
            }}
        />
    </div>

    <!-- Bottom Row: ALL Performance Sliders on one line -->
    <div class="performance-row">
        <Slider 
            compact={true}
            value={resolveParam($songStore, sectionIndex, partIndex, 'restPct') ?? 0.5} 
            inherited={getParamLevel($songStore, sectionIndex, partIndex, 'restPct') === 'part'}
            on:change={(e) => {
                performance.restPct = e.detail;
                $songStore = $songStore;
            }}
            min={0} max={1} step={0.01} label="REST %" 
        />
        
        <Slider 
            compact={true}
            value={resolveParam($songStore, sectionIndex, partIndex, 'tonicPct') ?? 0} 
            inherited={getParamLevel($songStore, sectionIndex, partIndex, 'tonicPct') === 'part'}
            on:change={(e) => {
                performance.tonicPct = e.detail;
                $songStore = $songStore;
            }}
            min={0} max={1} step={0.01} label="TONIC %" 
        />

        <Slider 
            compact={true}
            value={resolveParam($songStore, sectionIndex, partIndex, 'inversionPct') ?? 0} 
            inherited={getParamLevel($songStore, sectionIndex, partIndex, 'inversionPct') === 'part'}
            on:change={(e) => {
                performance.inversionPct = e.detail;
                $songStore = $songStore;
            }}
            min={0} max={1} step={0.01} label="INV %" 
        />

        <Slider 
            compact={true}
            value={resolveParam($songStore, sectionIndex, partIndex, 'velocity')?.[0] ?? 60} 
            inherited={getParamLevel($songStore, sectionIndex, partIndex, 'velocity') === 'part'}
            on:change={(e) => {
                if (!performance.velocity) performance.velocity = [60, 80];
                performance.velocity[0] = e.detail;
                $songStore = $songStore;
            }}
            min={0} max={127} label="MIN VEL"
        />
        <Slider 
            compact={true}
            value={resolveParam($songStore, sectionIndex, partIndex, 'velocity')?.[1] ?? 80} 
            inherited={getParamLevel($songStore, sectionIndex, partIndex, 'velocity') === 'part'}
            on:change={(e) => {
                if (!performance.velocity) performance.velocity = [60, 80];
                performance.velocity[1] = e.detail;
                $songStore = $songStore;
            }}
            min={0} max={127} label="MAX VEL"
        />
    </div>
  </div>
</Card>

<style>
  .part-compact {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .top-row {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    margin-bottom: 4px;
  }

  .performance-row {
    display: flex;
    gap: 5px;
    align-items: flex-end;
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .part-title {
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
</style>
