<script lang="js">
	import { onMount } from 'svelte'
	import Card from './lib/components/Card.svelte'
	import Choice from './lib/components/Choice.svelte'
	import Slider from './lib/components/Slider.svelte'
	import { tonics } from './lib/constants'

	const STORAGE_KEY = 'qrm_vst_scope_autosave'

	const defaultState = {
		root: 'C',
		octave: 3,
		velocity: 90,
		restLikelihood: 0.15,
		noteLength: 0.5,
		phraseLength: 4,
		phrasePlayback: 'loop',
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
		if (
			model.phrasePlayback !== 'one-shot'
			&& model.phrasePlayback !== 'loop'
			&& model.phrasePlayback !== 're-roll'
		)
		{
			model = {
				...model,
				phrasePlayback: defaultState.phrasePlayback
			}
		}

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
				const parsed = JSON.parse(saved)
				const { activationRangeEnabled, ...savedState } = parsed
				const legacyPhrasePlaybackMap = {
					'no-repeat': 'one-shot',
					'repeat-as-needed': 'loop',
					'regenerate-per-cycle': 're-roll'
				}

				model = {
					...defaultState,
					...savedState,
					phrasePlayback:
						legacyPhrasePlaybackMap[savedState.phrasePlayback]
						|| savedState.phrasePlayback
						|| defaultState.phrasePlayback
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
			<div class="brand-wrap">
				<div class="brand">qrm.vst</div>
				<div class="subtitle">Quasi-intelligent accompanist</div>
			</div>
			<button class="reset-btn" on:click={resetModel}>RESET</button>
		</header>

		<Card>
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

				<div class="control phrase-group-control">
					<div class="phrase-group">
						<div class="phrase-group-label">PHRASE</div>
						<Choice
							value={model.phrasePlayback}
							label="PHRASE MODE"
							options={[
								{ value: 'one-shot', label: 'Play Once' },
								{ value: 'loop', label: 'Repeat Same' },
								{ value: 're-roll', label: 'Regenerate Each Loop' }
							]}
							on:change={e =>
							{
								model = {
									...model,
									phrasePlayback: e.detail
								}
							}}
							width="140px"
						/>
						<div class="phrase-length-wrap" class:dimmed={model.phrasePlayback === 'one-shot'}>
							<Slider
								value={model.phraseLength}
								label="LENGTH (BARS)"
								min={1}
								max={16}
								step={1}
								on:change={e =>
								{
									if (model.phrasePlayback === 'one-shot')
										return

									model = {
										...model,
										phraseLength: e.detail
									}
								}}
							/>
						</div>
					</div>
				</div>
			</div>

			<div class="gate-card">
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
		--bg-main: #16181d;
		--bg-card: #1d2027;
		--bg-sub: #242933;
		--bg-hover: #2d3340;
		--bg-input: #232832;
		--text-main: #d7d9dd;
		--text-muted: #b3b8c0;
		--text-heading: #edf0f5;
		--border-main: #353a45;
		--border-sub: #323743;
		--border-input: #464d5d;
		--accent: #8fb3ff;
		--shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.28);

		margin: 0;
		padding: 0;
		background: radial-gradient(circle at top, #1f232d 0%, var(--bg-main) 55%);
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
		padding: 12px 16px;
		border: 1.5px solid var(--border-main);
		border-radius: 12px;
		background: var(--bg-card);
		box-shadow: var(--shadow-sm);
	}

	.brand-wrap {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.brand {
		font-weight: 800;
		letter-spacing: 0.02em;
		font-size: 1.3rem;
		line-height: 1.1;
		color: var(--text-heading);
	}

	.subtitle {
		font-size: 0.78rem;
		line-height: 1;
		color: var(--text-muted);
	}

	.reset-btn {
		height: 34px;
		padding: 0 12px;
		border-radius: 7px;
		border: 1px solid var(--border-input);
		background: var(--bg-sub);
		font-size: 0.7rem;
		font-weight: 700;
		cursor: pointer;
		color: var(--text-main);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.reset-btn:hover {
		background: var(--bg-hover);
		border-color: var(--accent);
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

	.phrase-group-control {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.phrase-group {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 8px 6px 6px;
		border: 1.5px solid var(--border-main);
		border-radius: 8px;
		background: var(--bg-sub);
		position: relative;
	}

	.phrase-group-label {
		position: absolute;
		top: -8px;
		left: 12px;
		padding: 0 6px;
		background: var(--bg-card);
		border: 1px solid var(--border-main);
		border-radius: 6px;
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.09em;
		color: var(--text-muted);
	}

	.phrase-length-wrap {
		display: block;
		min-width: 0;
	}

	.phrase-length-wrap.dimmed {
		opacity: 0.28;
		filter: grayscale(1) saturate(0.15);
		pointer-events: none;
	}

	:global(.phrase-length-wrap.dimmed .label) {
		color: var(--text-muted) !important;
	}

	:global(.phrase-length-wrap.dimmed .value) {
		color: var(--text-muted) !important;
		background: var(--bg-main) !important;
		border-color: var(--border-main) !important;
	}

	:global(.phrase-length-wrap.dimmed .slider) {
		opacity: 0.45 !important;
	}

	.gate-card {
		margin-top: 8px;
		padding: 10px;
		border: 1.5px solid var(--border-main);
		border-radius: 8px;
		background: var(--bg-sub);
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
		border: 1px dashed #5a6276;
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
