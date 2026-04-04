<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { songStore } from '../songStore';
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import Display from './Display.svelte';
  import Choice from './Choice.svelte';
  import { voiceTypes } from '../constants';

  export let selectedTrackIndex: number;

  $: currentTrack = $songStore?.tracks?.[selectedTrackIndex] || {};

  const dispatch = createEventDispatcher();
</script>

<Card 
  title="Track: {currentTrack.name || 'New Track'}" 
  showNav={true} 
  navLabel="TRACK {selectedTrackIndex + 1} OF {$songStore?.tracks?.length || 1}"
  on:next={() => dispatch('next')}
  on:prev={() => dispatch('prev')}
  showInsert={true}
  on:insert={(e) => dispatch('insert', e.detail)}
  showDelete={$songStore?.tracks?.length > 1}
  on:delete={() => dispatch('delete')}
>
  <div class="row">
    <Display bind:value={currentTrack.name} label="Track Name" width="150px" />
    
    <div class="grouped-box">
      <span class="box-label">INSTRUMENT DEFAULTS</span>
      
      <Choice 
        value={currentTrack.type || 'chordal'} 
        label="TYPE"
        options={voiceTypes}
        on:change={(e) => {
          currentTrack.type = e.detail;
          $songStore = $songStore;
        }}
        width="100px" 
      />

      <Slider 
        bind:value={currentTrack.restPct} 
        min={0} max={1} step={0.01} label="Rest %" 
      />

      <div class="velocity-box">
        <Slider 
          value={currentTrack.velocity?.[0] || 60} 
          on:change={(e) => {
            if (!currentTrack.velocity) currentTrack.velocity = [60, 80];
            currentTrack.velocity[0] = e.detail;
            $songStore = $songStore;
          }}
          min={0} max={127} label="Vel Min"
        />
        <Slider 
          value={currentTrack.velocity?.[1] || 80} 
          on:change={(e) => {
            if (!currentTrack.velocity) currentTrack.velocity = [60, 80];
            currentTrack.velocity[1] = e.detail;
            $songStore = $songStore;
          }}
          min={0} max={127} label="Vel Max"
        />
      </div>

      <Display 
        bind:value={currentTrack.duration} 
        label="Duration" width="80px" color="#00ffff" 
      />
    </div>
  </div>

  <slot />

</Card>

<style>
  .row {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 10px;
    flex-wrap: wrap;
  }

  .velocity-box, .grouped-box {
    display: flex;
    background: var(--bg-sub);
    padding: 5px;
    border-radius: 4px;
    border: 1px solid var(--border-main);
    position: relative;
    margin-top: 5px;
  }

  .grouped-box {
    gap: 5px;
    align-items: flex-end;
    padding-top: 15px;
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
</style>