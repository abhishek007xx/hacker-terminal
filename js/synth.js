/* ============================================================
   SPECTRE-9 // PROCEDURAL CYBERPUNK DARK SYNTHWAVE MUSIC ENGINE
   100% synthesized analog dark-synth basslines, arpeggios,
   resonant filter sweeps, and tape-hiss texture via Web Audio API.
   Zero external audio files required.
   ============================================================ */
(function () {
    'use strict';

    const Synth = {
        ctx: null,
        master: null,
        filter: null,
        running: false,
        timer: null,
        bpm: 116,
        step: 0,
        scale: [36.71, 41.20, 43.65, 49.00, 55.00, 61.74, 65.41, 73.42], // D minor pentatonic/aeolian bass notes
        arpPattern: [0, 2, 3, 5, 3, 2, 4, 1],

        init() {
            // Lazy initialization on first play toggle to conform to autoplay policies
            const btn = document.getElementById('btn-synth');
            if (btn) {
                btn.addEventListener('click', () => this.toggle());
            }
        },

        _initAudio() {
            if (this.ctx) return;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            this.ctx = new AudioContext();

            this.master = this.ctx.createGain();
            this.master.gain.value = 0.18;

            this.filter = this.ctx.createBiquadFilter();
            this.filter.type = 'lowpass';
            this.filter.frequency.value = 850;
            this.filter.Q.value = 4.5;

            this.filter.connect(this.master);
            this.master.connect(this.ctx.destination);

            this._startNoiseFloor();
        },

        toggle() {
            this._initAudio();
            if (!this.ctx) return;

            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            this.running = !this.running;
            const btn = document.getElementById('btn-synth');
            if (btn) {
                btn.classList.toggle('active', this.running);
                btn.title = this.running ? 'Ambient Synth: RUNNING' : 'Ambient Synth: MUTED';
                const label = document.getElementById('synth-label');
                if (label) label.textContent = this.running ? 'SYNTH: ON' : 'SYNTH: OFF';
            }

            if (this.running) {
                this._startSequencer();
                if (window.EventLog) window.EventLog.push('INFO', 'Procedural cyber synthwave audio stream started.');
            } else {
                this._stopSequencer();
            }
        },

        _startNoiseFloor() {
            try {
                // Subtle analog tape texture / white noise
                const bufferSize = this.ctx.sampleRate * 2;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * 0.008;
                }
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;
                noise.loop = true;
                const noiseGain = this.ctx.createGain();
                noiseGain.gain.value = 0.015;
                noise.connect(noiseGain);
                noiseGain.connect(this.master);
                noise.start();
            } catch (e) {}
        },

        _startSequencer() {
            const stepDur = (60 / this.bpm) / 2; // 16th note steps
            this.step = 0;

            const tick = () => {
                if (!this.running) return;
                const now = this.ctx.currentTime;

                // Modulate low-pass filter frequency for analog breathing effect
                const lfo = Math.sin(now * 0.4) * 450 + 950;
                this.filter.frequency.setTargetAtTime(lfo, now, 0.08);

                // Play bass synth pluck
                const noteIdx = this.arpPattern[this.step % this.arpPattern.length];
                const freq = this.scale[noteIdx % this.scale.length] * 2; // Base octave
                this._playNote(freq, now, stepDur * 0.9);

                // Sub-bass drone on downbeats
                if (this.step % 4 === 0) {
                    const subFreq = this.scale[0]; // deep root note ~36.7 Hz
                    this._playSub(subFreq, now, stepDur * 3.8);
                }

                // Synth kick pulse on beats 0 & 8
                if (this.step % 8 === 0 || this.step % 8 === 4) {
                    this._playKick(now);
                }

                this.step++;
                this.timer = setTimeout(tick, stepDur * 1000);
            };
            tick();
        },

        _stopSequencer() {
            if (this.timer) clearTimeout(this.timer);
            this.timer = null;
        },

        _playNote(freq, when, dur) {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, when);

            g.gain.setValueAtTime(0.0001, when);
            g.gain.exponentialRampToValueAtTime(0.22, when + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

            osc.connect(g);
            g.connect(this.filter);
            osc.start(when);
            osc.stop(when + dur + 0.05);
        },

        _playSub(freq, when, dur) {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, when);

            g.gain.setValueAtTime(0.0001, when);
            g.gain.exponentialRampToValueAtTime(0.35, when + 0.04);
            g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

            osc.connect(g);
            g.connect(this.master);
            osc.start(when);
            osc.stop(when + dur + 0.05);
        },

        _playKick(when) {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, when);
            osc.frequency.exponentialRampToValueAtTime(32, when + 0.12);

            g.gain.setValueAtTime(0.4, when);
            g.gain.exponentialRampToValueAtTime(0.0001, when + 0.15);

            osc.connect(g);
            g.connect(this.master);
            osc.start(when);
            osc.stop(when + 0.16);
        }
    };

    window.NexusSynth = Synth;
})();
