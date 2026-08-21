# SPECTRE-9 // BLACK-OPS CYBER WARFARE — Project Overview

A cinematic, **100% simulated** black-ops "hacker terminal" web experience. It looks like a
classified military-grade cyber command center from a movie, but nothing it displays is real: there is **no
network activity, no scanning, no exploitation** — every node, packet, key, hash,
target, and result is generated locally in the browser as pure visual theatre.

---

## 1. What it is (in one line)

> A single-page, dependency-free web app that renders a classified "SPECTRE-9 black-ops cyber warfare
> command center" — tactical boot sequence, live terminal, system dashboards, network
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
  `python -m http.server 5173` or direct file open).

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
├── js/
│   ├── typewriter.js     # window.NX — shared helpers (typing, random hex, disasm, geo, sleep)
│   ├── audio.js          # window.NexusAudio — synthesized SFX (EMP, sonar, sirens, radio static, morse)
│   ├── boot.js           # window.Boot — tactical military loading sequence
│   ├── main.js           # window.NexusApp — orchestrator: boot→reveal, wires all UI, theme manager
│   ├── terminal.js       # window.Terminal — auto-intro + extended multi-stage command engine
│   ├── satfeed.js        # window.SatFeed — orbital satellite trajectory and Ku-band telemetry canvas
│   ├── memory.js         # window.Memory — live virtual memory disassembler and hex inspector
│   ├── cyberwar.js       # window.CyberWar — real-time interactive cyber defense APT mini-game
│   ├── commands.js       # window.FX — glitch/shake/TRACE meter (cosmetic FX controller)
│   ├── monitor.js        # window.Monitor — animated CPU/MEM/NET/uptime/threads/nodes
│   ├── radar.js          # window.Radar — rotating radar sweep w/ blips
│   ├── topology.js       # window.Topology — node graph + traveling packets w/ clamp bounds
│   ├── encryption.js     # window.Encryption — rolling hashes/keys + padlock canvas
│   ├── eventlog.js       # window.EventLog — continuously appended color-coded logs
│   ├── datastream.js     # window.DataStream — scrolling hex/binary + audio-style bars
│   ├── worldmap.js       # window.WorldMap — dot-matrix world w/ pulsing targets
│   ├── matrix.js         # window.Matrix — fullscreen falling-glyph "Matrix" mode
│   ├── breach.js         # window.Breach — dramatic breach-simulation overlay
│   └── hackertyper.js    # window.HackerTyper — mash-keys-to-emit-code mode
```

---

## 4. Architecture & Data Flow

Everything is written in the **IIFE + global-namespace module pattern**: each file
wraps itself in `(function(){ ... })()` and exposes one object on `window`
(e.g. `window.Monitor`). There is no bundler; scripts load in dependency order at
the bottom of `index.html`.

### Startup Sequence
1. `main.js` (`NexusApp.start`) runs on `DOMContentLoaded`.
2. It restores the saved CRT theme from `localStorage` (`green`, `cyan`, `amber`, `red`, `purple`), randomizes the session ID, arms audio on first user gesture, initializes `FX`, and wires all interactive controls.
3. It kicks off `Boot.run()` — the fullscreen boot screen types classified kernel messages, fills a progress bar to 100%, then shows "SYSTEM READY".
4. When the user clicks **[ ENGAGE SPECTRE TERMINAL ]** (or presses Enter), `Boot.enter()` fades the boot screen and calls back into `main.js._enterInterface()`.
5. `_enterInterface()` reveals the app shell and **initializes every simulation module** (`Monitor`, `Radar`, `Topology`, `Encryption`, `SatFeed`, `Memory`, `CyberWar`, `WorldMap`, `EventLog`, `DataStream`, `Matrix`, `Breach`, `Terminal`, `HackerTyper`) inside `_safe()` wrappers.
6. `Terminal.playIntro()` auto-types the black-ops diagnostic sequence.

---

## 5. Extended Tactical Terminal Commands

Typed into the center terminal (all visual-only, multi-stage simulations):

| Command | Multi-Stage Flow |
|---|---|
| `help` | Categorized tactical matrix: Reconnaissance, Offensive Warfare, Cyber Defense, and System utilities. |
| `theme [name]` | Dynamically switch phosphor CRT colorway (`green`, `cyan`, `amber`, `red`, `purple`). |
| `game` / `defend` | Launch real-time interactive APT cyber defense mini-game under timer and alarm sirens. |
| `mitm [target]` | Man-in-the-middle ARP cache poison $\to$ SSL/TLS downgrade $\to$ live intercepted credential stream. |
| `nuke [target]` | Tactical orbital EMP strike simulation $\to$ 3-2-1 countdown sirens $\to$ full-screen EMP blast $\to$ subnet blackout. |
| `inject [pid]` | Memory thread hijack $\to$ `VirtualAllocEx` $\to$ `WriteProcessMemory` $\to$ live opcode disassembly corrupt dump. |
| `defcon [1-5]` | Change military cyber readiness level $\to$ synchronized warning sirens, LED colors, and emergency strobes. |
| `geoip [ip]` | Orbital geo-intelligence dossier with GPS coordinates, ISP backbone, and Autonomous System telemetry. |
| `keygen` | Procedural black-ops serial license cipher generator with algorithmic checksum verification. |
| `scan [target]` | 5-stage deep reconnaissance: ARP sweep $\to$ 10-port enumeration $\to$ OS fingerprinting $\to$ CVE mapping. |
| `connect [ip]` | 5-hop distributed onion circuit negotiation, Curve25519 key exchange, and anti-DPI cloak. |
| `decrypt [hash]` | 3-second rapid rainbow-table brute-force dictionary attack with scrambling live hex lines. |
| `trace [ip]` | Orbital satellite lock $\to$ 6-hop worldwide traceroute $\to$ reverse-trace probe alert with sirens. |
| `payload [type]` | Polymorphic shellcode synthesizer: NOP sled creation $\to$ x86_64 assembly $\to$ 64-byte hex dump. |
| `ddos [target]` | 256-node virtual botnet packet surge $\to$ monitor CPU/NET spike to 99% $\to$ topology packet flood. |
| `airmon` | IEEE 802.11 monitor mode $\to$ access point spectrum discovery $\to$ WPA3 4-way handshake capture. |
| `sat` | Antenna alignment to SPECTRE-SAT-09 reconnaissance satellite $\to$ NORAD telemetry $\to$ Ku-band lock. |
| `audio [sfx]` | Test-fire synthesized tactical SFX (`sonar`, `emp`, `static`, `siren`, `geiger`, `morse`). |
| `nodes` / `netstat` | Tabulated darknet node routing table with Node IDs, IP, Protocol, Port, Latency, and Threat Index. |
| `status` / `sysinfo` | Detailed tactical status: 8 virtual core threads, quantum entropy pool reserves, and firewall integrity. |
| `whoami` | Classified operative dossier: Level-5 Black-Ops clearance, quantum security key, PGP fingerprint. |
| `breach` | 6-tier assault: Firewall Bypass $\to$ Memory Heap Corruption $\to$ Kernel Privilege Escalation $\to$ Root Shell. |
| `matrix` | Enter fullscreen falling-glyph cyber construct mode. ESC to exit. |
| `hacker` | Toggle Hacker Typer mode (mash keys to pour syntax-highlighted kernel code). |
| `clear` / `cls` | Sanitize the terminal output buffer. |
| `about` | Inspect SPECTRE-9 black-ops engine specifications. |
| `exit` | "PERMISSION DENIED: OPERATIVE CANNOT DISCONNECT FROM THE GRID." |

**Easter eggs:** `sudo matrix`, `sudo coffee`, `hack the planet`, `42`, `godmode`, `overclock`, `sudo rm -rf /`, `ping`, `hacker typer`.

---

## 6. Safety / Simulation Guarantees

- **No networking code exists** — no `fetch`, no WebSocket, no XHR to any target.
- Every "scan / node / packet / hash / key / trace / breach / mitm / nuke" value comes from local procedural algorithms in `NX`.
- The Hacker Typer corpus is **static text** rendered character-by-character; it is never `eval`'d or executed.
- A permanent on-screen banner and repeated in-terminal notices state
  **"SIMULATION MODE // NO REAL NETWORK ACTIVITY"** and **"NO REAL SYSTEM WAS ACCESSED"**.
