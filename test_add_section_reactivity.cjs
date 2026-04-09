const { writable } = require('svelte/store');

const songStore = writable({
  name: "Test",
  sections: [ { name: "intro", nMeasures: 4 } ],
  parts: [ { name: "bass", performances: [ { file: "intro.mid" } ] } ]
});

function addSection(song, index) {
  const newSection = { name: "New Section", nMeasures: 4 };
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

let callCount = 0;
songStore.subscribe(s => {
  callCount++;
  console.log(`Subscribe fired. Sections: ${s.sections.length}`);
});

console.log("Adding section...");
// Simulate App.svelte: songStore.update(s => addSection(s, idx));
songStore.update(s => addSection(s, 1));
console.log(`Total subscribe calls: ${callCount}`);
