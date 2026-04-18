<script lang="ts">
	import { songStore, updateSong } from '../songStore'
	import Card from './Card.svelte'
	import Slider from './Slider.svelte'
	import Display from './Display.svelte'
	import Choice from './Choice.svelte'
	import ChordBuilder from './ChordBuilder.svelte'
	import { tonics, modes } from '../constants'

	export let loadedFilename = ''

	function webkitDir(node: HTMLInputElement) 
	{
		node.setAttribute('webkitdirectory', '')
		node.setAttribute('directory', '')
		return {}
	}

	function handleDirSelect(event: Event) 
	{
		const target = event.target as HTMLInputElement
		const file = target.files?.[0]
		if (file) 
		{
			// Get the relative path or absolute path if available in this environment

			const path =
				(file as any).path ||
				file.webkitRelativePath.split('/')[0] ||
				file.name
			updateSong(
				'outputDir',
				path.substring(0, path.lastIndexOf('/')) || path
			)
		}
	}
</script>

<Card title="">
	<div slot="header-left-extra" class="title-group">
		<h2 class="song-title">
			<div>SONG NAME</div>
				<div
					class="input-sizer"
					data-value={$songStore.name || 'Untitled'}
				>
					<input
						class="name-input highlight"
						value={$songStore.name}
						on:input={e =>
							updateSong('name', e.currentTarget.value)}
						placeholder="Untitled"
						size="1"
					/>
				</div>
		</h2>
	</div>

	<div slot="header-right-extra" class="header-controls">
		<div class="filename-display" title={loadedFilename}>
			{loadedFilename || ''}
		</div>

		<Slider
			value={$songStore.tempo}
			on:change={e => updateSong('tempo', e.detail)}
			min={40}
			max={240}
			label="Tempo"
			compact={true}
		/>

		<div class="header-group">
			<span class="group-label">DEFAULTS</span>
			<div class="group-content">
				<Choice
					value={$songStore.key?.tonic || 'C'}
					options={tonics}
					on:change={e => 
					{
						updateSong('key', {
							...($songStore.key || {
								tonic: 'C',
								mode: 'major'
							}),
							tonic: e.detail
						})
					}}
					width="45px"
				/>
				<Choice
					value={$songStore.key?.mode || 'major'}
					options={modes}
					on:change={e => 
					{
						updateSong('key', {
							...($songStore.key || {
								tonic: 'C',
								mode: 'major'
							}),
							mode: e.detail
						})
					}}
					width="80px"
				/>
				<Display
					value="{$songStore.meter?.numerator || 4}/{$songStore.meter
						?.denominator || 4}"
					label=""
					on:change={e => 
					{
						const [ n, d ] = e.detail.split('/')
						updateSong('meter', {
							numerator: parseInt(n) || 4,
							denominator: parseInt(d) || 4
						})
					}}
					width="60px"
				/>
			</div>
		</div>
	</div>

	<div class="chord-row">
		<span class="label">SONG CHORDS</span>
		<ChordBuilder
			chords={$songStore.chords || []}
			on:change={e => updateSong('chords', e.detail)}
		/>
	</div>
</Card>

<style>
	.header-controls {
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.header-group {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: var(--bg-sub);
		padding: 10px 8px 4px 8px;
		border-radius: 4px;
		border: 1px solid var(--border-main);
		position: relative;
		gap: 2px;
	}

	.group-label {
		position: absolute;
		top: -8px;
		left: 10px;
		font-size: 9px;
		color: var(--text-muted);
		background: var(--bg-card);
		padding: 0 5px;
		font-weight: bold;
		letter-spacing: 1.2px;
		border: 1px solid var(--border-main);
		border-radius: 4px;
	}

	.group-content {
		display: flex;
		gap: 4px;
		align-items: flex-end;
	}

	.filename-display {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-muted);
		font-family: monospace;
		max-width: 150px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.song-title {
		font-size: 1rem;
		font-weight: 800;
		margin: 0;
		color: var(--text-heading);
		display: flex;
		flex-flow: column;
		align-items: left;
		flex-wrap: wrap;
	}

	.name-wrapper {
		display: flex;
		align-items: center;
		white-space: nowrap;
	}

	.input-sizer {
		display: inline-grid;
		align-items: center;
	}

	.input-sizer::after,
	.name-input {
		min-width: 0;
		grid-area: 1 / 1;
		font-family: monospace;
		font-weight: 800;
		font-size: 1.2rem;
		margin: 0 4px 0 -2px;
		resize: none;
		background: none;
		appearance: none;
		border: none;
	}

	.name-input {
		width: 100%;
		color: var(--accent);
		outline: none;
	}

	.input-sizer::after {
		content: attr(data-value);
		visibility: hidden;
		white-space: pre;
	}

	.name-input:focus {
		background: var(--bg-sub);
		border-radius: 4px;
		box-shadow: 0 0 0 2px var(--bg-sub); /* Faux padding for focus */
	}

	.bracket {
		color: var(--text-muted);
		font-family: monospace;
		font-weight: 400;
	}

	.highlight {
		color: var(--accent);
		font-family: monospace;
		font-weight: 800;
	}

	.chord-row {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px dashed var(--border-sub);
	}

	.chord-row .label {
		font-size: 0.7rem;
		font-weight: 800;
		color: var(--text-muted);
		letter-spacing: 1px;
	}

	:global(.header-controls .slider-container) {
		margin: 0 !important;
	}
</style>
