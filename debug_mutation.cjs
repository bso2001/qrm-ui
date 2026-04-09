const { exportSong, importSong } = require('./test_store.cjs');

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

const state = importSong(aftaGlowFlat);
const stateJsonBefore = JSON.stringify(state);

const exported = exportSong(state);
const stateJsonAfter = JSON.stringify(state);

if (stateJsonBefore !== stateJsonAfter) {
    console.log("WARNING: exportSong mutated the original state!");
    console.log("Before:", stateJsonBefore);
    console.log("After:", stateJsonAfter);
} else {
    console.log("exportSong is safe, no mutations.");
}
