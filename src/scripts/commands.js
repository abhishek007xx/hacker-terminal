/* ============================================================
   NEXUS // FX CONTROLLER + shared UI effects
   (Interactive command implementations live in terminal.js.)
   This module exposes window.FX for glitch flashes, screen
   shake, and the simulated TRACE meter. All purely cosmetic.
   ============================================================ */
(function () {
    'use strict';

    const FX = {
        glitchEl: null,
        traceEl: null,
        traceVal: 0,
        _traceTimer: null,

        init() {
            this.glitchEl = document.getElementById('fx-glitch');
            this.traceEl = document.getElementById('trace-value');
            this._driftTrace();
        },

        // Brief glitch flash overlay; strong=true adds screen shake
        glitch(strong) {
            if (this.glitchEl) {
                this.glitchEl.classList.remove('active');
                // force reflow to restart animation
                void this.glitchEl.offsetWidth;
                this.glitchEl.classList.add('active');
                setTimeout(() => this.glitchEl && this.glitchEl.classList.remove('active'), 700);
            }
            if (strong) this.shake();
        },

        shake(ms) {
            document.body.classList.add('screen-shake');
            setTimeout(() => document.body.classList.remove('screen-shake'), ms || 400);
        },

        // TRACE meter hovers near 0% (we are "safe"), with tiny flickers
        _driftTrace() {
            const tick = () => {
                // occasionally blip up then settle back to 0
                if (Math.random() < 0.25) {
                    this.traceVal = window.NX ? window.NX.randInt(1, 6) : 3;
                } else {
                    this.traceVal = 0;
                }
                this._renderTrace();
                this._traceTimer = setTimeout(tick, 2600 + Math.random() * 2600);
            };
            tick();
        },

        // Push trace up during dramatic events, then decay
        raiseTrace(target) {
            target = target || 40;
            let v = this.traceVal;
            const step = () => {
                v += (target - v) * 0.25 + 1;
                this.traceVal = Math.min(target, Math.round(v));
                this._renderTrace();
                if (this.traceVal < target - 1) {
                    setTimeout(step, 90);
                } else {
                    // decay back to 0
                    setTimeout(() => this._decayTrace(), 900);
                }
            };
            step();
        },

        _decayTrace() {
            const step = () => {
                this.traceVal = Math.max(0, this.traceVal - (window.NX ? window.NX.randInt(2, 7) : 4));
                this._renderTrace();
                if (this.traceVal > 0) setTimeout(step, 120);
            };
            step();
        },

        _renderTrace() {
            if (!this.traceEl) return;
            this.traceEl.textContent = this.traceVal + '%';
            const led = document.getElementById('led-trace');
            if (led) {
                led.classList.toggle('led-red', this.traceVal >= 30);
            }
        }
    };

    window.FX = FX;
})();
