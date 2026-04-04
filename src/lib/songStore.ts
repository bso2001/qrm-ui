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

export function addPart(song: any, index?: number) {
  const newPart = {
    name: "new part",
    voices: [
      {
        type: "chordal",
        restPct: 0.5
      }
    ]
  };
  const parts = song.parts ? [...song.parts] : [];
  if (index !== undefined) {
    parts.splice(index, 0, newPart);
  } else {
    parts.push(newPart);
  }
  return { ...song, parts };
}

export function removePart(song: any, index: number) {
  if (song.parts && song.parts.length > 1) {
    const parts = [...song.parts];
    parts.splice(index, 1); console.log("spliced!", parts.length);
    return { ...song, parts };
  }
  return song;
}

export function addVoice(song: any, partIndex: number, index?: number) {
  const parts = [...(song.parts || [])];
  const part = { ...parts[partIndex] };
  if (!part) return song;
  
  const newVoice = {
    type: "chordal",
    restPct: 0.5
  };
  
  const voices = part.voices ? [...part.voices] : [];
  if (index !== undefined) {
    voices.splice(index, 0, newVoice);
  } else {
    voices.push(newVoice);
  }
  part.voices = voices;
  parts[partIndex] = part;
  return { ...song, parts };
}

export function removeVoice(song: any, partIndex: number, voiceIndex: number) {
  const parts = [...(song.parts || [])];
  const part = { ...parts[partIndex] };
  if (part && part.voices && part.voices.length > 1) {
    const voices = [...part.voices];
    voices.splice(voiceIndex, 1);
    part.voices = voices;
    parts[partIndex] = part;
    return { ...song, parts };
  }
  return song;
}

