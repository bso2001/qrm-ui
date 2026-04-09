const fs = require('fs');

// 1. Mock the constants and logic from songStore.ts
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
    state.parts = json.parts;
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

  // BUG SUSPICION: What if the value is an empty array [] or empty string ""? 
  // It won't be undefined, so it shadows the parent!
  if (performance && performance[key] !== undefined) return performance[key];
  if (part && part[key] !== undefined) return part[key];
  if (section && section[key] !== undefined) return section[key];
  if (song && song[key] !== undefined) return song[key];
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
        // BUG SUSPICION: If val is empty string or array, it gets exported and wipes out the engine's default fallbacks
        if (val !== undefined) combined[key] = val;
      });
      return combined;
    });
    return sectionOut;
  });
  return out;
}

// --- MOCK AFTAGLOW JSON ---
const aftaGlow = {
  "name": "AftaGlow", "outputDir": "ag", "tempo": 120,
  "key": { "tonic": "D", "mode": "major" },
  "sections": [
    {
      "name": "intro", "nMeasures": 2, "key": { "tonic": "G", "mode": "major" },
      "chords": ["G", "Gmaj", "C", "A"],
      "parts": [
        { "name": "bass", "type": "chordal", "file": "intro-bass.mid", "restPct": 0 },
        { "name": "chords", "type": "chords", "file": "intro-chords.mid", "restPct": 0 }
      ]
    },
    {
      "name": "outro", "nMeasures": 32, "key": { "tonic": "D", "mode": "major" },
      "chords": ["D", "Dmaj7", "G", "Gm", "D", "D", "G", "A"],
      "parts": [
        { "name": "bass", "type": "chordal", "file": "outro-bass.mid", "restPct": 0, "tonicPct": 0.42 },
        { "name": "chords", "type": "chords", "file": "outro-chords.mid", "restPct": 0 }
      ]
    }
  ]
};

console.log("1. Importing AftaGlow (Flat -> Relational)...");
const state = importSong(aftaGlow);
console.log("   Bass Part Performance 0 File:", state.parts[0].performances[0].file);
console.log("   Bass Part Performance 1 File:", state.parts[0].performances[1].file);

console.log("\n2. Testing Section Chord cascading to Parts...");
// Does the bass part in section 0 correctly resolve the section chords?
const resolvedChords = resolveParam(state, 0, 0, 'chords');
console.log("   Resolved Chords for Bass in Intro:", resolvedChords);

console.log("\n3. Exporting back to flat JSON...");
const exported = exportSong(state);
console.log("   Exported Intro Bass File:", exported.sections[0].parts[0].file);
console.log("   Exported Outro Bass File:", exported.sections[1].parts[0].file);
console.log("   Exported Intro Bass Chords:", exported.sections[0].parts[0].chords);

