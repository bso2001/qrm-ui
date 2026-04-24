<script lang="js">
	import { onMount } from 'svelte'
	import Card from './lib/components/Card.svelte'
	import Choice from './lib/components/Choice.svelte'
	import Slider from './lib/components/Slider.svelte'
	import Switch from './lib/components/Switch.svelte'
	import { tonics } from './lib/constants'

	const STORAGE_KEY = 'qrm_vst_scope_autosave'

	const defaultState = {
		root: 'C',
		octave: 3,
		velocity: 90,
		restLikelihood: 0.15,
		noteLength: 0.5,
		phraseLength: 4,
		phrasePlayback: 'repeat-as-needed',
		activationRangeEnabled: true,
		startRange: 'song-start',
		startBar: 1,
		endRange: 'song-end',
		endBar: 64
	}

	let model = { ...defaultState }
	let mounted = false

	function resetModel()
	{
		model = { ...defaultState }
	}

	function clampModel()
	{
		if (model.startBar < 1)
		{
			model = {
				...model,
				startBar: 1
			}
		}

		if (model.endBar < 1)
		{
			model = {
				...model,
				endBar: 1
			}
		}

		if (
			model.startRange === 'bar'
			&& model.endRange === 'bar'
			&& model.startBar > model.endBar
		)
		{
			model = {
				...model,
				endBar: model.startBar
			}
		}
	}

	$: if (mounted)
	{
		clampModel()
		localStorage.setItem(STORAGE_KEY, JSON.stringify(model))
	}

	onMount(() =>
	{
		const saved = localStorage.getItem(STORAGE_KEY)
		if (saved)
		{
			try
			{
				model = {
					...defaultState,
					...JSON.parse(saved)
				}
			}
			catch
			{
				model = { ...defaultState }
			}
		}

		mounted = true
	})
</script>

