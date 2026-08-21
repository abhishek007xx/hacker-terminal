/* ============================================================
   NEXUS // WORLD MAP (dot-matrix)
   Simulated global view with pulsing target dots. Local only.
   ============================================================ */
(function () {
    'use strict';

    // A very rough dot-matrix world silhouette (rows of 1/0-ish density).
    // Purely decorative — not real geography data.
    const MAP = [
        "00011100000000000000011111100000000000",
        "00111111000000000011111111111000011000",
        "01111111100000001111111111111100111100",
        "00111111110000011111111111111111111110",
        "00011111100000111111111111111111111100",
        "00001111000001111111111100111111111000",
        "00000110000011111111000000011111100000",
        "00000000000001111100000000001111000000",
        "00000000000000111000000000011111100000",
        "00000000000000011000000000111111000000",
        "00000000000000011100000001111110000000",
        "00000000000000001110000011111000000000",
        "00000000000000000110000011100000000000",
        "00000000000000000010000001000000000000"
    ];

    const WorldMap = {
        canvas: null,
        ctx: null,
        dpr: 1,
        cols: 0,
        rows: 0,
        targets: [],
        raf: null,
        t: 0,

        init() {
            this.canvas = document.getElementById('worldmap-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.rows = MAP.length;
            this.cols = MAP[0].length;
            this.resize();
            window.addEventListener('resize', () => this.resize());
            if (window.ResizeObserver && this.canvas.parentElement) {
                const ro = new ResizeObserver(() => this.resize());
                ro.observe(this.canvas.parentElement);
            }
            this._makeTargets();
            this.loop = this.loop.bind(this);
            this.raf = requestAnimationFrame(this.loop);
        },

        resize() {
            if (!this.canvas) return;
            const r = this.canvas.getBoundingClientRect();
            this.dpr = window.devicePixelRatio || 1;
            this.canvas.width = Math.max(2, Math.floor(r.width * this.dpr));
            this.canvas.height = Math.max(2, Math.floor(r.height * this.dpr));
        },

        _makeTargets() {
            this.targets = [];
            const n = 5;
            let placed = 0, guard = 0;
            while (placed < n && guard < 200) {
                guard++;
                const x = Math.floor(Math.random() * this.cols);
                const y = Math.floor(Math.random() * this.rows);
                if (MAP[y][x] === '1') {
                    this.targets.push({ x, y, phase: Math.random() * Math.PI * 2, speed: 0.03 + Math.random() * 0.04 });
                    placed++;
                }
            }
        },

        loop() {
            this.t += 1;
            this.draw();
            this.raf = requestAnimationFrame(this.loop);
        },

        draw() {
            const ctx = this.ctx;
            const W = this.canvas.width, H = this.canvas.height;
            if (W <= 10 || H <= 10) return;
            ctx.clearRect(0, 0, W, H);

            const cw = W / this.cols;
            const ch = H / this.rows;
            const dot = Math.min(cw, ch) * 0.32;

            // base dots
            for (let y = 0; y < this.rows; y++) {
                for (let x = 0; x < this.cols; x++) {
                    if (MAP[y][x] === '1') {
                        const px = x * cw + cw / 2;
                        const py = y * ch + ch / 2;
                        ctx.beginPath();
                        ctx.arc(px, py, dot, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(45, 200, 120, 0.35)';
                        ctx.fill();
                    }
                }
            }

            // pulsing targets
            for (const tgt of this.targets) {
                tgt.phase += tgt.speed;
                const px = tgt.x * cw + cw / 2;
                const py = tgt.y * ch + ch / 2;
                const pulse = (Math.sin(tgt.phase) + 1) / 2;
                const rad = dot + pulse * dot * 3.5;

                ctx.beginPath();
                ctx.arc(px, py, rad, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(63, 224, 255, ' + (0.5 - pulse * 0.4) + ')';
                ctx.lineWidth = this.dpr;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(px, py, dot * 1.3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(77, 255, 160, 0.95)';
                ctx.shadowColor = 'rgba(77,255,160,0.9)';
                ctx.shadowBlur = 6 * this.dpr;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    };

    window.WorldMap = WorldMap;
})();
