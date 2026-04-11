<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { tonics, chordQualities } from '../constants';
  import { flip } from 'svelte/animate';

  export let chords: string[] = [];
  
  const dispatch = createEventDispatcher();

  let activeIndex: number | null = null;
  let draggedIndex: number | null = null;

  function addChord() {
    const newChords = [...chords, 'C'];
    activeIndex = newChords.length - 1;
    dispatch('change', newChords);
  }

  function removeChord(index: number) {
    const newChords = chords.filter((_, i) => i !== index);
    activeIndex = null;
    dispatch('change', newChords);
  }

  function selectChord(index: number) {
    if (activeIndex === index) {
      activeIndex = null;
    } else {
      activeIndex = index;
    }
  }

  function closeEditor() {
    activeIndex = null;
  }

  function updateActiveChord(root: string, quality: string) {
    if (activeIndex === null) return;
    const newChords = [...chords];
    newChords[activeIndex] = root + quality;
    dispatch('change', newChords);
  }

  function getChordParts(chord: string) {
    if (!chord) return { root: 'C', quality: '' };
    const m = chord.match(/^([A-G][b#]?)(.*)$/);
    if (!m) return { root: 'C', quality: '' };
    return { root: m[1], quality: m[2] };
  }

  // Simple Drag and Drop
  function onDragStart(index: number) {
    draggedIndex = index;
  }

  function onDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newChords = [...chords];
    const item = newChords.splice(draggedIndex, 1)[0];
    newChords.splice(index, 0, item);
    
    draggedIndex = index;
    if (activeIndex === draggedIndex) activeIndex = index;
    
    dispatch('change', newChords);
  }

  function onDragEnd() {
    draggedIndex = null;
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="chord-builder" on:click|self={closeEditor}>
  <div class="chord-list" on:click|self={closeEditor}>
    {#each chords as chord, i}
      <div 
        class="chord-pill" 
        class:active={activeIndex === i}
        class:dragging={draggedIndex === i}
        draggable="true"
        on:dragstart={() => onDragStart(i)}
        on:dragover={(e) => onDragOver(e, i)}
        on:dragend={onDragEnd}
        on:click={() => selectChord(i)}
      >
        <span class="chord-name">{chord}</span>
        <button class="remove-btn" on:click|stopPropagation={() => removeChord(i)}>×</button>
      </div>
    {/each}
    
    <button class="add-btn" on:click={addChord}>+</button>
  </div>

  {#if activeIndex !== null && chords[activeIndex] !== undefined}
    <div class="editor-panel">
      <div class="panel-header">
        <span class="edit-title">EDIT CHORD: <span class="highlight">{chords[activeIndex]}</span></span>
        <button class="close-panel-btn" on:click={closeEditor}>DONE</button>
      </div>

      <div class="selector-group">
        <span class="label">ROOT</span>
        <div class="grid roots">
          {#each tonics as t}
            <button 
              class="chip" 
              class:selected={getChordParts(chords[activeIndex]).root === t}
              on:click={() => updateActiveChord(t, getChordParts(chords[activeIndex]).quality)}
            >
              {t}
            </button>
          {/each}
        </div>
      </div>

      <div class="selector-group">
        <span class="label">QUALITY</span>
        <div class="grid qualities">
          {#each chordQualities as q}
            <button 
              class="chip quality" 
              class:selected={getChordParts(chords[activeIndex]).quality === q.value}
              on:click={() => updateActiveChord(getChordParts(chords[activeIndex]).root, q.value)}
            >
              {q.label || 'Maj'}
            </button>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .chord-builder {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    background: var(--bg-sub);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--border-main);
  }

  .chord-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 40px;
    align-items: center;
  }

  .chord-pill {
    background: var(--bg-card);
    border: 1px solid var(--border-input);
    padding: 2px 8px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: grab;
    user-select: none;
    transition: transform 0.1s, box-shadow 0.2s;
    box-shadow: var(--shadow-sm);
  }

  .chord-pill:active {
    cursor: grabbing;
  }

  .chord-pill.dragging {
    opacity: 0.5;
    transform: scale(0.95);
  }

  .chord-pill:hover:not(.active) {
    border-color: var(--accent);
    background: var(--bg-hover);
    color: var(--text-main);
    filter: brightness(1.2);
  }

  .chord-pill.active {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }

  .chord-name {
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 0.5px;
  }

  .remove-btn {
    background: none;
    border: none;
    color: var(--danger);
    opacity: 0.6;
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
    padding: 0;
    transition: opacity 0.2s, transform 0.2s;
  }

  .remove-btn:hover {
    opacity: 1;
    transform: scale(1.2);
  }

  .add-btn {
    background: transparent;
    border: 1px dashed var(--border-input);
    color: var(--text-muted);
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: all 0.2s;
  }

  .add-btn:hover {
    border-style: solid;
    border-color: var(--accent);
    color: var(--accent);
  }

  .editor-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--border-sub);
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .edit-title {
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--text-muted);
    letter-spacing: 1px;
  }

  .highlight {
    color: var(--accent);
  }

  .close-panel-btn {
    background: var(--bg-card);
    border: 1px solid var(--border-input);
    color: var(--text-main);
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-panel-btn:hover {
    background: var(--bg-hover);
    border-color: var(--text-muted);
  }

  .selector-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .label {
    font-size: 0.7rem;
    font-weight: 800;
    color: var(--text-muted);
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .chip {
    background: var(--bg-card);
    border: 1px solid var(--border-input);
    color: var(--text-main);
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    min-width: 36px;
    text-align: center;
  }

  .chip.quality {
    min-width: 50px;
  }

  .chip:hover {
    border-color: var(--accent);
    background: var(--bg-hover);
  }

  .chip.selected {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }
</style>
