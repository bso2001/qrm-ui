<script lang="js">
	import { createEventDispatcher } from 'svelte'
	import {
		songStore,
		resolveParam,
		getParamLevel,
		updatePart,
		updatePerformance
	} from '../songStore'
	import Card from './Card.svelte'
	import Slider from './Slider.svelte'
	import Display from './Display.svelte'
	import Choice from './Choice.svelte'
	import ChordBuilder from './ChordBuilder.svelte'
	import { voiceTypes, tonics, modes } from '../constants'

	export let partIndex
	export let sectionIndex

	$: part = $songStore?.parts?.[partIndex] || {}
	$: performance = part?.performances?.[sectionIndex] || {}

	const dispatch = createEventDispatcher()

	let showKMC = false
</script>

<Card
	title=""
	subModule={true}
	showDelete={$songStore?.parts?.length > 1}
	on:delete={() => dispatch('delete')}
>
	<div slot="header-right-extra">
		<button
			class="icon-btn"
			title="Override Key/Meter/Chords"
			on:click={() => (showKMC = !showKMC)}>⚙</button
		>
	</div>

	<div slot="header-left-extra" class="title-group">
		<h3 class="part-title">
			<div class="input-sizer" data-value={part.name || 'Untitled'}>
				<input class="name-input" value={part.name} placeholder="Untitled"
					on:input={e => updatePart(partIndex, 'name', e.currentTarget.value)} />
			</div>
		</h3>

	</div>

	<div class="part-compact">
		<!-- Top Row: Identity and File -->
		<div class="top-row">
			<Choice
				value={part.type || 'chordal'}
				label="MODE"
				options={voiceTypes}
				on:change={e => 
				{
					updatePart(partIndex, 'type', e.detail)
				}}
				width="90px"
			/>
			<Display
				value={part.range ? part.range.join('-') : 'C1-C8'}
				label="RANGE"
				width="100px"
				on:change={e => 
				{
					updatePart(
						partIndex,
						'range',
						e.detail.split('-').map(s => s.trim())
					)
				}}
			/>
			<Display
				value={resolveParam(
					$songStore,
					sectionIndex,
					partIndex,
					'file'
				) || ''}
				label="MIDI FILE"
				width="180px"
				color="#aaa"
				fontSize="11px"
				on:change={e => 
				{
					updatePerformance(
						sectionIndex,
						partIndex,
						'file',
						e.detail
					)
				}}
			/>

			{#if showKMC}
				<Choice
					value={resolveParam(
						$songStore,
						sectionIndex,
						partIndex,
						'key'
					)?.tonic || 'C'}
					inherited={getParamLevel(
						$songStore,
						sectionIndex,
						partIndex,
						'key'
					) !== 'performance'}
					options={tonics}
					on:change={e => 
					{
						const currentKey = resolveParam(
							$songStore,
							sectionIndex,
							partIndex,
							'key'
						) || { tonic: 'C', mode: 'major' }
						updatePerformance(sectionIndex, partIndex, 'key', {
							...currentKey,
							tonic: e.detail
						})
					}}
					width="45px"
					label="KEY"
				/>
				<Choice
					value={resolveParam(
						$songStore,
						sectionIndex,
						partIndex,
						'key'
					)?.mode || 'major'}
					inherited={getParamLevel(
						$songStore,
						sectionIndex,
						partIndex,
						'key'
					) !== 'performance'}
					options={modes}
					on:change={e => 
					{
						const currentKey = resolveParam(
							$songStore,
							sectionIndex,
							partIndex,
							'key'
						) || { tonic: 'C', mode: 'major' }
						updatePerformance(sectionIndex, partIndex, 'key', {
							...currentKey,
							mode: e.detail
						})
					}}
					width="80px"
					label="MODE"
				/>

				<Display
					value="{resolveParam(
						$songStore,
						sectionIndex,
						partIndex,
						'meter'
					)?.numerator || 4}/{resolveParam(
						$songStore,
						sectionIndex,
						partIndex,
						'meter'
					)?.denominator || 4}"
					label="METER"
					inherited={getParamLevel(
						$songStore,
						sectionIndex,
						partIndex,
						'meter'
					) !== 'performance'}
					on:change={e => 
					{
						const val = e.detail
						const [ n, d ] = val.split('/')
						updatePerformance(sectionIndex, partIndex, 'meter', {
							numerator: parseInt(n) || 4,
							denominator: parseInt(d) || 4
						})
					}}
					width="60px"
				/>
			{/if}

			<Display
				value={resolveParam(
					$songStore,
					sectionIndex,
					partIndex,
					'duration'
				) || '1/4'}
				label="DURATION"
				width="70px"
				color="#00ffff"
				inherited={getParamLevel(
					$songStore,
					sectionIndex,
					partIndex,
					'duration'
				) !== 'performance'}
				on:change={e => 
				{
					updatePerformance(
						sectionIndex,
						partIndex,
						'duration',
						e.detail
					)
				}}
			/>
		</div>

		{#if showKMC}
			<div class="chords-row">
				<span class="label">PART CHORDS OVERRIDE</span>
				<ChordBuilder
					chords={resolveParam(
						$songStore,
						sectionIndex,
						partIndex,
						'chords'
					) || []}
					on:change={e => 
					{
						updatePerformance(
							sectionIndex,
							partIndex,
							'chords',
							e.detail
						)
					}}
				/>
			</div>
		{/if}

		<!-- Bottom Row: ALL Performance Sliders on one line -->
		<div class="performance-row">
			<Slider
				compact={true}
				value={resolveParam(
					$songStore,
					sectionIndex,
					partIndex,
					'restPct'
				) ?? 0.5}
				inherited={getParamLevel(
					$songStore,
					sectionIndex,
					partIndex,
					'restPct'
				) !== 'performance'}
				on:change={e => 
				{
					updatePerformance(
						sectionIndex,
						partIndex,
						'restPct',
						e.detail
					)
				}}
				min={0}
				max={1}
				step={0.01}
				label="REST %"
			/>

			<Slider
				compact={true}
				value={resolveParam(
					$songStore,
					sectionIndex,
					partIndex,
					'tonicPct'
				) ?? 0}
				inherited={getParamLevel(
					$songStore,
					sectionIndex,
					partIndex,
					'tonicPct'
				) !== 'performance'}
				on:change={e => 
				{
					updatePerformance(
						sectionIndex,
						partIndex,
						'tonicPct',
						e.detail
					)
				}}
				min={0}
				max={1}
				step={0.01}
				label="TONIC %"
			/>

			<Slider
				compact={true}
				value={resolveParam(
					$songStore,
					sectionIndex,
					partIndex,
					'inversionPct'
				) ?? 0}
				inherited={getParamLevel(
					$songStore,
					sectionIndex,
					partIndex,
					'inversionPct'
				) !== 'performance'}
				on:change={e => 
				{
					updatePerformance(
						sectionIndex,
						partIndex,
						'inversionPct',
						e.detail
					)
				}}
				min={0}
				max={1}
				step={0.01}
				label="INV %"
			/>

			<Slider
				compact={true}
				value={resolveParam(
					$songStore,
					sectionIndex,
					partIndex,
					'velocity'
				)?.[0] ?? 60}
				inherited={getParamLevel(
					$songStore,
					sectionIndex,
					partIndex,
					'velocity'
				) !== 'performance'}
				on:change={e => 
				{
					const currentVelocity = resolveParam(
						$songStore,
						sectionIndex,
						partIndex,
						'velocity'
					) || [ 60, 80 ]
					updatePerformance(sectionIndex, partIndex, 'velocity', [
						e.detail,
						currentVelocity[1]
					])
				}}
				min={0}
				max={127}
				label="MIN VEL"
			/>
			<Slider
				compact={true}
				value={resolveParam(
					$songStore,
					sectionIndex,
					partIndex,
					'velocity'
				)?.[1] ?? 80}
				inherited={getParamLevel(
					$songStore,
					sectionIndex,
					partIndex,
					'velocity'
				) !== 'performance'}
				on:change={e => 
				{
					const currentVelocity = resolveParam(
						$songStore,
						sectionIndex,
						partIndex,
						'velocity'
					) || [ 60, 80 ]
					updatePerformance(sectionIndex, partIndex, 'velocity', [
						currentVelocity[0],
						e.detail
					])
				}}
				min={0}
				max={127}
				label="MAX VEL"
			/>
		</div>
	</div>
</Card>

<style>
	.part-compact {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}

	.top-row {
		display: flex;
		gap: 12px;
		align-items: flex-end;
		margin-bottom: 4px;
		flex-wrap: wrap;
	}

	.chords-row {
		width: 100%;
		margin-bottom: 8px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.chords-row .label {
		font-size: 0.7rem;
		font-weight: 800;
		color: var(--text-muted);
		letter-spacing: 1px;
	}

	.performance-row {
		display: flex;
		gap: 5px;
		align-items: flex-end;
		flex-wrap: nowrap;
		overflow-x: auto;
	}

	.title-group {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.part-title {
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
		color: var(--text-heading);
		display: flex;
		align-items: center;
	}

	.input-sizer {
		display: inline-grid;
		vertical-align: top;
		align-items: center;
		position: relative;
		padding: 0 4px;
	}

	.input-sizer::after,
	.name-input {
		width: auto;
		min-width: 50px;
		grid-area: 1/2;
		font: inherit;
		margin: 0;
		resize: none;
		background: none;
		appearance: none;
		border: none;
		text-align: left;
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
		box-shadow: 0 0 0 2px var(--bg-sub);
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

	.icon-btn {
		background: var(--bg-card);
		border: 1px solid var(--border-input);
		color: var(--text-muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 6px;
		width: 32px;
		height: 32px;
		font-size: 1.4rem;
		font-weight: 800;
		padding: 0;
		transition: all 0.2s ease;
		box-shadow: var(--shadow-sm);
	}

	.icon-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
</style>
