/* ============================================================
   SPECTRE-9 // SATELLITE ORBITAL RECON TRACKER
   Visualizes orbital ground tracks, telemetry locks, and
   Ku-band radio intercepts for classified orbital reconnaissance.
   All client-side simulation.
   ============================================================ */
(function () {
    'use strict';

    const SatFeed = {
        canvas: null,
        ctx: null,
        dpr: 1,
        t: 0,
        raf: null,
        orbitPhase: 0,
        azimuthEl: null,
        elevationEl: null,
        freqEl: null,
        packetsCount: 4182,

        init() {
            this.canvas = document.getElementById('sat-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.azimuthEl = document.getElementById('sat-azimuth');
            this.elevationEl = document.getElementById('sat-elevation');
            this.freqEl = document.getElementById('sat-freq');

            this.resize();
            window.addEventListener('resize', () => this.resize());
            if (window.ResizeObserver && this.canvas.parentElement) {
                const ro = new ResizeObserver(() => this.resize());
                ro.observe(this.canvas.parentElement);
            }

            this.loop = this.loop.bind(this);
            this.raf = requestAnimationFrame(this.loop);
            setInterval(() => this._tickTelemetry(), 800);
        },

        resize() {
            if (!this.canvas) return;
            const r = this.canvas.getBoundingClientRect();
            this.dpr = window.devicePixelRatio || 1;
            this.canvas.width = Math.max(2, Math.floor(r.width * this.dpr));
            this.canvas.height = Math.max(2, Math.floor(r.height * this.dpr));
        },

        _tickTelemetry() {
            this.packetsCount += Math.floor(Math.random() * 14 + 3);
            const pkEl = document.getElementById('sat-packets');
            if (pkEl) pkEl.textContent = this.packetsCount.toLocaleString();

            if (this.azimuthEl) {
                const az = (142.4 + Math.sin(this.t * 0.02) * 12).toFixed(1);
                this.azimuthEl.textContent = az + '°';
            }
            if (this.elevationEl) {
                const el = (58.2 + Math.cos(this.t * 0.03) * 6).toFixed(1);
                this.elevationEl.textContent = el + '°';
            }
        },

        surge() {
            this.packetsCount += 500;
            if (window.NexusAudio) window.NexusAudio.sonar();
        },

        loop() {
            this.t += 0.04;
            this.orbitPhase += 0.008;
            if (this.orbitPhase > Math.PI * 2) this.orbitPhase -= Math.PI * 2;
            this.draw();
            this.raf = requestAnimationFrame(this.loop);
        },

        draw() {
            const ctx = this.ctx;
            const W = this.canvas.width, H = this.canvas.height;
            if (W <= 10 || H <= 10) return;
            ctx.clearRect(0, 0, W, H);
            const dpr = this.dpr;

            // Background latitude / longitude grid lines
            ctx.strokeStyle = 'rgba(45, 220, 130, 0.1)';
            ctx.lineWidth = dpr;
            const gridCols = 8, gridRows = 4;
            for (let i = 1; i < gridCols; i++) {
                const x = (W / gridCols) * i;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, H);
                ctx.stroke();
            }
            for (let i = 1; i < gridRows; i++) {
                const y = (H / gridRows) * i;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(W, y);
                ctx.stroke();
            }

            // Orbital ground track sine wave
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(63, 224, 255, 0.45)';
            ctx.lineWidth = 1.5 * dpr;
            const amplitude = H * 0.32;
            const midY = H * 0.5;
            for (let x = 0; x <= W; x += 4) {
                const y = midY + Math.sin((x / W) * Math.PI * 2 + this.orbitPhase) * amplitude;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Satellite position on the orbital track
            const satNormX = ((this.t * 0.15) % 1);
            const satX = satNormX * W;
            const satY = midY + Math.sin(satNormX * Math.PI * 2 + this.orbitPhase) * amplitude;

            // Signal transmission cone / footprint
            const conePulse = (Math.sin(this.t * 3) + 1) / 2;
            ctx.beginPath();
            ctx.arc(satX, satY, 18 * dpr + conePulse * 8 * dpr, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(55, 255, 139, ' + (0.4 - conePulse * 0.25) + ')';
            ctx.lineWidth = dpr;
            ctx.stroke();

            // Satellite Diamond Glyph
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.shadowColor = 'rgba(63, 224, 255, 0.9)';
            ctx.shadowBlur = 8 * dpr;
            ctx.beginPath();
            ctx.moveTo(satX, satY - 5 * dpr);
            ctx.lineTo(satX + 5 * dpr, satY);
            ctx.lineTo(satX, satY + 5 * dpr);
            ctx.lineTo(satX - 5 * dpr, satY);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;

            // Solar panels
            ctx.strokeStyle = 'rgba(63, 224, 255, 0.9)';
            ctx.lineWidth = 1.5 * dpr;
            ctx.beginPath();
            ctx.moveTo(satX - 11 * dpr, satY);
            ctx.lineTo(satX - 5 * dpr, satY);
            ctx.moveTo(satX + 5 * dpr, satY);
            ctx.lineTo(satX + 11 * dpr, satY);
            ctx.stroke();

            // Target crosshair & label
            ctx.fillStyle = 'rgba(77, 255, 160, 0.9)';
            ctx.font = '700 ' + (8 * dpr) + 'px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText('SPECTRE-SAT-09', Math.min(W - 90 * dpr, satX + 14 * dpr), satY - 6 * dpr);

            ctx.fillStyle = 'rgba(120, 200, 160, 0.7)';
            ctx.font = (6.5 * dpr) + 'px "JetBrains Mono", monospace';
            ctx.fillText('KU-LOCK: ACTIVE', Math.min(W - 90 * dpr, satX + 14 * dpr), satY + 4 * dpr);
        }
    };

    window.SatFeed = SatFeed;
})();
