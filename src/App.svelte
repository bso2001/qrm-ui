<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    songStore, loadSong, resolveParam, getParamLevel,
    addPart, removePart, addVoice, removeVoice 
  } from './lib/songStore';
  import MasterSection from './lib/components/MasterSection.svelte';
  import PartSection from './lib/components/PartSection.svelte';
  import VoiceSection from './lib/components/VoiceSection.svelte';

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

  function handleInsertPart(event: CustomEvent<string>) {
    const pos = event.detail;
    let idx = $songStore.parts.length;
    if (pos === 'start') idx = 0;
    else if (pos === 'current') idx = selectedPartIndex;
    else idx = $songStore.parts.length;
    
    $songStore = addPart($songStore, idx);
    selectedPartIndex = idx;
    selectedVoiceIndex = 0;
  }

  function handleRemovePart() {
    if ($songStore.parts.length <= 1) return;
    
    const indexToDelete = selectedPartIndex;
    
    // Calculate new index before mutating the store
    let newIndex = selectedPartIndex;
    if (selectedPartIndex >= $songStore.parts.length - 1) {
      newIndex = $songStore.parts.length - 2;
    }
    
    selectedPartIndex = newIndex;
    selectedVoiceIndex = 0;
    
    // Now update the store using the captured index
    $songStore = removePart($songStore, indexToDelete);
  }

  function handleInsertVoice(event: CustomEvent<string>) {
    const pos = event.detail;
    let idx = currentPart.voices.length;
    if (pos === 'start') idx = 0;
    else if (pos === 'current') idx = selectedVoiceIndex;
    else idx = currentPart.voices.length;
    
    $songStore = addVoice($songStore, selectedPartIndex, idx);
    selectedVoiceIndex = idx;
  }

  function handleRemoveVoice() {
    if (currentPart.voices.length <= 1) return;
    
    const indexToDelete = selectedVoiceIndex;
    
    let newIndex = selectedVoiceIndex;
    if (selectedVoiceIndex >= currentPart.voices.length - 1) {
      newIndex = currentPart.voices.length - 2;
    }
    
    selectedVoiceIndex = newIndex;
    
    $songStore = removeVoice($songStore, selectedPartIndex, indexToDelete);
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
        
        <MasterSection {loadedFilename} />

        {#if currentPart}
          <PartSection 
            {selectedPartIndex}
            on:next={nextPart}
            on:prev={prevPart}
            on:insert={handleInsertPart}
            on:delete={handleRemovePart}
          >
            {#if currentVoice}
              <VoiceSection 
                {selectedPartIndex}
                {selectedVoiceIndex}
                on:next={nextVoice}
                on:prev={prevVoice}
                on:insert={handleInsertVoice}
                on:delete={handleRemoveVoice}
              />
            {/if}
          </PartSection>
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
    position: absolute;
    right: 100%;
    top: 0;
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
</style>