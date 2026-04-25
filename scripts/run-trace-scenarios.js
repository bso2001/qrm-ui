import fs from 'node:fs/promises'
import path from 'node:path'

import {
	runTraceScenario,
	serializeTraceJsonl,
	validateTrace,
	defaultTraceModel
} from '../src/lib/trace/traceHarness.js'

const outputDir = path.resolve('logs/trace-runs')

const scenarios = [
	{
		id: 'S1-start-8-bars-stop',
		model: {
			...defaultTraceModel,
			partType: 'freeform',
			repeatPhrases: false
		},
		steps: [
			{ type: 'start' },
			{ type: 'advance-bars', bars: 8 },
			{ type: 'stop' }
		]
	},
	{
		id: 'S2-seek-bar-9-run-4-stop',
		model: {
			...defaultTraceModel,
			partType: 'freeform',
			repeatPhrases: true,
			repeatStyle: 'same',
			phraseLength: 2
		},
		steps: [
			{ type: 'start' },
			{ type: 'seek', bar: 9 },
			{ type: 'advance-bars', bars: 4 },
			{ type: 'stop' }
		]
	},
	{
		id: 'S3-repeat-off-vs-same',
		model: {
			...defaultTraceModel,
			partType: 'freeform',
			repeatPhrases: true,
			repeatStyle: 'same',
			phraseLength: 2
		},
		steps: [
			{ type: 'start' },
			{ type: 'advance-bars', bars: 6 },
			{ type: 'stop' }
		]
	},
	{
		id: 'S4-refresh-with-length-change',
		model: {
			...defaultTraceModel,
			partType: 'freeform',
			repeatPhrases: true,
			repeatStyle: 'refresh',
			phraseLength: 2
		},
		steps: [
			{ type: 'start' },
			{ type: 'advance-bars', bars: 4 },
			{ type: 'set-model', patch: { phraseLength: 3 } },
			{ type: 'advance-bars', bars: 6 },
			{ type: 'stop' }
		]
	},
	{
		id: 'S5-range-seeks',
		model: {
			...defaultTraceModel,
			partType: 'freeform',
			startRange: 'bar',
			startBar: 3,
			endRange: 'bar',
			endBar: 6,
			repeatPhrases: true,
			repeatStyle: 'refresh',
			phraseLength: 2
		},
		steps: [
			{ type: 'start' },
			{ type: 'seek', bar: 2 },
			{ type: 'advance-bars', bars: 2 },
			{ type: 'seek', bar: 4 },
			{ type: 'advance-bars', bars: 2 },
			{ type: 'seek', bar: 7 },
			{ type: 'advance-bars', bars: 1 },
			{ type: 'stop' }
		]
	},
	{
		id: 'S6-part-type-natural-behavior',
		model: {
			...defaultTraceModel,
			partType: 'freeform',
			repeatPhrases: false
		},
		steps: [
			{ type: 'start' },
			{ type: 'advance-bars', bars: 2 },
			{ type: 'set-model', patch: { partType: 'chords' } },
			{ type: 'advance-bars', bars: 4 },
			{ type: 'stop' }
		]
	}
]

async function main()
{
	await fs.mkdir(outputDir, { recursive: true })

	const summary = []

	for (const scenario of scenarios)
	{
		const events = runTraceScenario({
			scenarioId: scenario.id,
			seed: 'fixed-001',
			model: scenario.model,
			steps: scenario.steps,
			startTimestampMs: 1_700_000_000_000
		})

		const validation = validateTrace(events)
		const filePath = path.join(outputDir, `${scenario.id}.jsonl`)
		await fs.writeFile(filePath, serializeTraceJsonl(events), 'utf8')

		summary.push({
			scenarioId: scenario.id,
			filePath,
			ok: validation.ok,
			issues: validation.issues,
			summary: validation.summary
		})
	}

	const summaryPath = path.join(outputDir, 'summary.json')
	await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')

	const failed = summary.filter(item => !item.ok)
	if (failed.length > 0)
	{
		console.error(JSON.stringify({ ok: false, failed }, null, 2))
		process.exitCode = 1
		return
	}

	console.log(JSON.stringify({ ok: true, outputDir, summaryPath, scenarioCount: summary.length }, null, 2))
}

main().catch(error =>
{
	console.error(error)
	process.exitCode = 1
})
