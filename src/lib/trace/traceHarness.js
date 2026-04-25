const TRACE_SCHEMA_VERSION = 1
const BEATS_PER_BAR = 4
const PPQ_PER_BEAT = 960
const TICKS_PER_BEAT = 4

const tonics = [ 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B' ]

export const defaultTraceModel = {
	partType: 'freeform',
	root: 'C',
	octave: 3,
	velocity: 90,
	restLikelihood: 0.15,
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

function clampModel(input)
{
	const model = {
		...defaultTraceModel,
		...input
	}

	if (model.repeatStyle !== 'same' && model.repeatStyle !== 'refresh')
		model.repeatStyle = defaultTraceModel.repeatStyle

	if (model.partType !== 'freeform' && model.partType !== 'chordal' && model.partType !== 'chords')
		model.partType = defaultTraceModel.partType

	if (typeof model.repeatPhrases !== 'boolean')
		model.repeatPhrases = defaultTraceModel.repeatPhrases

	if (model.startBar < 1)
		model.startBar = 1

	if (model.endBar < 1)
		model.endBar = 1

	if (model.startRange === 'bar' && model.endRange === 'bar' && model.startBar > model.endBar)
		model.endBar = model.startBar

	model.phrasePlayback = model.repeatPhrases
		? (model.repeatStyle === 'same' ? 'loop' : 're-roll')
		: 're-roll'

	return model
}

function rangeStartLabel(model)
{
	return model.startRange === 'bar' ? `bar:${model.startBar}` : 'song-start'
}

function rangeStopLabel(model)
{
	return model.endRange === 'bar' ? `bar:${model.endBar}` : 'song-end'
}

function getActiveRangeBars(model)
{
	return {
		startBar: model.startRange === 'bar' ? model.startBar : 1,
		stopBar: model.endRange === 'bar' ? model.endBar : Number.POSITIVE_INFINITY
	}
}

function isInActiveRange(model, bar)
{
	const activeRange = getActiveRangeBars(model)
	return bar >= activeRange.startBar && bar <= activeRange.stopBar
}

function positionFromTick(transportTick)
{
	const beatIndex = Math.floor(transportTick / TICKS_PER_BEAT)
	return {
		transportTick,
		ppq: beatIndex * PPQ_PER_BEAT,
		bar: Math.floor(beatIndex / BEATS_PER_BAR) + 1,
		beat: (beatIndex % BEATS_PER_BAR) + 1
	}
}

function createRuntime(options = {})
{
	return {
		model: clampModel(options.model),
		runId: options.runId || `run-${Date.now().toString(36)}`,
		scenarioId: options.scenarioId || 'manual',
		seed: options.seed || 'fixed-001',
		source: options.source || 'js',
		timestampMs: options.startTimestampMs || 0,
		transportState: {
			isPlaying: false,
			...positionFromTick(0)
		},
		traceEvents: [],
		phraseCounter: 0,
		currentPhraseId: null,
		wasInActiveRange: true,
		activeNotes: [],
		nowStep: 0
	}
}

function logTrace(runtime, eventType, extra = {})
{
	runtime.traceEvents.push({
		schemaVersion: TRACE_SCHEMA_VERSION,
		runId: runtime.runId,
		scenarioId: runtime.scenarioId,
		source: runtime.source,
		timestampMs: runtime.timestampMs + runtime.nowStep,
		transportTick: runtime.transportState.transportTick,
		ppq: runtime.transportState.ppq,
		bar: runtime.transportState.bar,
		beat: runtime.transportState.beat,
		eventType,
		note: null,
		velocity: null,
		phraseId: runtime.currentPhraseId,
		partType: runtime.model.partType,
		repeatPhrases: runtime.model.repeatPhrases,
		repeatStyle: runtime.model.repeatStyle,
		phraseLengthBars: runtime.model.phraseLength,
		rangeStart: rangeStartLabel(runtime.model),
		rangeStop: rangeStopLabel(runtime.model),
		seed: runtime.seed,
		...extra
	})
	runtime.nowStep += 1
}

function resetPhraseRuntime(runtime)
{
	runtime.currentPhraseId = null
	runtime.phraseCounter = 0
}

function flushActiveNotes(runtime, reason)
{
	for (const note of runtime.activeNotes)
	{
		logTrace(runtime, 'note.off', {
			note,
			velocity: 0,
			reason
		})
	}

	runtime.activeNotes = []
}

function emitRangeTransitionIfNeeded(runtime)
{
	const inRange = isInActiveRange(runtime.model, runtime.transportState.bar)
	if (inRange !== runtime.wasInActiveRange)
	{
		logTrace(runtime, inRange ? 'range.enter' : 'range.exit', { inRange })
		runtime.wasInActiveRange = inRange
	}
}

function chooseNote(model, bar, beat)
{
	const rootSemitone = Math.max(0, tonics.indexOf(model.root))
	const baseNote = 24 + model.octave * 12 + rootSemitone

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
		const toneIndex = (beat - 1) % chord.length
		return Math.min(108, Math.max(24, baseNote + chord[toneIndex]))
	}

	if (model.partType === 'chordal')
	{
		const chordalOffsets = [ 0, 3, 7, 10, 12, 10, 7, 3 ]
		const degree = ((bar - 1) * 2 + beat - 1) % chordalOffsets.length
		return Math.min(108, Math.max(24, baseNote + chordalOffsets[degree]))
	}

	const scaleOffsets = [ 0, 2, 4, 5, 7, 9, 11 ]
	const degree = (bar + beat) % scaleOffsets.length
	return Math.min(108, Math.max(24, baseNote + scaleOffsets[degree]))
}

function resolvePhraseIdForBeat(runtime)
{
	const { bar, beat } = runtime.transportState

	if (!isInActiveRange(runtime.model, bar))
		return null

	if (!runtime.model.repeatPhrases)
	{
		if (runtime.model.partType === 'chords')
		{
			if (beat === 1)
			{
				const chordIndex = (bar - 1) % 4
				logTrace(runtime, 'phrase.boundary', {
					phraseId: `chord-cycle-${chordIndex}`,
					mode: 'chord-cycle'
				})
			}

			return null
		}

		return null
	}

	const phraseBars = Math.max(1, Math.round(runtime.model.phraseLength))
	const isBoundary = beat === 1 && (bar - 1) % phraseBars === 0

	if (isBoundary)
	{
		if (runtime.model.repeatStyle === 'refresh' || runtime.currentPhraseId == null)
			runtime.currentPhraseId = `phrase-${runtime.phraseCounter++}`

		logTrace(runtime, 'phrase.boundary', {
			phraseId: runtime.currentPhraseId,
			mode: runtime.model.repeatStyle
		})
	}

	if (runtime.currentPhraseId == null)
		runtime.currentPhraseId = `phrase-${runtime.phraseCounter++}`

	return runtime.currentPhraseId
}

function runBeatIfNeeded(runtime)
{
	if (runtime.transportState.transportTick % TICKS_PER_BEAT !== 0)
		return

	flushActiveNotes(runtime, 'beat-advance')

	if (!isInActiveRange(runtime.model, runtime.transportState.bar))
		return

	const phraseId = resolvePhraseIdForBeat(runtime)

	const note = chooseNote(runtime.model, runtime.transportState.bar, runtime.transportState.beat)
	runtime.activeNotes = [ note ]

	logTrace(runtime, 'note.on', {
		note,
		velocity: runtime.model.velocity,
		phraseId
	})
}

function stepTick(runtime)
{
	runtime.transportState = {
		...runtime.transportState,
		...positionFromTick(runtime.transportState.transportTick + 1)
	}
	emitRangeTransitionIfNeeded(runtime)
	runBeatIfNeeded(runtime)
}

function startTransport(runtime)
{
	if (runtime.transportState.isPlaying)
		return

	runtime.transportState.isPlaying = true
	logTrace(runtime, 'transport.start')
}

function stopTransport(runtime)
{
	if (!runtime.transportState.isPlaying)
		return

	flushActiveNotes(runtime, 'transport-stop')
	runtime.transportState.isPlaying = false
	logTrace(runtime, 'transport.stop')
}

function seekToBar(runtime, rawBar)
{
	const requestedBar = Number.isFinite(rawBar) ? Math.max(1, Math.round(rawBar)) : 1
	flushActiveNotes(runtime, 'transport-seek')
	resetPhraseRuntime(runtime)
	runtime.transportState = {
		...runtime.transportState,
		...positionFromTick((requestedBar - 1) * BEATS_PER_BAR * TICKS_PER_BEAT)
	}
	emitRangeTransitionIfNeeded(runtime)
	logTrace(runtime, 'transport.seek', {
		requestedBar,
		resolvedBar: runtime.transportState.bar
	})
}

function rewindTransport(runtime)
{
	seekToBar(runtime, 1)
}

function advanceBars(runtime, bars)
{
	const totalTicks = Math.max(0, Math.round(bars * BEATS_PER_BAR * TICKS_PER_BEAT))
	for (let i = 0; i < totalTicks; i += 1)
	{
		if (!runtime.transportState.isPlaying)
			break
		stepTick(runtime)
	}
}

function updateModel(runtime, patch)
{
	runtime.model = clampModel({
		...runtime.model,
		...patch
	})
	logTrace(runtime, 'model.update', {
		debug: patch
	})
}

export function runTraceScenario(definition)
{
	const runtime = createRuntime(definition)
	runtime.wasInActiveRange = isInActiveRange(runtime.model, runtime.transportState.bar)

	for (const step of definition.steps || [])
	{
		if (step.type === 'start')
			startTransport(runtime)
		else if (step.type === 'stop')
			stopTransport(runtime)
		else if (step.type === 'rewind')
			rewindTransport(runtime)
		else if (step.type === 'seek')
			seekToBar(runtime, step.bar)
		else if (step.type === 'advance-bars')
			advanceBars(runtime, step.bars)
		else if (step.type === 'set-model')
			updateModel(runtime, step.patch)
		else
			throw new Error(`Unsupported scenario step: ${step.type}`)
	}

	if (runtime.transportState.isPlaying)
		stopTransport(runtime)

	return runtime.traceEvents
}

function activeNoteKey(event)
{
	return `${event.note}`
}

export function validateTrace(events)
{
	const issues = []
	const activeNotes = new Map()
	const phraseByBoundaryIndex = []
	let previousTransportTick = -1

	for (let index = 0; index < events.length; index += 1)
	{
		const event = events[index]

		if (event.transportTick < previousTransportTick)
			issues.push(`Event ${index} has decreasing transportTick`)
		previousTransportTick = event.transportTick

		if (event.eventType === 'note.on')
		{
			const startBar = event.rangeStart.startsWith('bar:') ? Number(event.rangeStart.slice(4)) : 1
			const stopBar = event.rangeStop.startsWith('bar:') ? Number(event.rangeStop.slice(4)) : Number.POSITIVE_INFINITY
			if (event.bar < startBar || event.bar > stopBar)
				issues.push(`Event ${index} note.on is outside active range`)

			activeNotes.set(activeNoteKey(event), event)
		}
		else if (event.eventType === 'note.off')
		{
			const key = activeNoteKey(event)
			if (!activeNotes.has(key))
				issues.push(`Event ${index} note.off has no matching note.on`)
			else
				activeNotes.delete(key)
		}
		else if (event.eventType === 'phrase.boundary')
		{
			phraseByBoundaryIndex.push(event)
		}
	}

	if (activeNotes.size > 0)
		issues.push(`Trace ended with ${activeNotes.size} active note(s)`)

	const repeatOffBoundaries = phraseByBoundaryIndex.filter(event => event.repeatPhrases === false)
	if (repeatOffBoundaries.length > 1)
	{
		let allSame = true
		for (let i = 1; i < repeatOffBoundaries.length; i += 1)
		{
			if (repeatOffBoundaries[i].phraseId !== repeatOffBoundaries[i - 1].phraseId)
			{
				allSame = false
				break
			}
		}
		if (allSame)
			issues.push('Repeat-off boundaries never changed phrase identity')
	}

	const sameRepeatBoundaries = phraseByBoundaryIndex.filter(event => event.repeatPhrases === true && event.repeatStyle === 'same')
	if (sameRepeatBoundaries.length > 1)
	{
		const firstPhraseId = sameRepeatBoundaries[0].phraseId
		if (sameRepeatBoundaries.some(event => event.phraseId !== firstPhraseId))
			issues.push('Repeat-style same did not preserve phrase identity')
	}

	const refreshRepeatBoundaries = phraseByBoundaryIndex.filter(event => event.repeatPhrases === true && event.repeatStyle === 'refresh')
	if (refreshRepeatBoundaries.length > 1)
	{
		for (let i = 1; i < refreshRepeatBoundaries.length; i += 1)
		{
			if (refreshRepeatBoundaries[i].phraseId === refreshRepeatBoundaries[i - 1].phraseId)
			{
				issues.push('Repeat-style refresh reused phrase identity across boundaries')
				break
			}
		}
	}

	return {
		ok: issues.length === 0,
		issues,
		summary: {
			eventCount: events.length,
			phraseBoundaryCount: phraseByBoundaryIndex.length,
			noteOnCount: events.filter(event => event.eventType === 'note.on').length,
			transportEventCount: events.filter(event => event.eventType.startsWith('transport.')).length
		}
	}
}

export function serializeTraceJsonl(events)
{
	return `${events.map(event => JSON.stringify(event)).join('\n')}\n`
}
