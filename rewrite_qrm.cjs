const fs = require('fs');
const path = require('path');

const qrmDir = path.join(__dirname, '../qrm');

// 1. common.js
let commonStr = fs.readFileSync(path.join(qrmDir, 'common.js'), 'utf8');
commonStr = commonStr.replace(/let song  = \{\}[\s\S]*?let voice = \{\}\n+/g, '');
commonStr = commonStr.replace(/inspectOptions, part, voice, isAlpha/g, 'inspectOptions, isAlpha');
fs.writeFileSync(path.join(qrmDir, 'common.js'), commonStr);

// 2. theory.js
let theoryStr = fs.readFileSync(path.join(qrmDir, 'theory.js'), 'utf8');
theoryStr = theoryStr.replace(/function findIntervals\(\)/g, 'function findIntervals( song, section )');
theoryStr = theoryStr.replace(/common\.part\./g, 'section.');
theoryStr = theoryStr.replace(/common\.song\./g, 'song.');
fs.writeFileSync(path.join(qrmDir, 'theory.js'), theoryStr);

// 3. part.js
let partStr = fs.readFileSync(path.join(qrmDir, 'part.js'), 'utf8');
partStr = \`
//-------------------------------------------------------------------
//  Part generation
//-------------------------------------------------------------------

const evt    = require(\"./evt\")
const common = require(\"./common\")
const theory = require(\"./theory\")
const util   = require(\"node:util\")

function generate( song, section, inst, startTick )
{
        const part = {
                ...inst,
                events     : [],
                lastTick   : 0,
                thisTick   : startTick || 0,
                chordIndex : 0,
                prevRest   : false,
                intrvls    : theory.findIntervals( song, section ),
                timings    : theory.parseDuration( inst.duration ),
                minMidi    : theory.parseNoteName( inst.range[0] ),
                maxMidi    : theory.parseNoteName( inst.range[1] ),
                chords     : section.chords || song.chords,
                keyRoot    : song.keyRoot
        }

        if ( song.loglevel >= 1 )
        {
                console.log( '----------------------------------------------------------------------' )
                console.log( 'song spec =', util.inspect( song, common.inspectOptions ))
                console.log( 'part spec =', util.inspect( part, common.inspectOptions ))
        }

        for ( let m = 0; m < section.nMeasures; m++ )
        {
                part.thisBeat = 0
                part.measure  = m
                part.lastTick = part.thisTick + (song.meter.numerator * song.ppqn)

                if ( song.loglevel >= 3 )
                {
                        console.log( '----------------------------------------------------------------------' )
                        console.log( 'We are on measure #', part.measure, '; lastTick =' , part.lastTick )
                }

                for ( part.thisBeat = 0; part.thisBeat < song.meter.numerator; part.thisBeat++ )
                {
                        if ( song.loglevel >= 3 )
                                console.log( common.PAD4, 'Beat', part.thisBeat, 'lastTick', part.lastTick )

                        while ( part.thisTick < part.lastTick )
                        {
                                if ( song.loglevel >= 3 )
                                        console.log( common.PAD4, 'thisTick =', part.thisTick, 'lastTick =', part.lastTick )
                                evt.generate( song, part )
                        }
                }
        }

        part.events.sort( (a, b) => a.time - b.time || (a.type === \"note_off\" ? -1 : 1) )
        return part.events;
}

module.exports = { generate }
\`;
fs.writeFileSync(path.join(qrmDir, 'part.js'), partStr);

// 4. main.js
let mainStr = \`
//-------------------------------------------------------------------
//   Entry point
//-------------------------------------------------------------------

const fsys   = require(\"fs\")
const common = require(\"./common\")
const midi   = require(\"./midi\")
const part   = require(\"./part\")
const theory = require(\"./theory\")

if ( require.main === module )
{
        const inputFile = process.argv[2]

        if ( !inputFile )
        {
                console.error( \"Usage: node main.js input.json\" )
                process.exit(1)
        }

        const song = JSON.parse( fsys.readFileSync( inputFile, \"utf8\" ) )
        song.keyRoot = song.key ? theory.keyToSemitone( song.key.tonic ) : 0

        if ( !song.ppqn || song.ppqn === \"undefined\" )
                song.ppqn = 480

        for ( const section of song.sections )
        {
                if ( !section.instruments ) continue;
                for ( const inst of section.instruments )
                {
                        const pEvents = part.generate( song, section, inst, 0 )

                        if ( ! pEvents || pEvents.length === 0 ) {
                                console.error( \"Error: no events generated for\", inst.name )
                        } else {
                                pEvents.sort( (a, b) => a.time - b.time || (a.type === \"note_off\" ? -1 : 1) )

                                let evts  = []
                                let ptime = 0

                                evts.push(
                                {
                                        delta: 0,
                                        type: \"meta\",
                                        meta_type: \"tempo\",
                                        tempo: Math.round( 60000000 / song.tempo )
                                })

                                evts.push(
                                {
                                        delta: 0,
                                        type: \"meta\",
                                        meta_type: \"time_signature\",
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

                                evts.push({ delta: 0, type: \"meta\", meta_type: \"end_of_track\" })

                                midi.writeEvents( evts, song.ppqn, 
                                                (song.outputDir ? song.outputDir : '.') + '/' + inst.file )
                        }
                }
        }
}
\`;
fs.writeFileSync(path.join(qrmDir, 'main.js'), mainStr);

console.log(\"QRM refactor with new nomenclature complete.\");
