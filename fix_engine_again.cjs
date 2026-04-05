const fs = require('fs');
const path = require('path');

const partPath = path.join(__dirname, '../qrm/part.js');
let partStr = fs.readFileSync(partPath, 'utf8');

// Ensure part.js returns just the raw absolute events array like I intended in the final step
partStr = partStr.replace(/return \{ events: evts, endTick: part\.thisTick \}/g, 'return part.events');

// Let's make absolutely sure all the delta calculation garbage is stripped out of part.js 
// so it is ONLY generating the raw `part.events` and returning it.
partStr = partStr.replace(/part\.events\.sort\([\s\S]*?return part\.events/g, 
`part.events.sort( (a, b) => a.time - b.time || (a.type === "note_off" ? -1 : 1) )
        return part.events`);
fs.writeFileSync(partPath, partStr);

const mainPath = path.join(__dirname, '../qrm/main.js');
let mainStr = fs.readFileSync(mainPath, 'utf8');

// Update main.js to handle the raw array properly
mainStr = mainStr.replace(/const pEvents = part\.generate\( song, section, perf, performerTracks\[perf\.name\]\.currentTick \)\n\n                        if \( ! pEvents \|\| pEvents\.length === 0 \) \{/g, 
`const pEvents = part.generate( song, section, perf, performerTracks[perf.name].currentTick )

                        if ( ! pEvents || pEvents.length === 0 ) {`);

fs.writeFileSync(mainPath, mainStr);

console.log("Cleanup complete.");
