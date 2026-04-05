const fs = require('fs');
const path = require('path');

const qrmDir = path.join(__dirname, '../qrm');

// Part.js needs to return absolute-time events.
// Main.js collects them, sorts them, and then computes delta times!

let partStr = fs.readFileSync(path.join(qrmDir, 'part.js'), 'utf8');

partStr = partStr.replace(/part\.events\.sort\( \(a, b\) => a\.time - b\.time \|\| \(a\.type === "note_off" \? -1 : 1\) \)\n\n        let evts  = \[\]\n        let ptime = 0[\s\S]*?return evts/g, 
`part.events.sort( (a, b) => a.time - b.time || (a.type === "note_off" ? -1 : 1) )
        return part.events`);

partStr = partStr.replace(/function generate\( song, section, perf \)/g, `function generate( song, section, perf, startTick )`);
partStr = partStr.replace(/thisTick   : 0,/g, `thisTick   : startTick || 0,`);

fs.writeFileSync(path.join(qrmDir, 'part.js'), partStr);

let mainStr = fs.readFileSync(path.join(qrmDir, 'main.js'), 'utf8');
mainStr = mainStr.replace(/for \( const section of song\.timeline \)[\s\S]*?\}\n\}/g, 
`       const performerTracks = {};

        for ( const section of song.timeline )
        {
                if ( !section.performers ) continue;
                for ( const perf of section.performers )
                {
                        if (!performerTracks[perf.name]) {
                                performerTracks[perf.name] = { events: [], currentTick: 0, file: perf.file };
                        }
                        
                        const pEvents = part.generate( song, section, perf, performerTracks[perf.name].currentTick )

                        if ( ! pEvents || pEvents.length === 0 ) {
                                console.error( "Error: no events generated for", perf.name )
                        } else {
                                performerTracks[perf.name].events.push(...pEvents);
                                // The new startTick for the next section is calculated as the end of this section
                                performerTracks[perf.name].currentTick += (section.nMeasures * song.meter.numerator * song.ppqn);
                        }
                }
        }

        // Now write each performer's complete track to disk by calculating deltas
        for (const pName in performerTracks) {
                const track = performerTracks[pName];
                
                track.events.sort( (a, b) => a.time - b.time || (a.type === "note_off" ? -1 : 1) )

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

                for ( const e of track.events )
                {
                        const dlta = e.time - ptime
                        ptime = e.time

                        evts.push({ delta: dlta, type: e.type, channel: e.channel, note: e.note, velocity: e.velocity })
                }

                evts.push({ delta: 0, type: "meta", meta_type: "end_of_track" })

                midi.writeEvents( evts, song.ppqn, 
                                (song.outputDir ? song.outputDir : '.') + '/' + track.file )
        }
}`);
fs.writeFileSync(path.join(qrmDir, 'main.js'), mainStr);

console.log("QRM engine cross-section tick counting and delta-time generation fixed.");
