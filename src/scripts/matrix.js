/* ============================================================
   NEXUS // MATRIX MODE
   Fullscreen falling-character rain + fake system messages.
   ESC exits. All local.
   ============================================================ */
(function () {
    'use strict';

    const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトﾊﾋﾌﾍﾎ0123456789ABCDEF<>/\\|=+*#';

    const Matrix = {
        overlay: null, canvas: null, ctx: null, term: null,
        dpr: 1, cols: 0, drops: [], raf: null, active: false,
        fontSize: 16, msgTimer: null,

        init() {
            this.overlay = document.getElementById('matrix-mode');
            this.canvas = document.getElementById('matrix-canvas');
            this.term = document.getElementById('matrix-terminal');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            window.addEventListener('resize', () => { if (this.active) this._setup(); });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.active) this.exit();
            });
        },

        _setup() {
            const dpr = window.devicePixelRatio || 1;
            this.dpr = dpr;
            this.canvas.width = window.innerWidth * dpr;
            this.canvas.height = window.innerHeight * dpr;
            this.fontSize = (window.innerWidth < 600 ? 12 : 16);
            this.cols = Math.floor(window.innerWidth / this.fontSize);
            this.drops = [];
            for (let i = 0; i < this.cols; i++) {
                this.drops[i] = Math.random() * -50;
            }
        },

        enter() {
            if (this.active) return;
            this.active = true;
            this._setup();
            this.overlay.classList.add('active');
            document.body.classList.add('matrix-active');
            if (window.NexusAudio) { window.NexusAudio.arm(); window.NexusAudio.connect(); }
            this.loop = this.loop.bind(this);
            this.raf = requestAnimationFrame(this.loop);
            this._pushMessages();
        },

        exit() {
            if (!this.active) return;
            this.active = false;
            this.overlay.classList.remove('active');
            document.body.classList.remove('matrix-active');
            if (this.raf) cancelAnimationFrame(this.raf);
            if (this.msgTimer) clearTimeout(this.msgTimer);
            if (this.term) this.term.textContent = '';
            if (window.NexusAudio) window.NexusAudio.blip(300, 0.08, 'sine', 0.1);
        },

        toggle() { this.active ? this.exit() : this.enter(); },

        _pushMessages() {
            const NX = window.NX;
            const lines = [
                'WAKE UP, OPERATIVE...',
                'THE SPECTRE-GRID HAS YOU.',
                'FOLLOW THE PHANTOM PACKET.',
                '> decrypting quantum reality stream',
                '> 0x' + NX.hex(8) + ' :: ' + NX.hexBytes(4),
                '> injecting black-ops construct',
                '> ' + NX.keyBlock(4),
                'TACTICAL SIMULATION ACTIVE // ZERO NETWORK AT RISK',
                '> rendering ' + NX.randInt(1000, 9999) + ' virtual nodes',
                'PRESS [ESC] TO RETURN TO SPECTRE CONSOLE'
            ];
            let i = 0;
            const step = () => {
                if (!this.active || !this.term) return;
                this.term.textContent += (this.term.textContent ? '\n' : '') + lines[i % lines.length];
                // keep last ~12 lines
                const arr = this.term.textContent.split('\n');
                if (arr.length > 12) this.term.textContent = arr.slice(arr.length - 12).join('\n');
                i++;
                if (window.NexusAudio && Math.random() < 0.5) window.NexusAudio.key();
                this.msgTimer = setTimeout(step, 700 + Math.random() * 900);
            };
            step();
        },

        loop() {
            if (!this.active) return;
            const ctx = this.ctx;
            // translucent fade for trails
            ctx.fillStyle = 'rgba(0, 8, 4, 0.08)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            const fs = this.fontSize * this.dpr;
            ctx.font = fs + 'px "JetBrains Mono", monospace';

            for (let i = 0; i < this.drops.length; i++) {
                const ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
                const x = i * this.fontSize * this.dpr;
                const y = this.drops[i] * fs;

                // leading char brighter + occasional cyan
                if (Math.random() < 0.02) {
                    ctx.fillStyle = 'rgba(63, 224, 255, 0.95)';
                } else if (Math.random() < 0.1) {
                    ctx.fillStyle = 'rgba(200, 255, 224, 0.95)';
                } else {
                    ctx.fillStyle = 'rgba(55, 255, 139, 0.8)';
                }
                ctx.fillText(ch, x, y);

                if (y > this.canvas.height && Math.random() > 0.975) {
                    this.drops[i] = 0;
                }
                this.drops[i] += 0.5;
            }
            this.raf = requestAnimationFrame(this.loop);
        }
    };

    window.Matrix = Matrix;
})();
