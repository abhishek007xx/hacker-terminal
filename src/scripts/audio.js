/* ============================================================
   NEXUS // AUDIO ENGINE
   All sounds synthesized via Web Audio API (no files).
   Arms only after first user interaction. Visible mute toggle.
   ============================================================ */
(function () {
    'use strict';

    const NexusAudio = {
        ctx: null,
        master: null,
        hum: null,
        humGain: null,
        enabled: true,
        armed: false,

        init() {
            // Respect stored preference
            try {
                const stored = localStorage.getItem('nexus-muted');
                if (stored === '1') this.enabled = false;
            } catch (e) { /* ignore */ }
            if (!this.enabled) document.body.classList.add('muted');
        },

        // Create context lazily after a user gesture
        arm() {
            if (this.armed) return;
            try {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return;
                this.ctx = new AC();
                this.master = this.ctx.createGain();
                this.master.gain.value = this.enabled ? 0.5 : 0.0;
                this.master.connect(this.ctx.destination);
                this.armed = true;
                this._startHum();
            } catch (e) { /* audio unavailable */ }
        },

        resume() {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => { });
            }
        },

        setEnabled(on) {
            this.enabled = on;
            document.body.classList.toggle('muted', !on);
            try { localStorage.setItem('nexus-muted', on ? '0' : '1'); } catch (e) { }
            if (this.master) {
                const now = this.ctx.currentTime;
                this.master.gain.cancelScheduledValues(now);
                this.master.gain.linearRampToValueAtTime(on ? 0.5 : 0.0, now + 0.15);
            }
        },

        toggle() {
            this.arm();
            this.resume();
            this.setEnabled(!this.enabled);
            if (this.enabled) this.blip(660, 0.05, 'sine', 0.2);
        },

        // ---- low-level tone ----
        tone(freq, dur, type, gain, when) {
            if (!this.ctx || !this.enabled) return;
            const t = (when || this.ctx.currentTime);
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = type || 'square';
            osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(gain || 0.15, t + 0.008);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(g);
            g.connect(this.master);
            osc.start(t);
            osc.stop(t + dur + 0.02);
        },

        blip(freq, dur, type, gain) {
            if (!this.armed) return;
            this.tone(freq || 880, dur || 0.04, type || 'square', gain || 0.08);
        },

        // Soft keystroke — randomized pitch
        key() {
            if (!this.armed || !this.enabled) return;
            const f = 320 + Math.random() * 260;
            this.tone(f, 0.03, 'square', 0.03);
        },

        // Confirmation beep (two ascending)
        confirm() {
            if (!this.armed) return;
            const now = this.ctx ? this.ctx.currentTime : 0;
            this.tone(720, 0.06, 'sine', 0.12, now);
            this.tone(1080, 0.09, 'sine', 0.12, now + 0.07);
        },

        // Warning beep
        warn() {
            if (!this.armed) return;
            const now = this.ctx ? this.ctx.currentTime : 0;
            this.tone(440, 0.12, 'sawtooth', 0.1, now);
            this.tone(360, 0.14, 'sawtooth', 0.1, now + 0.13);
        },

        // Connection / sweep sound
        connect() {
            if (!this.ctx || !this.enabled) return;
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, t);
            osc.frequency.exponentialRampToValueAtTime(880, t + 0.4);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.12, t + 0.05);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
            osc.connect(g); g.connect(this.master);
            osc.start(t); osc.stop(t + 0.5);
        },

        // Glitch noise burst
        glitch() {
            if (!this.ctx || !this.enabled) return;
            const t = this.ctx.currentTime;
            const bufferSize = this.ctx.sampleRate * 0.25;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
            }
            const src = this.ctx.createBufferSource();
            src.buffer = buffer;
            const g = this.ctx.createGain();
            g.gain.value = 0.12;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1200;
            src.connect(filter); filter.connect(g); g.connect(this.master);
            src.start(t);
        },

        // Deep boot rumble
        boot() {
            if (!this.ctx || !this.enabled) return;
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(60, t);
            osc.frequency.exponentialRampToValueAtTime(180, t + 1.2);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.18, t + 0.3);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
            osc.connect(g); g.connect(this.master);
            osc.start(t); osc.stop(t + 1.5);
        },

        // EMP shockwave blast (heavy sub-bass + resonance drop)
        emp() {
            if (!this.ctx || !this.enabled) return;
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, t);
            osc.frequency.exponentialRampToValueAtTime(24, t + 1.2);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.35, t + 0.05);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, t);
            filter.frequency.exponentialRampToValueAtTime(60, t + 1.2);
            osc.connect(filter); filter.connect(g); g.connect(this.master);
            osc.start(t); osc.stop(t + 1.6);
        },

        // Sonar ping with reverberation tail
        sonar() {
            if (!this.ctx || !this.enabled) return;
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1440, t);
            osc.frequency.exponentialRampToValueAtTime(1380, t + 0.8);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.2, t + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
            osc.connect(g); g.connect(this.master);
            osc.start(t); osc.stop(t + 1.0);
        },

        // Tactical radio communication static burst
        radioStatic() {
            if (!this.ctx || !this.enabled) return;
            const t = this.ctx.currentTime;
            const len = Math.floor(this.ctx.sampleRate * 0.12);
            const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 2200;
            filter.Q.value = 3;
            const g = this.ctx.createGain();
            g.gain.value = 0.08;
            src.connect(filter); filter.connect(g); g.connect(this.master);
            src.start(t);
        },

        // Geiger counter click
        geiger() {
            if (!this.ctx || !this.enabled) return;
            this.tone(1800 + Math.random() * 800, 0.008, 'sawtooth', 0.04);
        },

        // DEFCON emergency siren
        defcon(level) {
            if (!this.ctx || !this.enabled) return;
            const now = this.ctx.currentTime;
            const f1 = level === 1 ? 880 : 660;
            const f2 = level === 1 ? 440 : 520;
            this.tone(f1, 0.18, 'sawtooth', 0.14, now);
            this.tone(f2, 0.18, 'sawtooth', 0.14, now + 0.2);
            this.tone(f1, 0.18, 'sawtooth', 0.14, now + 0.4);
            this.tone(f2, 0.18, 'sawtooth', 0.14, now + 0.6);
        },

        // Tactical morse telemetry
        morse() {
            if (!this.ctx || !this.enabled) return;
            const now = this.ctx.currentTime;
            const pattern = [0.05, 0.05, 0.12, 0.05, 0.05];
            let acc = now;
            for (const dur of pattern) {
                this.tone(1200, dur, 'sine', 0.06, acc);
                acc += dur + 0.04;
            }
        },

        // Continuous soft electronic hum bed
        _startHum() {
            if (!this.ctx) return;
            try {
                this.hum = this.ctx.createOscillator();
                const osc2 = this.ctx.createOscillator();
                this.humGain = this.ctx.createGain();
                const lfo = this.ctx.createOscillator();
                const lfoGain = this.ctx.createGain();

                this.hum.type = 'sine';
                this.hum.frequency.value = 55;
                osc2.type = 'sine';
                osc2.frequency.value = 110.5; // slight beat
                this.humGain.gain.value = 0.022;

                lfo.type = 'sine';
                lfo.frequency.value = 0.15;
                lfoGain.gain.value = 0.01;
                lfo.connect(lfoGain);
                lfoGain.connect(this.humGain.gain);

                this.hum.connect(this.humGain);
                osc2.connect(this.humGain);
                this.humGain.connect(this.master);
                this.hum.start();
                osc2.start();
                lfo.start();
            } catch (e) { /* ignore */ }
        }
    };

    NexusAudio.init();
    window.NexusAudio = NexusAudio;
})();
