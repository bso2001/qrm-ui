const { importSong } = require('./test_store.cjs');

function addSection(song, index) {
  const newSection = { name: "New Section", nMeasures: 4 };
  const sections = song.sections ? [...song.sections] : [];
  let insertIdx = index !== undefined ? index : sections.length;
  sections.splice(insertIdx, 0, newSection);
  const parts = song.parts ? song.parts.map((p) => {
    const performances = p.performances ? [...p.performances] : [];
    performances.splice(insertIdx, 0, {}); 
    return { ...p, performances: [...performances] };
  }) : [];
  return { ...song, sections: [...sections], parts: [...parts] };
}

const s = importSong({ sections: [{ name: "A", parts: [] }] });
console.log("Before:", s.sections.length);

const s2 = addSection(s, 1);
console.log("After:", s2.sections.length);

// Are the arrays actually new references?
console.log("Same sections array?", s.sections === s2.sections);
console.log("Same parts array?", s.parts === s2.parts);
