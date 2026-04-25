# QRM Step 1 Contract: Controls, Transport, Shared Tracing

Status: Frozen baseline for prototype-to-VST convergence.

Purpose: Lock behavior semantics and observability contract before deeper engine implementation.

## Timebox Intent

This contract is a decision freeze artifact, not a long implementation phase. The goal is to prevent repeated semantic churn during C++/VST work.

## Control Contract

| Control | Type | Default | Valid Values | Runtime Meaning | Interaction Rules |
|---|---|---|---|---|---|
| Repeat phrases | bool | false | true/false | When false, player continually invents through active range. When true, phrase repetition behavior is enabled. | Enables Repeat style and Length when true. Disables them when false. |
| Repeat style | enum | same | same, refresh | Controls how repeated phrases are sourced. same = keep one phrase and repeat it. refresh = generate a new phrase per repeat boundary. | Only effective when Repeat phrases is true. |
| Length | int bars | 4 | 1..16 | Phrase length in bars used for repetition boundaries. | Only effective when Repeat phrases is true. |
| Start | enum | song-start | song-start, bar | Activation range start anchor. | If bar is selected, Start bar is required. |
| Start bar | int | 1 | 1..512 | Explicit activation range start bar. | Used only when Start is bar. |
| Stop | enum | song-end | song-end, bar | Activation range stop anchor. | If bar is selected, Stop bar is required. |
| Stop bar | int | 64 | 1..512 | Explicit activation range stop bar. | Used only when Stop is bar. If both endpoints are bar, clamp to Start bar <= Stop bar. |

## Internal Representation Contract

- Canonical UI state for repetition uses `repeatPhrases` and `repeatStyle`.
- Derived compatibility field `phrasePlayback` is allowed for transitional engine integration:
- `repeatPhrases=false` -> `phrasePlayback=re-roll`
- `repeatPhrases=true` and `repeatStyle=same` -> `phrasePlayback=loop`
- `repeatPhrases=true` and `repeatStyle=refresh` -> `phrasePlayback=re-roll`

## Transport Contract (Prototype Harness)

Pseudo transport controls for behavior validation:

- Start: begin timeline advancement.
- Stop: halt timeline advancement and flush active note state.
- Rewind: move transport to song start anchor.
- Seek: jump to explicit target bar.
- Seek target bar input: integer spinner/number field, minimum 1.

Seek semantics:

- Seek target resolves to start of the selected bar.
- Seek is treated as a discontinuity event for scheduling/queue logic.
- Seek must emit a transport trace event with both requested target and resolved timeline position.

## Shared Tracing Contract

Format:

- JSONL (one JSON object per line).
- Same event shape in JS harness and VST logger where feasible.

Required fields:

- `schemaVersion`: integer.
- `runId`: string.
- `scenarioId`: string.
- `source`: `js` or `vst`.
- `timestampMs`: number (wall-clock for ordering/debug).
- `transportTick`: integer (monotonic logical tick).
- `ppq`: number.
- `bar`: integer.
- `beat`: number.
- `eventType`: string (`transport.start`, `transport.stop`, `transport.seek`, `note.on`, `note.off`, `phrase.boundary`, `range.enter`, `range.exit`).
- `note`: integer or null.
- `velocity`: integer or null.
- `phraseId`: string or null.
- `repeatPhrases`: boolean.
- `repeatStyle`: string or null.
- `phraseLengthBars`: integer.
- `rangeStart`: string (`song-start` or `bar:<n>`).
- `rangeStop`: string (`song-end` or `bar:<n>`).
- `seed`: string or number.

Optional fields:

- `debug`: object for source-specific diagnostics.

## Invariants To Validate

- Every `note.on` has a matching `note.off` (same note/channel/voice scope).
- No `note.off` appears before its corresponding `note.on`.
- No note-on event is emitted outside active range.
- `repeatPhrases=false` never pins phrase reuse by repeat boundaries.
- `repeatPhrases=true` + `repeatStyle=same` preserves phrase identity across boundaries.
- `repeatPhrases=true` + `repeatStyle=refresh` changes phrase identity at each boundary.
- Start/stop/seek discontinuities do not leave stuck active notes.

## Minimum Scenario Set

- S1: Start -> run 8 bars -> Stop.
- S2: Start -> Seek to bar 9 -> run 4 bars -> Stop.
- S3: Repeat off vs Repeat on same (same seed, same transport script).
- S4: Repeat on refresh with phrase length changes during playback.
- S5: Activation range bar-to-bar with seeks inside and outside range.

## Step 1 Exit Criteria

Step 1 is complete when:

- Control semantics and defaults are accepted.
- Interaction rules are accepted.
- Transport discontinuity policy is accepted.
- Shared trace schema is accepted.
- Invariant list and minimum scenario set are accepted.

Any unresolved behavior is marked explicitly as TBD before implementation starts.

## Current Prototype Harness

- Runner command: `npm run trace:run`
- Output directory: `logs/trace-runs/`
- Summary file: `logs/trace-runs/summary.json`
