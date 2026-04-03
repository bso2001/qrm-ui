# QRM Rack UI

A skeuomorphic web interface for managing Quasi-Random Music (QRM) JSON specifications.

## 🛠 Features

- **Analog Rack Aesthetic**: Designed to look like vintage studio hardware.
- **Interactive Controls**: Radial knobs with drag interaction, physical toggle switches, and LCD-style displays.
- **Hierarchical Parameter Resolution**: Automatically handles parameters defined at the Song, Part, or Voice level (as described in the QRM spec).
- **Import/Export**: Load existing `.json` song files and export modified versions.
- **Responsive Navigation**: Navigate through multi-part songs and multiple voices per part using interactive "rack screws" (arrows).

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- `npm` (comes with Node.js)

### Installation

1. Navigate to the UI directory:
   ```bash
   cd src/qrm-ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:
```bash
npm run dev
```
Open the provided URL (usually `http://localhost:5173`) in your browser.

### Building for Production

To create a production-ready build:
```bash
npm run build
```
The output will be in the `dist` folder.

## 📄 Specification

This UI is designed to manage JSON files following the QRM specification, which defines:
- Global song parameters (tempo, outputDir, etc.)
- Sequential song parts (key, meter, chords, etc.)
- Multiple voices per part (MIDI file, type, restPct, etc.)

---
© 2026. Sven Bert Olsson.
