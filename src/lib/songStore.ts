import { writable, get } from 'svelte/store'

export const songStore = writable<any>(null)

// Keys that define the core identity of a part (not performance-specific)

const partBaseKeys = [ 'name', 'type', 'duration', 'range' ]

// Keys that are resolved per-performance for export

const resolveKeys = [
	'duration',
	'range',
	'velocity',
	'restPct',
	'tonicPct',
	'inversionPct',
	'file',
	'type',
	'key',
	'meter',
	'chords'
]

export function exportSong(state: any) 
{
	if (!state) return state
	const out = { ...state }
	delete out.parts

	out.sections = (state.sections || []).map((section: any, idx: number) => 
	{
		const sectionOut = { ...section }

		// Ensure section-level musical params are resolved/included

		sectionOut.key = section.key || state.key
		sectionOut.meter = section.meter || state.meter
		sectionOut.chords = section.chords || state.chords

		sectionOut.parts = (state.parts || []).map((p: any, pIdx: number) => 
		{
			const combined: any = { name: p.name }

			// Resolve every part parameter so the backend gets a complete object

			resolveKeys.forEach(key => 
			{
				let val = resolveParam(state, idx, pIdx, key)
				if (
					key === 'file' &&
					typeof val === 'string' &&
					val &&
					!val.toLowerCase().endsWith('.mid')
				) 
				{
					val += '.mid'
				}
				if (val !== undefined && val !== null) 
				{
					combined[key] = val
				}
			})

			return combined
		})
		return sectionOut
	})

	return out
}

export function importSong(json: any) 
{
	if (!json) return json

	const state = { ...json }
	const sections = json.sections || json.timeline || json.parts || []
	state.sections = sections
	delete state.timeline
	delete state.parts_legacy
	delete state.instruments
	delete state.performers

	// Detect if it's already in the relational format

	if (
		json.parts &&
		Array.isArray(json.parts) &&
		json.parts[0] &&
		Array.isArray(json.parts[0].performances)
	) 
	{
		return state
	}

	// Reconstruct parts array from the first section (Flat format translation)

	const firstSection = state.sections[0]
	if (
		firstSection &&
		(firstSection.parts ||
			firstSection.instruments ||
			firstSection.performers ||
			firstSection.voices)
	) 
	{
		const templateParts =
			firstSection.parts ||
			firstSection.instruments ||
			firstSection.performers ||
			firstSection.voices

		state.parts = templateParts.map((tp: any, pIdx: number) => 
		{
			const p: any = {}

			// Extract base properties

			partBaseKeys.forEach(key => 
			{
				if (tp[key] !== undefined) p[key] = tp[key]
			})

			p.performances = []

			state.sections.forEach((sec: any) => 
			{
				const secPart =
					(sec.parts ||
						sec.instruments ||
						sec.performers ||
						sec.voices)?.[pIdx] || {}
				const perf: any = {}

				// Everything else goes into the performance specific object

				Object.keys(secPart).forEach(key => 
				{
					if (key !== 'name' && !partBaseKeys.includes(key)) 
					{
						perf[key] = secPart[key]
					}
				})

				p.performances.push(perf)
			})

			return p
		})

		// Clean up sections

		state.sections = state.sections.map((sec: any) => 
		{
			const s = { ...sec }
			delete s.parts
			delete s.instruments
			delete s.performers
			delete s.voices
			return s
		})
	}
	else if (!state.parts) 
	{
		state.parts = []
	}

	return state
}

export function loadSong(json: any) 
{
	songStore.set(importSong(json))
}

// --- Explicit Update Functions ---

export function updateSong(key: string, value: any) 
{
	songStore.update(state => 
	{
		if (!state) return state
		const newState = { ...state }
		if (
			value === undefined ||
			value === null ||
			(typeof value === 'string' && value.trim() === '')
		) 
		{
			delete newState[key]
		}
		else 
		{
			newState[key] = value
		}
		return newState
	})
}

export function updateSection(sectionIndex: number, key: string, value: any) 
{
	songStore.update(state => 
	{
		if (!state?.sections?.[sectionIndex]) return state
		const newState = { ...state, sections: [ ...state.sections ] }
		const section = { ...newState.sections[sectionIndex] }

		if (
			value === undefined ||
			value === null ||
			(typeof value === 'string' && value.trim() === '')
		) 
		{
			delete section[key]
		}
		else 
		{
			section[key] = value
		}
		newState.sections[sectionIndex] = section
		return newState
	})
}

