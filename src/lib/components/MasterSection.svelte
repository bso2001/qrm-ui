<script lang="ts">
  import { songStore } from '../songStore';
  import Card from './Card.svelte';
  import Slider from './Slider.svelte';
  import Display from './Display.svelte';
  import Choice from './Choice.svelte';
  import { tonics, modes, logLevels } from '../constants';

  export let loadedFilename = "";
</script>

<Card title={loadedFilename || "SONG INFO"}>
  <div class="row" style="gap: 15px; align-items: flex-end;">
    <div style="display: flex; flex-direction: column; gap: 0;">
      <Display bind:value={$songStore.name} label="Title" width="250px" fontSize="12px" />
      <Display bind:value={$songStore.outputDir} label="Output" width="250px" color="#ffaa00" fontSize="10px" />
    </div>
    
    <Slider bind:value={$songStore.tempo} min={40} max={240} label="Tempo" />
    
    <div class="grouped-box" style="margin-top: 0; padding-top: 10px;">
      <span class="box-label">LOG</span>
      <Choice 
        value={$songStore.loglevel?.toString() || '0'} 
        options={logLevels}
        on:change={(e) => {
          $songStore.loglevel = parseInt(e.detail);
          $songStore = $songStore;
        }}
        width="40px" 
      />
    </div>

    <div class="grouped-box" style="margin-top: 0; padding-top: 10px;">
      <span class="box-label">DEFAULT</span>
      <div style="display: flex; gap: 5px; align-items: flex-end;">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <span class="inner-label" style="font-size: 9px;">KEY</span>
          <Choice 
            value={$songStore.key?.tonic || 'C'} 
            options={tonics} 
            on:change={(e) => {
              if (!$songStore.key) $songStore.key = { tonic: 'C', mode: 'major' };
              $songStore.key.tonic = e.detail;
              $songStore = $songStore;
            }}
            width="45px" 
          />
        </div>
        <Choice 
          value={$songStore.key?.mode || 'major'} 
          options={modes} 
          on:change={(e) => {
            if (!$songStore.key) $songStore.key = { tonic: 'C', mode: 'major' };
            $songStore.key.mode = e.detail;
            $songStore = $songStore;
          }}
          width="80px" 
        />
        <Display 
          value="{$songStore.meter?.numerator || 4}/{$songStore.meter?.denominator || 4}" 
          label="METER"
          on:change={(e) => {
            const [n, d] = e.detail.split('/');
            $songStore.meter = { numerator: parseInt(n) || 4, denominator: parseInt(d) || 4 };
            $songStore = $songStore;
          }}
          width="60px" 
        />
      </div>
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
</style>