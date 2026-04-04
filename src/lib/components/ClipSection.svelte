<script lang="ts">
  import { songStore, resolveParam, getParamLevel } from '../songStore';
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import Display from './Display.svelte';

  export let selectedArrangerIndex: number;
  export let selectedTrackIndex: number;

  $: currentTrack = $songStore?.tracks?.[selectedTrackIndex] || {};
  $: currentClip = currentTrack?.clips?.[selectedArrangerIndex] || {};
  $: currentArrangerSection = $songStore?.arranger?.[selectedArrangerIndex] || {};
</script>

<Card 
  subModule={true} 
  title="Performance: {currentArrangerSection.name || 'Untitled Section'}"
>
  <div class="row" style="justify-content: center;">
    <Display bind:value={currentClip.file} label="MIDI File Override" width="200px" color="#aaa" />
    
    <Slider 
      value={resolveParam($songStore, selectedArrangerIndex, selectedTrackIndex, 'restPct') ?? 0} 
      inherited={getParamLevel($songStore, selectedArrangerIndex, selectedTrackIndex, 'restPct') !== 'clip'}
      on:change={(e) => {
        currentClip.restPct = e.detail;
        $songStore = $songStore;
      }}
      min={0} max={1} step={0.01} label="Rest %" 
    />
    
    <Slider 
      value={resolveParam($songStore, selectedArrangerIndex, selectedTrackIndex, 'tonicPct') ?? 0} 
      inherited={getParamLevel($songStore, selectedArrangerIndex, selectedTrackIndex, 'tonicPct') !== 'clip'}
      on:change={(e) => {
        currentClip.tonicPct = e.detail;
        $songStore = $songStore;
      }}
      min={0} max={1} step={0.01} label="Tonic %" 
    />

    <Slider 
      value={resolveParam($songStore, selectedArrangerIndex, selectedTrackIndex, 'inversionPct') ?? 0} 
      inherited={getParamLevel($songStore, selectedArrangerIndex, selectedTrackIndex, 'inversionPct') !== 'clip'}
      on:change={(e) => {
        currentClip.inversionPct = e.detail;
        $songStore = $songStore;
      }}
      min={0} max={1} step={0.01} label="Inv %" 
    />

    <div class="velocity-box">
      <Slider 
        value={resolveParam($songStore, selectedArrangerIndex, selectedTrackIndex, 'velocity')?.[0] ?? 60} 
        inherited={getParamLevel($songStore, selectedArrangerIndex, selectedTrackIndex, 'velocity') !== 'clip'}
        on:change={(e) => {
          if (!currentClip.velocity) currentClip.velocity = [60, 80];
          currentClip.velocity[0] = e.detail;
          $songStore = $songStore;
        }}
        min={0} max={127} label="Min Vel"
      />
      <Slider 
        value={resolveParam($songStore, selectedArrangerIndex, selectedTrackIndex, 'velocity')?.[1] ?? 80} 
        inherited={getParamLevel($songStore, selectedArrangerIndex, selectedTrackIndex, 'velocity') !== 'clip'}
        on:change={(e) => {
          if (!currentClip.velocity) currentClip.velocity = [60, 80];
          currentClip.velocity[1] = e.detail;
          $songStore = $songStore;
        }}
        min={0} max={127} label="Max Vel"
      />
    </div>
  </div>
</Card>

<style>
  .row {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 10px;
    flex-wrap: wrap;
  }

  .velocity-box {
    display: flex;
    background: var(--bg-sub);
    padding: 5px;
    border-radius: 4px;
    border: 1px solid var(--border-main);
    position: relative;
    margin-top: 5px;
  }
</style>