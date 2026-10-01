/* ============================================================
   NEXUS // NETWORK TOPOLOGY
   Simulated node mesh: core + satellites with ring links,
   traveling packets, periodic scan sweeps, link flaps, and
   interactive hover/click inspection (hover = readout,
   click = simulated ping burst). Node states cycle:
   ONLINE / SECURED / UNKNOWN / SIMULATED ACCESS.
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
        nodes: [], links: [], packets: [], sweeps: [],
        raf: null, t: 0, hover: null, mouse: null,
        nextScan: 0, nextFlap: 0,

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

            // hover inspection + click-to-ping
            this.canvas.addEventListener('pointermove', (e) => this._onMove(e));
            this.canvas.addEventListener('pointerleave', () => {
                this.mouse = null;
                this.hover = null;
                this.canvas.style.cursor = '';
            });
            this.canvas.addEventListener('click', (e) => {
                const n = this._hit(this._pos(e));
                if (n) this.ping(n);
            });

            this.loop = this.loop.bind(this);
            this.raf = requestAnimationFrame(this.loop);
            // random node state changes
            setInterval(() => this._randomState(), 3200);
            // spawn packets
            setInterval(() => this._spawnPacket(), 700);
            // periodic scan sweep + link flap events
            this.nextScan = 0;
            this.nextFlap = 240;
        },

        resize() {
            if (!this.canvas) return;
            const r = this.canvas.getBoundingClientRect();
            this.dpr = window.devicePixelRatio || 1;
            this.canvas.width = Math.max(2, Math.floor(r.width * this.dpr));
            this.canvas.height = Math.max(2, Math.floor(r.height * this.dpr));
        },

        _build() {
            // CORE in the center, 6 satellites on an outer ring
            this.nodes = [
                { id: 'CORE', ip: '10.0.0.1', rx: 0.5, ry: 0.5, state: 'ONLINE', core: true, phase: 0 },
                { id: 'NODE-01', ip: '192.168.1.10', rx: 0.5, ry: 0.14, state: 'ONLINE', phase: 1 },
                { id: 'NODE-02', ip: '192.168.1.20', rx: 0.86, ry: 0.38, state: 'SECURED', phase: 2 },
                { id: 'NODE-03', ip: '192.168.1.30', rx: 0.86, ry: 0.78, state: 'ONLINE', phase: 3 },
                { id: 'NODE-04', ip: '192.168.1.40', rx: 0.5, ry: 0.9, state: 'UNKNOWN', phase: 4 },
                { id: 'NODE-05', ip: '192.168.1.50', rx: 0.14, ry: 0.78, state: 'ONLINE', phase: 5 },
                { id: 'NODE-06', ip: '192.168.1.60', rx: 0.14, ry: 0.38, state: 'SECURED', phase: 6 }
            ];
            const ring = ['NODE-01', 'NODE-02', 'NODE-03', 'NODE-04', 'NODE-05', 'NODE-06'];
            this.links = [];
            // spokes core -> each satellite
            for (const id of ring) this.links.push({ a: 'CORE', b: id, up: true });
            // ring links between adjacent satellites (mesh path redundancy)
            for (let i = 0; i < ring.length; i++) {
                this.links.push({ a: ring[i], b: ring[(i + 1) % ring.length], up: true });
            }
        },

        _layout() {
            const W = this.canvas.width, H = this.canvas.height;
            if (W <= 10 || H <= 10) return;
            const dpr = this.dpr;
            const padX = Math.min(W * 0.18, Math.max(34 * dpr, W * 0.14));
            const padY = Math.min(H * 0.22, Math.max(26 * dpr, H * 0.18));
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

        /* --- pointer helpers (hover readout + click ping) --- */
        _pos(e) {
            const r = this.canvas.getBoundingClientRect();
            return {
                x: (e.clientX - r.left) * this.dpr,
                y: (e.clientY - r.top) * this.dpr
            };
        },

        _hit(p) {
            if (!p) return null;
            const R = 12 * this.dpr;
            for (const n of this.nodes) {
                const dx = n.x - p.x, dy = n.y - p.y;
                if (dx * dx + dy * dy <= R * R) return n;
            }
            return null;
        },

        _onMove(e) {
            this.mouse = this._pos(e);
            const hit = this._hit(this.mouse);
            if (hit !== this.hover) {
                this.hover = hit;
                this.canvas.style.cursor = hit ? 'pointer' : '';
            }
        },

        /* public: simulated ping burst against one node */
        ping(n) {
            if (!n || n.core) return;
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    this.packets.push({
                        from: 'CORE', to: n.id, p: -i * 0.18,
                        speed: 0.05, color: 'rgba(63,224,255,0.95)', ping: true
                    });
                }, i * 70);
            }
            n.flash = 1;
            if (window.NexusAudio) window.NexusAudio.blip(960, 0.05, 'sine', 0.06);
            if (window.EventLog) {
                window.EventLog.push('INFO', 'ICMP ping ' + n.id + ' (' + n.ip + ') — ' + (8 + Math.floor(Math.random() * 40)) + 'ms [simulated]');
            }
        },

        _spawnPacket() {
            if (this.packets.length > 16) return;
            const live = this.links.filter((l) => l.up);
            if (!live.length) return;
            const link = live[Math.floor(Math.random() * live.length)];
            const dir = Math.random() < 0.5;
            this.packets.push({
                from: dir ? link.a : link.b,
                to: dir ? link.b : link.a,
                p: 0,
                speed: 0.012 + Math.random() * 0.02,
                color: Math.random() < 0.3 ? 'rgba(63,224,255,0.95)' : 'rgba(77,255,160,0.95)'
            });
        },

        /* occasional link flap: one ring link drops, then recovers */
        _flap() {
            const ringLinks = this.links.filter((l) => l.a !== 'CORE' && l.b !== 'CORE');
            const l = ringLinks[Math.floor(Math.random() * ringLinks.length)];
            if (!l || !l.up) return;
            l.up = false;
            if (window.EventLog) window.EventLog.push('WARN', 'Mesh link ' + l.a + '-' + l.b + ' packet loss (simulated)');
            setTimeout(() => {
                l.up = true;
                if (window.EventLog) window.EventLog.push('OK', 'Mesh link ' + l.a + '-' + l.b + ' rerouted / restored');
            }, 3800);
        },


        loop() {
            this.t += 1;
            // schedule scan sweeps (~every 5s) and link flaps (~every 9s)
            if (this.t >= this.nextScan) {
                this.sweeps.push({ r: 0 });
                this.nextScan = this.t + 300;
            }
            if (this.t >= this.nextFlap) {
                this._flap();
                this.nextFlap = this.t + 540;
            }
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
            const maxR = Math.hypot(W, H) * 0.5;

            // scan sweeps: expanding rings from CORE
            for (let i = this.sweeps.length - 1; i >= 0; i--) {
                const s = this.sweeps[i];
                s.r += 3.2 * dpr * scale;
                if (s.r > maxR) { this.sweeps.splice(i, 1); continue; }
                ctx.beginPath();
                ctx.arc(W / 2, H / 2, s.r, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(63,224,255,' + (0.35 * (1 - s.r / maxR)).toFixed(3) + ')';
                ctx.lineWidth = dpr;
                ctx.stroke();
            }

            // links (down links render dashed + dim red)
            for (const l of this.links) {
                const na = this._node(l.a), nb = this._node(l.b);
                if (!na || !nb) continue;
                ctx.beginPath();
                ctx.moveTo(na.x, na.y);
                ctx.lineTo(nb.x, nb.y);
                if (l.up) {
                    ctx.setLineDash([]);
                    ctx.strokeStyle = 'rgba(45, 220, 130, 0.28)';
                    ctx.lineWidth = dpr;
                    ctx.stroke();
                    ctx.strokeStyle = 'rgba(45, 220, 130, 0.08)';
                    ctx.lineWidth = dpr * 3;
                    ctx.stroke();
                } else {
                    ctx.setLineDash([4 * dpr, 4 * dpr]);
                    ctx.strokeStyle = 'rgba(255, 65, 85, 0.45)';
                    ctx.lineWidth = dpr;
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }

            // packets
            for (let i = this.packets.length - 1; i >= 0; i--) {
                const pk = this.packets[i];
                pk.p += pk.speed;
                if (pk.p >= 1) { this.packets.splice(i, 1); continue; }
                if (pk.p < 0) continue;
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
                const isHover = n === this.hover;

                // ping flash decay
                if (n.flash) {
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, baseR + n.flash * 8 * dpr, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(63,224,255,' + n.flash.toFixed(3) + ')';
                    ctx.lineWidth = 1.5 * dpr;
                    ctx.stroke();
                    n.flash = Math.max(0, n.flash - 0.04);
                }

                // outer ring pulse
                ctx.beginPath();
                ctx.arc(n.x, n.y, baseR + pulse * 3.5 * dpr * scale, 0, Math.PI * 2);
                ctx.strokeStyle = col.replace('1)', (0.25 + pulse * 0.25) + ')');
                ctx.lineWidth = dpr;
                ctx.stroke();

                // hover halo
                if (isHover) {
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, baseR + 5 * dpr, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
                    ctx.lineWidth = dpr;
                    ctx.stroke();
                }

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

            // hover readout chip
            if (this.hover) this._drawReadout(ctx, W, H, dpr, scale);
        },

        _drawReadout(ctx, W, H, dpr, scale) {
            const n = this.hover;
            const fs = Math.max(7 * dpr, 8 * dpr * scale);
            const lines = [
                n.id + ' :: ' + n.ip,
                'STATE ' + n.state + ' // RTT ' + (8 + (n.phase * 7) % 40) + 'ms'
            ];
            ctx.font = '600 ' + fs + 'px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            const pad = 5 * dpr;
            const w = Math.max(lines[0].length, lines[1].length) * fs * 0.6 + pad * 2;
            const h = fs * 2 + pad * 2 + 3 * dpr;
            // clamp chip inside the canvas, near the node but never off-edge
            let x = n.x + 12 * dpr;
            let y = n.y - h - 6 * dpr;
            if (x + w > W - 2 * dpr) x = n.x - 12 * dpr - w;
            if (x < 2 * dpr) x = 2 * dpr;
            if (y < 2 * dpr) y = n.y + 12 * dpr;
            if (y + h > H - 2 * dpr) y = H - h - 2 * dpr;

            ctx.fillStyle = 'rgba(0, 8, 10, 0.88)';
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = 'rgba(63, 224, 255, 0.5)';
            ctx.lineWidth = dpr;
            ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = 'rgba(200, 255, 224, 0.95)';
            ctx.fillText(lines[0], x + pad, y + pad + fs);
            ctx.fillStyle = STATE_COLORS[n.state] || STATE_COLORS.ONLINE;
            ctx.fillText(lines[1], x + pad, y + pad + fs * 2 + 3 * dpr);
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
            if (n) {
                n.state = 'SIM ACCESS';
                n.flash = 1;
            }
        }
    };

    window.Topology = Topology;
})();

