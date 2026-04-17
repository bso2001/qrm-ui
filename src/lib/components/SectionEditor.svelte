<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { songStore, updateSection } from '../songStore'
	import Display from './Display.svelte'
	import Choice from './Choice.svelte'
	import ChordBuilder from './ChordBuilder.svelte'
	import { tonics, modes } from '../constants'

	export let sectionIndex: number

	$: currentSection = $songStore?.sections?.[sectionIndex] || {}

	const dispatch = createEventDispatcher()
</script>

<div class="section-editor">
	<div class="editor-header">
		<div class="title-group">
			<h2 class="section-title">
				SECTION <span class="bracket">[</span>
				<div
					class="input-sizer"
					data-value={currentSection.name || 'Untitled'}
				>
					<input
						class="name-input highlight"
						value={currentSection.name}
						on:input={e =>
							updateSection(
								sectionIndex,
								'name',
								e.currentTarget.value
							)}
						placeholder="Untitled"
						size="1"
					/>
				</div>
				<span class="bracket">]</span>
			</h2>
		</div>

		<div class="header-controls">
			<Display
				value={currentSection.nMeasures}
				label="BARS"
				width="100px"
				layout="row"
				on:change={e => 
				{
					updateSection(
						sectionIndex,
						'nMeasures',
						parseInt(e.detail) || 4
					)
				}}
			/>
		</div>
	</div>

	<div class="editor-grid">
		<div class="grouped-box">
			<span class="box-label">DEFAULTS</span>

			<div
				style="display: flex; gap: 8px; align-items: flex-end; padding-top: 5px; flex-wrap: wrap;"
			>
				<div
					style="display: flex; flex-direction: column; align-items: center;"
				>
					<span class="inner-label">KEY</span>
					<Choice
						value={currentSection.key?.tonic ||
							$songStore.key?.tonic ||
							'C'}
						inherited={!currentSection.key}
						options={tonics}
						on:change={e => 
						{
							updateSection(sectionIndex, 'key', {
								...(currentSection.key ||
									$songStore.key || {
									tonic: 'C',
									mode: 'major'
								}),
								tonic: e.detail
							})
						}}
						width="50px"
					/>
				</div>
				<Choice
					value={currentSection.key?.mode ||
						$songStore.key?.mode ||
						'major'}
					inherited={!currentSection.key}
					options={modes}
					on:change={e => 
					{
						updateSection(sectionIndex, 'key', {
							...(currentSection.key ||
								$songStore.key || {
								tonic: 'C',
								mode: 'major'
							}),
							mode: e.detail
						})
					}}
					width="100px"
				/>

				<div style="margin-left: 10px;">
					<Display
						value="{currentSection.meter?.numerator ||
							$songStore.meter?.numerator ||
							4}/{currentSection.meter?.denominator ||
							$songStore.meter?.denominator ||
							4}"
						label="METER"
						inherited={!currentSection.meter}
						on:change={e => 
						{
							const [ n, d ] = e.detail.split('/')
							updateSection(sectionIndex, 'meter', {
								numerator: parseInt(n) || 4,
								denominator: parseInt(d) || 4
							})
						}}
						width="75px"
					/>
				</div>
			</div>
		</div>

		<div class="chord-area">
			<span class="label">SECTION CHORDS</span>
			<ChordBuilder
				chords={currentSection.chords || $songStore.chords || []}
				on:change={e => 
				{
					updateSection(sectionIndex, 'chords', e.detail)
				}}
			/>
		</div>
	</div>
</div>

<style>
	.section-editor {
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: 8px;
		padding: 12px 20px;
		box-shadow: var(--shadow-sm);
	}

	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.section-title {
		font-size: 1.1rem;
		font-weight: 700;
		margin: 0;
		color: var(--text-heading);
		display: flex;
		align-items: center;
		gap: 4px;
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
		font-size: 1.1rem;
		padding: 0;
		margin: 0;
		resize: none;
		background: none;
		appearance: none;
		border: none;
		text-align: center;
	}

	.name-input {
		width: 100%;
		color: var(--accent);
		outline: none;
	}

	.input-sizer::after {
		width: auto;
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

	.header-controls {
		display: flex;
		gap: 15px;
		align-items: flex-end;
	}

	.editor-grid {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.grouped-box {
		display: flex;
		flex-direction: column;
		background: var(--bg-sub);
		padding: 15px;
		border-radius: 6px;
		border: 1px solid var(--border-main);
		position: relative;
		gap: 10px;
	}

	.box-label {
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

	.inner-label {
		font-size: 10px;
		color: var(--text-muted);
		margin-bottom: 4px;
		text-transform: uppercase;
		letter-spacing: 1px;
		font-weight: 700;
		text-align: center;
	}

	.chord-area {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.chord-area .label {
		font-size: 0.7rem;
		font-weight: 800;
		color: var(--text-muted);
		letter-spacing: 1px;
	}
</style>
