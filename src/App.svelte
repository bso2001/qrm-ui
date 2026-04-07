<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    songStore, loadSong, exportSong, resolveParam, getParamLevel,
    addSection, removeSection, addPart, removePart 
  } from './lib/songStore';
  import { initCatalog, saveToCatalog, loadFromCatalog } from './lib/catalogStore';
  import MasterSection from './lib/components/MasterSection.svelte';
  import SectionSidebar from './lib/components/SectionSidebar.svelte';
  import SectionEditor from './lib/components/SectionEditor.svelte';
  import PartSection from './lib/components/PartSection.svelte';
  import Choice from './lib/components/Choice.svelte';
  import Display from './lib/components/Display.svelte';
  import LibraryModal from './lib/components/LibraryModal.svelte';
  import Card from './lib/components/Card.svelte';

  // Toggle for raw JSON file LOAD/SAVE (Admin/Testing functionality)
  const ENABLE_ADMIN_FILE_IO = false;

  let currentTheme = 'light';
  const themes = ['light', 'dark'];
  
  let history: string[] = [];
  let historyIndex = -1;
  let isUndoing = false;
  let saveTimeout: ReturnType<typeof setTimeout>;

  let showLibrary = false;
  let currentCatalogId: string | null = null;

  function saveState() {
    if (!$songStore) return;
    const serialized = JSON.stringify($songStore);
    
    localStorage.setItem('qrm_autosave', serialized);
    // Also remember the active library ID so a refresh doesn't disconnect it
    if (currentCatalogId) {
      localStorage.setItem('qrm_active_catalog_id', currentCatalogId);
    } else {
      localStorage.removeItem('qrm_active_catalog_id');
    }

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

  function handleRevert() {
    if (history.length > 0) {
      isUndoing = true;
      historyIndex = 0;
      $songStore = JSON.parse(history[0]);
      validateIndices();
    }
  }

  function validateIndices() {
    if (!$songStore) return;
    if ($songStore.sections && selectedSectionIndex >= $songStore.sections.length) {
      selectedSectionIndex = Math.max(0, $songStore.sections.length - 1);
    }
    if ($songStore.parts && selectedPartIndex >= $songStore.parts.length) {
      selectedPartIndex = Math.max(0, $songStore.parts.length - 1);
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
    themes.forEach(t => document.body.classList.remove(t.toLowerCase()));
    if (currentTheme !== 'Light') {
      document.body.classList.add(currentTheme.toLowerCase());
    }
  }

  const initialSong = {
    "name": "Untitled",
    "outputDir": "",
    "tempo": 120,
    "velocity": [ 60, 80 ],
    "key": { "tonic": "C", "mode": "major" },
    "meter": { "numerator": 4, "denominator": 4 },
    "sections": [
      {
        "name": "Section A",
        "nMeasures": 4,
        "parts": [
          {
            "name": "Part 1",
            "type": "chordal",
            "duration": "1/4",
            "range": [ "C3", "C5" ],
            "file": "part1.mid",
            "restPct": 0,
            "tonicPct": 0,
            "inversionPct": 0,
            "velocity": [ 70, 90 ]
          }
        ]
      }
    ]
  };

  let selectedSectionIndex = 0;
  let selectedPartIndex = 0;
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

  function handleInsertPart(event: CustomEvent<string>) {
    const pos = event.detail;
    let idx = $songStore.parts.length;
    if (pos === 'start') idx = 0;
    else if (pos === 'current') idx = selectedPartIndex;
    
    $songStore = addPart($songStore, idx);
    selectedPartIndex = idx;
  }

  function handleRemovePart(index: number) {
    if ($songStore.parts.length <= 1) return;
    $songStore = removePart($songStore, index);
    validateIndices();
  }

  function handleAddPartAtEnd() {
    handleInsertPart({ detail: 'end' } as CustomEvent<string>);
  }

  onMount(() => {
    initCatalog();
    const saved = localStorage.getItem('qrm_autosave');
    currentCatalogId = localStorage.getItem('qrm_active_catalog_id');

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

  // --- Library Methods ---
  function saveCurrentToLibrary() {
    if (!$songStore) return;
    currentCatalogId = saveToCatalog(exportSong($songStore));
  }

  function overwriteCurrentInLibrary() {
    if (!$songStore || !currentCatalogId) return;
    saveToCatalog(exportSong($songStore), currentCatalogId);
  }

  function loadFromLibrary(event: CustomEvent<string>) {
    const id = event.detail;
    const songData = loadFromCatalog(id);
    if (songData) {
      loadSong(songData);
      currentCatalogId = id;
      selectedSectionIndex = 0;
      selectedPartIndex = 0;
      showLibrary = false;
    }
  }

  function handleLibraryClearedCurrent() {
    currentCatalogId = null;
  }
  // ----------------------

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
          currentCatalogId = null; // Loading a file disconnects from library
          selectedSectionIndex = 0;
          selectedPartIndex = 0;
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

<LibraryModal 
  show={showLibrary} 
  currentSongId={currentCatalogId}
  on:close={() => showLibrary = false}
  on:load={loadFromLibrary}
  on:saveNew={saveCurrentToLibrary}
  on:saveOverwrite={overwriteCurrentInLibrary}
  on:clearedCurrent={handleLibraryClearedCurrent}
/>

<main>
  <div class="app-container">
    <div class="header-sidebar">
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
      {/if}

      <button class="btn sidebar-btn" on:click={() => showLibrary = true}>LIBRARY</button>

      {#if ENABLE_ADMIN_FILE_IO}
        <label class="btn sidebar-btn">
          LOAD FILE
          <input type="file" accept=".json" on:change={handleFileLoad} hidden />
        </label>
      {/if}
      
      {#if $songStore}
        {#if ENABLE_ADMIN_FILE_IO}
          <button class="btn sidebar-btn" on:click={downloadJson}>SAVE FILE</button>
        {/if}
        
        <div class="history-controls">
          <button 
            class="btn sidebar-btn undo-btn" 
            on:click={handleUndo} 
            disabled={historyIndex <= 0}
            title="UNDO (Ctrl+Z)"
          >UNDO</button>
          
          <button 
            class="btn sidebar-btn revert-btn" 
            on:click={handleRevert} 
            disabled={historyIndex <= 0}
            title="REVERT TO ORIGINAL"
          >REVERT</button>

          <button 
            class="btn sidebar-btn clear-btn" 
            on:click={handleClear} 
            title="CLEAR ENTIRE SONG"
          >CLEAR</button>
        </div>
      {/if}
      
      <div class="theme-picker">
        <Choice 
          bind:value={currentTheme} 
          options={themes} 
          width="65px"
        />
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

            <div class="parts-container">
              <Card title="PARTS">
                <div slot="header-right-extra">
                  <button class="btn add-btn" on:click={handleAddPartAtEnd}>+ ADD PART</button>
                </div>
                
                <div class="parts-list">
                  {#each $songStore.parts as part, i}
                    <PartSection 
                      partIndex={i}
                      sectionIndex={selectedSectionIndex}
                      on:delete={() => handleRemovePart(i)}
                    />
                  {/each}
                </div>
              </Card>
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
    padding: 10px;
    box-sizing: border-box;
  }

  .app-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    max-width: 1200px;
  }

  .header-sidebar {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    background: var(--bg-card);
    padding: 8px 16px;
    border-radius: 8px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-main);
    width: 100%;
    box-sizing: border-box;
    position: sticky;
    top: 10px;
    z-index: 100;
  }

  .logo {
    font-size: 16px;
    font-weight: 900;
    color: var(--text-heading);
    line-height: 1;
    letter-spacing: 3px;
    margin-right: 12px;
    padding-right: 20px;
    border-right: 2px solid var(--border-sub);
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
    padding: 0 16px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    white-space: nowrap;
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
  }

  .generate-btn.generating {
    background: #40c057 !important;
    border-color: #40c057 !important;
    box-shadow: 0 2px 8px rgba(64, 192, 87, 0.4);
  }

  .history-controls {
    display: flex;
    gap: 4px;
    margin-left: auto;
  }

  .undo-btn, .revert-btn, .clear-btn {
    font-size: 10px;
    padding: 0 10px;
    height: 32px;
  }

  .undo-btn:disabled, .revert-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .revert-btn:hover:not(:disabled) {
    border-color: #ff6b6b;
    color: #ff6b6b;
  }

  .clear-btn:hover {
    border-color: #fa5252;
    background: #fa5252;
    color: white;
  }

  .theme-picker {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .theme-label {
    font-size: 9px;
    color: var(--text-muted);
    font-weight: bold;
    text-transform: uppercase;
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

  .parts-container {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .parts-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .add-btn {
    padding: 6px 12px;
    font-size: 0.75rem;
  }

  @media (max-width: 800px) {
    .header-sidebar {
      flex-wrap: wrap;
      justify-content: center;
      position: static;
    }

    .workspace {
      flex-direction: column;
    }

    :global(.section-sidebar) {
      width: 100% !important;
    }

    .history-controls {
      margin-left: 0;
    }
    
    .logo {
      border-right: none;
      width: 100%;
      text-align: center;
      margin-right: 0;
      padding-right: 0;
      margin-bottom: 8px;
    }
  }
</style>
