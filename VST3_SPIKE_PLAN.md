# QRM VST3 Spike Plan

## Goal

Determine whether QRM can become a useful macOS VST3 plugin without over-investing in UI or platform work too early.

This is a spike, not a productization effort.

## Scope

In scope:

- macOS only
- VST3 only
- Prototype quality
- Local development only
- One or two DAWs for testing

Out of scope:

- AU support
- Windows support
- Linux support
- Commercial packaging
- Signing and notarization
- Installer work
- Broad host compatibility

## Primary Question

Can we build a macOS VST3 that:

1. Loads reliably in a target DAW on the local machine
2. Opens a usable editor window
3. Saves and restores plugin state correctly
4. Proves that a small slice of QRM generation is meaningful inside a DAW
5. Tells us whether further UI work should target a plugin-first architecture

If the answer is no, the current web UI remains the main product path.

## Recommendation

Use JUCE for the spike.

Reasoning:

- Fastest path to a working macOS VST3
- Mature plugin editor and host integration model
- Good fit for a local prototype where commercial licensing is not the immediate constraint

## What Carries Over From The Current Repos

Likely reusable:

- QRM song schema and terminology
- Parameter resolution rules across song, section, and part
- Import/export semantics
- Core generation concepts such as keys, chords, durations, ranges, and probabilities

Not directly reusable:

- Node/CommonJS runtime in qrm
- HTTP generation flow
- Browser storage assumptions such as localStorage
- Download-a-ZIP generation workflow
- UI patterns that assume a full browser application shell

## Core Technical Reality

The current qrm engine is an offline MIDI file generator running in Node.

A plugin is different:

- It lives inside the DAW process
- It must save and restore state through the plugin API
- It must handle timing and transport correctly
- It must avoid browser and server assumptions
- It may need to emit MIDI in real time instead of writing files

Because of that, this spike should be treated as a native plugin implementation that reuses QRM concepts, not as a direct port of the existing app.

## Architecture For The Spike

### 1. Native Plugin Shell

Build a JUCE VST3 plugin for macOS only.

Responsibilities:

- Plugin lifecycle
- Host integration
- State save and restore
- Editor window
- MIDI event output path

### 2. Native QRM Core

Implement a small native core that owns:

- Song state
- Section and part state
- Resolution logic
- Minimal event generation behavior

This core should be isolated from JUCE-specific UI code where practical.

### 3. UI Strategy

Do not try to embed the existing Svelte app for the spike.

Instead:

- Rebuild a minimal native editor
- Reuse the current UI as a design reference
- Preserve terminology and mental model from qrm-ui
- Optimize for proof of concept, not visual parity

## Product Model Question To Resolve Early

The spike needs to answer what kind of plugin QRM actually wants to be.

The main options are:

### Option A: Real-Time MIDI Generator

The plugin generates MIDI inside the DAW while transport is running.

Pros:

- Feels like a true plugin
- Tight DAW integration
- Strong reason to exist as VST3

Risks:

- Timing and transport complexity
- More constraints on implementation
- Harder to debug than offline generation

### Option B: In-DAW Configurator / Export Tool

The plugin acts more like a structured editor and export surface.

Pros:

- Closer to the current QRM model
- Lower timing complexity
- Easier first port

Risks:

- Weaker plugin value proposition
- May end up being the wrong form factor

The spike should compare these two models quickly, not assume the answer up front.

## Recommended DAW Test Matrix

Keep this intentionally small.

Primary host:

- REAPER on macOS

Optional second host:

- Bitwig Studio or Ableton Live, whichever is already available locally

Selection criteria:

- Fast rescan and reload loop
- Easy plugin diagnostics
- Reliable MIDI plugin testing

## Definition Of Done For The Spike

The spike is successful if all of the following are true:

1. The VST3 builds locally on macOS
2. The plugin loads in the target DAW
3. The editor opens and remains stable
4. At least a minimal QRM-shaped state object can be edited
5. State restore works across DAW reloads
6. One minimal generation behavior works well enough to evaluate the product direction
7. We can clearly say whether plugin-first development is justified

The spike is unsuccessful if any of the following happens:

- Host integration is too unstable
- Timing model is a poor fit for QRM
- The plugin form factor adds friction without enough benefit
- UI constraints make the authoring experience materially worse than the current web app

## Two-Week Execution Plan

### Week 1

Objectives:

- Create the JUCE project
- Build a minimal macOS VST3
- Verify plugin discovery and editor launch in the target DAW
- Implement basic state serialization

Tasks:

1. Create a minimal JUCE VST3 project
2. Build and install the plugin into the user VST3 path on macOS
3. Confirm the DAW scans and opens it
4. Add a small editor with a handful of QRM-shaped controls
5. Implement plugin state save and restore

Deliverable:

- A plugin that loads, opens, and remembers a small state object

### Week 2

Objectives:

- Port a very small slice of QRM logic
- Decide whether real-time MIDI behavior is viable
- Evaluate whether the plugin UI model feels right

Tasks:

1. Port a minimal subset of generation concepts
2. Implement one thin vertical slice of behavior
3. Test transport interaction and reload behavior
4. Compare plugin experience against the current web prototype
5. Write a short spike conclusion with go / no-go recommendation

Deliverable:

- A thin but real QRM-in-a-plugin proof of concept

## Minimal Version 0.1 Parameter Set

Keep the first plugin parameter surface deliberately small.

Suggested initial parameters:

- Tempo source mode if needed
- Key tonic
- Key mode
- Section length in measures
- Part type
- Duration selection
- Note range low
- Note range high
- Rest probability
- Tonic probability

Do not attempt the full song editor in version 0.1.

## UI Guidance For Current Work

Work that is still valuable now:

- Clarifying schema rules
- Simplifying parameter naming
- Making section / part / performance relationships consistent
- Deciding what is automatable versus internal
- Refining how generation intent is expressed

Work that is likely throwaway for the plugin path:

- Browser-only persistence behavior
- Generate-and-download workflows
- App-shell navigation patterns that do not map to plugin windows
- Any assumptions that require a separate backend service

## Risks

### Technical Risks

- Real-time MIDI generation may not fit the current QRM model cleanly
- Transport and timing behavior may be harder than expected
- Porting logic from Node to native code may expose hidden assumptions

### Product Risks

- QRM may be better as an offline composition tool than as a live plugin
- A plugin UI may be less effective for authoring complex arrangements than the current web editor

### Process Risks

- Trying to preserve too much of the current UI too early will slow the spike
- Expanding scope beyond macOS VST3 will bury the core question

## Recommendation After The Spike

If the spike succeeds:

- Move toward a plugin-first architecture
- Keep qrm-ui as a schema workbench and transition aid during migration

If the spike fails:

- Keep qrm-ui as the primary product
- Consider a standalone native wrapper only if it solves a specific user problem

## Immediate Next Step

Start with the smallest possible plugin that proves three things:

1. It loads in a DAW
2. It restores state correctly
3. It can express one minimal QRM behavior meaningfully

That is the decision gate. Everything else is secondary.