export function updatePart(partIndex: number, key: string, value: any) 
{
	songStore.update(state => 
	{
		if (!state?.parts?.[partIndex]) return state
		const newState = { ...state, parts: [ ...state.parts ] }
		const part = { ...newState.parts[partIndex] }

		if (
			value === undefined ||
			value === null ||
			(typeof value === 'string' && value.trim() === '')
		) 
		{
			delete part[key]
		}
		else 
		{
			part[key] = value
		}
		newState.parts[partIndex] = part
		return newState
	})
}

export function updatePerformance(
	sectionIndex: number,
	partIndex: number,
	key: string,
	value: any
) 
{
	songStore.update(state => 
	{
		if (!state?.parts?.[partIndex]) return state
		const newState = { ...state, parts: [ ...state.parts ] }
		const part = {
			...newState.parts[partIndex],
			performances: [ ...(newState.parts[partIndex].performances || []) ]
		}

		if (!part.performances[sectionIndex]) 
		{
			part.performances[sectionIndex] = {}
		}
		const performance = { ...part.performances[sectionIndex] }

		if (
			value === undefined ||
			value === null ||
			(typeof value === 'string' && value.trim() === '')
		) 
		{
			delete performance[key]
		}
		else 
		{
			performance[key] = value
		}
		part.performances[sectionIndex] = performance
		newState.parts[partIndex] = part
		return newState
	})
}

/**
 * Resolves a parameter value by looking at the part level (local),
 * then the part level (default), then the section level (global structure), then the root (song).
 */

export function resolveParam(
	song: any,
	sectionIndex: number,
	partIndex: number,
	key: string
) 
{
	const section = song?.sections?.[sectionIndex]
	const part = song?.parts?.[partIndex]
	const performance = part?.performances?.[sectionIndex]

	function isValid(val: any) 
	{
		if (val === undefined || val === null) return false
		if (typeof val === 'string' && val.trim() === '') return false
		if (Array.isArray(val) && val.length === 0) return false
		return true
	}

	// All params should resolve from Performance -> Part -> Section -> Song

	if (performance && isValid(performance[key])) return performance[key]
	if (part && isValid(part[key])) return part[key]
	if (section && isValid(section[key])) return section[key]
	if (song && isValid(song[key])) return song[key]

	return undefined
}

export function getParamLevel(
	song: any,
	sectionIndex: number,
	partIndex: number,
	key: string
) 
{
	const section = song?.sections?.[sectionIndex]
	const part = song?.parts?.[partIndex]
	const performance = part?.performances?.[sectionIndex]

	function isValid(val: any) 
	{
		if (val === undefined || val === null) return false
		if (typeof val === 'string' && val.trim() === '') return false
		if (Array.isArray(val) && val.length === 0) return false
		return true
	}

	// All params should resolve from Performance -> Part -> Section -> Song

	if (performance && isValid(performance[key])) return 'performance'
	if (part && isValid(part[key])) return 'part'
	if (section && isValid(section[key])) return 'section'
	if (song && isValid(song[key])) return 'song'
	return 'none'
}

export function addSection(song: any, index?: number) 
{
	const newSection = {
		name: 'New Section',
		nMeasures: 4
	}

	const sections = song.sections ? [ ...song.sections ] : []
	const insertIdx = index !== undefined ? index : sections.length
	sections.splice(insertIdx, 0, newSection)

	// Keep all parts synced with the new section

	const parts = song.parts
		? song.parts.map((p: any) => 
		{
			const performances = p.performances ? [ ...p.performances ] : []
			performances.splice(insertIdx, 0, {}) // Insert empty performance
			return { ...p, performances }
		})
		: []

	return { ...song, sections, parts }
}

export function removeSection(song: any, index: number) 
{
	if (song.sections && song.sections.length > 1) 
	{
		const sections = [ ...song.sections ]
		sections.splice(index, 1)

		// Remove corresponding performance from all parts

		const parts = song.parts
			? song.parts.map((p: any) => 
			{
				const performances = p.performances
					? [ ...p.performances ]
					: []
				performances.splice(index, 1)
				return { ...p, performances }
			})
			: []

		return { ...song, sections, parts }
	}
	return song
}

export function addPart(song: any, index?: number) 
{
	const sectionsLen = song.sections ? song.sections.length : 1
	const newPart = {
		name: 'New Part',
		type: 'chordal',
		performances: Array(sectionsLen)
			.fill({})
			.map(() => ({})) // Fill with unique empty performance objects
	}

	const parts = song.parts ? [ ...song.parts ] : []
	if (index !== undefined) 
	{
		parts.splice(index, 0, newPart)
	}
	else 
	{
		parts.push(newPart)
	}
	return { ...song, parts }
}

export function removePart(song: any, index: number) 
{
	if (song.parts && song.parts.length > 1) 
	{
		const parts = [ ...song.parts ]
		parts.splice(index, 1)
		return { ...song, parts }
	}
	return song
}
