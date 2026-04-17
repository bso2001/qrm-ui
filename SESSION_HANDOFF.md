# QRM Project Handoff - April 11, 2026

## 1. Project Overview

- **UI:** Svelte/Vite application (qrm-ui).
- **Backend:** Node.js Express microservice (qrm).
- **Deployment:** Linux (lbr) via systemd service in `/var/www`.

## 2. Nomenclature (Finalized)

- **Song:** Root object.
- **Sections:** Vertical timeline/structural chunks (e.g., intro, outro).
- **Parts:** Horizontal instrument tracks (e.g., Bass, Chords).
- **Instruments:** The specific settings/performances inside a section for a part.

## 3. Data Model & Architecture

- **Stateless Backend:** `qrm` backend is refactored to be stateless. It accepts a "flattened" JSON object for every part in every section.
- **Hierarchical Resolution:** Parameters "float" down: Song -> Section -> Part -> Performance.
- **Flattening Export:** The UI's `exportSong` function resolves all inherited values (key, meter, chords, velocity, duration, range) before sending to the backend.
- **Nginx Proxy:** `qrm.noztrey.com/api/` points to port 3000 (Backend). Root `/` points to port 5173 (UI).

## 4. UI Layout & Style

- **Theme:** Added a 'Medium' midpoint grey theme.
- **Tactile UI:** Rounded rectangles (6px) for all action buttons (+, X, Gear) and chord pills.
- **Weights:** Font weights for field values are set to 600.
- **Safety:** Red 'Danger' buttons are theme-aware and pop brightly in Medium theme.
- **Chord Builder:** Visual grid picker with drag-drop reordering.

## 5. Deployment Setup

- **Linux Service:** `qrm.service` in `/etc/systemd/system`.
- **Startup:** `deploy/linux/start.sh` (hardcoded to `/var/www`).
- **Monitoring:** `sudo journalctl -u qrm -f`.

## 6. Current TODO

- **Implement `restPct` & `tonicPct` as Groove Presets:** Use a Choice dropdown for probabilistic patterns (e.g., "Heavy Downbeat").
- **Durations as Weighted Arrays:** Support inputs like "1/8b", "1/4a".
- **Advanced Chord Extensions:** Support for complex qualities like b7#9.

## 7. Cost Management Strategy

- **Telemetry:** Enabled in `.gemini/settings.json` to log token usage to `.gemini/usage.log`.
- **Session Duration:** Keep sessions short. Use this handoff file to bridge fresh sessions.
