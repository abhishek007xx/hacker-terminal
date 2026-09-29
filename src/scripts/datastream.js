/* ============================================================
   NEXUS // DATA STREAM
   Subtle scrolling hex/binary/key columns + tiny bar viz.
   Purely decorative, generated locally.
   ============================================================ */
(function () {
    'use strict';

    const DataStream = {
        hexEl: null, asciiEl: null, canvas: null, ctx: null,
        dpr: 1, bars: [], raf: null, t: 0,
        hexLines: [], asciiLines: [],
        maxLines: 8,

        init() {
            this.hexEl = document.getElementById('ds-hex');
            this.asciiEl = document.getElementById('ds-ascii');
            this.canvas = document.getElementById('ds-canvas');

            if (this.canvas) {
                this.ctx = this.canvas.getContext('2d');
                this.resize();
                window.addEventListener('resize', () => this.resize());
                if (window.ResizeObserver && this.canvas.parentElement) {
                    const ro = new ResizeObserver(() => this.resize());
                    ro.observe(this.canvas.parentElement);
                }
                this._seedBars();
                this.loop = this.loop.bind(this);
                this.raf = requestAnimationFrame(this.loop);
            }

            // seed text
            for (let i = 0; i < this.maxLines; i++) {
                this.hexLines.push(this._hexLine());
                this.asciiLines.push(this._asciiLine());
            }
            this._renderText();
            setInterval(() => this._tickText(), 420);
        },

        resize() {
            if (!this.canvas) return;
            const r = this.canvas.getBoundingClientRect();
            this.dpr = window.devicePixelRatio || 1;
            this.canvas.width = Math.max(2, Math.floor(r.width * this.dpr));
            this.canvas.height = Math.max(2, Math.floor(r.height * this.dpr));
        },

        _hexLine() {
            const NX = window.NX;
            const kind = Math.random();
            if (kind < 0.5) return NX.hexBytes(8);
            if (kind < 0.7) return '0x' + NX.hex(8) + '  ' + NX.keyBlock(2);
            if (kind < 0.85) return NX.binary(16);
            return NX.keyBlock(3);
        },

        _asciiLine() {
            // ELF-header-ish decorative garble
            const glyphs = ".ELF..>.|.....!.#.@.^~.:{.};.=-<>_/*";
            let s = '';
            for (let i = 0; i < 18; i++) s += glyphs[Math.floor(Math.random() * glyphs.length)];
            return s;
        },

        _tickText() {
            this.hexLines.push(this._hexLine());
            this.asciiLines.push(this._asciiLine());
            if (this.hexLines.length > this.maxLines) this.hexLines.shift();
            if (this.asciiLines.length > this.maxLines) this.asciiLines.shift();
            this._renderText();
        },

        _renderText() {
            if (this.hexEl) this.hexEl.textContent = this.hexLines.join('\n');
            if (this.asciiEl) this.asciiEl.textContent = this.asciiLines.join('\n');
        },

        _seedBars() {
            this.bars = [];
            const n = 32;
            for (let i = 0; i < n; i++) this.bars.push(Math.random());
        },

        loop() {
            this.t += 0.05;
            // update bars slowly
            for (let i = 0; i < this.bars.length; i++) {
                const target = (Math.sin(this.t + i * 0.5) + 1) / 2 * 0.7 + Math.random() * 0.3;
                this.bars[i] += (target - this.bars[i]) * 0.1;
            }
            this.draw();
            this.raf = requestAnimationFrame(this.loop);
        },

        draw() {
            const ctx = this.ctx;
            const W = this.canvas.width, H = this.canvas.height;
            ctx.clearRect(0, 0, W, H);
            const n = this.bars.length;
            const bw = W / n;
            for (let i = 0; i < n; i++) {
                const h = this.bars[i] * H * 0.9;
                const x = i * bw;
                const y = H - h;
                const alpha = 0.25 + this.bars[i] * 0.55;
                ctx.fillStyle = 'rgba(55, 255, 139, ' + alpha + ')';
                ctx.fillRect(x + bw * 0.15, y, bw * 0.7, h);
            }
        }
    };

    window.DataStream = DataStream;
})();
