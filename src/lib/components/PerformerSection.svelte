<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { songStore, resolveParam, getParamLevel } from '../songStore';
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import Display from './Display.svelte';
  import Choice from './Choice.svelte';
  import { voiceTypes } from '../constants';

  export let selectedPerformerIndex: number;
  export let selectedTimelineIndex: number;

  $: performer = $songStore?.performers?.[selectedPerformerIndex] || {};
  $: performance = performer?.performances?.[selectedTimelineIndex] || {};
  $: section = $songStore?.timeline?.[selectedTimelineIndex] || {};

  const dispatch = createEventDispatcher();
</script>

<Card 
  title="" 
  showDelete={$songStore?.performers?.length > 1}
  on:delete={() => dispatch('delete')}
>
  <div class="performer-compact">
    <!-- Top Row: Identity and File -->
    <div class="top-row">
        <Display bind:value={performer.name} label="Performer" width="140px" />
        <Choice 
            value={performer.type || 'chordal'} 
            options={voiceTypes}
            on:change={(e) => {
                performer.type = e.detail;
                $songStore = $songStore;
            }}
            width="90px" 
        />
        <Display bind:value={performance.file} label="MIDI File" width="180px" color="#aaa" fontSize="11px" />
        <Display bind:value={performer.duration} label="Duration" width="70px" color="#00ffff" />
    </div>

    <!-- Bottom Row: ALL Performance Sliders on one line -->
    <div class="performance-row">
        <Slider 
            compact={true}
            value={resolveParam($songStore, selectedTimelineIndex, selectedPerformerIndex, 'restPct') ?? 0.5} 
            inherited={getParamLevel($songStore, selectedTimelineIndex, selectedPerformerIndex, 'restPct') === 'performer'}
            on:change={(e) => {
                performance.restPct = e.detail;
                $songStore = $songStore;
            }}
            min={0} max={1} step={0.01} label="Rest %" 
        />
        
        <Slider 
            compact={true}
            value={resolveParam($songStore, selectedTimelineIndex, selectedPerformerIndex, 'tonicPct') ?? 0} 
            inherited={getParamLevel($songStore, selectedTimelineIndex, selectedPerformerIndex, 'tonicPct') === 'performer'}
            on:change={(e) => {
                performance.tonicPct = e.detail;
                $songStore = $songStore;
            }}
            min={0} max={1} step={0.01} label="Tonic %" 
        />

        <Slider 
            compact={true}
            value={resolveParam($songStore, selectedTimelineIndex, selectedPerformerIndex, 'inversionPct') ?? 0} 
            inherited={getParamLevel($songStore, selectedTimelineIndex, selectedPerformerIndex, 'inversionPct') === 'performer'}
            on:change={(e) => {
                performance.inversionPct = e.detail;
                $songStore = $songStore;
            }}
            min={0} max={1} step={0.01} label="Inv %" 
        />

        <Slider 
            compact={true}
            value={resolveParam($songStore, selectedTimelineIndex, selectedPerformerIndex, 'velocity')?.[0] ?? 60} 
            inherited={getParamLevel($songStore, selectedTimelineIndex, selectedPerformerIndex, 'velocity') === 'performer'}
            on:change={(e) => {
                if (!performance.velocity) performance.velocity = [60, 80];
                performance.velocity[0] = e.detail;
                $songStore = $songStore;
            }}
            min={0} max={127} label="Min Vel"
        />
        <Slider 
            compact={true}
            value={resolveParam($songStore, selectedTimelineIndex, selectedPerformerIndex, 'velocity')?.[1] ?? 80} 
            inherited={getParamLevel($songStore, selectedTimelineIndex, selectedPerformerIndex, 'velocity') === 'performer'}
            on:change={(e) => {
                if (!performance.velocity) performance.velocity = [60, 80];
                performance.velocity[1] = e.detail;
                $songStore = $songStore;
            }}
            min={0} max={127} label="Max Vel"
        />
    </div>
  </div>
</Card>

<style>
  .performer-compact {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .top-row {
    display: flex;
    gap: 15px;
    align-items: flex-end;
    border-bottom: 1px solid var(--border-sub);
    padding-bottom: 6px;
  }

  .performance-row {
    display: flex;
    gap: 5px;
    align-items: flex-end;
    flex-wrap: nowrap;
    overflow-x: auto;
  }
</style>