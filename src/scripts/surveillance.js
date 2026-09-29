/* ============================================================
   SPECTRE-9 // DRONE RECON & CCTV SURVEILLANCE MATRIX
   Multi-channel simulated tactical optical camera feeds,
   thermal FLIR spectrum, and AI target recognition HUD.
   ============================================================ */
(function () {
    'use strict';

    const CHANNELS = [
        { id: 'CAM-01', name: 'ORBITAL RECON DRONE [ALPHA]', location: 'SECTOR-09 PERIMETER' },
        { id: 'CAM-02', name: 'FACILITY INGRESS GATE', location: 'SURFACE GATEWAY 04' },
        { id: 'CAM-03', name: 'SUB-LEVEL SERVER VAULT B3', location: 'QUANTUM CRYPTO LAB' },
        { id: 'CAM-04', name: 'ROOFTOP FLIR THERMAL SWEEP', location: 'ROOFTOP ARRAY 02' }
    ];

    const Surveillance = {
        modal: null,
        canvas: null,
        ctx: null,
        channelIdx: 0,
        mode: 'NVG', // NVG, FLIR, OPTICAL
        active: false,
        t: 0,
        raf: null,
        targets: [],

        init() {
            this.modal = document.getElementById('surveillance-modal');
            this.canvas = document.getElementById('surv-canvas');
            if (this.canvas) this.ctx = this.canvas.getContext('2d');

            const btnClose = document.getElementById('btn-surv-close');
            if (btnClose) btnClose.addEventListener('click', () => this.close());

            const btnNext = document.getElementById('btn-surv-next');
            if (btnNext) btnNext.addEventListener('click', () => this.nextChannel());

            const btnMode = document.getElementById('btn-surv-mode');
            if (btnMode) btnMode.addEventListener('click', () => this.cycleMode());

            if (this.modal) {
                this.modal.addEventListener('click', (e) => {
                    if (e.target === this.modal) this.close();
                });
            }
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.active) this.close();
            });

            // Seed initial targets
            this._seedTargets();
        },

        _seedTargets() {
            this.targets = [
                { x: 120, y: 160, vx: 0.6, vy: 0.2, id: 'T-804 [VEHICLE]', match: '98.4%', speed: '42 KM/H', w: 60, h: 35 },
                { x: 380, y: 220, vx: -0.4, vy: 0.1, id: 'PERSONNEL #14', match: '94.1%', speed: '5.2 KM/H', w: 28, h: 50 },
                { x: 510, y: 130, vx: 0.2, vy: -0.3, id: 'DRONE_UAV_02', match: '99.2%', speed: '68 KM/H', w: 45, h: 25 }
            ];
        },

        toggle() {
            if (this.active) this.close();
            else this.open();
        },

        open() {
            if (!this.modal) return;
            this.active = true;
            this.modal.classList.add('active');
            if (window.NexusAudio) {
                window.NexusAudio.radioStatic();
                window.NexusAudio.blip(880, 0.05, 'sine', 0.1);
            }
            this.resize();
            this.loop = this.loop.bind(this);
            this.raf = requestAnimationFrame(this.loop);
        },

        close() {
            if (!this.active) return;
            this.active = false;
            if (this.rafTimer) cancelAnimationFrame(this.raf);
            if (this.modal) this.modal.classList.remove('active');
            if (window.Terminal) window.Terminal.focus();
        },

        nextChannel() {
            this.channelIdx = (this.channelIdx + 1) % CHANNELS.length;
            if (window.NexusAudio) window.NexusAudio.glitch();
            this._seedTargets();
            this._updateLabels();
        },

        cycleMode() {
            const modes = ['NVG', 'FLIR', 'OPTICAL'];
            const idx = (modes.indexOf(this.mode) + 1) % modes.length;
            this.mode = modes[idx];
            if (window.NexusAudio) window.NexusAudio.blip(740, 0.04, 'square', 0.08);
            this._updateLabels();
        },

        _updateLabels() {
            const ch = CHANNELS[this.channelIdx];
            const chEl = document.getElementById('surv-ch-name');
            if (chEl) chEl.textContent = '[' + ch.id + '] ' + ch.name;
            const locEl = document.getElementById('surv-ch-loc');
            if (locEl) locEl.textContent = 'LOCATION: ' + ch.location;
            const mEl = document.getElementById('surv-mode-label');
            if (mEl) mEl.textContent = 'MODE: ' + this.mode;
        },

        resize() {
            if (!this.canvas) return;
            const r = this.canvas.getBoundingClientRect();
            this.canvas.width = Math.max(300, Math.floor(r.width));
            this.canvas.height = Math.max(200, Math.floor(r.height));
        },

        loop() {
            if (!this.active) return;
            this.t += 0.03;
            this.draw();
            this.raf = requestAnimationFrame(this.loop);
        },

        draw() {
            const ctx = this.ctx;
            const W = this.canvas.width, H = this.canvas.height;
            if (W <= 10 || H <= 10) return;

            // Render background shader simulation based on mode
            if (this.mode === 'NVG') {
                ctx.fillStyle = '#011208';
                ctx.fillRect(0, 0, W, H);
            } else if (this.mode === 'FLIR') {
                ctx.fillStyle = '#100020';
                ctx.fillRect(0, 0, W, H);
            } else {
                ctx.fillStyle = '#060a0d';
                ctx.fillRect(0, 0, W, H);
            }

            // Draw Wireframe Buildings / Grid
            ctx.strokeStyle = this.mode === 'FLIR' ? 'rgba(255, 120, 40, 0.25)' : 'rgba(55, 255, 139, 0.25)';
            ctx.lineWidth = 1;

            // Perspective Grid Ground
            const horizon = H * 0.45;
            ctx.beginPath();
            ctx.moveTo(0, horizon);
            ctx.lineTo(W, horizon);
            for (let i = 0; i <= W; i += 50) {
                ctx.moveTo(i, horizon);
                ctx.lineTo(W / 2 + (i - W / 2) * 2.2, H);
            }
            ctx.stroke();

            // Background Structural Wireframe Silhouettes
            const buildings = [
                { x: W * 0.1, w: W * 0.2, h: horizon * 0.8 },
                { x: W * 0.35, w: W * 0.25, h: horizon * 0.95 },
                { x: W * 0.65, w: W * 0.25, h: horizon * 0.75 }
            ];
            for (const b of buildings) {
                const bY = horizon - b.h;
                if (this.mode === 'FLIR') {
                    ctx.fillStyle = 'rgba(120, 20, 160, 0.4)';
                    ctx.fillRect(b.x, bY, b.w, b.h);
                }
                ctx.strokeRect(b.x, bY, b.w, b.h);
            }

            // Draw & Update Moving Targets
            for (const tgt of this.targets) {
                tgt.x += tgt.vx;
                tgt.y += tgt.vy;
                if (tgt.x < 50 || tgt.x > W - 100) tgt.vx *= -1;
                if (tgt.y < horizon + 20 || tgt.y > H - 60) tgt.vy *= -1;

                // Thermal heat glow in FLIR mode
                if (this.mode === 'FLIR') {
                    const heatGrad = ctx.createRadialGradient(tgt.x + tgt.w / 2, tgt.y + tgt.h / 2, 2, tgt.x + tgt.w / 2, tgt.y + tgt.h / 2, tgt.w);
                    heatGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                    heatGrad.addColorStop(0.4, 'rgba(255, 120, 0, 0.8)');
                    heatGrad.addColorStop(1, 'rgba(180, 0, 100, 0)');
                    ctx.fillStyle = heatGrad;
                    ctx.fillRect(tgt.x - 10, tgt.y - 10, tgt.w + 20, tgt.h + 20);
                }

                // AI Bounding Box
                ctx.strokeStyle = this.mode === 'FLIR' ? 'rgba(255, 220, 60, 0.9)' : 'rgba(77, 255, 160, 0.9)';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(tgt.x, tgt.y, tgt.w, tgt.h);

                // Corner brackets
                const bLen = 6;
                ctx.strokeStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(tgt.x - 2, tgt.y + bLen); ctx.lineTo(tgt.x - 2, tgt.y - 2); ctx.lineTo(tgt.x + bLen, tgt.y - 2);
                ctx.moveTo(tgt.x + tgt.w + 2, tgt.y + bLen); ctx.lineTo(tgt.x + tgt.w + 2, tgt.y - 2); ctx.lineTo(tgt.x + tgt.w - bLen, tgt.y - 2);
                ctx.stroke();

                // Target Tag
                ctx.fillStyle = '#ffffff';
                ctx.font = '700 9px "JetBrains Mono", monospace';
                ctx.fillText(tgt.id, tgt.x, tgt.y - 6);
                ctx.fillStyle = this.mode === 'FLIR' ? 'rgba(255, 200, 100, 0.9)' : 'rgba(127, 230, 171, 0.85)';
                ctx.font = '8px "JetBrains Mono", monospace';
                ctx.fillText(tgt.match + ' // ' + tgt.speed, tgt.x, tgt.y + tgt.h + 12);
            }

            // Crosshair Reticle Center
            const cx = W / 2, cy = H / 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - 24, cy); ctx.lineTo(cx - 6, cy);
            ctx.moveTo(cx + 6, cy); ctx.lineTo(cx + 24, cy);
            ctx.moveTo(cx, cy - 24); ctx.lineTo(cx, cy - 6);
            ctx.moveTo(cx, cy + 6); ctx.lineTo(cx, cy + 24);
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.stroke();

            // Optical HUD Overlay
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.font = '10px "JetBrains Mono", monospace';
            ctx.fillText('REC ● 24 FPS', 18, 24);
            ctx.fillText('ZOOM: 14.8X // HEADING: 284° WNW', 18, 42);
            ctx.fillText('PTZ: [34.82, -118.24] // ELEV: 480M', W - 240, 24);
        }
    };

    window.Surveillance = Surveillance;
})();
