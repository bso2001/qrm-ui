<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { songStore } from '../songStore';

  export let selectedSectionIndex: number;

  const dispatch = createEventDispatcher();

  function select(index: number) {
    dispatch('select', index);
  }
</script>

<div class="section-sidebar">
  <div class="sidebar-header">
    <span class="label">SECTIONS</span>
    <div class="header-actions">
        <button class="add-btn" on:click={() => dispatch('insert', 'end')} title="Add Section">+</button>
    </div>
  </div>
  
  <div class="sections-list">
    {#each $songStore?.sections || [] as section, i}
      <div 
        class="section-item" 
        class:active={selectedSectionIndex === i}
        on:click={() => select(i)}
      >
        <div class="section-info">
          <span class="section-name">{section.name || 'Untitled'}</span>
          <span class="section-measures">{section.nMeasures} {section.nMeasures === 1 ? 'bar' : 'bars'}</span>
        </div>
        {#if $songStore.sections.length > 1}
            <button class="delete-btn" on:click|stopPropagation={() => dispatch('delete', i)}>×</button>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .section-sidebar {
    display: flex;
    flex-direction: column;
    background: var(--bg-card);
    border: 1px solid var(--border-main);
    border-radius: 8px;
    width: 180px;
    box-shadow: var(--shadow-sm);
    overflow: hidden;
    height: fit-content;
  }

  .sidebar-header {
    padding: 8px 12px;
    background: var(--bg-sub);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .label {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-heading);
  }

  .add-btn {
    background: transparent;
    border: 1px solid var(--border-input);
    color: var(--text-main);
    width: 20px;
    height: 20px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .add-btn:hover {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }

  .sections-list {
    display: flex;
    flex-direction: column;
    padding: 8px;
    gap: 4px;
  }

  .section-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
  }

  .section-item:hover {
    background: var(--bg-hover);
  }

  .section-item.active {
    background: var(--bg-sub);
    border-color: var(--accent);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }

  .section-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
  }

  .section-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-main);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .section-measures {
    font-size: 0.7rem;
    color: var(--text-muted);
  }

  .delete-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 16px;
    cursor: pointer;
    padding: 0 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .section-item:hover .delete-btn {
    opacity: 1;
  }

  .delete-btn:hover {
    color: var(--danger);
  }
</style>
