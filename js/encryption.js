/* ============================================================
   NEXUS // ENCRYPTION ENGINE
   Rolling fake hashes / session keys + lock canvas.
   Harmless random strings generated locally.
   ============================================================ */
(function () {
    'use strict';

    const Encryption = {
        canvas: null, ctx: null, dpr: 1, raf: null, t: 0,
        els: {},

        init() {
            this.els = {
                hash: document.getElementById('crypto-hash'),
                session: document.getElementById('crypto-session'),
                genbar: document.getElementById('crypto-genbar'),
                status: document.getElementById('crypto-status')
            };
            this.canvas = document.getElementById('crypto-canvas');
            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                this.resize();
                window.addEventListener('resize', () => this.resize());
                this.loop = this.loop.bind(this);
                this.raf = requestAnimationFrame(this.loop);
            }
            this._roll();
            setInterval(() => this._roll(), 2000);
            setInterval(() => this._rollHashFast(), 220);
        },

        resize() {
            const r = this.canvas.getBoundingClientRect();
            this.dpr = window.devicePixelRatio || 1;
            this.canvas.width = Math.max(2, r.width * this.dpr);
            this.canvas.height = Math.max(2, r.height * this.dpr);
        },

        _rollHashFast() {
            // subtly scramble a few chars of the hash for a "computing" feel
            if (!this.els.hash) return;
            const NX = window.NX;
            this.els.hash.textContent = NX.hex(24) + '...';
        },

        _roll() {
            const NX = window.NX;
            if (this.els.session) this.els.session.textContent = NX.keyBlock(4).slice(0, 19);
        },

        loop() {
            this.t += 0.03;
            this.draw();
            this.raf = requestAnimationFrame(this.loop);
        },

        draw() {
            const ctx = this.ctx;
            const W = this.canvas.width, H = this.canvas.height;
            ctx.clearRect(0, 0, W, H);
            const cx = W / 2, cy = H / 2;
            const dpr = this.dpr;
            const s = Math.min(W, H) * 0.5;

            // padlock shackle (arc)
            ctx.strokeStyle = 'rgba(55, 255, 139, 0.7)';
            ctx.lineWidth = dpr * 2;
            ctx.shadowColor = 'rgba(55,255,139,0.5)';
            ctx.shadowBlur = 6 * dpr;
            ctx.beginPath();
            ctx.arc(cx, cy - s * 0.22, s * 0.26, Math.PI, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // lock body as dot-matrix grid that scrambles
            const bodyW = s * 0.78, bodyH = s * 0.62;
            const bx = cx - bodyW / 2, by = cy - s * 0.02;
            ctx.strokeStyle = 'rgba(55, 255, 139, 0.5)';
            ctx.lineWidth = dpr;
            ctx.strokeRect(bx, by, bodyW, bodyH);

            const cols = 7, rows = 5;
            const cw = bodyW / cols, ch = bodyH / rows;
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const lit = Math.sin(this.t * 2 + i * 0.9 + j * 1.3) > 0.35;
                    if (!lit) continue;
                    const px = bx + i * cw + cw / 2;
                    const py = by + j * ch + ch / 2;
                    ctx.beginPath();
                    ctx.arc(px, py, dpr * 1.4, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(77, 255, 160, 0.85)';
                    ctx.fill();
                }
            }
        }
    };

    window.Encryption = Encryption;
})();
