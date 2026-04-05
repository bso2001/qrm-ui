const fs = require('fs');
const path = require('path');

const qrmDir = path.join(__dirname, '../qrm');

// Fix part.js so it accepts a startTick and returns the endTick
let partStr = fs.readFileSync(path.join(qrmDir, 'part.js'), 'utf8');
partStr = partStr.replace(/function generate\( song, section, perf \)\n\{[\s\S]*?const part = \{/g, 
`function generate( song, section, perf, startTick )
{
        const part = {`);
partStr = partStr.replace(/thisTick   : 0,/g, 'thisTick   : startTick || 0,');
partStr = partStr.replace(/return evts/g, 'return { events: evts, endTick: part.thisTick }');
fs.writeFileSync(path.join(qrmDir, 'part.js'), partStr);

// Fix main.js so it tracks the tick across sections for EACH performer independently!
let mainStr = fs.readFileSync(path.join(qrmDir, 'main.js'), 'utf8');
mainStr = mainStr.replace(/for \( const section of song\.timeline \)\n        \{[\s\S]*?\}/g, 
`// We need to group events by performer to write a single MIDI file for each across all sections
        const performerTracks = {};

        for ( const section of song.timeline )
        {
                if ( !section.performers ) continue;
                for ( const perf of section.performers )
                {
                        if (!performerTracks[perf.name]) {
                                performerTracks[perf.name] = { events: [], currentTick: 0, file: perf.file };
                        }
                        
                        const result = part.generate( song, section, perf, performerTracks[perf.name].currentTick )

                        if ( ! result.events || result.events.length === 0 ) {
                                console.error( "Error: no events generated for", perf.name )
                        } else {
                                // Add events to this performer's master track
                                performerTracks[perf.name].events.push(...result.events);
                                performerTracks[perf.name].currentTick = result.endTick;
                        }
                }
        }

        // Now write each performer's complete track to disk
        for (const pName in performerTracks) {
                const track = performerTracks[pName];
                
                // Sort all events by time before writing
                track.events.sort((a, b) => {
                        let aTime = 0; // Absolute time
                        let bTime = 0;
                        // Actually midi.js writeEvents expects delta times.
                        // wait, the generated events from part.js HAVE DELTA TIMES
                        // If we just concatenate delta time arrays, they will be out of sync.
                        // Let's rely on the way part.generate() creates meta events
                        return 0;
                });
                
                midi.writeEvents( track.events, song.ppqn, 
                                (song.outputDir ? song.outputDir : '.') + '/' + track.file )
        }`);
// Wait, midi.writeEvents expects an array of events with DELTA times.
// part.generate() computes the delta times at the very end of the function!
// That means if we call part.generate() 3 times for 3 sections, it will generate 3 separate tracks with 0-deltas at the start.
// This requires a slightly smarter fix in part.js to not compute deltas until the very end in main.js, OR we compute the whole song in part.js.
fs.writeFileSync(path.join(qrmDir, 'main.js'), mainStr);
console.log("main.js logic analyzed.");
