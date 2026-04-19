<script lang="js">
	import { createEventDispatcher } from 'svelte'
	import {
		catalogStore,
		deleteFromCatalog,
		loadFromCatalog,
		saveToCatalog
	} from '../catalogStore'

	export let show = false
	export let currentSongId = null

	const dispatch = createEventDispatcher()

	function handleExportLibrary() 
	{
		const catalog = $catalogStore
		const fullLibrary = catalog
			.map(entry => 
			{
				const songData = loadFromCatalog(entry.id)
				return songData
			})
			.filter(song => song !== null) // Filter out any broken entries

		const dataStr =
			'data:text/json;charset=utf-8,' +
			encodeURIComponent(JSON.stringify(fullLibrary, null, 2))
		const downloadAnchorNode = document.createElement('a')
		downloadAnchorNode.setAttribute('href', dataStr)
		downloadAnchorNode.setAttribute(
			'download',
			`qrm_library_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
		)
		document.body.appendChild(downloadAnchorNode)
		downloadAnchorNode.click()
		downloadAnchorNode.remove()
	}

	function handleImportLibrary(event) 
	{
		const target = event.target
		const file = target.files?.[0]
		if (file) 
		{
			if (
				confirm(
					'Importing a library will OVERWRITE your current local library completely. Are you sure you want to proceed?'
				)
			) 
			{
				const reader = new FileReader()
				reader.onload = e => 
				{
					try 
					{
						const json = JSON.parse(e.target?.result)
						if (Array.isArray(json)) 
						{
							// 1. Clear existing catalog and all its songs

							const oldCatalog = $catalogStore
							oldCatalog.forEach(entry => 
							{
								localStorage.removeItem(`qrm_song_${entry.id}`)
							})
							localStorage.removeItem('qrm_catalog')
							catalogStore.set([])

							// 2. Import each song into the new catalog

							json.forEach(song => 
							{
								if (song && typeof song === 'object') 
								{
									saveToCatalog(song) // This generates a new ID and updates the store/index
								}
							})

							// 3. Clear current song in UI and reload

							dispatch('clearedCurrent')
							setTimeout(() => 
							{
								window.location.reload()
							}, 100)
						}
						else 
						{
							alert(
								'Invalid library format. Expected a JSON array of songs.'
							)
						}
					}
					catch (err) 
					{
						alert('Error parsing JSON library file')
					}
					finally 
					{
						target.value = ''
					}
				}
				reader.readAsText(file)
			}
			else 
			{
				target.value = ''
			}
		}
	}

	function handleClose() 
	{
		dispatch('close')
	}

	function handleLoad(id) 
	{
		dispatch('load', id)
	}

	function handleDelete(id) 
	{
		if (
			confirm(
				'Are you sure you want to delete this song from your library?'
			)
		) 
		{
			deleteFromCatalog(id)
			if (currentSongId === id) 
			{
				dispatch('clearedCurrent')
			}
		}
	}

	function formatDate(ts) 
	{
		return new Date(ts).toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}
</script>

{#if show}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="modal-backdrop" on:click={handleClose}>
		<div class="modal-content" on:click|stopPropagation>
			<div class="modal-header">
				<div style="display: flex; align-items: center; gap: 15px;">
					<h2>SONG LIBRARY</h2>
					<button
						class="action-btn"
						on:click={handleExportLibrary}
						title="Export Library">EXPORT</button
					>
					<label class="action-btn" title="Import Library">
						IMPORT
						<input
							type="file"
							accept=".json"
							on:change={handleImportLibrary}
							hidden
						/>
					</label>
				</div>
				<button class="close-btn" on:click={handleClose}>×</button>
			</div>

			<div class="modal-body">
				{#if $catalogStore.length === 0}
					<div class="empty-state">
						<p>Your library is empty.</p>
						<p class="sub">
							Save your current workspace to see it here.
						</p>
					</div>
				{:else}
					<div class="song-list">
						{#each $catalogStore as entry (entry.id)}
							<div
								class="song-item"
								class:active={currentSongId === entry.id}
							>
								<div class="song-info">
									<span class="song-name">{entry.name}</span>
									<span class="song-date"
										>{formatDate(entry.lastModified)}</span
									>
								</div>
								<div class="song-actions">
									<button
										class="action-btn load"
										on:click={() => handleLoad(entry.id)}
									>
										{currentSongId === entry.id
											? 'REVERT'
											: 'LOAD'}
									</button>
									<button
										class="action-btn delete"
										on:click={() => handleDelete(entry.id)}
										>DELETE</button
									>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button
					class="btn save-new-btn"
					on:click={() => dispatch('saveNew')}
				>
					SAVE CURRENT AS NEW
				</button>
				{#if currentSongId}
					<button
						class="btn overwrite-btn"
						on:click={() => dispatch('saveOverwrite')}
					>
						OVERWRITE CURRENT
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	.modal-content {
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: 8px;
		width: 500px;
		max-width: 90vw;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
		overflow: hidden;
	}

	.modal-header {
		padding: 15px 20px;
		background: var(--bg-sub);
		border-bottom: 1px solid var(--border-main);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 800;
		color: var(--text-heading);
		letter-spacing: 1px;
	}

	.action-btn {
		background: var(--bg-card);
		border: 1px solid var(--border-input);
		color: var(--text-main);
		font-size: 0.75rem;
		font-weight: 700;
		padding: 4px 8px;
		border-radius: 4px;
		cursor: pointer;
		text-transform: uppercase;
		transition: all 0.2s;
	}

	.action-btn:hover {
		background: var(--bg-hover);
		border-color: var(--text-muted);
	}

	.close-btn {
		background: transparent;
		border: none;
		font-size: 1.5rem;
		color: var(--text-muted);
		cursor: pointer;
		line-height: 1;
		padding: 0;
	}

	.close-btn:hover {
		color: var(--text-main);
	}

	.modal-body {
		padding: 20px;
		overflow-y: auto;
		flex: 1;
	}

	.empty-state {
		text-align: center;
		padding: 40px 20px;
		color: var(--text-main);
	}

	.empty-state .sub {
		font-size: 0.9rem;
		color: var(--text-muted);
		margin-top: 10px;
	}

	.song-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.song-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 15px;
		background: var(--bg-sub);
		border: 1px solid var(--border-main);
		border-radius: 6px;
		transition: all 0.2s;
	}

	.song-item:hover {
		border-color: var(--accent);
	}

	.song-item.active {
		border-left: 4px solid var(--accent);
	}

	.song-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.song-name {
		font-weight: 700;
		color: var(--text-heading);
		font-size: 1.05rem;
	}

	.song-date {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.song-actions {
		display: flex;
		gap: 8px;
	}

	.action-btn {
		padding: 6px 12px;
		font-size: 0.75rem;
		font-weight: 700;
		border-radius: 4px;
		cursor: pointer;
		text-transform: uppercase;
		border: 1px solid transparent;
		transition: all 0.2s;
	}

	.action-btn.load {
		background: var(--bg-card);
		border-color: var(--accent);
		color: var(--accent);
	}

	.action-btn.load:hover {
		background: var(--accent);
		color: white;
	}

	.action-btn.delete {
		background: transparent;
		color: var(--text-muted);
	}

	.action-btn.delete:hover {
		color: #ff6b6b;
		border-color: #ff6b6b;
	}

	.modal-footer {
		padding: 15px 20px;
		background: var(--bg-sub);
		border-top: 1px solid var(--border-main);
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}

	.btn {
		padding: 8px 16px;
		font-size: 0.85rem;
		font-weight: 700;
		border-radius: 4px;
		cursor: pointer;
		text-transform: uppercase;
		border: 1px solid var(--border-input);
		transition: all 0.2s;
	}

	.save-new-btn {
		background: var(--bg-card);
		color: var(--text-main);
	}

	.save-new-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.overwrite-btn {
		background: var(--accent);
		color: white;
		border-color: var(--accent);
	}

	.overwrite-btn:hover {
		filter: brightness(1.1);
	}
</style>
