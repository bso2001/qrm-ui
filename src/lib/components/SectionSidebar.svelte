<script lang="js">
	import { createEventDispatcher } from 'svelte'
	import { songStore } from '../songStore'

	export let selectedSectionIndex

	const dispatch = createEventDispatcher()

	function select(index) 
	{
		dispatch('select', index)
	}

	let draggedIndex = null

	function onDragStart(index) 
	{
		draggedIndex = index
	}

	function onDragOver(e, index) 
	{
		e.preventDefault()
		if (draggedIndex === null || draggedIndex === index) return
		dispatch('move', { from: draggedIndex, to: index })
		draggedIndex = index
	}

	function onDragEnd() 
	{
		draggedIndex = null
	}
</script>

<div class="section-sidebar">
	<div class="sidebar-header">
		<span class="label">SECTIONS</span>
		<div class="header-actions">
			<button
				class="add-btn"
				on:click={() => dispatch('insert', 'end')}
				title="Add Section">+</button
			>
		</div>
	</div>

	<div class="sections-list">
		{#each $songStore?.sections || [] as section, i}
			<div
				class="section-item"
				class:active={selectedSectionIndex === i}
				class:dragging={draggedIndex === i}
				draggable="true"
				on:click={() => select(i)}
				on:dragstart={() => onDragStart(i)}
				on:dragover={e => onDragOver(e, i)}
				on:dragend={onDragEnd}
			>
				<div class="section-info">
					<span class="section-name"
						>{section.name || 'New Section'}</span
					>
					<span class="section-measures"
						>{section.nMeasures ? `${section.nMeasures} ${section.nMeasures === 1 ? 'bar' : 'bars'}` : ''}</span
					>
				</div>
				{#if $songStore.sections.length > 1 && selectedSectionIndex === i}
					<button
						class="delete-btn"
						on:click|stopPropagation={() => dispatch('delete', i)}
						>×</button
					>
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
		background: var(--bg-card);
		border: 1px dashed var(--border-input);
		color: var(--text-muted);
		width: 24px;
		height: 24px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 16px;
		font-weight: 800;
		transition: all 0.2s;
		box-shadow: var(--shadow-sm);
	}

	.add-btn:hover {
		background: var(--bg-hover);
		color: var(--accent);
		border-color: var(--accent);
	}

	.sections-list {
		display: flex;
		flex-direction: column;
		padding: 8px;
		gap: 6px;
	}

	.section-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 12px;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
		border: 1px solid var(--border-input);
		background: var(--bg-card);
		box-shadow: var(--shadow-sm);
	}

	.section-item:hover {
		border-color: var(--text-muted);
	}

	.section-item.active {
		background: var(--bg-sub);
		border-color: var(--accent);
		box-shadow: 0 2px 4px rgba(77, 171, 247, 0.2);
	}

	.section-item.dragging {
		opacity: 0.5;
	}

	.section-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		overflow: hidden;
	}

	.section-name {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text-main);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.section-measures {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.delete-btn {
		background: var(--bg-card);
		border: 1px solid var(--border-input);
		color: var(--danger);
		width: 24px;
		height: 24px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 800;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		box-shadow: var(--shadow-sm);
	}

	.delete-btn:hover {
		background: var(--bg-hover);
		color: var(--danger-hover);
		border-color: var(--danger);
	}
</style>
