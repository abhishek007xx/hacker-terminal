# NEXUS // SECURE TERMINAL — Project Overview

A cinematic, **100% simulated** "hacker terminal" web experience. It looks like a
scene from a cyber-thriller movie, but nothing it displays is real: there is **no
network activity, no scanning, no exploitation** — every node, packet, key, hash,
target, and result is generated locally in the browser as pure visual theatre.

---

## 1. What it is (in one line)

> A single-page, dependency-free web app that renders a fake "underground cyber
> command center" — boot sequence, live terminal, system dashboards, network
> topology, encryption engine, event log, Matrix mode, breach simulation, and a
> "Hacker Typer" — all synthesized client-side.

---

## 2. Tech stack

- **Pure HTML + CSS + vanilla JavaScript.** No frameworks, no build step, no npm
  dependencies.
- **HTML5 Canvas** for all the animated visualizations (radar, topology, world
  map, encryption lock, data-stream bars, matrix rain).
- **Web Audio API** for 100% synthesized sound (no audio files shipped).
- **Google Fonts**: JetBrains Mono, Share Tech Mono, Space Mono (the only external
  resource).
- Runs by simply opening `index.html` (served locally during dev via
  `python -m http.server 5173`).

**Why this matters:** it's portable, lightweight, and every "hacking" behaviour is
provably fake because there is no backend and no network code at all.

---

## 3. File structure

```
hacker terminal/
├── index.html            # Single page: all DOM structure + script/style includes
├── PROJECT_OVERVIEW.md   # This document
├── css/
│   ├── variables.css     # Design tokens: colors, glow, fonts, spacing, base reset
│   ├── layout.css        # Topbar, statusbar, main grid, sidebar, action buttons, badge
│   ├── panels.css        # Glass panels: terminal, monitor, topology, crypto, log, stream
│   ├── effects.css       # CRT scanlines, flicker, glitch, boot, matrix, breach styling
│   └── responsive.css     # Tablet/mobile: collapse panels into a tabbed layout
└── js/
    ├── typewriter.js     # window.NX — shared helpers (typing, random hex, bars, sleep)
    ├── audio.js          # window.NexusAudio — synthesized SFX + ambient hum + mute
    ├── boot.js           # window.Boot — cinematic loading sequence
    ├── main.js           # window.NexusApp — orchestrator: boot→reveal, wires all UI
    ├── terminal.js       # window.Terminal — auto-intro + interactive command engine
    ├── commands.js       # window.FX — glitch/shake/TRACE meter (cosmetic FX controller)
    ├── monitor.js        # window.Monitor — animated CPU/MEM/NET/uptime/threads/nodes
    ├── radar.js          # window.Radar — rotating radar sweep w/ blips
    ├── topology.js       # window.Topology — node graph + traveling packets
    ├── encryption.js     # window.Encryption — rolling hashes/keys + padlock canvas
    ├── eventlog.js       # window.EventLog — continuously appended color-coded logs
    ├── datastream.js     # window.DataStream — scrolling hex/binary + audio-style bars
    ├── worldmap.js       # window.WorldMap — dot-matrix world w/ pulsing targets
    ├── matrix.js         # window.Matrix — fullscreen falling-glyph "Matrix" mode
    ├── breach.js         # window.Breach — dramatic breach-simulation overlay
    └── hackertyper.js    # window.HackerTyper — mash-keys-to-emit-code mode
```

---

## 4. Architecture & data flow

Everything is written in the **IIFE + global-namespace module pattern**: each file
wraps itself in `(function(){ ... })()` and exposes one object on `window`
(e.g. `window.Monitor`). There is no bundler; scripts load in dependency order at
the bottom of `index.html`.

### Startup sequence
1. `main.js` (`NexusApp.start`) runs on `DOMContentLoaded`.
2. It randomizes the session ID, arms audio on first user gesture (autoplay-safe),
   initializes `FX`, wires the topbar/nav/action buttons/mobile tabs, and starts
   the clock.
