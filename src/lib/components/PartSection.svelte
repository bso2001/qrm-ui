<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { songStore, resolveParam, getParamLevel } from '../songStore';
  import RackUnit from './RackUnit.svelte';
  import Knob from './Knob.svelte';
  import Display from './Display.svelte';
  import Choice from './Choice.svelte';
  import { tonics, modes } from '../constants';

  export let selectedPartIndex: number;

  $: currentPart = $songStore?.parts?.[selectedPartIndex] || {};

  const dispatch = createEventDispatcher();
</script>

<RackUnit 
  title="Part Settings" 
  showNav={true} 
  navLabel="PART {selectedPartIndex + 1} OF {$songStore.parts.length}"
  on:next={() => dispatch('next')}
  on:prev={() => dispatch('prev')}
  showInsert={true}
  on:insert={(e) => dispatch('insert', e.detail)}
  showDelete={$songStore?.parts?.length > 1}
  on:delete={() => dispatch('delete')}
>
  <div class="row">
    <Display bind:value={currentPart.name} label="Part Name" width="150px" />
    
    <div class="grouped-box">
      <span class="box-label">OVERRIDES</span>
      
      <div style="display: flex; gap: 5px; align-items: flex-end; margin: 5px;">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <span class="inner-label">KEY</span>
          <Choice 
            value={resolveParam($songStore, selectedPartIndex, 0, 'key')?.tonic || 'C'} 
            inherited={getParamLevel($songStore, selectedPartIndex, 0, 'key') === 'song'}
            options={tonics}
            on:change={(e) => {
              if (!currentPart.key) currentPart.key = { ...($songStore.key || {tonic: 'C', mode: 'major'}) };
              currentPart.key.tonic = e.detail;
              $songStore = $songStore;
            }}
            width="50px" 
          />
        </div>
        <Choice 
          value={resolveParam($songStore, selectedPartIndex, 0, 'key')?.mode || 'major'} 
          inherited={getParamLevel($songStore, selectedPartIndex, 0, 'key') === 'song'}
          options={modes}
          on:change={(e) => {
            if (!currentPart.key) currentPart.key = { ...($songStore.key || {tonic: 'C', mode: 'major'}) };
            currentPart.key.mode = e.detail;
            $songStore = $songStore;
          }}
          width="100px" 
        />
      </div>

      <Display 
        value="{resolveParam($songStore, selectedPartIndex, 0, 'meter')?.numerator || 4}/{resolveParam($songStore, selectedPartIndex, 0, 'meter')?.denominator || 4}" 
        label="METER"
        inherited={getParamLevel($songStore, selectedPartIndex, 0, 'meter') === 'song'}
        on:change={(e) => {
          const [n, d] = e.detail.split('/');
          currentPart.meter = { numerator: parseInt(n) || 4, denominator: parseInt(d) || 4 };
          $songStore = $songStore;
        }}
        width="75px" 
      />
    </div>
    
    <Knob 
      value={resolveParam($songStore, selectedPartIndex, 0, 'nMeasures') || 1} 
      inherited={getParamLevel($songStore, selectedPartIndex, 0, 'nMeasures') === 'song'}
      on:change={(e) => {
        currentPart.nMeasures = e.detail;
        $songStore = $songStore;
      }}
      min={1} max={128} label="Measures" 
    />

    <div class="velocity-box">
      <Knob 
        value={resolveParam($songStore, selectedPartIndex, 0, 'velocity')?.[0] || 60} 
        inherited={getParamLevel($songStore, selectedPartIndex, 0, 'velocity') === 'song'}
        on:change={(e) => {
          if (!currentPart.velocity) currentPart.velocity = [...($songStore.velocity || [60, 80])];
          currentPart.velocity[0] = e.detail;
          $songStore = $songStore;
        }}
        min={0} max={127} label="Min" size={25}
      />
      <Knob 
        value={resolveParam($songStore, selectedPartIndex, 0, 'velocity')?.[1] || 80} 
        inherited={getParamLevel($songStore, selectedPartIndex, 0, 'velocity') === 'song'}
        on:change={(e) => {
          if (!currentPart.velocity) currentPart.velocity = [...($songStore.velocity || [60, 80])];
          currentPart.velocity[1] = e.detail;
          $songStore = $songStore;
        }}
        min={0} max={127} label="Max" size={25}
      />
    </div>

    <Display 
      value={resolveParam($songStore, selectedPartIndex, 0, 'duration') || '1/4'} 
      inherited={getParamLevel($songStore, selectedPartIndex, 0, 'duration') === 'song'}
      on:change={(e) => {
        if (e.detail.startsWith('[')) {
          try { currentPart.duration = JSON.parse(e.detail); } catch(err) { currentPart.duration = e.detail; }
        } else {
          currentPart.duration = e.detail;
        }
        $songStore = $songStore;
      }}
      label="Duration" width="80px" color="#00ffff" 
    />
  </div>

  {#if resolveParam($songStore, selectedPartIndex, 0, 'chords')}
    <div class="chords-row" class:inherited={getParamLevel($songStore, selectedPartIndex, 0, 'chords') === 'song'}>
      <span class="chords-label">CHORDS:</span>
      <div class="chord-sequence">
        {#each resolveParam($songStore, selectedPartIndex, 0, 'chords') as chord}
          <span class="chord-tag">{chord}</span>
        {/each}
      </div>
    </div>
  {/if}

  <slot />

</RackUnit>

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
    background: rgba(0,0,0,0.2);
    padding: 5px;
    border-radius: 4px;
    border: 1px solid #333;
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
    color: var(--accent, #00ff00);
    background: #222;
    padding: 0 5px;
    font-weight: bold;
    letter-spacing: 1.2px;
    border: 1px solid #444;
    border-radius: 4px;
  }

  .inner-label {
    font-size: 11px;
    color: #eee;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 900;
    text-shadow: 0 1px 2px rgba(0,0,0,1);
    text-align: center;
  }

  .chords-row {
    margin-top: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    background: rgba(0,0,0,0.3);
    padding: 10px;
    border-radius: 2px;
    border: 1px solid #222;
    transition: opacity 0.2s;
  }

  .chords-row.inherited {
    opacity: 0.4;
  }

  .chords-row.inherited:hover {
    opacity: 0.7;
  }

  .chords-label {
    font-size: 11px;
    color: #bbb;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 900;
    text-shadow: 0 1px 2px rgba(0,0,0,1);
    min-width: 80px;
  }

  .chord-sequence {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }

  .chord-tag {
    background: #000;
    color: var(--accent, #00ff00);
    border: 1px solid #333;
    padding: 2px 8px;
    font-size: 14px;
    border-radius: 2px;
    text-shadow: 0 0 5px var(--accent, #00ff00);
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);
  }
</style>