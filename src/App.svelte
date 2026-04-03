<script lang="ts">
  import { onMount } from 'svelte';
  import { songStore, loadSong, resolveParam } from './lib/songStore';
  import RackUnit from './lib/components/RackUnit.svelte';
  import Knob from './lib/components/Knob.svelte';
  import Display from './lib/components/Display.svelte';
  import Switch from './lib/components/Switch.svelte';
  import Choice from './lib/components/Choice.svelte';

  const tonics = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const modes = ['major', 'minor'];
  const voiceTypes = ['chordal', 'freeform', 'chords'];

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
  <div class="app-container">
    <div class="sidebar">
      <div class="logo">QRM<br>RACK</div>
      <label class="btn sidebar-btn">
        LOAD
        <input type="file" accept=".json" on:change={handleFileLoad} hidden />
      </label>
      <button class="btn sidebar-btn" on:click={downloadJson}>SAVE</button>
    </div>

    {#if $songStore}
      <div class="rack">
        <!-- Master Section -->
        <RackUnit title="Master Control Section">
          <Display bind:value={$songStore.name} label="Song Title" width="300px" />
          <Knob bind:value={$songStore.tempo} min={40} max={240} label="Tempo" />
          <Knob bind:value={$songStore.loglevel} min={0} max={4} label="Log Level" />
          <Display bind:value={$songStore.outputDir} label="Output Directory" width="300px" color="#ffaa00" fontSize="12px" />
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
              <div class="grouped-box">
                <span class="box-label">KEY</span>
                <Choice 
                  value={resolveParam($songStore, selectedPartIndex, 0, 'key')?.tonic} 
                  options={tonics}
                  on:change={(e) => {
                    let k = resolveParam($songStore, selectedPartIndex, 0, 'key');
                    if (!k) {
                      currentPart.key = { tonic: e.detail, mode: 'major' };
                    } else {
                      k.tonic = e.detail;
                    }
                    $songStore = $songStore;
                  }}
                  width="50px" 
                />
                <Choice 
                  value={resolveParam($songStore, selectedPartIndex, 0, 'key')?.mode} 
                  options={modes}
                  on:change={(e) => {
                    let k = resolveParam($songStore, selectedPartIndex, 0, 'key');
                    if (!k) {
                      currentPart.key = { tonic: 'C', mode: e.detail };
                    } else {
                      k.mode = e.detail;
                    }
                    $songStore = $songStore;
                  }}
                  width="100px" 
                />
              </div>

              <div class="grouped-box">
                <span class="box-label">METER</span>
                <Display 
                  value="{resolveParam($songStore, selectedPartIndex, 0, 'meter')?.numerator || 4}/{resolveParam($songStore, selectedPartIndex, 0, 'meter')?.denominator || 4}" 
                  on:change={(e) => {
                    let m = resolveParam($songStore, selectedPartIndex, 0, 'meter');
                    const [n, d] = e.detail.split('/');
                    if (!m) {
                      currentPart.meter = { numerator: parseInt(n), denominator: parseInt(d) };
                    } else {
                      m.numerator = parseInt(n);
                      m.denominator = parseInt(d);
                    }
                    $songStore = $songStore;
                  }}
                  width="75px" 
                />
              </div>
              
              <Knob 
                value={resolveParam($songStore, selectedPartIndex, 0, 'nMeasures') || 1} 
                on:change={(e) => {
                  if (currentPart.nMeasures !== undefined) currentPart.nMeasures = e.detail;
                  else $songStore.nMeasures = e.detail;
                  $songStore = $songStore;
                }}
                min={1} max={128} label="Measures" 
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
                  min={0} max={127} label="Min" size={25}
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
                  min={0} max={127} label="Max" size={25}
                />
              </div>

              <Display 
                value={resolveParam($songStore, selectedPartIndex, 0, 'duration')} 
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
                <div class="row" style="justify-content: center;">
                  <div class="grouped-box">
                    <span class="box-label">TYPE</span>
                    <Choice 
                      value={currentVoice.type} 
                      options={voiceTypes}
                      on:change={(e) => {
                        currentVoice.type = e.detail;
                        $songStore = $songStore;
                      }}
                      width="100px" 
                    />
                  </div>
                  <Display bind:value={currentVoice.file} label="MIDI File" width="200px" color="#aaa" />
                  <Knob 
                    value={resolveParam($songStore, selectedPartIndex, selectedVoiceIndex, 'restPct') || 0} 
                    on:change={(e) => {
                      if (currentVoice.restPct !== undefined) currentVoice.restPct = e.detail;
                      else if (currentPart.restPct !== undefined) currentPart.restPct = e.detail;
                      else $songStore.restPct = e.detail;
                      $songStore = $songStore;
                    }}
                    min={0} max={1} label="Rest %" 
                  />
                  
                  {#if resolveParam($songStore, selectedPartIndex, selectedVoiceIndex, 'tonicPct') !== undefined}
                    <Knob 
                      value={resolveParam($songStore, selectedPartIndex, selectedVoiceIndex, 'tonicPct')} 
                      on:change={(e) => {
                        if (currentVoice.tonicPct !== undefined) currentVoice.tonicPct = e.detail;
                        else if (currentPart.tonicPct !== undefined) currentPart.tonicPct = e.detail;
                        $songStore = $songStore;
                      }}
                      min={0} max={1} label="Tonic %" 
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
                      min={0} max={1} label="Inv %" 
                    />
                  {/if}
                </div>
              </RackUnit>
            {/if}
          </RackUnit>
        {/if}
      </div>
    {/if}
  </div>
</main>

<style>
  main {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 40px 0;
  }

  .app-container {
    display: flex;
    align-items: flex-start;
    gap: 0;
    position: relative;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 15px;
    background: #222;
    padding: 20px 10px;
    border: 4px solid #000;
    border-right: none;
    border-radius: 4px 0 0 4px;
    box-shadow: -10px 10px 30px rgba(0,0,0,0.5);
    margin-top: 20px;
  }

  .logo {
    font-size: 14px;
    font-weight: 900;
    color: var(--accent);
    text-align: center;
    border-bottom: 2px solid #444;
    padding-bottom: 10px;
    margin-bottom: 10px;
    line-height: 1;
  }

  .btn {
    background: #333;
    border: 1px solid #555;
    color: #eee;
    cursor: pointer;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-radius: 2px;
  }

  .sidebar-btn {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 10px;
    border-radius: 50%;
    background: radial-gradient(circle, #444, #222);
    border: 2px solid #555;
    box-shadow: 0 4px 0 #111;
    transition: all 0.05s;
  }

  .sidebar-btn:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 #000;
    background: radial-gradient(circle, #333, #111);
  }

  .rack {
    width: 900px;
    background-color: #111;
    border: 8px solid #000;
    padding: 20px;
    border-radius: 0 4px 4px 0;
    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
    position: relative;
  }

  .rack::after {
    content: "";
    position: absolute;
    top: 0;
    right: -30px;
    width: 30px;
    height: 100%;
    background: #222;
    z-index: -1;
    border-radius: 0 4px 4px 0;
    border-right: 2px solid #333;
  }

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
    color: var(--accent);
    background: #222;
    padding: 0 5px;
    font-weight: bold;
    letter-spacing: 1.2px;
    border: 1px solid #444;
    border-radius: 4px;
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
