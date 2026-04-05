import { writable } from 'svelte/store';

export const songStore = writable<any>(null);

const instrumentBaseKeys = ['name', 'type', 'duration', 'range', 'velocity', 'key', 'meter', 'chords', 'nMeasures'];
const resolveKeys = ['duration', 'range', 'velocity', 'restPct', 'tonicPct', 'inversionPct', 'file', 'type', 'key', 'meter', 'chords', 'nMeasures'];

export function exportSong(state: any) {
  const out = { ...state };
  delete out.instruments;

  out.sections = (state.sections || []).map((section: any, idx: number) => {
    const sectionOut = { ...section };
    
    // Ensure section-level musical params are resolved/included
    sectionOut.key = section.key || state.key;
    sectionOut.meter = section.meter || state.meter;
    sectionOut.chords = section.chords || state.chords;

    sectionOut.instruments = (state.instruments || []).map((p: any, pIdx: number) => {
      const combined = { ...p };
      delete combined.performances;
      
      // Resolve every instrument parameter so the backend gets a complete object
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
  
  // Detect if it's already in the relational format (has root instruments array)
  if ((json.instruments || json.performers) && !sections[0]?.instruments && !sections[0]?.performers && !sections[0]?.voices) {
    // Already relational, just ensure keys are modern
    const state = { ...json };
    state.sections = sections;
    state.instruments = json.instruments || json.performers;
    delete state.timeline;
    delete state.parts;
    delete state.performers;
    return state;
  }

  const state = { ...json };
  state.sections = sections;
  delete state.timeline;
  delete state.parts;
  
  // Reconstruct instruments array from the first section
  const firstSection = state.sections[0];
  if (firstSection && (firstSection.instruments || firstSection.performers || firstSection.voices)) {
    const templateInstruments = firstSection.instruments || firstSection.performers || firstSection.voices;
    
    state.instruments = templateInstruments.map((tp: any, pIdx: number) => {
      const inst: any = {};
      
      // Extract base properties from the first section's instance
      instrumentBaseKeys.forEach(key => {
        if (tp[key] !== undefined) inst[key] = tp[key];
      });

      inst.performances = [];
      
      state.sections.forEach((sec: any) => {
        const secInst = (sec.instruments || sec.performers || sec.voices)?.[pIdx] || {};
        const perf: any = {};
        
        // Everything that isn't a base property goes into the performance specific object
        Object.keys(secInst).forEach(key => {
          if (!instrumentBaseKeys.includes(key)) {
            perf[key] = secInst[key];
          }
        });
        
        inst.performances.push(perf);
      });
      
      return inst;
    });

    // Clean up sections
    state.sections = state.sections.map((sec: any) => {
      const s = { ...sec };
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
 * Resolves a parameter value by looking at the instrument level (local), 
 * then the instrument level (default), then the section level (global structure), then the root (song).
 */
export function resolveParam(song: any, sectionIndex: number, instrumentIndex: number, key: string) {
  const section = song?.sections?.[sectionIndex];
  const instrument = song?.instruments?.[instrumentIndex];
  const performance = instrument?.performances?.[sectionIndex]; // performances map 1:1 with sections

  // All params should resolve from Performance -> Instrument -> Section -> Song
  if (performance && performance[key] !== undefined) return performance[key];
  if (instrument && instrument[key] !== undefined) return instrument[key];
  if (section && section[key] !== undefined) return section[key];
  if (song && song[key] !== undefined) return song[key];

  return undefined;
}

/**
 * Returns 'performance', 'instrument', 'section', or 'song' depending on where the param is actually defined.
 */
export function getParamLevel(song: any, sectionIndex: number, instrumentIndex: number, key: string) {
  const section = song?.sections?.[sectionIndex];
  const instrument = song?.instruments?.[instrumentIndex];
  const performance = instrument?.performances?.[sectionIndex];

  // All params should resolve from Performance -> Instrument -> Section -> Song
  if (performance && performance[key] !== undefined) return 'performance';
  if (instrument && instrument[key] !== undefined) return 'instrument';
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
  
  // Keep all instruments synced with the new section
  const instruments = song.instruments ? song.instruments.map((p: any) => {
    const performances = p.performances ? [...p.performances] : [];
    performances.splice(insertIdx, 0, {}); // Insert empty performance
    return { ...p, performances };
  }) : [];

  return { ...song, sections, instruments };
}

export function removeSection(song: any, index: number) {
  if (song.sections && song.sections.length > 1) {
    const sections = [...song.sections];
    sections.splice(index, 1);
    
    // Remove corresponding performance from all instruments
    const instruments = song.instruments ? song.instruments.map((p: any) => {
      const performances = p.performances ? [...p.performances] : [];
      performances.splice(index, 1);
      return { ...p, performances };
    }) : [];

    return { ...song, sections, instruments };
  }
  return song;
}

export function addInstrument(song: any, index?: number) {
  const sectionsLen = song.sections ? song.sections.length : 1;
  const newInstrument = {
    name: "New Instrument",
    type: "chordal",
    performances: Array(sectionsLen).fill({}).map(() => ({})) // Fill with unique empty performance objects
  };
  
  const instruments = song.instruments ? [...song.instruments] : [];
  if (index !== undefined) {
    instruments.splice(index, 0, newInstrument);
  } else {
    instruments.push(newInstrument);
  }
  return { ...song, instruments };
}

export function removeInstrument(song: any, index: number) {
  if (song.instruments && song.instruments.length > 1) {
    const instruments = [...song.instruments];
    instruments.splice(index, 1);
    return { ...song, instruments };
  }
  return song;
}
