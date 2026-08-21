/* ============================================================
   NEXUS // NETWORK TOPOLOGY
   Simulated node graph with glowing links + traveling packets.
   Node states cycle: ONLINE / SECURED / UNKNOWN / SIMULATED ACCESS.
   All fictional, client-side only.
   ============================================================ */
(function () {
    'use strict';

    const STATES = ['ONLINE', 'SECURED', 'UNKNOWN', 'SIM ACCESS'];
    const STATE_COLORS = {
        'ONLINE': 'rgba(77, 255, 160, 1)',
        'SECURED': 'rgba(63, 224, 255, 1)',
        'UNKNOWN': 'rgba(255, 179, 64, 1)',
        'SIM ACCESS': 'rgba(255, 65, 85, 1)'
    };

    const Topology = {
        canvas: null, ctx: null, dpr: 1,
        nodes: [], links: [], packets: [], raf: null, t: 0,

        init() {
            this.canvas = document.getElementById('topo-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            this._build();
            this._layout();

            window.addEventListener('resize', () => { this.resize(); this._layout(); });
            if (window.ResizeObserver && this.canvas.parentElement) {
                const ro = new ResizeObserver(() => { this.resize(); this._layout(); });
                ro.observe(this.canvas.parentElement);
            }

            this.loop = this.loop.bind(this);
            this.raf = requestAnimationFrame(this.loop);
            // random node state changes
            setInterval(() => this._randomState(), 3200);
            // spawn packets
            setInterval(() => this._spawnPacket(), 700);
        },

        resize() {
            if (!this.canvas) return;
            const r = this.canvas.getBoundingClientRect();
            this.dpr = window.devicePixelRatio || 1;
            this.canvas.width = Math.max(2, Math.floor(r.width * this.dpr));
            this.canvas.height = Math.max(2, Math.floor(r.height * this.dpr));
        },

        _build() {
            // CORE + 4 satellites, matching tactical node diagram
            this.nodes = [
                { id: 'CORE', ip: '10.0.0.1', rx: 0.5, ry: 0.5, state: 'ONLINE', core: true, phase: 0 },
                { id: 'NODE-01', ip: '192.168.1.10', rx: 0.5, ry: 0.15, state: 'ONLINE', phase: 1 },
                { id: 'NODE-02', ip: '192.168.1.20', rx: 0.85, ry: 0.5, state: 'SECURED', phase: 2 },
                { id: 'NODE-03', ip: '192.168.1.30', rx: 0.15, ry: 0.5, state: 'ONLINE', phase: 3 },
                { id: 'NODE-04', ip: '192.168.1.40', rx: 0.5, ry: 0.85, state: 'UNKNOWN', phase: 4 }
            ];
            this.links = [
                ['CORE', 'NODE-01'],
                ['CORE', 'NODE-02'],
                ['CORE', 'NODE-03'],
                ['CORE', 'NODE-04']
            ];
        },

        _layout() {
            const W = this.canvas.width, H = this.canvas.height;
            if (W <= 10 || H <= 10) return;
            const dpr = this.dpr;
            const padX = Math.min(W * 0.2, Math.max(34 * dpr, W * 0.15));
            const padY = Math.min(H * 0.24, Math.max(26 * dpr, H * 0.2));
            for (const n of this.nodes) {
                n.x = padX + n.rx * (W - padX * 2);
                n.y = padY + n.ry * (H - padY * 2);
            }
        },

        _node(id) { return this.nodes.find((n) => n.id === id); },

        _randomState() {
            const n = this.pickNonCore();
            if (!n) return;
            n.state = STATES[Math.floor(Math.random() * STATES.length)];
        },

        pickNonCore() {
            const opts = this.nodes.filter((n) => !n.core);
            return opts[Math.floor(Math.random() * opts.length)];
        },

        _spawnPacket() {
            if (this.packets.length > 14) return;
            const link = this.links[Math.floor(Math.random() * this.links.length)];
            const dir = Math.random() < 0.5;
            this.packets.push({
                from: dir ? link[0] : link[1],
                to: dir ? link[1] : link[0],
                p: 0,
                speed: 0.012 + Math.random() * 0.02,
                color: Math.random() < 0.3 ? 'rgba(63,224,255,0.95)' : 'rgba(77,255,160,0.95)'
            });
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
            const dpr = this.dpr;
            const scale = Math.min(1.2, Math.max(0.65, Math.min(W / (320 * dpr), H / (180 * dpr))));

            // links
            for (const [a, b] of this.links) {
                const na = this._node(a), nb = this._node(b);
                if (!na || !nb) continue;
                ctx.beginPath();
                ctx.moveTo(na.x, na.y);
                ctx.lineTo(nb.x, nb.y);
                ctx.strokeStyle = 'rgba(45, 220, 130, 0.28)';
                ctx.lineWidth = dpr;
                ctx.stroke();
                // faint glow underlay
                ctx.strokeStyle = 'rgba(45, 220, 130, 0.08)';
                ctx.lineWidth = dpr * 3;
                ctx.stroke();
            }

            // packets
            for (let i = this.packets.length - 1; i >= 0; i--) {
                const pk = this.packets[i];
                pk.p += pk.speed;
                if (pk.p >= 1) { this.packets.splice(i, 1); continue; }
                const na = this._node(pk.from), nb = this._node(pk.to);
                if (!na || !nb) continue;
                const x = na.x + (nb.x - na.x) * pk.p;
                const y = na.y + (nb.y - na.y) * pk.p;
                ctx.beginPath();
                ctx.arc(x, y, dpr * 1.8 * scale, 0, Math.PI * 2);
                ctx.fillStyle = pk.color;
                ctx.shadowColor = pk.color;
                ctx.shadowBlur = 6 * dpr;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // nodes
            for (const n of this.nodes) {
                const col = STATE_COLORS[n.state] || STATE_COLORS.ONLINE;
                const pulse = (Math.sin(this.t * 0.05 + n.phase) + 1) / 2;
                const baseR = (n.core ? 8.5 : 6) * dpr * scale;

                // outer ring pulse
                ctx.beginPath();
                ctx.arc(n.x, n.y, baseR + pulse * 3.5 * dpr * scale, 0, Math.PI * 2);
                ctx.strokeStyle = col.replace('1)', (0.25 + pulse * 0.25) + ')');
                ctx.lineWidth = dpr;
                ctx.stroke();

                // hexagon body
                this._hex(ctx, n.x, n.y, baseR, col, n.core);

                // labels with safety clamping
                const fontSizeHead = Math.max(7.5 * dpr, 8.5 * dpr * scale);
                const fontSizeSub = Math.max(6.5 * dpr, 7.5 * dpr * scale);

                ctx.fillStyle = 'rgba(200, 255, 224, 0.92)';
                ctx.font = (n.core ? 700 : 600) + ' ' + fontSizeHead + 'px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                const labelY = Math.max(fontSizeHead, n.y - baseR - 4 * dpr * scale);
                ctx.fillText(n.id, n.x, labelY);

                ctx.fillStyle = 'rgba(80, 160, 120, 0.8)';
                ctx.font = fontSizeSub + 'px "JetBrains Mono", monospace';
                const ipY = Math.min(H - fontSizeSub - 2 * dpr, n.y + baseR + 9 * dpr * scale);
                ctx.fillText(n.ip, n.x, ipY);

                ctx.fillStyle = col;
                ctx.font = '700 ' + fontSizeSub + 'px "JetBrains Mono", monospace';
                const stateY = Math.min(H - 2 * dpr, n.y + baseR + 17 * dpr * scale);
                ctx.fillText(n.state, n.x, stateY);
            }
        },

        _hex(ctx, cx, cy, r, color, filled) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (Math.PI / 3) * i - Math.PI / 6;
                const px = cx + Math.cos(a) * r;
                const py = cy + Math.sin(a) * r;
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = color.replace('1)', filled ? '0.28)' : '0.14)');
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = this.dpr * 1.3;
            ctx.shadowColor = color;
            ctx.shadowBlur = 6 * this.dpr;
            ctx.stroke();
            ctx.shadowBlur = 0;
        },

        // Public: burst of packets + turn a node red (used in breach/scan)
        surge() {
            for (let i = 0; i < 8; i++) setTimeout(() => this._spawnPacket(), i * 60);
            const n = this.pickNonCore();
            if (n) n.state = 'SIM ACCESS';
        }
    };

    window.Topology = Topology;
})();
