<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    songStore, loadSong, resolveParam, getParamLevel,
    addArrangerSection, removeArrangerSection, addTrack, removeTrack 
  } from './lib/songStore';
  import MasterSection from './lib/components/MasterSection.svelte';
  import ArrangerSidebar from './lib/components/ArrangerSidebar.svelte';
  import ArrangerEditor from './lib/components/ArrangerEditor.svelte';
  import TrackSection from './lib/components/TrackSection.svelte';
  import ClipSection from './lib/components/ClipSection.svelte';
  import Choice from './lib/components/Choice.svelte';

  let currentTheme = 'light';
  const themes = ['light', 'dark'];
  
  let history: string[] = [];
  let historyIndex = -1;
  let isUndoing = false;
  let saveTimeout: ReturnType<typeof setTimeout>;

  function saveState() {
    if (!$songStore) return;
    const serialized = JSON.stringify($songStore);
    
    localStorage.setItem('qrm_autosave', serialized);

    if (isUndoing) {
      isUndoing = false;
      return;
    }

    if (historyIndex < history.length - 1) {
      history = history.slice(0, historyIndex + 1);
    }

    if (history.length === 0 || history[history.length - 1] !== serialized) {
      history = [...history, serialized];
      historyIndex = history.length - 1;
      if (history.length > 50) {
        history.shift();
        historyIndex--;
      }
    }
  }

  $: if ($songStore && typeof localStorage !== 'undefined') {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveState, 200);
  }

  function handleUndo() {
    if (historyIndex > 0) {
      isUndoing = true;
      historyIndex--;
      $songStore = JSON.parse(history[historyIndex]);
      validateIndices();
    }
  }

  function handleRedo() {
    if (historyIndex < history.length - 1) {
      isUndoing = true;
      historyIndex++;
      $songStore = JSON.parse(history[historyIndex]);
      validateIndices();
    }
  }

  function validateIndices() {
    if (!$songStore) return;
    if ($songStore.arranger && selectedArrangerIndex >= $songStore.arranger.length) {
      selectedArrangerIndex = Math.max(0, $songStore.arranger.length - 1);
    }
    if ($songStore.tracks && selectedTrackIndex >= $songStore.tracks.length) {
      selectedTrackIndex = Math.max(0, $songStore.tracks.length - 1);
    }
  }

  function handleGlobalKeydown(e: KeyboardEvent) {
    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    } else if (e.key === 'y' && e.ctrlKey) {
      e.preventDefault();
      handleRedo();
    }
  }

  $: if (typeof document !== 'undefined') {
    // Remove all known theme classes first
    themes.forEach(t => document.body.classList.remove(t));
    if (currentTheme !== 'light') {
      document.body.classList.add(currentTheme);
    }
  }

  const initialSong = {
    "name"      : "Afterglowish",
    "outputDir" : "/Users/bert.olsson/Desktop/ag",
    "tempo"     : 60,
    "loglevel"  : 0,
    "key"       : { "tonic": "G", "mode": "major" },
    "meter"     : { "numerator": 4, "denominator": 4 },
    "arranger"  : [
      {
        "name"      : "intro",
        "nMeasures" : 1,
        "chords"    : [ "G", "Gmaj7", "G", "Gmaj7", "G", "C", "A" ]
      },
      {
        "name"      : "outro",
        "key"       : { "tonic": "D", "mode": "major" },
        "nMeasures" : 32,
        "chords"    : [ "D", "Dmaj7", "G", "Gm", "D", "Dmaj7", "G", "A" ]
      }
    ],
    "tracks" : [
      {
        "name"     : "Bass",
        "type"     : "chordal",
        "velocity" : [ 70, 80 ],
        "duration" : "1/2",
        "clips"    : [
          {
            "file"     : "afglo-bass-1.mid",
            "range"    : [ "E1", "E3" ],
            "restPct"  : 0,
            "tonicPct" : 0.75
          },
          {
            "file"     : "afglo-bass-2.mid",
            "range"    : [ "E1", "E3" ],
            "restPct"  : 0,
            "tonicPct" : 0.75,
            "velocity" : [ 80, 90 ]
          }
        ]
      },
      {
        "name"     : "Chords",
        "type"     : "chords",
        "duration" : "1/2",
        "clips"    : [
          {
            "file"         : "afglo-chords-1.mid",
            "inversionPct" : 0.25,
            "range"        : [ "C3", "C5" ],
            "restPct"      : 0
          },
          {
            "file"         : "afglo-chords-2.mid",
            "inversionPct" : 0.5,
            "range"        : [ "C3", "C5" ],
            "restPct"      : 0,
            "velocity"     : [ 80, 90 ]
          }
        ]
      }
    ]
  };

  let selectedArrangerIndex = 0;
  let selectedTrackIndex = 0;
  let loadedFilename = "";

  function handleInsertArranger(event: CustomEvent<string>) {
    const pos = event.detail;
    let idx = $songStore.arranger.length;
    if (pos === 'start') idx = 0;
    else if (pos === 'current') idx = selectedArrangerIndex;
    
    $songStore = addArrangerSection($songStore, idx);
    selectedArrangerIndex = idx;
  }

  function handleRemoveArranger(index: number) {
    if ($songStore.arranger.length <= 1) return;
    $songStore = removeArrangerSection($songStore, index);
    validateIndices();
  }

  function handleInsertTrack(event: CustomEvent<string>) {
    const pos = event.detail;
    let idx = $songStore.tracks.length;
    if (pos === 'start') idx = 0;
    else if (pos === 'current') idx = selectedTrackIndex;
    
    $songStore = addTrack($songStore, idx);
    selectedTrackIndex = idx;
  }

  function handleRemoveTrack(index: number) {
    if ($songStore.tracks.length <= 1) return;
    $songStore = removeTrack($songStore, index);
    validateIndices();
  }

  function handleAddTrackAtEnd() {
    handleInsertTrack({ detail: 'end' } as CustomEvent<string>);
  }

  onMount(() => {
    const saved = localStorage.getItem('qrm_autosave');
    if (saved) {
      try {
        const json = JSON.parse(saved);
        if (json.arranger && json.tracks) {
          loadSong(json);
        } else {
          loadSong(initialSong);
        }
      } catch (err) {
        loadSong(initialSong);
      }
    } else {
      loadSong(initialSong);
    }
  });

  function handleFileLoad(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      loadedFilename = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          loadSong(json);
          selectedArrangerIndex = 0;
          selectedTrackIndex = 0;
        } catch (err) {
          alert("Error parsing JSON file");
        } finally {
          target.value = "";
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

<svelte:window on:keydown={handleGlobalKeydown} />

<main>
  <div class="app-container">
    <div class="sidebar">
      <div class="logo">QRM<br>RACK</div>
      <label class="btn sidebar-btn">
        LOAD
        <input type="file" accept=".json" on:change={handleFileLoad} hidden />
      </label>
      <button class="btn sidebar-btn" on:click={downloadJson}>SAVE</button>
      
      <button 
        class="btn sidebar-btn" 
        on:click={handleUndo} 
        disabled={historyIndex <= 0}
        style="opacity: {historyIndex <= 0 ? '0.5' : '1'}; cursor: {historyIndex <= 0 ? 'not-allowed' : 'pointer'}"
      >UNDO</button>
      
      <div style="margin-top: auto; display: flex; flex-direction: column; align-items: center;">
        <Choice 
          bind:value={currentTheme} 
          options={themes} 
          width="80px"
        />
        <span style="font-size: 10px; color: var(--text-muted); margin-top: 4px; font-weight: bold; text-transform: uppercase;">Theme</span>
      </div>
    </div>

    {#if $songStore}
      <div class="main-content">
        <MasterSection {loadedFilename} />

        <div class="workspace">
          <ArrangerSidebar 
            {selectedArrangerIndex}
            on:select={(e) => selectedArrangerIndex = e.detail}
            on:insert={handleInsertArranger}
            on:delete={(e) => handleRemoveArranger(e.detail)}
          />

          <div class="stage">
            <ArrangerEditor {selectedArrangerIndex} />

            <div class="tracks-list">
              <div class="tracks-header">
                <h2 class="section-title">Instruments</h2>
                <button class="btn add-track-btn" on:click={handleAddTrackAtEnd}>+ Add Track</button>
              </div>

              {#each $songStore.tracks as track, i}
                <TrackSection 
                  selectedTrackIndex={i}
                  on:insert={handleInsertTrack}
                  on:delete={() => handleRemoveTrack(i)}
                >
                  <ClipSection 
                    {selectedArrangerIndex}
                    selectedTrackIndex={i}
                  />
                </TrackSection>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</main>

<style>
  :global(body) {
    --bg-main: #f4f6f8;
    --bg-card: #ffffff;
    --bg-sub: #f8f9fa;
    --bg-hover: #e9ecef;
    --bg-input: #ffffff;
    --text-main: #333333;
    --text-muted: #6c757d;
    --text-heading: #2c3e50;
    --border-main: #e0e0e0;
    --border-sub: #e9ecef;
    --border-input: #ced4da;
    --accent: #4dabf7;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: var(--bg-main);
    color: var(--text-main);
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  :global(body.dark) {
    --bg-main: #121212;
    --bg-card: #1e1e1e;
    --bg-sub: #252525;
    --bg-hover: #333333;
    --bg-input: #2a2a2a;
    --text-main: #e0e0e0;
    --text-muted: #a0a0a0;
    --text-heading: #ffffff;
    --border-main: #333333;
    --border-sub: #444444;
    --border-input: #555555;
    --accent: #3b82f6;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.5);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
  }

  main {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 40px 20px;
    box-sizing: border-box;
  }

  .app-container {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    width: 100%;
    max-width: 1200px;
  }

  .sidebar {
    flex: 0 0 100px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    background: var(--bg-card);
    padding: 20px;
    border-radius: 8px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-main);
  }

  .logo {
    font-size: 16px;
    font-weight: 800;
    color: var(--text-heading);
    text-align: center;
    border-bottom: 2px solid var(--border-sub);
    padding-bottom: 12px;
    margin-bottom: 8px;
    line-height: 1.2;
    letter-spacing: 1px;
  }

  .btn {
    background: var(--bg-sub);
    border: 1px solid var(--border-input);
    color: var(--text-main);
    cursor: pointer;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .sidebar-btn {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
  }

  .btn:hover {
    background: var(--bg-hover);
    border-color: var(--text-muted);
  }

  .btn:active {
    transform: translateY(1px);
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }

  .workspace {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .tracks-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .tracks-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
    padding: 0 5px;
  }

  .section-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-heading);
    margin: 0;
  }

  .add-track-btn {
    padding: 6px 12px;
    font-size: 0.75rem;
  }
</style>