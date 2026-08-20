/* ============================================================
   NEXUS // BOOT SEQUENCE
   Cinematic loading screen. Types kernel messages, animates a
   progress bar, then reveals the main interface. All local.
   ============================================================ */
(function () {
    'use strict';

    const LOGO =
        "  _   _ _______  ___   _ ____  \n" +
        " | \\ | | ____\\ \\/ / | | / ___| \n" +
        " |  \\| |  _|  \\  /| | | \\___ \\ \n" +
        " | |\\  | |___ /  \\| |_| |___) |\n" +
        " |_| \\_|_____/_/\\_\\\\___/|____/ \n" +
        "        N E X U S   O S   v4.7.21";

    const STEPS = [
        'Initializing kernel...',
        'Loading encryption module...',
        'Loading network interface...',
        'Mounting virtual filesystem...',
        'Calibrating proxy chain...',
        'Initializing secure shell...'
    ];

    const Boot = {
        screen: null, logoEl: null, logEl: null,
        fill: null, label: null, ready: null, enterBtn: null,
        started: false, done: false,

        init(onEnter) {
            this.onEnter = onEnter;
            this.screen = document.getElementById('boot-screen');
            this.logoEl = document.getElementById('boot-logo');
            this.logEl = document.getElementById('boot-log');
            this.fill = document.getElementById('boot-progress-fill');
            this.label = document.getElementById('boot-progress-label');
            this.ready = document.getElementById('boot-ready');
            this.enterBtn = document.getElementById('boot-enter-btn');

            if (this.enterBtn) {
                this.enterBtn.addEventListener('click', () => this.enter());
            }
            // Allow Enter/Space to proceed once ready
            document.addEventListener('keydown', (e) => {
                if (this.done && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    this.enter();
                }
            });
        },

        async run() {
            if (this.started) return;
            this.started = true;
            const NX = window.NX;

            // Arm audio on first user gesture (handled by main); attempt anyway
            if (this.logoEl) {
                // reveal logo char-fade
                this.logoEl.textContent = LOGO;
                this.logoEl.style.opacity = '0';
                this.logoEl.style.transition = 'opacity 0.6s ease';
                requestAnimationFrame(() => { this.logoEl.style.opacity = '1'; });
            }
            await NX.sleep(700);

            const total = STEPS.length;
            for (let i = 0; i < total; i++) {
                const lineWrap = document.createElement('span');
                lineWrap.className = 'boot-line';
                this.logEl.appendChild(lineWrap);

                await this._typeInto(lineWrap, STEPS[i], 16);
                const ok = document.createElement('span');
                ok.className = 'boot-ok';
                ok.textContent = '  [OK]';
                lineWrap.appendChild(ok);

                if (window.NexusAudio) window.NexusAudio.blip(520 + i * 60, 0.04, 'square', 0.05);

                const pct = Math.round(((i + 1) / total) * 100);
                this._setProgress(pct);
                await NX.sleep(180 + Math.random() * 220);
            }

            this._setProgress(100);
            await NX.sleep(400);

            // ready
            this.done = true;
            if (this.ready) this.ready.classList.add('show');
            if (window.NexusAudio) window.NexusAudio.confirm();
        },

        _setProgress(pct) {
            if (this.fill) this.fill.style.width = pct + '%';
            if (this.label) this.label.textContent = pct + '%';
        },

        _typeInto(el, text, speed) {
            return new Promise((resolve) => {
                let i = 0;
                const txt = document.createTextNode('');
                el.appendChild(txt);
                const step = () => {
                    txt.textContent += text[i];
                    i++;
                    if (window.NexusAudio && Math.random() < 0.4) window.NexusAudio.key();
                    if (i < text.length) setTimeout(step, speed);
                    else resolve();
                };
                step();
            });
        },

        enter() {
            if (!this.done) return;
            this.done = false; // prevent double
            if (window.NexusAudio) { window.NexusAudio.arm(); window.NexusAudio.resume(); window.NexusAudio.connect(); }
            if (this.screen) this.screen.classList.add('hidden');
            document.body.classList.remove('pre-boot');
            setTimeout(() => {
                if (this.screen) this.screen.style.display = 'none';
                if (typeof this.onEnter === 'function') this.onEnter();
            }, 620);
        }
    };

    window.Boot = Boot;
})();
