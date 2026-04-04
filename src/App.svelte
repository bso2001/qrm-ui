<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    songStore, loadSong, resolveParam, getParamLevel,
    addTimelineSection, removeTimelineSection, addPlayer, removePlayer 
  } from './lib/songStore';
  import MasterSection from './lib/components/MasterSection.svelte';
  import TimelineSidebar from './lib/components/TimelineSidebar.svelte';
  import TimelineEditor from './lib/components/TimelineEditor.svelte';
  import PerformerSection from './lib/components/PerformerSection.svelte';
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
    if ($songStore.timeline && selectedTimelineIndex >= $songStore.timeline.length) {
      selectedTimelineIndex = Math.max(0, $songStore.timeline.length - 1);
    }
    if ($songStore.performers && selectedPerformerIndex >= $songStore.performers.length) {
      selectedPerformerIndex = Math.max(0, $songStore.performers.length - 1);
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
    "timeline"  : [
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
    "performers" : [
      {
        "name"     : "Bass",
        "type"     : "chordal",
        "velocity" : [ 70, 80 ],
        "duration" : "1/2",
        "performances" : [
          {
            "file"     : "afglo-bass-1.mid",
            "restPct"  : 0,
            "tonicPct" : 0.75
          },
          {
            "file"     : "afglo-bass-2.mid",
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
        "performances" : [
          {
            "file"         : "afglo-chords-1.mid",
            "inversionPct" : 0.25,
            "restPct"      : 0
          },
          {
            "file"         : "afglo-chords-2.mid",
            "inversionPct" : 0.5,
            "restPct"      : 0,
            "velocity"     : [ 80, 90 ]
          }
        ]
      }
    ]
  };

  let selectedTimelineIndex = 0;
  let selectedPerformerIndex = 0;
  let loadedFilename = "";

  function handleInsertTimeline(event: CustomEvent<string>) {
    const pos = event.detail;
    let idx = $songStore.timeline.length;
    if (pos === 'start') idx = 0;
    else if (pos === 'current') idx = selectedTimelineIndex;
    
    $songStore = addTimelineSection($songStore, idx);
    selectedTimelineIndex = idx;
  }

  function handleRemoveTimeline(index: number) {
    if ($songStore.timeline.length <= 1) return;
    $songStore = removeTimelineSection($songStore, index);
    validateIndices();
  }

  function handleInsertPerformer(event: CustomEvent<string>) {
    const pos = event.detail;
    let idx = $songStore.performers.length;
    if (pos === 'start') idx = 0;
    else if (pos === 'current') idx = selectedPerformerIndex;
    
    $songStore = addPlayer($songStore, idx);
    selectedPerformerIndex = idx;
  }

  function handleRemovePerformer(index: number) {
    if ($songStore.performers.length <= 1) return;
    $songStore = removePlayer($songStore, index);
    validateIndices();
  }

  function handleAddPerformerAtEnd() {
    handleInsertPerformer({ detail: 'end' } as CustomEvent<string>);
  }

  onMount(() => {
    const saved = localStorage.getItem('qrm_autosave');
    if (saved) {
      try {
        const json = JSON.parse(saved);
        if (json.timeline && json.performers) {
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
          selectedTimelineIndex = 0;
          selectedPerformerIndex = 0;
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
      <div class="logo">QRM</div>
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
          <TimelineSidebar 
            {selectedTimelineIndex}
            on:select={(e) => selectedTimelineIndex = e.detail}
            on:insert={handleInsertTimeline}
            on:delete={(e) => handleRemoveTimeline(e.detail)}
          />

          <div class="stage">
            <TimelineEditor {selectedTimelineIndex} />

            <div class="performers-list">
              <div class="list-header">
                <h2 class="section-title">Ensemble</h2>
                <button class="btn add-btn" on:click={handleAddPerformerAtEnd}>+ Add Performer</button>
              </div>

              {#each $songStore.performers as performer, i}
                <PerformerSection 
                  selectedPerformerIndex={i}
                  {selectedTimelineIndex}
                  on:delete={() => handleRemovePerformer(i)}
                />
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
    height: calc(100vh - 80px);
    position: sticky;
    top: 40px;
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

  .performers-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .list-header {
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

  .add-btn {
    padding: 6px 12px;
    font-size: 0.75rem;
  }
</style>