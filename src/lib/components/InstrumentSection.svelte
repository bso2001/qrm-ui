<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { songStore, resolveParam, getParamLevel } from '../songStore';
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import Display from './Display.svelte';
  import Choice from './Choice.svelte';
  import { voiceTypes } from '../constants';

  export let instrumentIndex: number;
  export let sectionIndex: number;

  $: instrument = $songStore?.instruments?.[instrumentIndex] || {};
  $: performance = instrument?.performances?.[sectionIndex] || {};

  const dispatch = createEventDispatcher();
</script>

<Card 
  title="" 
  showDelete={$songStore?.instruments?.length > 1}
  on:delete={() => dispatch('delete')}
>
  <div class="instrument-compact">
    <!-- Top Row: Identity and File -->
    <div class="top-row">
        <Display bind:value={instrument.name} label="INSTRUMENT" width="140px" />
        <Choice 
            value={instrument.type || 'chordal'} 
            label="MODE"
            options={voiceTypes}
            on:change={(e) => {
                instrument.type = e.detail;
                $songStore = $songStore;
            }}
            width="90px" 
        />
        <Display 
            value={instrument.range ? instrument.range.join('-') : 'C1-C8'} 
            label="RANGE" 
            width="100px" 
            on:change={(e) => {
                instrument.range = e.detail.split('-').map(s => s.trim());
                $songStore = $songStore;
            }}
        />
        <Display bind:value={performance.file} label="OUTPUT FILE" width="180px" color="#aaa" fontSize="11px" />
        <Display bind:value={instrument.duration} label="DURATION" width="70px" color="#00ffff" />
    </div>

    <!-- Bottom Row: ALL Performance Sliders on one line -->
    <div class="performance-row">
        <Slider 
            compact={true}
            value={resolveParam($songStore, sectionIndex, instrumentIndex, 'restPct') ?? 0.5} 
            inherited={getParamLevel($songStore, sectionIndex, instrumentIndex, 'restPct') === 'instrument'}
            on:change={(e) => {
                performance.restPct = e.detail;
                $songStore = $songStore;
            }}
            min={0} max={1} step={0.01} label="REST %" 
        />
        
        <Slider 
            compact={true}
            value={resolveParam($songStore, sectionIndex, instrumentIndex, 'tonicPct') ?? 0} 
            inherited={getParamLevel($songStore, sectionIndex, instrumentIndex, 'tonicPct') === 'instrument'}
            on:change={(e) => {
                performance.tonicPct = e.detail;
                $songStore = $songStore;
            }}
            min={0} max={1} step={0.01} label="TONIC %" 
        />

        <Slider 
            compact={true}
            value={resolveParam($songStore, sectionIndex, instrumentIndex, 'inversionPct') ?? 0} 
            inherited={getParamLevel($songStore, sectionIndex, instrumentIndex, 'inversionPct') === 'instrument'}
            on:change={(e) => {
                performance.inversionPct = e.detail;
                $songStore = $songStore;
            }}
            min={0} max={1} step={0.01} label="INV %" 
        />

        <Slider 
            compact={true}
            value={resolveParam($songStore, sectionIndex, instrumentIndex, 'velocity')?.[0] ?? 60} 
            inherited={getParamLevel($songStore, sectionIndex, instrumentIndex, 'velocity') === 'instrument'}
            on:change={(e) => {
                if (!performance.velocity) performance.velocity = [60, 80];
                performance.velocity[0] = e.detail;
                $songStore = $songStore;
            }}
            min={0} max={127} label="MIN VEL"
        />
        <Slider 
            compact={true}
            value={resolveParam($songStore, sectionIndex, instrumentIndex, 'velocity')?.[1] ?? 80} 
            inherited={getParamLevel($songStore, sectionIndex, instrumentIndex, 'velocity') === 'instrument'}
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
  .instrument-compact {
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
</style>
