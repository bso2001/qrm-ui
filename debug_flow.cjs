const fs = require('fs');

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
      partBaseKeys.forEach(key => {
        if (tp[key] !== undefined) p[key] = tp[key];
      });

      p.performances = [];
      
      state.sections.forEach((sec) => {
        const secPart = (sec.parts || sec.instruments || sec.performers || sec.voices)?.[pIdx] || {};
        const perf = {};
        
        Object.keys(secPart).forEach(key => {
          if (!partBaseKeys.includes(key)) {
            perf[key] = secPart[key];
          }
        });
        
        p.performances.push(perf);
      });
      
      return p;
    });

    state.sections = state.sections.map((sec) => {
      const s = { ...sec };
      delete s.parts;
      delete s.instruments;
      delete s.performers;
      delete s.voices;
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
  const out = { ...state };
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
        if (key === 'file' && typeof val === 'string' && val && !val.toLowerCase().endsWith('.mid')) {
          val += '.mid';
        }
        
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

const aftaGlowFlat = {
  "name": "AftaGlow", "tempo": 120,
  "sections": [
    {
      "name": "intro",
      "parts": [
        { "name": "bass", "file": "intro-bass.mid" }
      ]
    },
    {
      "name": "outro",
      "parts": [
        { "name": "bass", "file": "outro-bass.mid" }
      ]
    }
  ]
};

console.log("--- 1. Importing Flat AftaGlow ---");
const state1 = importSong(aftaGlowFlat);
console.log("Section 0 File:", resolveParam(state1, 0, 0, 'file'));
console.log("Section 1 File:", resolveParam(state1, 1, 0, 'file'));

console.log("\n--- 2. Exporting to Flat ---");
const exported = exportSong(state1);
console.log("Exported Section 0 File:", exported.sections[0].parts[0].file);
console.log("Exported Section 1 File:", exported.sections[1].parts[0].file);

console.log("\n--- 3. Simulating Local Storage Save & Reload ---");
const localJson = JSON.stringify(state1);
const state2 = importSong(JSON.parse(localJson));
console.log("Reloaded Section 0 File:", resolveParam(state2, 0, 0, 'file'));
console.log("Reloaded Section 1 File:", resolveParam(state2, 1, 0, 'file'));

console.log("\n--- 4. Changing a file via UI ---");
// Simulate UI: part.performances[sectionIndex].file = e.detail
if (!state2.parts[0].performances[1]) state2.parts[0].performances[1] = {};
state2.parts[0].performances[1].file = "new-outro-bass.mid";
console.log("Modified Section 1 File:", resolveParam(state2, 1, 0, 'file'));

console.log("\n--- 5. Exporting after modification ---");
const exported2 = exportSong(state2);
console.log("Exported Modified Section 1 File:", exported2.sections[1].parts[0].file);

