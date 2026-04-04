<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { songStore, resolveParam, getParamLevel } from '../songStore';
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import Display from './Display.svelte';
  import Choice from './Choice.svelte';
  import { tonics, modes } from '../constants';

  export let selectedPartIndex: number;

  $: currentPart = $songStore?.parts?.[selectedPartIndex] || {};

  const dispatch = createEventDispatcher();
</script>

<Card 
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
    
    <Slider 
      value={resolveParam($songStore, selectedPartIndex, 0, 'nMeasures') || 1} 
      inherited={getParamLevel($songStore, selectedPartIndex, 0, 'nMeasures') === 'song'}
      on:change={(e) => {
        currentPart.nMeasures = e.detail;
        $songStore = $songStore;
      }}
      min={1} max={128} label="Measures" 
    />

    <div class="velocity-box">
      <Slider 
        value={resolveParam($songStore, selectedPartIndex, 0, 'velocity')?.[0] || 60} 
        inherited={getParamLevel($songStore, selectedPartIndex, 0, 'velocity') === 'song'}
        on:change={(e) => {
          if (!currentPart.velocity) currentPart.velocity = [...($songStore.velocity || [60, 80])];
          currentPart.velocity[0] = e.detail;
          $songStore = $songStore;
        }}
        min={0} max={127} label="Min"
      />
      <Slider 
        value={resolveParam($songStore, selectedPartIndex, 0, 'velocity')?.[1] || 80} 
        inherited={getParamLevel($songStore, selectedPartIndex, 0, 'velocity') === 'song'}
        on:change={(e) => {
          if (!currentPart.velocity) currentPart.velocity = [...($songStore.velocity || [60, 80])];
          currentPart.velocity[1] = e.detail;
          $songStore = $songStore;
        }}
        min={0} max={127} label="Max"
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

  .inner-label {
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 900;
    text-align: center;
  }

  .chords-row {
    margin-top: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    background: var(--bg-sub);
    padding: 10px;
    border-radius: 6px;
    border: 1px solid var(--border-main);
    transition: opacity 0.2s;
  }

  .chords-row.inherited {
    opacity: 0.5;
  }

  .chords-row.inherited:hover {
    opacity: 0.8;
  }

  .chords-label {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 900;
    min-width: 80px;
  }

  .chord-sequence {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }

  .chord-tag {
    background: var(--bg-input);
    color: var(--accent);
    border: 1px solid var(--border-input);
    padding: 4px 10px;
    font-size: 14px;
    border-radius: 4px;
    font-weight: 600;
    box-shadow: var(--shadow-sm);
  }
</style>