/* ============================================================
   NEXUS // RADAR SWEEP (system monitor)
   Rotating sweep with simulated blips. Local only.
   ============================================================ */
(function () {
    'use strict';

    const Radar = {
        canvas: null, ctx: null, dpr: 1,
        angle: 0, blips: [], raf: null,

        init() {
            this.canvas = document.getElementById('radar-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this._seedBlips();
            this.loop = this.loop.bind(this);
            this.raf = requestAnimationFrame(this.loop);
            // occasionally reseed blips
            setInterval(() => this._seedBlips(), 6000);
        },

        resize() {
            const r = this.canvas.getBoundingClientRect();
            this.dpr = window.devicePixelRatio || 1;
            this.canvas.width = Math.max(2, r.width * this.dpr);
            this.canvas.height = Math.max(2, r.height * this.dpr);
        },

        _seedBlips() {
            this.blips = [];
            const n = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < n; i++) {
                this.blips.push({
                    a: Math.random() * Math.PI * 2,
                    r: 0.25 + Math.random() * 0.65,
                    lit: 0
                });
            }
        },

        loop() {
            this.angle += 0.02;
            if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
            this.draw();
            this.raf = requestAnimationFrame(this.loop);
        },

        draw() {
            const ctx = this.ctx;
            const W = this.canvas.width, H = this.canvas.height;
            const cx = W / 2, cy = H / 2;
            const R = Math.min(W, H) / 2 - this.dpr * 2;
            ctx.clearRect(0, 0, W, H);

            // rings
            ctx.strokeStyle = 'rgba(45, 220, 130, 0.22)';
            ctx.lineWidth = this.dpr;
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.arc(cx, cy, (R * i) / 3, 0, Math.PI * 2);
                ctx.stroke();
            }
            // cross-hair
            ctx.beginPath();
            ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy);
            ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R);
            ctx.strokeStyle = 'rgba(45, 220, 130, 0.14)';
            ctx.stroke();

            // sweep gradient wedge
            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
            grad.addColorStop(0, 'rgba(55, 255, 139, 0.25)');
            grad.addColorStop(1, 'rgba(55, 255, 139, 0)');
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, R, -0.4, 0);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.fill();
            // leading line
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(R, 0);
            ctx.strokeStyle = 'rgba(77, 255, 160, 0.7)';
            ctx.lineWidth = this.dpr * 1.4;
            ctx.stroke();
            ctx.restore();

            // blips — light up when sweep passes
            for (const b of this.blips) {
                let diff = this.angle - b.a;
                diff = ((diff % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
                if (diff < 0.18) b.lit = 1;
                b.lit *= 0.97;
                if (b.lit < 0.02) continue;
                const px = cx + Math.cos(b.a) * b.r * R;
                const py = cy + Math.sin(b.a) * b.r * R;
                ctx.beginPath();
                ctx.arc(px, py, this.dpr * 2.2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(77, 255, 160, ' + b.lit + ')';
                ctx.shadowColor = 'rgba(77,255,160,' + b.lit + ')';
                ctx.shadowBlur = 8 * this.dpr;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    };

    window.Radar = Radar;
})();
