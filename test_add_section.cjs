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

function addSection(song, index) {
  const newSection = {
    name: "New Section",
    nMeasures: 4
  };
  
  const sections = song.sections ? [...song.sections] : [];
  let insertIdx = index !== undefined ? index : sections.length;
  sections.splice(insertIdx, 0, newSection);
  
  const parts = song.parts ? song.parts.map((p) => {
    const performances = p.performances ? [...p.performances] : [];
    performances.splice(insertIdx, 0, {}); 
    return { ...p, performances };
  }) : [];

  return { ...song, sections, parts };
}

const song = {
  "name": "BarTest",
  "sections": [
    { "name": "Intro", "nMeasures": 4, "parts": [{ "file": "f1.mid" }] }
  ]
};

const state = importSong(song);
console.log("Before: ", JSON.stringify(state, null, 2));

const newState = addSection(state, 1);
console.log("\nAfter adding section: ", JSON.stringify(newState, null, 2));

const state3 = importSong(JSON.parse(JSON.stringify(newState)));
console.log("\nAfter local storage cycle: ", JSON.stringify(state3, null, 2));

