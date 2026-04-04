import { writable } from 'svelte/store';

export const songStore = writable<any>(null);

export function loadSong(json: any) {
  songStore.set(json);
}

/**
 * Resolves a parameter value by looking at the performance level (local), 
 * then the player level (default), then the timeline section level (global structure), then the root (song).
 */
export function resolveParam(song: any, timelineIndex: number, playerIndex: number, key: string) {
  const section = song?.timeline?.[timelineIndex];
  const player = song?.players?.[playerIndex];
  const performance = player?.performances?.[timelineIndex]; // performances map 1:1 with timeline sections

  // Musical structure params should resolve from Timeline before Player
  if (['key', 'meter', 'chords', 'nMeasures'].includes(key)) {
    if (performance && performance[key] !== undefined) return performance[key];
    if (section && section[key] !== undefined) return section[key];
    if (player && player[key] !== undefined) return player[key];
    if (song && song[key] !== undefined) return song[key];
    return undefined;
  }

  // Player/Performance params should resolve from Player before Timeline
  if (performance && performance[key] !== undefined) return performance[key];
  if (player && player[key] !== undefined) return player[key];
  if (section && section[key] !== undefined) return section[key];
  if (song && song[key] !== undefined) return song[key];

  return undefined;
}

/**
 * Returns 'performance', 'player', 'timeline', or 'song' depending on where the param is actually defined.
 */
export function getParamLevel(song: any, timelineIndex: number, playerIndex: number, key: string) {
  const section = song?.timeline?.[timelineIndex];
  const player = song?.players?.[playerIndex];
  const performance = player?.performances?.[timelineIndex];

  if (['key', 'meter', 'chords', 'nMeasures'].includes(key)) {
    if (performance && performance[key] !== undefined) return 'performance';
    if (section && section[key] !== undefined) return 'timeline';
    if (player && player[key] !== undefined) return 'player';
    if (song && song[key] !== undefined) return 'song';
    return 'none';
  }

  if (performance && performance[key] !== undefined) return 'performance';
  if (player && player[key] !== undefined) return 'player';
  if (section && section[key] !== undefined) return 'timeline';
  if (song && song[key] !== undefined) return 'song';
  return 'none';
}

export function addTimelineSection(song: any, index?: number) {
  const newSection = {
    name: "New Section",
    nMeasures: 4
  };
  
  const timeline = song.timeline ? [...song.timeline] : [];
  let insertIdx = index !== undefined ? index : timeline.length;
  timeline.splice(insertIdx, 0, newSection);
  
  // Keep all players synced with the new timeline section
  const players = song.players ? song.players.map((p: any) => {
    const performances = p.performances ? [...p.performances] : [];
    performances.splice(insertIdx, 0, {}); // Insert empty performance
    return { ...p, performances };
  }) : [];

  return { ...song, timeline, players };
}

export function removeTimelineSection(song: any, index: number) {
  if (song.timeline && song.timeline.length > 1) {
    const timeline = [...song.timeline];
    timeline.splice(index, 1);
    
    // Remove corresponding performance from all players
    const players = song.players ? song.players.map((p: any) => {
      const performances = p.performances ? [...p.performances] : [];
      performances.splice(index, 1);
      return { ...p, performances };
    }) : [];

    return { ...song, timeline, players };
  }
  return song;
}

export function addPlayer(song: any, index?: number) {
  const timelineLen = song.timeline ? song.timeline.length : 1;
  const newPlayer = {
    name: "New Player",
    type: "chordal",
    performances: Array(timelineLen).fill({}).map(() => ({})) // Fill with unique empty performance objects
  };
  
  const players = song.players ? [...song.players] : [];
  if (index !== undefined) {
    players.splice(index, 0, newPlayer);
  } else {
    players.push(newPlayer);
  }
  return { ...song, players };
}

export function removePlayer(song: any, index: number) {
  if (song.players && song.players.length > 1) {
    const players = [...song.players];
    players.splice(index, 1);
    return { ...song, players };
  }
  return song;
}


