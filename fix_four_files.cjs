const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '../qrm/main.js');
let mainStr = fs.readFileSync(mainPath, 'utf8');

// The original architecture generated one MIDI file PER SECTION PER PERFORMER.
// The previous "multitrack compiler" refactor concatenated the sections together into a single file per performer.
// We need to revert main.js to generate 4 separate files exactly like it used to.

mainStr = mainStr.replace(/const performerTracks = \{\};[\s\S]*?for \(const pName in performerTracks\) \{[\s\S]*?const track = performerTracks\[pName\];[\s\S]*?track\.events\.sort[\s\S]*?midi\.writeEvents\( evts, song\.ppqn, [\s\S]*?\)\n        \}/g, 
`for ( const section of song.timeline )
        {
                if ( !section.performers ) continue;
                for ( const perf of section.performers )
                {
                        const pEvents = part.generate( song, section, perf, 0 ) // Every section starts at tick 0 because it's a standalone file

                        if ( ! pEvents || pEvents.length === 0 ) {
                                console.error( "Error: no events generated for", perf.name )
                        } else {
                                pEvents.sort( (a, b) => a.time - b.time || (a.type === "note_off" ? -1 : 1) )

                                let evts  = []
                                let ptime = 0

                                evts.push(
                                {
                                        delta: 0,
                                        type: "meta",
                                        meta_type: "tempo",
                                        tempo: Math.round( 60000000 / song.tempo )
                                })

                                evts.push(
                                {
                                        delta: 0,
                                        type: "meta",
                                        meta_type: "time_signature",
                                        numerator: song.meter.numerator,
                                        denominator: song.meter.denominator,
                                        metronome: 24,
                                        thirtyseconds: 8
                                })

                                for ( const e of pEvents )
                                {
                                        const dlta = e.time - ptime
                                        ptime = e.time

                                        evts.push({ delta: dlta, type: e.type, channel: e.channel, note: e.note, velocity: e.velocity })
                                }

                                evts.push({ delta: 0, type: "meta", meta_type: "end_of_track" })

                                midi.writeEvents( evts, song.ppqn, 
                                                (song.outputDir ? song.outputDir : '.') + '/' + perf.file )
                        }
                }
        }`);

// Also fix the residual looping mess.
mainStr = mainStr.replace(/for \( const section of song\.timeline \)\n        \{\n                if \( !section\.performers \) continue;\n                for \( const perf of section\.performers \)\n                \{\n                        if \(!performerTracks\[perf\.name\]\) \{\n                                performerTracks\[perf\.name\] = \{ events: \[\], currentTick: 0, file: perf\.file \};\n                        \}\n                        \n                        const pEvents = part\.generate\( song, section, perf, performerTracks\[perf\.name\]\.currentTick \)\n\n                        if \( ! pEvents \|\| pEvents\.length === 0 \) \{\n                                console\.error\( "Error: no events generated for", perf\.name \)\n                        \} else \{\n                                performerTracks\[perf\.name\]\.events\.push\(\.\.\.pEvents\);\n                                \/\/ The new startTick for the next section is calculated as the end of this section\n                                performerTracks\[perf\.name\]\.currentTick \+= \(section\.nMeasures \* song\.meter\.numerator \* song\.ppqn\);\n                        \}\n                \}\n        \}\n\n        \/\/ Now write each performer's complete track to disk by calculating deltas/g, 
'');

fs.writeFileSync(mainPath, mainStr);

console.log("Reverted to 4 individual MIDI files per song.");
