import { writable } from 'svelte/store';

export const songStore = writable<any>(null);

export function loadSong(json: any) {
  songStore.set(json);
}

/**
 * Resolves a parameter value by looking at the clip level, 
 * then the track level, then the arranger section level, then the root (song).
 */
export function resolveParam(song: any, arrangerIndex: number, trackIndex: number, key: string) {
  const arrangerSection = song?.arranger?.[arrangerIndex];
  const track = song?.tracks?.[trackIndex];
  const clip = track?.clips?.[arrangerIndex]; // clips map 1:1 with arranger sections

  // Musical structure params should resolve from Arranger before Track
  if (['key', 'meter', 'chords', 'nMeasures'].includes(key)) {
    if (clip && clip[key] !== undefined) return clip[key];
    if (arrangerSection && arrangerSection[key] !== undefined) return arrangerSection[key];
    if (track && track[key] !== undefined) return track[key];
    if (song && song[key] !== undefined) return song[key];
    return undefined;
  }

  // Instrument/Performance params should resolve from Track before Arranger
  if (clip && clip[key] !== undefined) return clip[key];
  if (track && track[key] !== undefined) return track[key];
  if (arrangerSection && arrangerSection[key] !== undefined) return arrangerSection[key];
  if (song && song[key] !== undefined) return song[key];

  return undefined;
}

/**
 * Returns 'clip', 'track', 'arranger', or 'song' depending on where the param is actually defined.
 */
export function getParamLevel(song: any, arrangerIndex: number, trackIndex: number, key: string) {
  const arrangerSection = song?.arranger?.[arrangerIndex];
  const track = song?.tracks?.[trackIndex];
  const clip = track?.clips?.[arrangerIndex];

  if (['key', 'meter', 'chords', 'nMeasures'].includes(key)) {
    if (clip && clip[key] !== undefined) return 'clip';
    if (arrangerSection && arrangerSection[key] !== undefined) return 'arranger';
    if (track && track[key] !== undefined) return 'track';
    if (song && song[key] !== undefined) return 'song';
    return 'none';
  }

  if (clip && clip[key] !== undefined) return 'clip';
  if (track && track[key] !== undefined) return 'track';
  if (arrangerSection && arrangerSection[key] !== undefined) return 'arranger';
  if (song && song[key] !== undefined) return 'song';
  return 'none';
}

export function addArrangerSection(song: any, index?: number) {
  const newSection = {
    name: "New Section",
    nMeasures: 4
  };
  
  const arranger = song.arranger ? [...song.arranger] : [];
  let insertIdx = index !== undefined ? index : arranger.length;
  arranger.splice(insertIdx, 0, newSection);
  
  // Keep all tracks synced with the new timeline section
  const tracks = song.tracks ? song.tracks.map((t: any) => {
    const clips = t.clips ? [...t.clips] : [];
    clips.splice(insertIdx, 0, {}); // Insert empty clip
    return { ...t, clips };
  }) : [];

  return { ...song, arranger, tracks };
}

export function removeArrangerSection(song: any, index: number) {
  if (song.arranger && song.arranger.length > 1) {
    const arranger = [...song.arranger];
    arranger.splice(index, 1);
    
    // Remove corresponding clip from all tracks
    const tracks = song.tracks ? song.tracks.map((t: any) => {
      const clips = t.clips ? [...t.clips] : [];
      clips.splice(index, 1);
      return { ...t, clips };
    }) : [];

    return { ...song, arranger, tracks };
  }
  return song;
}

export function addTrack(song: any, index?: number) {
  const arrangerLen = song.arranger ? song.arranger.length : 1;
  const newTrack = {
    name: "New Track",
    type: "chordal",
    clips: Array(arrangerLen).fill({}) // Fill with empty clips
  };
  
  const tracks = song.tracks ? [...song.tracks] : [];
  if (index !== undefined) {
    tracks.splice(index, 0, newTrack);
  } else {
    tracks.push(newTrack);
  }
  return { ...song, tracks };
}

export function removeTrack(song: any, index: number) {
  if (song.tracks && song.tracks.length > 1) {
    const tracks = [...song.tracks];
    tracks.splice(index, 1);
    return { ...song, tracks };
  }
  return song;
}

