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

            // Sync inert on all modals: when 'active' added -> remove inert, when removed -> set inert
            this._wireModalInert();

            // Engage tactical interface directly with no loading delay
            this._enterInterface();
        },

        _enterInterface() {
            if (this.booted) return;
            this.booted = true;

            // Reveal the app shell immediately
            if (this.appEl) {
                this.appEl.setAttribute('aria-hidden', 'false');
                this.appEl.classList.add('revealed');
            }

            // Initialize primary viewport modules
            this._safe(() => window.Terminal && window.Terminal.init());
            this._safe(() => window.HackerTyper && window.HackerTyper.init());
            this._safe(() => window.Monitor && window.Monitor.init());
            this._safe(() => window.Radar && window.Radar.init());
            this._safe(() => window.Topology && window.Topology.init());
            this._safe(() => window.Encryption && window.Encryption.init());
            this._safe(() => window.WorldMap && window.WorldMap.init());
            this._safe(() => window.SatFeed && window.SatFeed.init());
            this._safe(() => window.Memory && window.Memory.init());
            this._safe(() => window.EventLog && window.EventLog.init());
            this._safe(() => window.DataStream && window.DataStream.init());

            // Defer secondary/overlay tool initializations to idle time
            const initOverlays = () => {
                this._safe(() => window.Surveillance && window.Surveillance.init());
                this._safe(() => window.StegoLab && window.StegoLab.init());
                this._safe(() => window.ExploitBuilder && window.ExploitBuilder.init());
                this._safe(() => window.HashCracker && window.HashCracker.init());
                this._safe(() => window.DarknetFeed && window.DarknetFeed.init());
                this._safe(() => window.NexusSynth && window.NexusSynth.init());
                this._safe(() => window.CyberWar && window.CyberWar.init());
                this._safe(() => window.Matrix && window.Matrix.init());
                this._safe(() => window.Breach && window.Breach.init());
            };
            if ('requestIdleCallback' in window) {
                requestIdleCallback(initOverlays, { timeout: 1000 });
            } else {
                setTimeout(initOverlays, 100);
            }

            // Nudge canvases to size correctly on next animation frame
            requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));

            // Populate tactical terminal intro
            this._safe(() => window.Terminal && window.Terminal.playIntro());

            // Focus the terminal when the user starts typing anywhere
            document.addEventListener('keydown', (e) => this._globalType(e));
        },

        _safe(fn) { try { fn(); } catch (e) { /* keep going */ } },

        _globalType(e) {
            if (!window.Terminal || !window.Terminal.input) return;
            const active = document.activeElement;
            if (active === window.Terminal.input) return;
            // ignore when an overlay is active
            if (document.body.classList.contains('matrix-active')) return;
            if (document.body.classList.contains('hacker-typing')) return;
            const brief = document.getElementById('brief-modal');
            if (brief && brief.classList.contains('active')) return;
            const breach = document.getElementById('breach-overlay');
            if (breach && breach.classList.contains('active')) return;
            // only hijack plain printable keys (no modifiers)
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key && e.key.length === 1) {
                window.Terminal.focus();
            }
        },

        /* ---------------- MISSION BRIEF (about / FAQ overlay) ---------------- */
        toggleBrief(force) {
            const brief = document.getElementById('brief-modal');
            if (!brief) return;
            const open = typeof force === 'boolean' ? force : !brief.classList.contains('active');
            brief.classList.toggle('active', open);
            brief.setAttribute('aria-hidden', open ? 'false' : 'true');
            if (open) { brief.removeAttribute('inert'); } else { brief.setAttribute('inert', ''); }
            document.body.classList.toggle('brief-open', open);

            if (open) {
                const close = document.getElementById('btn-brief-close');
                if (close) close.focus();
                if (window.NexusAudio) window.NexusAudio.blip(1150, 0.05, 'square', 0.05);
            } else {
                const btn = document.getElementById('btn-brief');
                if (btn) btn.focus();
            }
        },

        _globalType(e) {
            // ignore when an overlay or modal is active
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
            if (document.body.classList.contains('brief-open')) return;

            const active = document.activeElement;
            if (active && active !== (window.Terminal && window.Terminal.input) &&
                (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
                return;
            }

            // ignore modifiers, shortcuts, function keys, escape
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const k = e.key;
            if (k === 'Escape' || k === 'Tab' || k === 'CapsLock' ||
                k === 'Shift' || k === 'Control' || k === 'Alt' ||
                k === 'Meta' || k === 'ContextMenu' ||
                (k && k.startsWith('Arrow')) ||
                (k && k.startsWith('F') && k.length > 1 && !isNaN(k.slice(1)))) {
                return;
            }
            if (k === '?') return;

            const termMode = (window.Terminal && window.Terminal.mode) || 'typer';
            if (termMode === 'typer' && window.HackerTyper) {
                e.preventDefault();
                e.stopPropagation();
                if (window.Terminal && window.Terminal.input) {
                    window.Terminal.input.value = '';
                    window.Terminal._syncMirror && window.Terminal._syncMirror();
                    window.Terminal.input.blur();
                }
                if (!window.HackerTyper.active) window.HackerTyper.start();
                window.HackerTyper._emit();
            } else if (termMode === 'command' && window.Terminal) {
                if (e.key && e.key.length === 1 && document.activeElement !== window.Terminal.input) {
                    window.Terminal.focus();
                }
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

            // Mission Brief (about / FAQ) overlay
            const btnBrief = document.getElementById('btn-brief');
            if (btnBrief) btnBrief.addEventListener('click', () => this.toggleBrief());

            const btnBriefClose = document.getElementById('btn-brief-close');
            if (btnBriefClose) btnBriefClose.addEventListener('click', () => this.toggleBrief(false));

            const briefModal = document.getElementById('brief-modal');
            if (briefModal) {
                briefModal.addEventListener('click', (e) => {
                    if (e.target === briefModal) this.toggleBrief(false);
                });
            }

            // '?' opens the brief anywhere (except while typing), ESC closes it
            document.addEventListener('keydown', (e) => {
                const brief = document.getElementById('brief-modal');
                if (!brief) return;
                if (e.key === 'Escape' && brief.classList.contains('active')) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    this.toggleBrief(false);
                    return;
                }
                if (e.key === '?') {
                    const a = document.activeElement;
                    const typing = a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT');
                    if (typing || document.body.classList.contains('matrix-active') ||
                        document.body.classList.contains('hacker-typing')) return;
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    this.toggleBrief();
                }
            });

            // 'Clear log' control is a span with role="button" — make Enter/Space activate it
            const clearLog = document.getElementById('btn-clearlog');
            if (clearLog) {
                clearLog.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        clearLog.click();
                    }
                });
            }

            // Exploit Builder Button
            const btnExp = document.getElementById('btn-exploit');
            if (btnExp) btnExp.addEventListener('click', () => window.ExploitBuilder && window.ExploitBuilder.open());

            // Theme Cycle button
            const btnTheme = document.getElementById('btn-theme');
            if (btnTheme) {
                btnTheme.addEventListener('click', () => this.cycleTheme());
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

        /* ---- Accessibility: sync `inert` on modal open/close ---- */
        _wireModalInert() {
            const MODAL_IDS = [
                'brief-modal', 'cyberwar-modal', 'surveillance-modal',
                'cipher-modal', 'exploit-modal', 'matrix-mode',
                'hashcracker-modal', 'darknet-modal', 'breach-overlay'
            ];
            const observer = new MutationObserver((mutations) => {
                for (const m of mutations) {
                    if (m.type !== 'attributes' || m.attributeName !== 'class') continue;
                    const el = m.target;
                    const isOpen = el.classList.contains('active');
                    if (isOpen) {
                        el.removeAttribute('inert');
                        el.setAttribute('aria-hidden', 'false');
                    } else {
                        el.setAttribute('inert', '');
                        el.setAttribute('aria-hidden', 'true');
                    }
                }
            });
            MODAL_IDS.forEach(id => {
                const el = document.getElementById(id);
                if (el) observer.observe(el, { attributes: true, attributeFilter: ['class'] });
            });
        },

        setTheme(themeName) {
            const themes = ['green', 'cyan', 'amber', 'red', 'purple'];
            const nextTheme = themes.includes(themeName) ? themeName : 'green';
            document.body.classList.remove('theme-green', 'theme-cyan', 'theme-amber', 'theme-red', 'theme-purple');
            if (nextTheme !== 'green') document.body.classList.add('theme-' + nextTheme);
            try { localStorage.setItem('spectre-theme', nextTheme); } catch (e) {}

            const thLabel = document.getElementById('theme-name');
            if (thLabel) thLabel.textContent = nextTheme.toUpperCase();
            this._updateFavicon(nextTheme);
            if (window.NexusAudio) window.NexusAudio.blip(800, 0.04, 'sine', 0.1);
            return nextTheme;
        },

        cycleTheme() {
            const themes = ['green', 'cyan', 'amber', 'red', 'purple'];
            let current = 'green';
            for (const th of themes) {
                if (document.body.classList.contains('theme-' + th)) current = th;
            }
            const nextIdx = (themes.indexOf(current) + 1) % themes.length;
            return this.setTheme(themes[nextIdx]);
        },

        _updateFavicon(theme) {
            const valid = ['green', 'cyan', 'amber', 'red', 'purple'];
            const t = valid.includes(theme) ? theme : 'green';
            const iconUrl = `/favicons/favicon-${t}.png?v=${Date.now()}`;

            // Remove existing icon links to force browser tab refresh
            const existingLinks = document.querySelectorAll("link[rel*='icon']");
            existingLinks.forEach(el => {
                if (el && el.parentNode) el.parentNode.removeChild(el);
            });

            // Create and append fresh PNG icon link
            const newLink = document.createElement('link');
            newLink.id = 'favicon-link';
            newLink.rel = 'icon';
            newLink.type = 'image/png';
            newLink.sizes = '64x64';
            newLink.href = iconUrl;
            document.head.appendChild(newLink);

            const appleLink = document.querySelector("link[rel='apple-touch-icon']");
            if (appleLink) appleLink.href = iconUrl;
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
            if (ht) {
                ht.addEventListener('click', () => {
                    if (window.Terminal) {
                        window.Terminal.setMode(window.Terminal.mode === 'typer' ? 'command' : 'typer');
                    } else if (window.HackerTyper) {
                        window.HackerTyper.toggle();
                    }
                });
            }

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
