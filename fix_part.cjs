const fs = require('fs');
const path = require('path');

const qrmDir = path.join(__dirname, '../qrm');
let partStr = fs.readFileSync(path.join(qrmDir, 'part.js'), 'utf8');

// I am modifying the loop so that the lastTick computation properly reflects
// the cumulative beats being processed across measures and sections.
partStr = partStr.replace(/part\.lastTick = part\.thisTick \+ \(song\.meter\.numerator \* song\.ppqn\)/g, 
'part.lastTick = part.thisTick + (song.meter.numerator * song.ppqn)');

// Wait, the logic `part.lastTick = part.thisTick + (song.meter.numerator * song.ppqn)` is exactly the same.
// The problem is actually that in the original part.js, `common.part.thisTick` was maintained globally 
// *across* section calls! 
// When I refactored to make it stateless, I initialized `thisTick: 0` inside `generate()`.
// This means every section starts at tick 0 and overwrites the previous section in the MIDI file!
// That's why the files are small and garbled.

fs.writeFileSync(path.join(qrmDir, 'part.js'), partStr);
console.log("part.js logic analyzed.");
