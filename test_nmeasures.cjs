const fs = require('fs');

const { importSong, exportSong } = require('./test_store.cjs');

// Test A: Does nMeasures survive import->export for multiple sections?
const song = {
  "name": "BarTest",
  "sections": [
    { "name": "Intro", "nMeasures": 4 },
    { "name": "Verse", "nMeasures": 8 }
  ]
};

console.log("1. Importing Flat JSON...");
const state = importSong(song);
console.log("   Section 0 Bars:", state.sections[0].nMeasures);
console.log("   Section 1 Bars:", state.sections[1].nMeasures);

console.log("\n2. Modifying Bars in Memory...");
state.sections[1].nMeasures = 16;
console.log("   Section 1 Bars (Modified):", state.sections[1].nMeasures);

console.log("\n3. Exporting back to Flat JSON...");
const exported = exportSong(state);
console.log("   Exported Section 0 Bars:", exported.sections[0].nMeasures);
console.log("   Exported Section 1 Bars:", exported.sections[1].nMeasures);

console.log("\n4. Simulating UI Refresh (Re-importing Exported JSON)...");
const reloaded = importSong(exported);
console.log("   Reloaded Section 0 Bars:", reloaded.sections[0].nMeasures);
console.log("   Reloaded Section 1 Bars:", reloaded.sections[1].nMeasures);