3. It kicks off `Boot.run()` — the fullscreen boot screen types kernel messages,
   fills a progress bar to 100%, then shows "SYSTEM READY".
4. When the user clicks **[ ENTER TERMINAL ]** (or presses Enter), `Boot.enter()`
   fades the boot screen and calls back into `main.js._enterInterface()`.
5. `_enterInterface()` reveals the app shell and **initializes every simulation
   module** (`Monitor`, `Radar`, `Topology`, `Encryption`, `WorldMap`, `EventLog`,
   `DataStream`, `Matrix`, `Breach`, `Terminal`, `HackerTyper`) inside a `_safe()`
   wrapper so one failure never breaks the rest.
6. `Terminal.playIntro()` auto-types the cinematic command sequence.

### Shared foundation: `window.NX` (typewriter.js)
This is the utility layer every other module leans on:
- `type()` — progressive typewriter rendering into the terminal (with optional
  keystroke sounds).
- `line()` / `spacer()` — append pre-built HTML lines.
- `animateBar()` — animated `[████░░]` progress bars.
- `hex()`, `hexBytes()`, `keyBlock()`, `binary()` — harmless random string
  generators used for all the fake hashes/keys/packets.
- `rand`, `randInt`, `pick`, `sleep`, `dotline`, `progressBar`.

---

## 5. Module-by-module summary

| Module | Responsibility |
|---|---|
| **Boot** | Cinematic loading screen: ASCII NEXUS logo, typed kernel steps, progress bar, "SYSTEM READY" gate. |
| **Terminal** | The centerpiece. Auto-plays the intro, then accepts typed commands. Renders a fake input line (hidden real `<input>` + mirror span + blinking caret), supports command history (↑/↓), Tab autocomplete, and Ctrl+L clear. |
| **FX** (commands.js) | Cosmetic effects controller: glitch flash, screen shake, and the **TRACE meter** that hovers near 0% and spikes during dramatic events, then decays. |
| **Monitor** | Animated CPU / MEMORY / NETWORK bars (drift within bounds), live uptime clock, threads & node counts. Bars turn amber/red at high load. Exposes `spike()` and `getNodes()`. |
| **Radar** | Canvas radar: concentric rings, rotating gradient sweep, blips that light up as the sweep passes. |
| **Topology** | Canvas node graph — a CORE hub + 4 satellite nodes drawn as glowing hexagons with pulsing rings. Packets travel along links; node states randomly cycle ONLINE / SECURED / UNKNOWN / SIM ACCESS. `surge()` bursts packets during scans/breaches. |
| **Encryption** | "Encryption Engine" panel: fast-scrambling hash, rolling session key, and a canvas padlock rendered as a shimmering dot-matrix. |
| **EventLog** | Continuously appends timestamped, color-coded `[INFO]/[OK]/[WARN]/[ERR]` log lines from a message pool; seeds with backdated entries; caps at 60 rows. |
| **DataStream** | Subtle scrolling hex/binary/key columns + an ELF-header-ish ASCII garble column + a small animated "audio bars" canvas. |
| **WorldMap** | Tiny dot-matrix world silhouette in the identity panel with a few pulsing cyan "target" pings. |
| **Matrix** | Fullscreen falling-glyph rain (canvas) + a semi-transparent HUD that types fake system messages; intensified scanlines; **ESC to exit**. |
| **Breach** | Dramatic overlay: types "INITIALIZING → TARGET IDENTIFIED", walks through 5 security layers (BYPASSED/ANALYZED/etc.), spikes monitor+topology, ends with a glitch payoff and **"NO REAL SYSTEM WAS ACCESSED"**. |
| **HackerTyper** | The classic movie gag: engage it, then **mash any keys** and pre-written, **syntax-highlighted** C-style "kernel" code pours out (2–6 chars per keystroke). Floating badge + ESC to stop. The code is inert set-dressing — never executed. |
| **Audio** | All sound is synthesized (oscillators/noise buffers): keystrokes, confirm/warn beeps, connection sweep, glitch burst, boot rumble, and a continuous low hum bed. Mute toggle persists via `localStorage`; only arms after a user gesture. |

