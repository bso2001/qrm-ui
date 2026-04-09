const partBaseKeys = ['name', 'type', 'duration', 'range', 'velocity', 'key', 'meter', 'chords', 'nMeasures'];
const resolveKeys = ['duration', 'range', 'velocity', 'restPct', 'tonicPct', 'inversionPct', 'file', 'type', 'key', 'meter', 'chords', 'nMeasures'];

function resolveParam(song, sectionIndex, partIndex, key) {
  const section = song?.sections?.[sectionIndex];
  const part = song?.parts?.[partIndex];
  const performance = part?.performances?.[sectionIndex];

  if (performance && performance[key] !== undefined) return performance[key];
  if (part && part[key] !== undefined) return part[key];
  if (section && section[key] !== undefined) return section[key];
  if (song && song[key] !== undefined) return song[key];
  return undefined;
}

const state = {
  sections: [ { chords: ["G", "C"] } ],
  parts: [ { performances: [ { chords: [] } ] } ]
};

console.log("If UI clears the chord input, it writes an empty array [] to performance.chords.");
console.log("resolveParam sees [] is !== undefined, and returns:", resolveParam(state, 0, 0, 'chords'));
console.log("Is it an empty array?", resolveParam(state, 0, 0, 'chords').length === 0);
