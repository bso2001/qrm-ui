import { writable, get } from 'svelte/store'

export const songStore = writable(null)

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

export function exportSong(state) 
{
	if (!state) return state
	const out = { ...state }
	delete out.parts

	out.sections = (state.sections || []).map((section, idx) => 
	{
		const sectionOut = { ...section }

		// Ensure section-level musical params are resolved/included

		sectionOut.key = section.key || state.key
		sectionOut.meter = section.meter || state.meter
		sectionOut.chords = section.chords || state.chords

		sectionOut.parts = (state.parts || []).map((p, pIdx) => 
		{
			const combined = { name: p.name }

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

export function importSong(json) 
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

		state.parts = templateParts.map((tp, pIdx) => 
		{
			const p = {}

			// Extract base properties

			partBaseKeys.forEach(key => 
			{
				if (tp[key] !== undefined) p[key] = tp[key]
			})

			p.performances = []

			state.sections.forEach((sec) => 
			{
				const secPart =
					(sec.parts ||
						sec.instruments ||
						sec.performers ||
						sec.voices)?.[pIdx] || {}
				const perf = {}

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

		state.sections = state.sections.map((sec) => 
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

export function loadSong(json) 
{
	songStore.set(importSong(json))
}

// --- Explicit Update Functions ---

export function updateSong(key, value) 
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

export function updateSection(sectionIndex, key, value) 
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

export function updatePart(partIndex, key, value) 
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
	sectionIndex,
	partIndex,
	key,
	value
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
	song,
	sectionIndex,
	partIndex,
	key
) 
{
	if (!song) return undefined

	const part = song.parts?.[partIndex]
	const performance = part?.performances?.[sectionIndex]
	const section = song.sections?.[sectionIndex]

	// Check performance-level first
	if (performance && key in performance) 
	{
		return performance[key]
	}

	// Check part-level (all performances)
	if (part && key in part) 
	{
		return part[key]
	}

	// Check section-level
	if (section && key in section) 
	{
		return section[key]
	}

	// Check song-level (root)
	if (key in song) 
	{
		return song[key]
	}

	return undefined
}

export function getParamLevel(
	song,
	sectionIndex,
	partIndex,
	key
) 
{
	if (!song) return null

	const part = song.parts?.[partIndex]
	const performance = part?.performances?.[sectionIndex]
	const section = song.sections?.[sectionIndex]

	if (performance && key in performance) 
	{
		return 'performance'
	}
	if (part && key in part) 
	{
		return 'part'
	}
	if (section && key in section) 
	{
		return 'section'
	}
	if (key in song) 
	{
		return 'song'
	}

	return null
}

export function addSection() 
{
	songStore.update(state => 
	{
		if (!state) return state
		const newState = { ...state, sections: [ ...state.sections ] }
		newState.sections.push({})
		return newState
	})
}

export function removeSection(index) 
{
	songStore.update(state => 
	{
		if (!state?.sections) return state
		const newState = { ...state, sections: state.sections.filter((_, i) => i !== index) }
		return newState
	})
}

export function addPart() 
{
	songStore.update(state => 
	{
		if (!state) return state
		const newState = { ...state, parts: [ ...state.parts ] }
		newState.parts.push({ performances: [] })
		return newState
	})
}

export function removePart(index) 
{
	songStore.update(state => 
	{
		if (!state?.parts) return state
		const newState = { ...state, parts: state.parts.filter((_, i) => i !== index) }
		return newState
	})
}