<main>
	<div class="app-shell">
		<header class="topbar">
			<div class="brand">QRM UI - VST Scope</div>
			<button class="reset-btn" on:click={resetModel}>RESET</button>
		</header>

		<Card title="Single-Part Control Panel">
			<div class="panel-grid">
				<div class="control choice-control">
					<Choice
						value={model.root}
						label="ROOT"
						options={tonics}
						on:change={e =>
						{
							model = {
								...model,
								root: e.detail
							}
						}}
						width="92px"
					/>
				</div>

				<div class="control">
					<Slider
						value={model.octave}
						label="OCTAVE"
						min={0}
						max={8}
						step={1}
						on:change={e =>
						{
							model = {
								...model,
								octave: e.detail
							}
						}}
					/>
				</div>

				<div class="control">
					<Slider
						value={model.velocity}
						label="VELOCITY"
						min={1}
						max={127}
						step={1}
						on:change={e =>
						{
							model = {
								...model,
								velocity: e.detail
							}
						}}
					/>
				</div>

				<div class="control">
					<Slider
						value={model.restLikelihood}
						label="REST LIKELIHOOD"
						min={0}
						max={1}
						step={0.01}
						on:change={e =>
						{
							model = {
								...model,
								restLikelihood: e.detail
							}
						}}
					/>
				</div>

				<div class="control">
					<Slider
						value={model.noteLength}
						label="NOTE LENGTH"
						min={0.05}
						max={1}
						step={0.01}
						on:change={e =>
						{
							model = {
								...model,
								noteLength: e.detail
							}
						}}
					/>
				</div>

				<div class="control">
					<Slider
						value={model.phraseLength}
						label="PHRASE LENGTH"
						min={1}
						max={16}
						step={1}
						on:change={e =>
						{
							model = {
								...model,
								phraseLength: e.detail
							}
						}}
					/>
				</div>

				<div class="control phrase-playback-control">
					<Choice
						value={model.phrasePlayback}
						label="PHRASE PLAYBACK"
						options={[ 'no-repeat', 'repeat-as-needed', 'regenerate-per-cycle' ]}
						on:change={e =>
						{
							model = {
								...model,
								phrasePlayback: e.detail
							}
						}}
						width="220px"
					/>
				</div>
			</div>

			<div class="gate-card" class:disabled={!model.activationRangeEnabled}>
				<div class="gate-header">
					<Switch
						on={model.activationRangeEnabled}
						label="ACTIVATION RANGE"
						on:change={e =>
						{
							model = {
								...model,
								activationRangeEnabled: e.detail
							}
						}}
					/>
				</div>

				<div class="gate-grid">
					<div class="range-block">
						<Choice
							value={model.startRange}
							label="START"
							options={[ 'song-start', 'bar' ]}
							on:change={e =>
							{
								model = {
									...model,
									startRange: e.detail
								}
							}}
							width="120px"
						/>

						{#if model.startRange === 'bar'}
							<Slider
								value={model.startBar}
								label="START BAR"
								min={1}
								max={512}
								step={1}
								on:change={e =>
								{
									const startBar = e.detail
									model = {
										...model,
										startBar,
										endBar: model.endRange === 'bar'
											? Math.max(model.endBar, startBar)
											: model.endBar
									}
								}}
							/>
						{/if}
					</div>

					<div class="range-block">
						<Choice
							value={model.endRange}
							label="STOP"
							options={[ 'song-end', 'bar' ]}
							on:change={e =>
							{
								model = {
									...model,
									endRange: e.detail
								}
							}}
							width="120px"
						/>

						{#if model.endRange === 'bar'}
							<Slider
								value={model.endBar}
								label="STOP BAR"
								min={1}
								max={512}
								step={1}
								on:change={e =>
								{
									const endBar = e.detail
									model = {
										...model,
										startBar: model.startRange === 'bar'
											? Math.min(model.startBar, endBar)
											: model.startBar,
										endBar
									}
								}}
							/>
						{/if}
					</div>
				</div>
			</div>

			<div class="json-preview">
				<div class="json-title">VST PARAM SNAPSHOT</div>
				<pre>{JSON.stringify(model, null, 2)}</pre>
			</div>
		</Card>
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
		--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);

		margin: 0;
		padding: 0;
		background: var(--bg-main);
		font-family:
			-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
			Arial, sans-serif;
		color: var(--text-main);
	}

	main {
		width: 100%;
		display: flex;
		justify-content: center;
		padding: 14px;
		box-sizing: border-box;
	}

	.app-shell {
		width: min(980px, 100%);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 14px;
		border: 1px solid var(--border-main);
		border-radius: 8px;
		background: var(--bg-card);
		box-shadow: var(--shadow-sm);
	}

	.brand {
		font-weight: 800;
		letter-spacing: 0.04em;
		font-size: 0.95rem;
		text-transform: uppercase;
	}

	.reset-btn {
		height: 34px;
		padding: 0 12px;
		border-radius: 6px;
		border: 1px solid var(--border-input);
		background: var(--bg-sub);
		font-size: 0.75rem;
		font-weight: 700;
		cursor: pointer;
	}

	.panel-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(180px, 1fr));
		gap: 6px;
		width: 100%;
	}

	.control {
		min-width: 0;
	}

	.choice-control {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.phrase-playback-control {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.gate-card {
		margin-top: 8px;
		padding: 10px;
		border: 1px solid var(--border-main);
		border-radius: 8px;
		background: var(--bg-sub);
	}

	.gate-card.disabled {
		opacity: 0.75;
	}

	.gate-header {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		padding-left: 6px;
	}

	.gate-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(200px, 1fr));
		gap: 8px;
	}

	.range-block {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		padding-top: 4px;
	}

	.json-preview {
		margin-top: 8px;
		padding: 10px;
		border-radius: 8px;
		border: 1px dashed var(--border-input);
		background: var(--bg-sub);
	}

	.json-title {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 6px;
	}

	pre {
		margin: 0;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 0.76rem;
		line-height: 1.35;
		overflow: auto;
	}

	@media (max-width: 900px) {
		.panel-grid {
			grid-template-columns: repeat(2, minmax(170px, 1fr));
		}

		.gate-grid {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 600px) {
		.panel-grid {
			grid-template-columns: 1fr;
		}

		.topbar {
			gap: 10px;
			align-items: flex-start;
			flex-direction: column;
		}
	}
</style>
