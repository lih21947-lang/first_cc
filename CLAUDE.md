# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Run (HTTP server)**: `npm start` — serves app on `http://localhost:8765` (required for PWA install)
- **Run (desktop window)**: `npm run start:app` — opens `index.html` in a frameless Chrome window (440x680)
- **Custom port**: `node server.js <port>` (default 8765)
- **No build, test, or lint commands exist** — this is a zero-dependency vanilla project with no build step

## Project Overview

A Pomodoro Technique focus timer PWA. The entire application (HTML, CSS, JavaScript) lives in a single `index.html` file with no frameworks, bundlers, or external dependencies.

### Key Files

| File | Purpose |
|---|---|
| `index.html` | Entire app: markup (~80 lines), CSS (~450 lines), JS (~420 lines) |
| `server.js` | Minimal Node.js HTTP server for PWA support (uses built-in `http`/`fs`/`path` only) |
| `launcher.js` | Opens `index.html` in Chrome `--app` frameless mode |
| `sw.js` | Service Worker with cache-first strategy for offline support |
| `manifest.json` | PWA Web App Manifest (icons, display mode, theme) |
| `package.json` | Project metadata only — zero dependencies |

## Architecture

The app follows a **manual MVC + Finite State Machine** pattern, all within `index.html`:

### State Machine (5 states)
```
IDLE → WORKING → (timer ends) → BREAK → (timer ends) → IDLE
 ↑       |                          |
 |    PAUSED                   BREAK_PAUSED
 └───────┴──────────────────────────┘
        (reset from any state)
```

### Data Flow
```
User Action (click/keyboard)
  → Action function (actionStart/actionPause/actionReset)
    → Mutate state + remainingSeconds
      → renderAll()  — imperatively updates DOM
```

### Key Patterns

- **Imperative rendering**: Every state change calls `renderAll()` which updates time text, SVG progress ring, phase label, and buttons by direct DOM manipulation
- **Drift-corrected timer**: `tick()` uses `Date.now()` to measure actual elapsed time and catches up if `setInterval` drifts (e.g., tab backgrounded)
- **Settings persistence**: Saved to `localStorage` key `pomodoro-settings`; daily session counter resets when date changes
- **Audio**: Web Audio API (`AudioContext` + oscillators) generates ascending/descending chime tones — no audio files
- **Notifications**: Web Notifications API with progressive permission request
- **Dual mode**: Works via `file://` (launcher.js) or HTTP (server.js + PWA via Service Worker)
- **Theme**: CSS custom properties + `@media (prefers-color-scheme)` for dark/light mode

### Entry Point

`index.html` initialization order (lines 943–962):
1. Calculate SVG ring geometry
2. `loadSettings()` — restore from localStorage, reset daily counter if new day
3. `syncUIToSettings()` — populate form inputs from loaded settings
4. Set state to `IDLE`, compute `totalSeconds`/`remainingSeconds`
5. `renderAll()` — display time, progress, phase, buttons
6. Register Service Worker (HTTP only, skipped for `file://`)
