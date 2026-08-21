/* ============================================================
   NEXUS // MAIN
   Orchestrates boot → interface reveal, initializes every
   module, and wires global UI (clock, nav, mute, fullscreen,
   mobile tabs, action buttons). Everything is simulated.
   ============================================================ */
(function () {
    'use strict';

    const App = {
        appEl: null,
        booted: false,

        start() {
            this.appEl = document.getElementById('app');
            document.body.setAttribute('data-mtab', 'terminal');

            // Restore saved theme preference
            try {
                const savedTheme = localStorage.getItem('spectre-theme');
                if (savedTheme && savedTheme !== 'green') {
                    document.body.classList.add('theme-' + savedTheme);
                    const thLabel = document.getElementById('theme-name');
                    if (thLabel) thLabel.textContent = savedTheme.toUpperCase();
                    this._updateFavicon(savedTheme);
                } else {
                    this._updateFavicon('green');
                }
            } catch (e) {}

            // Randomize the session id for a fresh feel each load
            const sess = document.getElementById('meta-session');
            if (sess && window.NX) sess.textContent = window.NX.hex(4) + '-' + window.NX.hex(4);

            // Arm audio on the very first user interaction (autoplay-safe)
            const armOnce = () => {
                if (window.NexusAudio) { window.NexusAudio.arm(); window.NexusAudio.resume(); }
                window.removeEventListener('pointerdown', armOnce);
                window.removeEventListener('keydown', armOnce);
            };
            window.addEventListener('pointerdown', armOnce);
            window.addEventListener('keydown', armOnce);

            // Global chrome that can init immediately
            if (window.FX) window.FX.init();
            this._wireTopbar();
            this._wireNav();
            this._wireActions();
            this._wireMobileTabs();
            this._startClock();

            // Kick off the boot sequence, reveal interface when done
            if (window.Boot) {
                window.Boot.init(() => this._enterInterface());
                window.Boot.run();
            } else {
                this._enterInterface();
            }
        },

        _enterInterface() {
            if (this.booted) return;
            this.booted = true;

            // Reveal the app shell
            if (this.appEl) {
                this.appEl.setAttribute('aria-hidden', 'false');
                requestAnimationFrame(() => this.appEl.classList.add('revealed'));
            }

            // Initialize all simulation modules (canvas + panels)
            this._safe(() => window.Monitor && window.Monitor.init());
            this._safe(() => window.Radar && window.Radar.init());
            this._safe(() => window.Topology && window.Topology.init());
            this._safe(() => window.Encryption && window.Encryption.init());
            this._safe(() => window.WorldMap && window.WorldMap.init());
            this._safe(() => window.SatFeed && window.SatFeed.init());
            this._safe(() => window.Surveillance && window.Surveillance.init());
            this._safe(() => window.StegoLab && window.StegoLab.init());
            this._safe(() => window.ExploitBuilder && window.ExploitBuilder.init());
            this._safe(() => window.HashCracker && window.HashCracker.init());
            this._safe(() => window.DarknetFeed && window.DarknetFeed.init());
            this._safe(() => window.NexusSynth && window.NexusSynth.init());
            this._safe(() => window.Memory && window.Memory.init());
            this._safe(() => window.CyberWar && window.CyberWar.init());
            this._safe(() => window.EventLog && window.EventLog.init());
            this._safe(() => window.DataStream && window.DataStream.init());
            this._safe(() => window.Matrix && window.Matrix.init());
            this._safe(() => window.Breach && window.Breach.init());
            this._safe(() => window.Terminal && window.Terminal.init());
            this._safe(() => window.HackerTyper && window.HackerTyper.init());

            // Nudge canvases to size correctly after the reveal transition
            setTimeout(() => window.dispatchEvent(new Event('resize')), 120);
            setTimeout(() => window.dispatchEvent(new Event('resize')), 800);

            // Auto-play the cinematic terminal intro
            setTimeout(() => {
                this._safe(() => window.Terminal && window.Terminal.playIntro());
            }, 500);

            // Focus the terminal when the user starts typing anywhere
            document.addEventListener('keydown', (e) => this._globalType(e));
        },

        _safe(fn) { try { fn(); } catch (e) { /* keep going */ } },

        _globalType(e) {
            if (!window.Terminal || !window.Terminal.input) return;
            const active = document.activeElement;
            if (active === window.Terminal.input) return;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) return;
            // ignore when an overlay is active
            if (document.body.classList.contains('matrix-active')) return;
            if (document.body.classList.contains('hacker-typing')) return;
            const breach = document.getElementById('breach-overlay');
            if (breach && breach.classList.contains('active')) return;
            const cw = document.getElementById('cyberwar-modal');
            if (cw && cw.classList.contains('active')) return;
            const surv = document.getElementById('surveillance-modal');
            if (surv && surv.classList.contains('active')) return;
            const cipher = document.getElementById('cipher-modal');
            if (cipher && cipher.classList.contains('active')) return;
            const exp = document.getElementById('exploit-modal');
            if (exp && exp.classList.contains('active')) return;
            const hc = document.getElementById('hashcracker-modal');
            if (hc && hc.classList.contains('active')) return;
            const dn = document.getElementById('darknet-modal');
            if (dn && dn.classList.contains('active')) return;

            // only hijack plain printable keys (no modifiers)
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key && e.key.length === 1) {
                window.Terminal.focus();
            }
        },

        /* ---------------- TOP BAR ---------------- */
        _wireTopbar() {
            const mute = document.getElementById('btn-mute');
            if (mute) {
                mute.addEventListener('click', () => {
                    if (window.NexusAudio) window.NexusAudio.toggle();
                });
            }
            const fs = document.getElementById('btn-fullscreen');
            if (fs) {
                fs.addEventListener('click', () => this._toggleFullscreen());
            }

            // Surveillance Button
            const btnCam = document.getElementById('btn-cam');
            if (btnCam) btnCam.addEventListener('click', () => window.Surveillance && window.Surveillance.open());

            // Cipher Lab Button
            const btnCipher = document.getElementById('btn-cipher');
            if (btnCipher) btnCipher.addEventListener('click', () => window.StegoLab && window.StegoLab.open());

            // Exploit Builder Button
            const btnExp = document.getElementById('btn-exploit');
            if (btnExp) btnExp.addEventListener('click', () => window.ExploitBuilder && window.ExploitBuilder.open());

            // Theme Cycle button
            const btnTheme = document.getElementById('btn-theme');
            if (btnTheme) {
                const themes = ['green', 'cyan', 'amber', 'red', 'purple'];
                btnTheme.addEventListener('click', () => {
                    let current = 'green';
                    for (const th of themes) {
                        if (document.body.classList.contains('theme-' + th)) current = th;
                    }
                    const nextIdx = (themes.indexOf(current) + 1) % themes.length;
                    const nextTheme = themes[nextIdx];

                    document.body.classList.remove('theme-green', 'theme-cyan', 'theme-amber', 'theme-red', 'theme-purple');
                    if (nextTheme !== 'green') document.body.classList.add('theme-' + nextTheme);
                    try { localStorage.setItem('spectre-theme', nextTheme); } catch (e) {}

                    const thLabel = document.getElementById('theme-name');
                    if (thLabel) thLabel.textContent = nextTheme.toUpperCase();
                    this._updateFavicon(nextTheme);
                    if (window.NexusAudio) window.NexusAudio.blip(800, 0.04, 'sine', 0.1);
                });
            }

            // Wargame launcher button in topbar
            const btnCw = document.getElementById('btn-cw');
            if (btnCw) {
                btnCw.addEventListener('click', () => {
                    if (window.CyberWar) window.CyberWar.start();
                });
            }

            // GPU Hash Cracker button
            const btnHC = document.getElementById('btn-hashcrack');
            if (btnHC) btnHC.addEventListener('click', () => window.HashCracker && window.HashCracker.open());

            // Darknet Intelligence Feed button
            const btnDN = document.getElementById('btn-darknet');
            if (btnDN) btnDN.addEventListener('click', () => window.DarknetFeed && window.DarknetFeed.open());

            // Sync with browser native fullscreen state (F11 or esc)
            document.addEventListener('fullscreenchange', () => {
                const isFs = !!document.fullscreenElement;
                if (this.appEl) this.appEl.classList.toggle('fullscreen-mode', isFs);
                setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
                setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
            });
        },

        _updateFavicon(theme) {
            const colors = {
                green: { primary: '#37ff8b', core: '#4dffa0', dim: '#12563a' },
                cyan: { primary: '#3fe0ff', core: '#70ecff', dim: '#0d4659' },
                amber: { primary: '#ffb340', core: '#ffcb65', dim: '#593907' },
                red: { primary: '#ff4155', core: '#ff6e7f', dim: '#590913' },
                purple: { primary: '#b98bff', core: '#d4b3ff', dim: '#3d1b70' }
            };
            const c = colors[theme] || colors.green;
            const link = document.getElementById('favicon-link');
            if (!link) return;
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="#030806" stroke="${c.dim}" stroke-width="1.5"/><polygon points="32,6 54,18 54,46 32,58 10,46 10,18" fill="#05120c" stroke="${c.primary}" stroke-width="2"/><path d="M 21 24 L 28 32 L 21 40" fill="none" stroke="${c.core}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><line x1="34" y1="23" x2="33" y2="41" stroke="${c.core}" stroke-width="2.2" stroke-linecap="round"/><line x1="41" y1="23" x2="40" y2="41" stroke="${c.core}" stroke-width="2.2" stroke-linecap="round"/><line x1="30" y1="28" x2="45" y2="28" stroke="${c.core}" stroke-width="2.2" stroke-linecap="round"/><line x1="29" y1="36" x2="44" y2="36" stroke="${c.core}" stroke-width="2.2" stroke-linecap="round"/><path d="M 4 14 L 4 4 L 14 4" fill="none" stroke="${c.primary}" stroke-width="2"/><path d="M 50 4 L 60 4 L 60 14" fill="none" stroke="${c.primary}" stroke-width="2"/><path d="M 4 50 L 4 60 L 14 60" fill="none" stroke="${c.primary}" stroke-width="2"/><path d="M 50 60 L 60 60 L 60 50" fill="none" stroke="${c.primary}" stroke-width="2"/></svg>`;
            link.href = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
        },

        _toggleFullscreen() {
            const d = document;
            if (!d.fullscreenElement) {
                const el = d.documentElement;
                (el.requestFullscreen || el.webkitRequestFullscreen || function () { }).call(el);
            } else {
                (d.exitFullscreen || d.webkitExitFullscreen || function () { }).call(d);
            }
        },

        /* ---------------- SIDEBAR NAV ---------------- */
        _wireNav() {
            const items = document.querySelectorAll('.nav-item');
            items.forEach((it) => {
                it.addEventListener('click', () => {
                    items.forEach((x) => x.classList.remove('active'));
                    it.classList.add('active');
                    const nav = it.getAttribute('data-nav');
                    if (window.NexusAudio) window.NexusAudio.blip(700, 0.03, 'square', 0.05);

                    if (nav === 'terminal') {
                        if (window.Terminal) window.Terminal.focus();
                    } else if (nav === 'network') {
                        if (window.Topology) window.Topology.surge();
                        if (window.Terminal) window.Terminal.submit('nodes');
                    } else if (nav === 'system') {
                        if (window.Monitor) window.Monitor.spike();
                        if (window.Terminal) window.Terminal.submit('status');
                    } else if (nav === 'exploits') {
                        if (window.ExploitBuilder) window.ExploitBuilder.open();
                    } else if (nav === 'payloads') {
                        if (window.StegoLab) window.StegoLab.open();
                    } else if (nav === 'logs') {
                        const logEl = document.getElementById('region-logs');
                        if (logEl) {
                            logEl.style.boxShadow = '0 0 25px rgba(55, 255, 139, 0.4)';
                            setTimeout(() => { logEl.style.boxShadow = ''; }, 1200);
                        }
                        if (window.EventLog) window.EventLog.push('INFO', 'Operative inspected classified tactical event log.');
                    } else if (nav === 'settings') {
                        const btnTheme = document.getElementById('btn-theme');
                        if (btnTheme) btnTheme.click();
                    }
                });
            });
        },

        /* ---------------- ACTION BUTTONS ---------------- */
        _wireActions() {
            const ht = document.getElementById('btn-hacker');
            if (ht) ht.addEventListener('click', () => window.HackerTyper && window.HackerTyper.toggle());

            const mx = document.getElementById('btn-matrix');
            if (mx) mx.addEventListener('click', () => window.Matrix && window.Matrix.enter());

            const br = document.getElementById('btn-breach');
            if (br) br.addEventListener('click', () => {
                if (window.FX) window.FX.raiseTrace(38);
                if (window.Breach) window.Breach.run();
            });

            const sideCw = document.getElementById('btn-side-cw');
            if (sideCw) sideCw.addEventListener('click', () => {
                if (window.CyberWar) window.CyberWar.start();
            });

            const clearLog = document.getElementById('btn-clearlog');
            if (clearLog) clearLog.addEventListener('click', () => {
                const c = document.getElementById('eventlog-content');
                if (c) c.innerHTML = '';
            });
        },

        /* ---------------- MOBILE TABS ---------------- */
        _wireMobileTabs() {
            const tabs = document.querySelectorAll('.mtab');
            tabs.forEach((tab) => {
                tab.addEventListener('click', () => {
                    tabs.forEach((t) => t.classList.remove('active'));
                    tab.classList.add('active');
                    document.body.setAttribute('data-mtab', tab.getAttribute('data-tab'));
                    if (window.NexusAudio) window.NexusAudio.blip(660, 0.03, 'square', 0.05);
                    // re-measure canvases for the newly shown pane
                    setTimeout(() => window.dispatchEvent(new Event('resize')), 60);
                });
            });
        },

        /* ---------------- CLOCK ---------------- */
        _startClock() {
            const el = document.getElementById('topbar-clock');
            const tick = () => {
                const d = new Date();
                const s = String(d.getHours()).padStart(2, '0') + ':' +
                    String(d.getMinutes()).padStart(2, '0') + ':' +
                    String(d.getSeconds()).padStart(2, '0');
                if (el) el.textContent = s;
            };
            tick();
            setInterval(tick, 1000);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.start());
    } else {
        App.start();
    }

    window.NexusApp = App;
})();
