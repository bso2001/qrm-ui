<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    songStore, loadSong, exportSong, resolveParam, getParamLevel,
    addSection, removeSection, addInstrument, removeInstrument 
  } from './lib/songStore';
  import MasterSection from './lib/components/MasterSection.svelte';
  import SectionSidebar from './lib/components/SectionSidebar.svelte';
  import SectionEditor from './lib/components/SectionEditor.svelte';
  import InstrumentSection from './lib/components/InstrumentSection.svelte';
  import Choice from './lib/components/Choice.svelte';
  import Display from './lib/components/Display.svelte';

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
    if ($songStore.sections && selectedSectionIndex >= $songStore.sections.length) {
      selectedSectionIndex = Math.max(0, $songStore.sections.length - 1);
    }
    if ($songStore.instruments && selectedInstrumentIndex >= $songStore.instruments.length) {
      selectedInstrumentIndex = Math.max(0, $songStore.instruments.length - 1);
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
    "name": "Afterglowish",
    "outputDir": "/Users/bert.olsson/Desktop/ag",
    "tempo": 60,
    "velocity": [ 60, 80 ],
    "key": { "tonic": "G", "mode": "major" },
    "meter": { "numerator": 4, "denominator": 4 },
    "sections": [
      {
        "name": "intro",
        "nMeasures": 1,
        "chords": [ "G", "Gmaj7", "G", "Gmaj7", "G", "C", "A" ],
        "instruments": [
          {
            "name": "Bass",
            "type": "chordal",
            "duration": "1/2",
            "range": [ "E1", "E3" ],
            "file": "afglo-bass-1.mid",
            "restPct": 0,
            "tonicPct": 0.75,
            "velocity": [ 70, 80 ]
          },
          {
            "name": "Chords",
            "type": "chords",
            "duration": "1/2",
            "range": [ "C3", "C5" ],
            "file": "afglo-chords-1.mid",
            "inversionPct": 0.25,
            "restPct": 0,
            "velocity": [ 60, 75 ]
          }
        ]
      },
      {
        "name": "outro",
        "key": { "tonic": "D", "mode": "major" },
        "nMeasures": 32,
        "chords": [ "D", "Dmaj7", "G", "Gm", "D", "Dmaj7", "G", "A" ],
        "instruments": [
          {
            "name": "Bass",
            "type": "chordal",
            "duration": "1/2",
            "range": [ "E1", "E3" ],
            "file": "afglo-bass-2.mid",
            "restPct": 0,
            "tonicPct": 0.75,
            "velocity": [ 80, 90 ]
          },
          {
            "name": "Chords",
            "type": "chords",
            "duration": "1/2",
            "range": [ "C3", "C5" ],
            "file": "afglo-chords-2.mid",
            "inversionPct": 0.5,
            "restPct": 0,
            "velocity": [ 80, 90 ]
          }
        ]
      }
    ]
  };

  let selectedSectionIndex = 0;
  let selectedInstrumentIndex = 0;
  let loadedFilename = "";

  function handleInsertSection(event: CustomEvent<string>) {
    const pos = event.detail;
    let idx = $songStore.sections.length;
    if (pos === 'start') idx = 0;
    else if (pos === 'current') idx = selectedSectionIndex;
    
    $songStore = addSection($songStore, idx);
    selectedSectionIndex = idx;
  }

  function handleRemoveSection(index: number) {
    if ($songStore.sections.length <= 1) return;
    $songStore = removeSection($songStore, index);
    validateIndices();
  }

  function handleInsertInstrument(event: CustomEvent<string>) {
    const pos = event.detail;
    let idx = $songStore.instruments.length;
    if (pos === 'start') idx = 0;
    else if (pos === 'current') idx = selectedInstrumentIndex;
    
    $songStore = addInstrument($songStore, idx);
    selectedInstrumentIndex = idx;
  }

  function handleRemoveInstrument(index: number) {
    if ($songStore.instruments.length <= 1) return;
    $songStore = removeInstrument($songStore, index);
    validateIndices();
  }

  function handleAddInstrumentAtEnd() {
    handleInsertInstrument({ detail: 'end' } as CustomEvent<string>);
  }

  onMount(() => {
    const saved = localStorage.getItem('qrm_autosave');
    if (saved) {
      try {
        const json = JSON.parse(saved);
        if (json.sections || json.timeline) {
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

  let generating = false;

  async function handleGenerate() {
    if (!$songStore) return;
    generating = true;
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportSong($songStore))
      });
      if (res.ok) {
        // Success indicator
        setTimeout(() => generating = false, 1000);
      } else {
        alert('Generation failed');
        generating = false;
      }
    } catch (err) {
      console.error(err);
      alert('Network error during generation');
      generating = false;
    }
  }

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
          selectedSectionIndex = 0;
          selectedInstrumentIndex = 0;
        } catch (err) {
          alert("Error parsing JSON file");
        } finally {
          target.value = "";
        }
      };
      reader.readAsText(file);
    }
  }

  function webkitDir(node: HTMLInputElement) {
    node.setAttribute('webkitdirectory', '');
    node.setAttribute('directory', '');
    return {};
  }

  function handleDirSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      // Get the relative path or absolute path if available in this environment
      const path = (file as any).path || file.webkitRelativePath.split('/')[0] || file.name;
      // Depending on the environment (like Electron), file.path has the full absolute path
      $songStore.outputDir = path.substring(0, path.lastIndexOf('/')) || path;
    }
  }

  function downloadJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportSong($songStore), null, 2));
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
      
      {#if $songStore}
        <button 
          class="btn sidebar-btn generate-btn" 
          class:generating
          on:click={handleGenerate}
          disabled={generating}
        >
          {generating ? 'DONE!' : 'GENERATE'}
        </button>

        <div style="height: 10px;"></div>
      {/if}

      <label class="btn sidebar-btn">
        LOAD
        <input type="file" accept=".json" on:change={handleFileLoad} hidden />
      </label>
      
      {#if $songStore}
        <button class="btn sidebar-btn" on:click={downloadJson}>SAVE</button>
        
        <button 
          class="btn sidebar-btn" 
          on:click={handleUndo} 
          disabled={historyIndex <= 0}
          style="opacity: {historyIndex <= 0 ? '0.5' : '1'}; cursor: {historyIndex <= 0 ? 'not-allowed' : 'pointer'}"
        >UNDO</button>
        
        <div style="margin-top: 20px;">
          <label class="btn sidebar-btn" style="margin-bottom: 5px;">
            OUTPUT
            <input type="file" use:webkitDir hidden on:change={handleDirSelect} />
          </label>
          <Display bind:value={$songStore.outputDir} label="" width="100%" color="#ffaa00" fontSize="10px" />
        </div>
      {/if}
      
      <div style="margin-top: auto; display: flex; flex-direction: column; align-items: center;">
        <Choice 
          bind:value={currentTheme} 
          options={themes} 
          width="80px"
        />
        <span style="font-size: 10px; color: var(--text-muted); margin-top: 4px; font-weight: bold; text-transform: uppercase;">THEME</span>
      </div>
    </div>

    {#if $songStore}
      <div class="main-content">
        <MasterSection {loadedFilename} />

        <div class="workspace">
          <SectionSidebar 
            selectedSectionIndex={selectedSectionIndex}
            on:select={(e) => selectedSectionIndex = e.detail}
            on:insert={handleInsertSection}
            on:delete={(e) => handleRemoveSection(e.detail)}
          />

          <div class="stage">
            <SectionEditor sectionIndex={selectedSectionIndex} />

            <div class="performers-list">
              <div class="list-header">
                <h2 class="section-title">ENSEMBLE</h2>
                <button class="btn add-btn" on:click={handleAddInstrumentAtEnd}>+ Add Instrument</button>
              </div>

              {#each $songStore.instruments as instrument, i}
                <InstrumentSection 
                  instrumentIndex={i}
                  sectionIndex={selectedSectionIndex}
                  on:delete={() => handleRemoveInstrument(i)}
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
    padding: 20px;
    box-sizing: border-box;
  }

  .app-container {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    width: 100%;
    max-width: 1200px;
  }

  .sidebar {
    flex: 0 0 100px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: var(--bg-card);
    padding: 16px;
    border-radius: 8px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-main);
    height: calc(100vh - 40px);
    position: sticky;
    top: 20px;
  }

  .logo {
    font-size: 14px;
    font-weight: 800;
    color: var(--text-heading);
    text-align: center;
    margin-bottom: 12px;
    line-height: 1.2;
    letter-spacing: 2px;
  }

  .btn {
    background: var(--bg-sub);
    border: 1px solid var(--border-input);
    color: var(--text-main);
    cursor: pointer;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .sidebar-btn {
    width: 100%;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
  }

  .generate-btn {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
    font-weight: 800;
    box-shadow: 0 2px 4px rgba(77, 171, 247, 0.3);
  }

  .generate-btn:hover {
    filter: brightness(1.1);
    background: var(--accent);
    border-color: var(--accent);
  }

  .generate-btn.generating {
    background: #40c057 !important;
    border-color: #40c057 !important;
    box-shadow: 0 2px 8px rgba(64, 192, 87, 0.4);
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
    gap: 12px;
    min-width: 0;
  }

  .workspace {
    display: flex;
    gap: 16px;
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
    gap: 12px;
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