---

## 6. UI layout

**Desktop** is a CSS grid:
- **Top bar** — brand, connection/node/session meta, clock, mute + fullscreen buttons.
- **Status bar** — pulsing LEDs (SYSTEM ONLINE / ENCRYPTED / PROXY ACTIVE / TRACE %)
  and the persistent red **`SIMULATION MODE // NO REAL NETWORK ACTIVITY`** banner.
- **Left sidebar** — cosmetic nav, IDENTITY panel with dot-matrix world map, and the
  three action buttons: **[ HACKER TYPER ]**, **[ ENTER MATRIX MODE ]**,
  **RUN BREACH SIMULATION**.
- **Center** — the terminal window (tabbed titlebar + output + input line).
- **Right column** — System Monitor (with radar), Network Topology, Encryption Engine.
- **Bottom row** — Event Log + Data Stream.

**Mobile/tablet** (`responsive.css`): the grid collapses into a single column with a
bottom **tab bar** (TERMINAL / MONITOR / NET / LOG) that toggles which pane is visible
via `body[data-mtab="..."]`.

---

## 7. Interactive terminal commands

Typed into the center terminal (all visual-only):

`help`, `status`, `scan`, `connect`, `decrypt`, `trace`, `nodes`, `breach`,
`hacker`, `matrix`, `clear`, `whoami`, `about`, `exit`
(plus aliases `cls`, `ls`, `man`).

**Easter eggs:** `sudo matrix`, `sudo coffee`, `hack the planet` (+ `the planet`),
`42`, `sudo rm -rf /`, `ping`, `hacker typer` (+ `sudo hacker`). Unknown commands
return a "COMMAND NOT RECOGNIZED" message.

---

## 8. Design system (variables.css)

- **Palette:** near-black layered backgrounds, phosphor green (`#37ff8b`) primary
  text, dark emerald accents, cyan/blue highlights, amber alerts, red warnings.
- **Controlled glow** tokens (small/medium/large) rather than everything neon.
- **Layered background:** radial glows + a faint grid masked toward the center.
- **Typography:** monospace hierarchy via JetBrains Mono / Share Tech Mono / Space Mono.
- **Effects (effects.css):** CRT scanlines + slow rolling scan bar, SVG film noise,
  vignette, occasional flicker, glitch flash, screen shake, RGB-split glitch text.
- **Accessibility:** honors `prefers-reduced-motion` (disables heavy animations).

---

## 9. Safety / simulation guarantees

This is the single most important design constraint, and it's enforced structurally:

- **No networking code exists** — no `fetch`, no WebSocket, no XHR to any target.
- Every "scan / node / packet / hash / key / trace / breach" value comes from local
  random generators in `NX`.
- The Hacker Typer corpus is **static text** rendered character-by-character; it is
  never `eval`'d or executed.
- A permanent on-screen banner and repeated in-terminal notices state
  **"SIMULATION MODE // NO REAL NETWORK ACTIVITY"** and **"NO REAL SYSTEM WAS ACCESSED"**.

---

## 10. How to run

```bash
# From the project folder:
python -m http.server 5173
# then open:
http://localhost:5173
```

Or simply open `index.html` directly in a browser. First click/keypress arms audio
(browser autoplay policy). Use the mute button anytime.

---

## 11. Quick talking points (for explaining it)

- "It's a **cinematic fake-hacker terminal** — pure front-end, no backend, nothing
  real happens."
- "**Modular vanilla JS**: ~16 self-contained modules, each attaching one object to
  `window`, loaded in order — no framework, no build."
- "**Canvas + Web Audio** drive the visuals and synthesized sound; a shared `NX`
  helper handles typing and random string generation."
- "It boots like an OS, auto-plays a hacking intro, then lets you **type commands**,
  trigger a **breach sequence**, drop into **Matrix mode**, or use **Hacker Typer**."
- "Safety is structural: **there's literally no network code**, and it constantly
  labels itself as a simulation."
```
