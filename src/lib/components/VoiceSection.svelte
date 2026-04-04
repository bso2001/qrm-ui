<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { songStore, resolveParam, getParamLevel } from '../songStore';
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import Display from './Display.svelte';
  import Choice from './Choice.svelte';
  import { voiceTypes } from '../constants';

  export let selectedPartIndex: number;
  export let selectedVoiceIndex: number;

  $: currentPart = $songStore?.parts?.[selectedPartIndex] || {};
  $: currentVoice = currentPart?.voices?.[selectedVoiceIndex] || {};

  const dispatch = createEventDispatcher();
</script>

<Card 
  subModule={true} 
  title="Voice: {currentVoice.file || 'Internal'}"
  showNav={true}
  navLabel="VOICE {selectedVoiceIndex + 1} OF {currentPart.voices?.length || 1}"
  on:next={() => dispatch('next')}
  on:prev={() => dispatch('prev')}
  showInsert={true}
  on:insert={(e) => dispatch('insert', e.detail)}
  showDelete={currentPart?.voices?.length > 1}
  on:delete={() => dispatch('delete')}
>
  <div class="row" style="justify-content: center;">
    <div class="grouped-box">
      <span class="box-label">TYPE</span>
      <Choice 
        value={currentVoice.type || 'chordal'} 
        options={voiceTypes}
        on:change={(e) => {
          currentVoice.type = e.detail;
          $songStore = $songStore;
        }}
        width="100px" 
      />
    </div>
    <Display bind:value={currentVoice.file} label="MIDI File" width="200px" color="#aaa" />
    <Slider 
      value={resolveParam($songStore, selectedPartIndex, selectedVoiceIndex, 'restPct') || 0} 
      inherited={getParamLevel($songStore, selectedPartIndex, selectedVoiceIndex, 'restPct') !== 'voice'}
      on:change={(e) => {
        currentVoice.restPct = e.detail;
        $songStore = $songStore;
      }}
      min={0} max={1} step={0.01} label="Rest %" 
    />
    
    {#if resolveParam($songStore, selectedPartIndex, selectedVoiceIndex, 'tonicPct') !== undefined}
      <Slider 
        value={resolveParam($songStore, selectedPartIndex, selectedVoiceIndex, 'tonicPct')} 
        inherited={getParamLevel($songStore, selectedPartIndex, selectedVoiceIndex, 'tonicPct') !== 'voice'}
        on:change={(e) => {
          currentVoice.tonicPct = e.detail;
          $songStore = $songStore;
        }}
        min={0} max={1} step={0.01} label="Tonic %" 
      />
    {/if}

    {#if resolveParam($songStore, selectedPartIndex, selectedVoiceIndex, 'inversionPct') !== undefined}
      <Slider 
        value={resolveParam($songStore, selectedPartIndex, selectedVoiceIndex, 'inversionPct')} 
        inherited={getParamLevel($songStore, selectedPartIndex, selectedVoiceIndex, 'inversionPct') !== 'voice'}
        on:change={(e) => {
          currentVoice.inversionPct = e.detail;
          $songStore = $songStore;
        }}
        min={0} max={1} step={0.01} label="Inv %" 
      />
    {/if}
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

  .grouped-box {
    display: flex;
    background: var(--bg-sub);
    padding: 5px;
    border-radius: 4px;
    border: 1px solid var(--border-main);
    position: relative;
    margin-top: 5px;
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