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
            window.addEventListener('resize', () => { this.resize(); this._layout(); });
            this._build();
            this._layout();
            this.loop = this.loop.bind(this);
            this.raf = requestAnimationFrame(this.loop);
            // random node state changes
            setInterval(() => this._randomState(), 3200);
            // spawn packets
            setInterval(() => this._spawnPacket(), 700);
        },

        resize() {
            const r = this.canvas.getBoundingClientRect();
            this.dpr = window.devicePixelRatio || 1;
            this.canvas.width = Math.max(2, r.width * this.dpr);
            this.canvas.height = Math.max(2, r.height * this.dpr);
        },

        _build() {
            // CORE + 4 satellites, matching brief's diagram
            this.nodes = [
                { id: 'CORE', ip: '10.0.0.1', rx: 0.5, ry: 0.5, state: 'ONLINE', core: true, phase: 0 },
                { id: 'NODE-01', ip: '192.168.1.10', rx: 0.5, ry: 0.16, state: 'ONLINE', phase: 1 },
                { id: 'NODE-02', ip: '192.168.1.20', rx: 0.84, ry: 0.5, state: 'SECURED', phase: 2 },
                { id: 'NODE-03', ip: '192.168.1.30', rx: 0.16, ry: 0.5, state: 'ONLINE', phase: 3 },
                { id: 'NODE-04', ip: '192.168.1.40', rx: 0.5, ry: 0.84, state: 'UNKNOWN', phase: 4 }
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
            const padX = W * 0.14, padY = H * 0.16;
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
            ctx.clearRect(0, 0, W, H);
            const dpr = this.dpr;

            // links
            for (const [a, b] of this.links) {
                const na = this._node(a), nb = this._node(b);
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
                const x = na.x + (nb.x - na.x) * pk.p;
                const y = na.y + (nb.y - na.y) * pk.p;
                ctx.beginPath();
                ctx.arc(x, y, dpr * 1.8, 0, Math.PI * 2);
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
                const baseR = (n.core ? 10 : 7) * dpr;

                // outer ring pulse
                ctx.beginPath();
                ctx.arc(n.x, n.y, baseR + pulse * 4 * dpr, 0, Math.PI * 2);
                ctx.strokeStyle = col.replace('1)', (0.25 + pulse * 0.25) + ')');
                ctx.lineWidth = dpr;
                ctx.stroke();

                // hexagon body
                this._hex(ctx, n.x, n.y, baseR, col, n.core);

                // labels
                ctx.fillStyle = 'rgba(200, 255, 224, 0.92)';
                ctx.font = (n.core ? 700 : 600) + ' ' + (9 * dpr) + 'px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                const labelY = n.y - baseR - 6 * dpr;
                ctx.fillText(n.id, n.x, labelY);

                ctx.fillStyle = 'rgba(80, 160, 120, 0.8)';
                ctx.font = (7.5 * dpr) + 'px "JetBrains Mono", monospace';
                ctx.fillText(n.ip, n.x, n.y + baseR + 11 * dpr);

                ctx.fillStyle = col;
                ctx.font = '700 ' + (7.5 * dpr) + 'px "JetBrains Mono", monospace';
                ctx.fillText(n.state, n.x, n.y + baseR + 21 * dpr);
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
