import { writable } from 'svelte/store';

export const songStore = writable<any>(null);

export function loadSong(json: any) {
  songStore.set(json);
}

/**
 * Resolves a parameter value by looking at the current level (voice), 
 * then the parent level (part), then the root (song).
 */
export function resolveParam(song: any, partIndex: number, voiceIndex: number, key: string) {
  const part = song?.parts?.[partIndex];
  const voice = part?.voices?.[voiceIndex];

  if (voice && voice[key] !== undefined) return voice[key];
  if (part && part[key] !== undefined) return part[key];
  if (song && song[key] !== undefined) return song[key];

  return undefined;
}

/**
 * Returns 'voice', 'part', or 'song' depending on where the param is actually defined.
 */
export function getParamLevel(song: any, partIndex: number, voiceIndex: number, key: string) {
  const part = song?.parts?.[partIndex];
  const voice = part?.voices?.[voiceIndex];

  if (voice && voice[key] !== undefined) return 'voice';
  if (part && part[key] !== undefined) return 'part';
  if (song && song[key] !== undefined) return 'song';
  return 'none';
}
