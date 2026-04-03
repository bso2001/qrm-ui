<script lang="ts">
  import { onMount } from 'svelte';
  import { songStore, loadSong, resolveParam } from './lib/songStore';
  import RackUnit from './lib/components/RackUnit.svelte';
  import Knob from './lib/components/Knob.svelte';
  import Display from './lib/components/Display.svelte';
  import Switch from './lib/components/Switch.svelte';

  const initialSong = {
    "name"      : "Afterglowish",
    "outputDir" : "/Users/bert.olsson/Desktop/ag",
    "tempo"     : 60,
    "loglevel"  : 0,
    "parts" : [
      {
        "name"      : "intro",
        "key"       : { "tonic" : "G", "mode" : "major" },
        "meter"     : { "numerator" : 4, "denominator" : 4 },
        "nMeasures" : 1,
        "chords"    : [ "G", "Gmaj7", "G", "Gmaj7", "G", "C", "A" ],
        "velocity"  : [ 70, 80 ],
        "duration"  : "1/2",
        "voices" : [
          {
            "file"     : "afglo-bass-1.mid",
            "type"     : "chordal",
            "range"    : [ "E1", "E3" ],
            "restPct"  : 0,
            "tonicPct" : 0.75
          },
          {
            "file"         : "afglo-chords-1.mid",
            "type"         : "chords",
            "inversionPct" : 0.25,
            "range"        : [ "C3", "C5" ],
            "restPct"      : 0
          }
        ]
      },
      {
        "name"      : "outro",
        "key"       : { "tonic" : "D", "mode" : "major" },
        "meter"     : { "numerator" : 4, "denominator" : 4 },
        "nMeasures" : 32,
        "chords"    : [ "D", "Dmaj7", "G", "Gm", "D", "Dmaj7", "G", "A" ],
        "velocity"  : [ 80, 90 ],
        "duration"  : "1/2",
        "voices" : [
          {
            "file"     : "afglo-bass-2.mid",
            "type"     : "chordal",
            "range"    : [ "E1", "E3" ],
            "restPct"  : 0,
            "tonicPct" : 0.75
          },
          {
            "file"         : "afglo-chords-2.mid",
            "type"         : "chords",
            "inversionPct" : 0.5,
            "range"        : [ "C3", "C5" ],
            "restPct"      : 0
          }
        ]
      }
    ]
  };

  let selectedPartIndex = 0;
  let selectedVoiceIndex = 0;
  let loadedFilename = "";

  $: currentPart = $songStore?.parts?.[selectedPartIndex];
  $: currentVoice = currentPart?.voices?.[selectedVoiceIndex];

  function nextPart() {
    selectedPartIndex = (selectedPartIndex + 1) % $songStore.parts.length;
    selectedVoiceIndex = 0;
  }

  function prevPart() {
    selectedPartIndex = (selectedPartIndex - 1 + $songStore.parts.length) % $songStore.parts.length;
    selectedVoiceIndex = 0;
  }

  function nextVoice() {
    selectedVoiceIndex = (selectedVoiceIndex + 1) % currentPart.voices.length;
  }

  function prevVoice() {
    selectedVoiceIndex = (selectedVoiceIndex - 1 + currentPart.voices.length) % currentPart.voices.length;
  }

  onMount(() => {
    loadSong(initialSong);
  });

  function handleFileLoad(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      loadedFilename = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          loadSong(json);
          selectedPartIndex = 0;
          selectedVoiceIndex = 0;
          (event.target as HTMLInputElement).value = "";
        } catch (err) {
          alert("Error parsing JSON file");
        }
      };
      reader.readAsText(file);
    }
  }

  function downloadJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify($songStore, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", ($songStore.name || loadedFilename || "song") + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
</script>

<main>
  <div class="toolbar">
    <label class="btn">
      LOAD JSON
      <input type="file" accept=".json" on:change={handleFileLoad} hidden />
    </label>
    <button class="btn" on:click={downloadJson}>SAVE JSON</button>
  </div>

  {#if $songStore}
    <div class="rack">
      <!-- Master Section -->
      <RackUnit title="Master Control Section">
        <Display value={$songStore.name || loadedFilename || "-- UNSET --"} label="Song Title" width="300px" />
        <Knob bind:value={$songStore.tempo} min={40} max={240} label="Tempo" size={60} />
        <Knob bind:value={$songStore.loglevel} min={0} max={4} label="Log Level" size={40} />
        <Display value={$songStore.outputDir || "-- UNSET --"} label="Output Directory" width="300px" color="#ffaa00" />
      </RackUnit>

      <!-- Current Part -->
      {#if currentPart}
        <RackUnit 
          title="Part: {currentPart.name || 'Part ' + (selectedPartIndex + 1)}" 
          showNav={true} 
          navLabel="PART {selectedPartIndex + 1} OF {$songStore.parts.length}"
          on:next={nextPart}
          on:prev={prevPart}
        >
          <div class="row">
            <Display value={resolveParam($songStore, selectedPartIndex, 0, 'key')?.tonic || "-"} label="Tonic" width="50px" />
            <Display value={resolveParam($songStore, selectedPartIndex, 0, 'key')?.mode || "-"} label="Mode" width="100px" />
            <Display 
              value="{resolveParam($songStore, selectedPartIndex, 0, 'meter')?.numerator || 4}/{resolveParam($songStore, selectedPartIndex, 0, 'meter')?.denominator || 4}" 
              label="Meter" width="60px" 
            />
            
            <Knob 
              value={resolveParam($songStore, selectedPartIndex, 0, 'nMeasures') || 1} 
              on:change={(e) => {
                if (currentPart.nMeasures !== undefined) currentPart.nMeasures = e.detail;
                else $songStore.nMeasures = e.detail;
                $songStore = $songStore;
              }}
              min={1} max={128} label="Measures" size={40} 
            />

            <div class="velocity-box">
              <Knob 
                value={resolveParam($songStore, selectedPartIndex, 0, 'velocity')?.[0] || 60} 
                on:change={(e) => {
                  let v = resolveParam($songStore, selectedPartIndex, 0, 'velocity');
                  if (!v) {
                    currentPart.velocity = [e.detail, 80];
                  } else {
                    v[0] = e.detail;
                  }
                  $songStore = $songStore;
                }}
                min={0} max={127} label="Vel Min" size={30} 
              />
              <Knob 
                value={resolveParam($songStore, selectedPartIndex, 0, 'velocity')?.[1] || 80} 
                on:change={(e) => {
                  let v = resolveParam($songStore, selectedPartIndex, 0, 'velocity');
                  if (!v) {
                    currentPart.velocity = [60, e.detail];
                  } else {
                    v[1] = e.detail;
                  }
                  $songStore = $songStore;
                }}
                min={0} max={127} label="Vel Max" size={30} 
              />
            </div>

            <Display 
              value={resolveParam($songStore, selectedPartIndex, 0, 'duration') || "1/4"} 
              label="Duration" width="80px" color="#00ffff" 
            />
          </div>

          <!-- Chords Display -->
          {#if resolveParam($songStore, selectedPartIndex, 0, 'chords')}
            <div class="chords-row">
              <span class="chords-label">CHORDS:</span>
              <div class="chord-sequence">
                {#each resolveParam($songStore, selectedPartIndex, 0, 'chords') as chord}
                  <span class="chord-tag">{chord}</span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Current Voice -->
          {#if currentVoice}
            <RackUnit 
              subModule={true} 
              title="Voice: {currentVoice.file || 'Internal'}"
              showNav={true}
              navLabel="VOICE {selectedVoiceIndex + 1} OF {currentPart.voices.length}"
              on:next={nextVoice}
              on:prev={prevVoice}
            >
              <div class="row">
                <Switch on={currentVoice.type === 'chordal'} label="Chordal" />
                <Display value={currentVoice.file || "internal"} label="MIDI File" width="200px" color="#aaa" />
                <Knob 
                  value={resolveParam($songStore, selectedPartIndex, selectedVoiceIndex, 'restPct') || 0} 
                  on:change={(e) => {
                    if (currentVoice.restPct !== undefined) currentVoice.restPct = e.detail;
                    else if (currentPart.restPct !== undefined) currentPart.restPct = e.detail;
                    else $songStore.restPct = e.detail;
                    $songStore = $songStore;
                  }}
                  min={0} max={1} label="Rest %" size={40} 
                />
                
                {#if resolveParam($songStore, selectedPartIndex, selectedVoiceIndex, 'tonicPct') !== undefined}
                  <Knob 
                    value={resolveParam($songStore, selectedPartIndex, selectedVoiceIndex, 'tonicPct')} 
                    on:change={(e) => {
                      if (currentVoice.tonicPct !== undefined) currentVoice.tonicPct = e.detail;
                      else if (currentPart.tonicPct !== undefined) currentPart.tonicPct = e.detail;
                      $songStore = $songStore;
                    }}
                    min={0} max={1} label="Tonic %" size={40} 
                  />
                {/if}

                {#if resolveParam($songStore, selectedPartIndex, selectedVoiceIndex, 'inversionPct') !== undefined}
                  <Knob 
                    value={resolveParam($songStore, selectedPartIndex, selectedVoiceIndex, 'inversionPct')} 
                    on:change={(e) => {
                      if (currentVoice.inversionPct !== undefined) currentVoice.inversionPct = e.detail;
                      else if (currentPart.inversionPct !== undefined) currentPart.inversionPct = e.detail;
                      $songStore = $songStore;
                    }}
                    min={0} max={1} label="Inv %" size={40} 
                  />
                {/if}
              </div>
            </RackUnit>
          {/if}
        </RackUnit>
      {/if}
    </div>
  {/if}
</main>

<style>
  main {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .toolbar {
    margin-bottom: 20px;
    display: flex;
    gap: 10px;
  }

  .btn {
    background: #333;
    border: 1px solid #555;
    color: #eee;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.5);
    border-radius: 2px;
  }

  .btn:hover {
    background: #444;
    border-color: #666;
  }

  .rack {
    width: 900px;
    background-color: #111;
    border: 8px solid #000;
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
    position: relative;
  }

  .rack::before, .rack::after {
    content: "";
    position: absolute;
    top: 0;
    width: 30px;
    height: 100%;
    background: #222;
    z-index: -1;
  }
  .rack::before { left: -30px; border-radius: 4px 0 0 4px; border-left: 2px solid #333; }
  .rack::after { right: -30px; border-radius: 0 4px 4px 0; border-right: 2px solid #333; }

  .row {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 10px;
    flex-wrap: wrap;
  }

  .velocity-box {
    display: flex;
    background: rgba(0,0,0,0.2);
    padding: 5px;
    border-radius: 4px;
    border: 1px solid #333;
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
    color: var(--accent);
    border: 1px solid #333;
    padding: 2px 8px;
    font-size: 14px;
    border-radius: 2px;
    text-shadow: 0 0 5px var(--accent);
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.8);
  }
</style>
