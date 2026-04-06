import { writable } from 'svelte/store';

export const songStore = writable<any>(null);

const partBaseKeys = ['name', 'type', 'duration', 'range', 'velocity', 'key', 'meter', 'chords', 'nMeasures'];
const resolveKeys = ['duration', 'range', 'velocity', 'restPct', 'tonicPct', 'inversionPct', 'file', 'type', 'key', 'meter', 'chords', 'nMeasures'];

export function exportSong(state: any) {
  const out = { ...state };
  delete out.parts;

  out.sections = (state.sections || []).map((section: any, idx: number) => {
    const sectionOut = { ...section };
    
    // Ensure section-level musical params are resolved/included
    sectionOut.key = section.key || state.key;
    sectionOut.meter = section.meter || state.meter;
    sectionOut.chords = section.chords || state.chords;

    sectionOut.parts = (state.parts || []).map((p: any, pIdx: number) => {
      const combined = { ...p };
      delete combined.performances;
      
      // Resolve every part parameter so the backend gets a complete object
      resolveKeys.forEach(key => {
        const val = resolveParam(state, idx, pIdx, key);
        if (val !== undefined) combined[key] = val;
      });
      
      return combined;
    });
    return sectionOut;
  });

  return out;
}

export function importSong(json: any) {
  if (!json) return json;
  
  // Normalize legacy section keys
  const sections = json.sections || json.timeline || json.parts || [];
  
  // Detect if it's already in the relational format (has root parts array)
  if ((json.parts || json.instruments || json.performers) && !sections[0]?.parts && !sections[0]?.instruments && !sections[0]?.performers && !sections[0]?.voices) {
    // Already relational, just ensure keys are modern
    const state = { ...json };
    state.sections = sections;
    state.parts = json.parts || json.instruments || json.performers;
    delete state.timeline;
    delete state.parts_legacy; // just in case
    delete state.instruments;
    delete state.performers;
    return state;
  }

  const state = { ...json };
  state.sections = sections;
  delete state.timeline;
  
  // Reconstruct parts array from the first section
  const firstSection = state.sections[0];
  if (firstSection && (firstSection.parts || firstSection.instruments || firstSection.performers || firstSection.voices)) {
    const templateParts = firstSection.parts || firstSection.instruments || firstSection.performers || firstSection.voices;
    
    state.parts = templateParts.map((tp: any, pIdx: number) => {
      const p: any = {};
      
      // Extract base properties from the first section's instance
      partBaseKeys.forEach(key => {
        if (tp[key] !== undefined) p[key] = tp[key];
      });

      p.performances = [];
      
      state.sections.forEach((sec: any) => {
        const secPart = (sec.parts || sec.instruments || sec.performers || sec.voices)?.[pIdx] || {};
        const perf: any = {};
        
        // Everything that isn't a base property goes into the performance specific object
        Object.keys(secPart).forEach(key => {
          if (!partBaseKeys.includes(key)) {
            perf[key] = secPart[key];
          }
        });
        
        p.performances.push(perf);
      });
      
      return p;
    });

    // Clean up sections
    state.sections = state.sections.map((sec: any) => {
      const s = { ...sec };
      delete s.parts;
      delete s.instruments;
      delete s.performers;
      delete s.voices;
      return s;
    });
  }

  return state;
}

export function loadSong(json: any) {
  songStore.set(importSong(json));
}

/**
 * Resolves a parameter value by looking at the part level (local), 
 * then the part level (default), then the section level (global structure), then the root (song).
 */
export function resolveParam(song: any, sectionIndex: number, partIndex: number, key: string) {
  const section = song?.sections?.[sectionIndex];
  const part = song?.parts?.[partIndex];
  const performance = part?.performances?.[sectionIndex]; // performances map 1:1 with sections

  // All params should resolve from Performance -> Part -> Section -> Song
  if (performance && performance[key] !== undefined) return performance[key];
  if (part && part[key] !== undefined) return part[key];
  if (section && section[key] !== undefined) return section[key];
  if (song && song[key] !== undefined) return song[key];

  return undefined;
}

/**
 * Returns 'performance', 'part', 'section', or 'song' depending on where the param is actually defined.
 */
export function getParamLevel(song: any, sectionIndex: number, partIndex: number, key: string) {
  const section = song?.sections?.[sectionIndex];
  const part = song?.parts?.[partIndex];
  const performance = part?.performances?.[sectionIndex];

  // All params should resolve from Performance -> Part -> Section -> Song
  if (performance && performance[key] !== undefined) return 'performance';
  if (part && part[key] !== undefined) return 'part';
  if (section && section[key] !== undefined) return 'section';
  if (song && song[key] !== undefined) return 'song';
  return 'none';
}

export function addSection(song: any, index?: number) {
  const newSection = {
    name: "New Section",
    nMeasures: 4
  };
  
  const sections = song.sections ? [...song.sections] : [];
  let insertIdx = index !== undefined ? index : sections.length;
  sections.splice(insertIdx, 0, newSection);
  
  // Keep all parts synced with the new section
  const parts = song.parts ? song.parts.map((p: any) => {
    const performances = p.performances ? [...p.performances] : [];
    performances.splice(insertIdx, 0, {}); // Insert empty performance
    return { ...p, performances };
  }) : [];

  return { ...song, sections, parts };
}

export function removeSection(song: any, index: number) {
  if (song.sections && song.sections.length > 1) {
    const sections = [...song.sections];
    sections.splice(index, 1);
    
    // Remove corresponding performance from all parts
    const parts = song.parts ? song.parts.map((p: any) => {
      const performances = p.performances ? [...p.performances] : [];
      performances.splice(index, 1);
      return { ...p, performances };
    }) : [];

    return { ...song, sections, parts };
  }
  return song;
}

export function addPart(song: any, index?: number) {
  const sectionsLen = song.sections ? song.sections.length : 1;
  const newPart = {
    name: "New Part",
    type: "chordal",
    performances: Array(sectionsLen).fill({}).map(() => ({})) // Fill with unique empty performance objects
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
    parts.splice(index, 1);
    return { ...song, parts };
  }
  return song;
}
