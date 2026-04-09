const partBaseKeys = ['name', 'type', 'duration', 'range', 'velocity', 'key', 'meter', 'chords', 'nMeasures'];
const resolveKeys = ['duration', 'range', 'velocity', 'restPct', 'tonicPct', 'inversionPct', 'file', 'type', 'key', 'meter', 'chords', 'nMeasures'];

function importSong(json) {
  if (!json) return json;
  const sections = json.sections || json.timeline || json.parts || [];
  const state = { ...json };
  state.sections = sections;
  delete state.timeline;
  delete state.parts_legacy;
  delete state.instruments;
  delete state.performers;

  if (json.parts && Array.isArray(json.parts) && json.parts[0] && Array.isArray(json.parts[0].performances)) {
    state.parts = json.parts.map(p => {
        const cleanedPart = { ...p };
        delete cleanedPart.file; // Force clear buggy ghost properties
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

function resolveParam(song, sectionIndex, partIndex, key) {
  const section = song?.sections?.[sectionIndex];
  const part = song?.parts?.[partIndex];
  const performance = part?.performances?.[sectionIndex];

  function isValid(val) {
    if (val === undefined || val === null) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }

  if (performance && isValid(performance[key])) return performance[key];
  if (part && isValid(part[key])) return part[key];
  if (section && isValid(section[key])) return section[key];
  if (song && isValid(song[key])) return song[key];
  return undefined;
}

function exportSong(state) {
  const out = JSON.parse(JSON.stringify(state)); // Deep clone
  delete out.parts;
  out.sections = (state.sections || []).map((section, idx) => {
    const sectionOut = { ...section };
    sectionOut.key = section.key || state.key;
    sectionOut.meter = section.meter || state.meter;
    sectionOut.chords = section.chords || state.chords;
    sectionOut.parts = (state.parts || []).map((p, pIdx) => {
      const combined = { ...p };
      delete combined.performances;
      resolveKeys.forEach(key => {
        let val = resolveParam(state, idx, pIdx, key);
        if (key === 'file' && typeof val === 'string' && val && !val.toLowerCase().endsWith('.mid')) val += '.mid';
        
        function isValid(v) {
          if (v === undefined || v === null) return false;
          if (typeof v === 'string' && v.trim() === '') return false;
          if (Array.isArray(v) && v.length === 0) return false;
          return true;
        }

        if (isValid(val)) combined[key] = val;
      });
      return combined;
    });
    return sectionOut;
  });
  return out;
}

// Test A: Does nMeasures survive import->export for multiple sections?
const song = {
  "name": "BarTest",
  "sections": [
    { "name": "Intro", "nMeasures": 4, "parts": [{ "file": "f1.mid" }] },
    { "name": "Verse", "nMeasures": 8, "parts": [{ "file": "f2.mid" }] }
  ]
};

console.log("1. Importing Flat JSON...");
const state = importSong(song);
console.log("   Section 0 Bars:", state.sections[0].nMeasures);
console.log("   Section 1 Bars:", state.sections[1].nMeasures);

console.log("\n2. Modifying Bars & Files in Memory...");
state.sections[1].nMeasures = 16;
state.parts[0].performances[1].file = "verse-bass.mid";
console.log("   Section 1 Bars (Modified):", state.sections[1].nMeasures);
console.log("   Section 1 File (Modified):", resolveParam(state, 1, 0, 'file'));

console.log("\n3. Exporting back to Flat JSON...");
const exported = exportSong(state);
console.log("   Exported Section 0 Bars:", exported.sections[0].nMeasures);
console.log("   Exported Section 1 Bars:", exported.sections[1].nMeasures);
console.log("   Exported Section 0 File:", exported.sections[0].parts[0].file);
console.log("   Exported Section 1 File:", exported.sections[1].parts[0].file);

console.log("\n4. Simulating UI Refresh (Re-importing Exported JSON)...");
const reloaded = importSong(exported);
console.log("   Reloaded Section 0 Bars:", reloaded.sections[0].nMeasures);
console.log("   Reloaded Section 1 Bars:", reloaded.sections[1].nMeasures);
console.log("   Reloaded Section 0 File:", resolveParam(reloaded, 0, 0, 'file'));
console.log("   Reloaded Section 1 File:", resolveParam(reloaded, 1, 0, 'file'));

