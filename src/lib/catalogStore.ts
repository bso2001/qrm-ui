import { writable } from 'svelte/store'

export interface CatalogEntry {
	id: string;
	name: string;
	lastModified: number;
}

const CATALOG_KEY = 'qrm_catalog'
const SONG_PREFIX = 'qrm_song_'

// Reactive store for the catalog index

export const catalogStore = writable<CatalogEntry[]>([])

// Initialize catalog from localStorage

export function initCatalog() 
{
	if (typeof localStorage === 'undefined') return
	const data = localStorage.getItem(CATALOG_KEY)
	if (data) 
	{
		try 
		{
			catalogStore.set(JSON.parse(data))
		}
		catch (e) 
		{
			console.error('Failed to parse QRM catalog', e)
			catalogStore.set([])
		}
	}
	else 
	{
		catalogStore.set([])
	}
}

// Generate a simple unique ID

function generateId() 
{
	return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
}

// Save a song to the catalog

export function saveToCatalog(songData: any, existingId?: string): string 
{
	const id = existingId || generateId()
	const name = songData.name || 'Untitled Song'
	const now = Date.now()

	// Save the actual song data

	localStorage.setItem(`${SONG_PREFIX}${id}`, JSON.stringify(songData))

	// Update the catalog index

	catalogStore.update(catalog => 
	{
		const existingIndex = catalog.findIndex(entry => entry.id === id)
		if (existingIndex >= 0) 
		{
			// Update existing

			const updated = [ ...catalog ]
			updated[existingIndex] = {
				...updated[existingIndex],
				name,
				lastModified: now
			}
			localStorage.setItem(CATALOG_KEY, JSON.stringify(updated))
			return updated
		}
		else 
		{
			// Add new

			const updated = [ { id, name, lastModified: now }, ...catalog ]
			localStorage.setItem(CATALOG_KEY, JSON.stringify(updated))
			return updated
		}
	})

	return id
}

// Load a specific song from the catalog

export function loadFromCatalog(id: string): any | null 
{
	const data = localStorage.getItem(`${SONG_PREFIX}${id}`)
	if (data) 
	{
		try 
		{
			return JSON.parse(data)
		}
		catch (e) 
		{
			console.error(`Failed to parse song data for id ${id}`, e)
			return null
		}
	}
	return null
}

// Delete a song from the catalog

export function deleteFromCatalog(id: string) 
{
	// Remove the song data

	localStorage.removeItem(`${SONG_PREFIX}${id}`)

	// Update the catalog index

	catalogStore.update(catalog => 
	{
		const updated = catalog.filter(entry => entry.id !== id)
		localStorage.setItem(CATALOG_KEY, JSON.stringify(updated))
		return updated
	})
}
