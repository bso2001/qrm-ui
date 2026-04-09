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
  return state;
}

const autoSaveJson = {
    name: "AftaGlow",
    sections: [ { name: "intro", nMeasures: 4 } ],
    parts: [ { name: "bass", file: "GLOBAL-FILE", performances: [ { file: "intro-bass.mid" } ] } ]
};

console.log("Local Storage Object:");
console.log(JSON.stringify(autoSaveJson, null, 2));

const imported = importSong(autoSaveJson);
console.log("\nImported Object:");
console.log(JSON.stringify(imported, null, 2));

