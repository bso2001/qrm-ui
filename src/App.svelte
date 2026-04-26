<script lang="js">
	import { onMount, onDestroy } from 'svelte'
	import Card from './lib/components/Card.svelte'
	import Choice from './lib/components/Choice.svelte'
	import Slider from './lib/components/Slider.svelte'
	import { tonics } from './lib/constants'

	const STORAGE_KEY = 'qrm_vst_scope_autosave'
	const TRACE_SCHEMA_VERSION = 1
	const BEATS_PER_BAR = 4
	const PPQ_PER_BEAT = 960
	const TICKS_PER_BEAT = 4
	const TICK_INTERVAL_MS = 140

	const defaultState = {
		partType: 'freeform',
		root: 'C',
		octave: 3,
		velocity: 90,
		restPct: 0.15,
		tonicPct: 0,
		noteLength: 0.5,
		phraseLength: 4,
		repeatPhrases: false,
		repeatStyle: 'same',
		phrasePlayback: 're-roll',
		startRange: 'song-start',
		startBar: 1,
		endRange: 'song-end',
		endBar: 64
	}

	let model = { ...defaultState }
	let mounted = false
	let scenarioId = 'manual'
	let seed = 'fixed-001'
	let runId = `run-${Date.now().toString(36)}`
	let traceEvents = []
	let seekBarInput = 1

	let transportState = {
		isPlaying: false,
		transportTick: 0,
		ppq: 0,
		bar: 1,
		beat: 1
	}

	let timerHandle = null
	let phraseCounter = 0
	let currentPhraseId = null
	let wasInActiveRange = true
	let activeNotes = []
	let traceWindow = null
	let traceWindowBlocked = false
	let traceWindowOpen = false

	$: tracePreview = traceEvents
		.slice(-30)
		.map(event => JSON.stringify(event))
		.join('\n')

	function resetModel()
	{
		model = { ...defaultState }
	}

	function makeRunId()
	{
		return `run-${Date.now().toString(36)}`
	}

	function rangeStartLabel()
	{
		return model.startRange === 'bar'
			? `bar:${model.startBar}`
			: 'song-start'
	}

	function rangeStopLabel()
	{
		return model.endRange === 'bar'
			? `bar:${model.endBar}`
			: 'song-end'
	}

	function getActiveRangeBars()
	{
		const startBar = model.startRange === 'bar' ? model.startBar : 1
		const stopBar = model.endRange === 'bar' ? model.endBar : Number.POSITIVE_INFINITY

		return {
			startBar,
			stopBar
		}
	}

	function isInActiveRange(bar)
	{
		const activeRange = getActiveRangeBars()
		return bar >= activeRange.startBar && bar <= activeRange.stopBar
	}

	function updatePositionFromTick(transportTick)
	{
		const beatIndex = Math.floor(transportTick / TICKS_PER_BEAT)
		const bar = Math.floor(beatIndex / BEATS_PER_BAR) + 1
		const beat = (beatIndex % BEATS_PER_BAR) + 1

		transportState = {
			...transportState,
			transportTick,
			ppq: beatIndex * PPQ_PER_BEAT,
			bar,
			beat
		}
	}

	function logTrace(eventType, extra = {})
	{
		traceEvents = [
			...traceEvents,
			{
				schemaVersion: TRACE_SCHEMA_VERSION,
				runId,
				scenarioId,
				source: 'js',
				timestampMs: Date.now(),
				transportTick: transportState.transportTick,
				ppq: transportState.ppq,
				bar: transportState.bar,
				beat: transportState.beat,
				eventType,
				note: null,
				velocity: null,
				phraseId: currentPhraseId,
				partType: model.partType,
				repeatPhrases: model.repeatPhrases,
				repeatStyle: model.repeatStyle,
				phraseLengthBars: model.phraseLength,
				rangeStart: rangeStartLabel(),
				rangeStop: rangeStopLabel(),
				seed,
				...extra
			}
		]
	}

	function emitRangeTransitionIfNeeded()
	{
		const inRange = isInActiveRange(transportState.bar)

		if (inRange !== wasInActiveRange)
		{
			logTrace(inRange ? 'range.enter' : 'range.exit', {
				inRange
			})
			wasInActiveRange = inRange
		}
	}

	function resetPhraseRuntime()
	{
		currentPhraseId = null
		phraseCounter = 0
	}

	function flushActiveNotes(reason)
	{
		for (const note of activeNotes)
		{
			logTrace('note.off', {
				note,
				velocity: 0,
				reason
			})
		}

		activeNotes = []
	}

	function resolvePhraseIdForBeat(bar, beat)
	{
		if (!isInActiveRange(bar))
			return null

		if (!model.repeatPhrases)
		{
			if (model.partType === 'chords')
			{
				if (beat === 1)
				{
					const chordIndex = (bar - 1) % 4
					logTrace('phrase.boundary', {
						phraseId: `chord-cycle-${chordIndex}`,
						mode: 'chord-cycle'
					})
				}

				return null
			}

			return null
		}

		const phraseBars = Math.max(1, Math.round(model.phraseLength))
		const isBoundary = beat === 1 && (bar - 1) % phraseBars === 0

		if (isBoundary)
		{
			if (model.repeatStyle === 'refresh' || currentPhraseId == null)
				currentPhraseId = `phrase-${phraseCounter++}`

			logTrace('phrase.boundary', {
				phraseId: currentPhraseId,
				mode: model.repeatStyle
			})
		}

		if (currentPhraseId == null)
			currentPhraseId = `phrase-${phraseCounter++}`

		return currentPhraseId
	}

	function chooseNote(bar, beat)
	{
		const rootSemitone = Math.max(0, tonics.indexOf(model.root))
		const baseNote = 24 + model.octave * 12 + rootSemitone
		let note = baseNote

		if (model.partType === 'chords')
		{
			const chordCycle = [
				[ 0, 3, 7, 10 ],
				[ 0, 4, 7, 11 ],
				[ 0, 3, 7 ],
				[ 0, 3, 7 ]
			]
			const chordIndex = (bar - 1) % chordCycle.length
			const chord = chordCycle[chordIndex]
			note += chord[(beat - 1) % chord.length]
		}
		else if (model.partType === 'chordal')
		{
			const chordalOffsets = [ 0, 3, 7, 10, 12, 10, 7, 3 ]
			note += chordalOffsets[((bar - 1) * 2 + beat - 1) % chordalOffsets.length]
		}
		else
		{
			const scaleOffsets = [ 0, 2, 4, 5, 7, 9, 11 ]
			note += scaleOffsets[(bar + beat) % scaleOffsets.length]
		}

		if (Math.random() < model.tonicPct)
			note = baseNote

		return Math.min(108, Math.max(24, note))
	}

	function runBeatIfNeeded()
	{
		if (transportState.transportTick % TICKS_PER_BEAT !== 0)
			return

		flushActiveNotes('beat-advance')

		if (!isInActiveRange(transportState.bar))
			return

		const phraseId = resolvePhraseIdForBeat(transportState.bar, transportState.beat)

		if (Math.random() < model.restPct)
			return

		const note = chooseNote(transportState.bar, transportState.beat)
		activeNotes = [ note ]

		logTrace('note.on', {
			note,
			velocity: model.velocity,
			phraseId
		})
	}

	function stepTransport()
	{
		updatePositionFromTick(transportState.transportTick + 1)
		emitRangeTransitionIfNeeded()
		runBeatIfNeeded()
	}

	function startTransport()
	{
		if (transportState.isPlaying)
			return

		transportState = {
			...transportState,
			isPlaying: true
		}

		logTrace('transport.start')

		if (timerHandle == null)
			timerHandle = setInterval(stepTransport, TICK_INTERVAL_MS)
	}

	function stopTransport()
	{
		if (!transportState.isPlaying)
			return

		flushActiveNotes('transport-stop')

		transportState = {
			...transportState,
			isPlaying: false
		}

		if (timerHandle != null)
		{
			clearInterval(timerHandle)
			timerHandle = null
		}

		logTrace('transport.stop')
	}

	function seekToBar(rawBar)
	{
		const requestedBar = Number.isFinite(rawBar)
			? Math.max(1, Math.round(rawBar))
			: 1

		seekBarInput = requestedBar
		flushActiveNotes('transport-seek')
		resetPhraseRuntime()

		const beatIndex = (requestedBar - 1) * BEATS_PER_BAR
		updatePositionFromTick(beatIndex * TICKS_PER_BEAT)
		emitRangeTransitionIfNeeded()

		logTrace('transport.seek', {
			requestedBar,
			resolvedBar: transportState.bar
		})
	}

	function rewindTransport()
	{
		seekToBar(1)
	}

	function clearTrace()
	{
		traceEvents = []
		runId = makeRunId()
	}

	function ensureTraceWindowContent(windowRef)
	{
		if (!windowRef || windowRef.closed)
			return

		const doc = windowRef.document
		if (doc.getElementById('trace-output'))
			return

		doc.open()
		doc.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>QRM Trace Window</title>
  <style>
    body {
      margin: 0;
      padding: 10px;
      background: #151920;
      color: #d7d9dd;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .meta {
      font-size: 12px;
      color: #b3b8c0;
      margin-bottom: 8px;
      white-space: pre-wrap;
      border: 1px solid #353a45;
      border-radius: 6px;
      padding: 8px;
      background: #1d2027;
    }
    pre {
      margin: 0;
      border: 1px solid #353a45;
      border-radius: 6px;
      padding: 10px;
      background: #1d2027;
      font-size: 12px;
      line-height: 1.35;
      white-space: pre-wrap;
      word-break: break-word;
      min-height: calc(100vh - 80px);
      box-sizing: border-box;
      overflow: auto;
    }

		.section-title {
			margin: 10px 0 6px;
			font-size: 11px;
			letter-spacing: 0.06em;
			text-transform: uppercase;
			color: #b3b8c0;
			font-weight: 700;
		}
  </style>
</head>
<body>
  <div id="trace-meta" class="meta"></div>
	<div class="section-title">VST Param Snapshot</div>
	<pre id="model-output"></pre>
	<div class="section-title">Trace Preview (Last 30 JSONL Events)</div>
  <pre id="trace-output"></pre>
</body>
</html>`)
		doc.close()
	}

	function syncTraceWindow()
	{
		if (!traceWindow || traceWindow.closed)
		{
			traceWindow = null
			traceWindowOpen = false
			return
		}

		ensureTraceWindowContent(traceWindow)

		const doc = traceWindow.document
		const meta = doc.getElementById('trace-meta')
		const modelOutput = doc.getElementById('model-output')
		const output = doc.getElementById('trace-output')
		if (!meta || !modelOutput || !output)
			return

		meta.textContent = `RUN: ${runId}\nSCENARIO: ${scenarioId}\nSEED: ${seed}\nSTATE: ${transportState.isPlaying ? 'PLAYING' : 'STOPPED'}\nBAR: ${transportState.bar} BEAT: ${transportState.beat} TICK: ${transportState.transportTick}\nEVENTS: ${traceEvents.length}`
		modelOutput.textContent = JSON.stringify(model, null, 2)
		output.textContent = tracePreview || 'No trace events yet.'
		traceWindowOpen = true
	}

	function openTraceWindow()
	{
		if (traceWindow && !traceWindow.closed)
		{
			traceWindow.focus()
			syncTraceWindow()
			return
		}

		const popup = window.open('', 'qrmTraceWindow', 'width=640,height=900,left=980,top=60')
		if (!popup)
		{
			traceWindowBlocked = true
			traceWindowOpen = false
			return
		}

		traceWindowBlocked = false
		traceWindow = popup
		traceWindowOpen = true
		syncTraceWindow()
		traceWindow.focus()
	}

	function downloadTrace()
	{
		if (traceEvents.length === 0)
			return

		const lines = traceEvents.map(event => JSON.stringify(event)).join('\n')
		const blob = new Blob([ `${lines}\n` ], { type: 'application/x-ndjson' })
		const url = URL.createObjectURL(blob)
		const anchor = document.createElement('a')

		anchor.href = url
		anchor.download = `qrm-trace-${runId}.jsonl`
		document.body.appendChild(anchor)
		anchor.click()
		document.body.removeChild(anchor)
		URL.revokeObjectURL(url)
	}

	function clampModel()
	{
		if (model.restPct == null && Number.isFinite(model.restLikelihood))
		{
			model = {
				...model,
				restPct: model.restLikelihood
			}
		}

		if (model.tonicPct == null)
		{
			model = {
				...model,
				tonicPct: 0
			}
		}

		if (model.partType !== 'freeform' && model.partType !== 'chordal' && model.partType !== 'chords')
		{
			model = {
				...model,
				partType: defaultState.partType
			}
		}

		if (
			model.repeatStyle !== 'same'
			&& model.repeatStyle !== 'refresh'
		)
		{
			model = {
				...model,
				repeatStyle: defaultState.repeatStyle
			}
		}

		if (typeof model.repeatPhrases !== 'boolean')
		{
			model = {
				...model,
				repeatPhrases: defaultState.repeatPhrases
			}
		}

		if (!Number.isFinite(model.restPct))
		{
			model = {
				...model,
				restPct: defaultState.restPct
			}
		}

		if (!Number.isFinite(model.tonicPct))
		{
			model = {
				...model,
				tonicPct: defaultState.tonicPct
			}
		}

		if (model.restPct < 0 || model.restPct > 1)
		{
			model = {
				...model,
				restPct: Math.min(1, Math.max(0, model.restPct))
			}
		}

		if (model.tonicPct < 0 || model.tonicPct > 1)
		{
			model = {
				...model,
				tonicPct: Math.min(1, Math.max(0, model.tonicPct))
			}
		}

		const phrasePlayback = model.repeatPhrases
			? (model.repeatStyle === 'same' ? 'loop' : 're-roll')
			: 're-roll';

		if (model.phrasePlayback !== phrasePlayback)
		{
			model = {
				...model,
				phrasePlayback
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

		if ('restLikelihood' in model)
		{
			const { restLikelihood, ...cleanModel } = model
			model = cleanModel
		}
	}

	$: if (mounted)
	{
		clampModel()
		localStorage.setItem(STORAGE_KEY, JSON.stringify(model))
	}

	$: if (mounted)
	{
		tracePreview
		transportState
		runId
		scenarioId
		seed
		model
		syncTraceWindow()
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
		wasInActiveRange = isInActiveRange(transportState.bar)
	})

	onDestroy(() =>
	{
		if (timerHandle != null)
			clearInterval(timerHandle)

		if (traceWindow && !traceWindow.closed)
			traceWindow.close()

		traceWindowOpen = false
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
						value={model.partType}
						label="PART TYPE"
						options={[ 'freeform', 'chordal', 'chords' ]}
						on:change={e =>
						{
							model = {
								...model,
								partType: e.detail
							}
						}}
						width="120px"
						fontSize="0.78rem"
					/>
				</div>

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
						value={model.restPct}
						label="REST %"
						min={0}
						max={1}
						step={0.01}
						on:change={e =>
						{
							model = {
								...model,
								restPct: e.detail
							}
						}}
					/>
				</div>

				<div class="control">
					<Slider
						value={model.tonicPct}
						label="TONIC %"
						min={0}
						max={1}
						step={0.01}
						on:change={e =>
						{
							model = {
								...model,
								tonicPct: e.detail
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
						<label class="repeat-toggle">
							<input
								type="checkbox"
								checked={model.repeatPhrases}
								on:change={e =>
								{
									model = {
										...model,
										repeatPhrases: e.currentTarget.checked
									}
								}}
							/>
							<span>Repeat phrases</span>
						</label>

						<div class="repeat-style-group" class:dimmed={!model.repeatPhrases}>
							<div class="repeat-style-label">Repeat style</div>
							<label class="repeat-style-option">
								<input
									type="radio"
									name="repeat-style"
									value="same"
									checked={model.repeatStyle === 'same'}
									disabled={!model.repeatPhrases}
									on:change={e =>
									{
										model = {
											...model,
											repeatStyle: e.currentTarget.value
										}
									}}
								/>
								<span>Keep same phrase</span>
							</label>
							<label class="repeat-style-option">
								<input
									type="radio"
									name="repeat-style"
									value="refresh"
									checked={model.repeatStyle === 'refresh'}
									disabled={!model.repeatPhrases}
									on:change={e =>
									{
										model = {
											...model,
											repeatStyle: e.currentTarget.value
										}
									}}
								/>
								<span>Refresh each repeat</span>
							</label>
						</div>
						<div class="phrase-length-wrap" class:dimmed={!model.repeatPhrases}>
							<Slider
								value={model.phraseLength}
								label="LENGTH"
								compact={true}
								singleLine={true}
								min={1}
								max={16}
								step={1}
								on:change={e =>
								{
									if (!model.repeatPhrases)
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
							fontSize="0.76rem"
							on:change={e =>
							{
								model = {
									...model,
									startRange: e.detail
								}
							}}
							width="142px"
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
							fontSize="0.76rem"
							on:change={e =>
							{
								model = {
									...model,
									endRange: e.detail
								}
							}}
							width="142px"
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

			<div class="transport-card">
				<div class="transport-title">TRANSPORT SIMULATOR</div>
				<div class="transport-controls">
					<button class="transport-btn" on:click={startTransport} disabled={transportState.isPlaying}>START</button>
					<button class="transport-btn" on:click={stopTransport} disabled={!transportState.isPlaying}>STOP</button>
					<button class="transport-btn" on:click={rewindTransport}>RWD</button>

					<label class="seek-input-wrap">
						<span>SEEK BAR</span>
						<input
							type="number"
							min="1"
							step="1"
							bind:value={seekBarInput}
						/>
					</label>
					<button class="transport-btn" on:click={() => seekToBar(seekBarInput)}>SEEK</button>
					<button class="transport-btn" on:click={clearTrace}>CLEAR TRACE</button>
					<button class="transport-btn" on:click={downloadTrace} disabled={traceEvents.length === 0}>DOWNLOAD JSONL</button>
					<button class="transport-btn debug-window-btn" on:click={openTraceWindow}>SHOW DEBUG WINDOW</button>
				</div>

				<div class="transport-controls transport-meta-row">
					<label class="meta-field">
						<span>SCENARIO</span>
						<input type="text" bind:value={scenarioId} />
					</label>
					<label class="meta-field">
						<span>SEED</span>
						<input type="text" bind:value={seed} />
					</label>
				</div>

				<div class="transport-status">
					<span>STATE: {transportState.isPlaying ? 'PLAYING' : 'STOPPED'}</span>
					<span>BAR: {transportState.bar}</span>
					<span>BEAT: {transportState.beat}</span>
					<span>TICK: {transportState.transportTick}</span>
					<span>EVENTS: {traceEvents.length}</span>
					<span>RUN: {runId}</span>
					<span>TRACE WINDOW: {traceWindowOpen ? 'OPEN' : 'CLOSED'}</span>
					{#if traceWindowBlocked}
						<span>TRACE WINDOW BLOCKED BY BROWSER POPUP SETTINGS (TRY ALLOWING POPUPS FOR THIS SITE)</span>
					{/if}
				</div>
			</div>

			{#if traceWindowBlocked}
				<div class="json-preview">
					<div class="json-title">TRACE WINDOW</div>
					<pre>Popup blocked or suppressed. Allow popups for this site, then click OPEN TRACE WINDOW again. Some browsers open it as a new tab instead of a floating window.</pre>
				</div>
			{/if}
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
		flex-direction: column;
		align-items: stretch;
		gap: 10px;
		padding: 8px 6px 6px;
		border: 1.5px solid var(--border-main);
		border-radius: 8px;
		background: var(--bg-sub);
		position: relative;
	}

	.repeat-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 6px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-heading);
	}

	.repeat-toggle input {
		accent-color: var(--accent);
	}

	.repeat-style-group {
		display: flex;
		flex-direction: column;
		gap: 5px;
		margin: 0 6px;
		padding: 6px 6px 2px;
		border: 1px solid var(--border-main);
		border-radius: 8px;
		background: var(--bg-card);
		padding-top: 2px;
		min-height: 76px;
	}

	.repeat-style-group.dimmed {
		opacity: 0.4;
	}

	.repeat-style-label {
		font-size: 0.68rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted);
		font-weight: 700;
	}

	.repeat-style-option {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.78rem;
		color: var(--text-main);
	}

	.repeat-style-option input {
		accent-color: var(--accent);
	}

	.phrase-length-wrap {
		display: block;
		width: min(320px, 100%);
		min-width: 0;
		align-self: center;
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

	.transport-card {
		margin-top: 8px;
		padding: 10px;
		border: 1.5px solid var(--border-main);
		border-radius: 8px;
		background: var(--bg-sub);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.transport-title {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.transport-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}

	.transport-btn {
		height: 30px;
		padding: 0 10px;
		border-radius: 6px;
		border: 1px solid var(--border-input);
		background: var(--bg-card);
		color: var(--text-main);
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		cursor: pointer;
		text-transform: uppercase;
	}

	.transport-btn:hover {
		border-color: var(--accent);
		background: var(--bg-hover);
	}

	.debug-window-btn {
		background: color-mix(in srgb, var(--accent) 18%, var(--bg-card));
		border-color: color-mix(in srgb, var(--accent) 50%, var(--border-input));
		color: var(--text-heading);
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
	}

	.debug-window-btn:hover {
		background: color-mix(in srgb, var(--accent) 28%, var(--bg-hover));
		border-color: var(--accent);
	}

	.transport-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.seek-input-wrap,
	.meta-field {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.68rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--text-muted);
		font-weight: 700;
	}

	.seek-input-wrap input,
	.meta-field input {
		height: 28px;
		padding: 0 8px;
		border-radius: 6px;
		border: 1px solid var(--border-input);
		background: var(--bg-input);
		color: var(--text-main);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.seek-input-wrap input {
		width: 84px;
	}

	.meta-field input {
		width: 140px;
	}

	.transport-meta-row {
		padding-top: 2px;
		border-top: 1px solid var(--border-main);
	}

	.transport-status {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		font-size: 0.66rem;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--text-muted);
		padding-top: 12px;
		border-top: 1px solid var(--border-main);
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
