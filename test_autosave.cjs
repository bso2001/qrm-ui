const partBaseKeys = ['name', 'type', 'duration', 'range', 'velocity', 'key', 'meter', 'chords', 'nMeasures'];

function importSong(json) {
  if (!json) return json;
  const sections = json.sections || json.timeline || json.parts || [];
  const state = { ...json };
  state.sections = sections;
  delete state.timeline;
  delete state.parts_legacy;
  delete state.instruments;
  delete state.performers;

  // Simulate exactly what's in songStore.ts
  if (json.parts && Array.isArray(json.parts) && json.parts[0] && Array.isArray(json.parts[0].performances)) {
    state.parts = json.parts.map(p => {
        const cleanedPart = { ...p };
        delete cleanedPart.file; 
        return cleanedPart;
    });
    return state;
  }
  
  const firstSection = state.sections[0];
  if (firstSection && (firstSection.parts || firstSection.instruments || firstSection.performers || firstSection.voices)) {
    const templateParts = firstSection.parts || firstSection.instruments || firstSection.performers || firstSection.voices;
    state.parts = templateParts.map((tp, pIdx) => {
      const p = {};
      partBaseKeys.forEach(key => { if (tp[key] !== undefined) p[key] = tp[key]; });
      p.performances = [];
      state.sections.forEach((sec) => {
        const secPart = (sec.parts || sec.instruments || sec.performers || sec.voices)?.[pIdx] || {};
        const perf = {};
        Object.keys(secPart).forEach(key => { if (!partBaseKeys.includes(key)) perf[key] = secPart[key]; });
        p.performances.push(perf);
      });
      return p;
    });
    state.sections = state.sections.map((sec) => {
      const s = { ...sec };
      delete s.parts; delete s.instruments; delete s.performers; delete s.voices;
      return s;
    });
  } else if (!state.parts) {
      state.parts = [];
  }
  return state;
}

const aftaGlow = {
  "name": "AftaGlow", "tempo": 120,
  "sections": [
    { "name": "intro", "nMeasures": 2, "parts": [ { "name": "bass", "file": "intro-bass.mid" } ] },
    { "name": "outro", "nMeasures": 32, "parts": [ { "name": "bass", "file": "outro-bass.mid" } ] }
  ]
};

const state = importSong(aftaGlow);
console.log("1. Loaded AftaGlow (Initial state)");
console.log("   Section 1 file:", state.parts[0].performances[1].file);
console.log("   Section 1 bars:", state.sections[1].nMeasures);

console.log("\n2. Simulating User Edits (Changing Section 1 data)...");
state.parts[0].performances[1].file = "new-outro.mid";
state.sections[1].nMeasures = 64;

console.log("\n3. Simulating Autosave to localStorage...");
const autosaveString = JSON.stringify(state);

console.log("\n4. Simulating App Refresh (Loading from localStorage)...");
const restoredState = importSong(JSON.parse(autosaveString));
console.log("   Restored Section 1 file:", restoredState.parts[0].performances[1].file);
console.log("   Restored Section 1 bars:", restoredState.sections[1].nMeasures);

