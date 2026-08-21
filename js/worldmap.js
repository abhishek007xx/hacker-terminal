/* ============================================================
   SPECTRE-9 // 3D VECTOR WIREGLOBE & ATTACK VECTOR INTERCEPTOR
   Real-time 3D vector wireframe globe with planetary latitude/longitude
   mesh, rotating city hubs, and arcing ballistic cyber missile trajectories.
   ============================================================ */
(function () {
    'use strict';

    const CITIES = [
        { name: 'REYKJAVIK', lat: 64.14, lon: -21.94 },
        { name: 'ZURICH', lat: 47.37, lon: 8.54 },
        { name: 'TOKYO', lat: 35.67, lon: 139.65 },
        { name: 'NEW YORK', lat: 40.71, lon: -74.00 },
        { name: 'LONDON', lat: 51.50, lon: -0.12 },
        { name: 'SINGAPORE', lat: 1.35, lon: 103.81 },
        { name: 'FRANKFURT', lat: 50.11, lon: 8.68 },
        { name: 'SYDNEY', lat: -33.86, lon: 151.20 },
        { name: 'SAO PAULO', lat: -23.55, lon: -46.63 }
    ];

    const WireGlobe = {
        canvas: null,
        ctx: null,
        dpr: 1,
        rotY: 0,
        rotX: 0.25,
        autoSpeed: 0.006,
        isDragging: false,
        lastMouseX: 0,
        lastMouseY: 0,
        arcs: [],
        impacts: [],
        t: 0,
        raf: null,

        init() {
            this.canvas = document.getElementById('worldmap-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');

            this.resize();
            window.addEventListener('resize', () => this.resize());
            if (window.ResizeObserver && this.canvas.parentElement) {
                const ro = new ResizeObserver(() => this.resize());
                ro.observe(this.canvas.parentElement);
            }

            // Drag to rotate controls
            this.canvas.addEventListener('mousedown', (e) => {
                this.isDragging = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            });
            window.addEventListener('mousemove', (e) => {
                if (!this.isDragging) return;
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                this.rotY += dx * 0.008;
                this.rotX = Math.max(-0.8, Math.min(0.8, this.rotX + dy * 0.008));
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            });
            window.addEventListener('mouseup', () => { this.isDragging = false; });

            // Spawn initial ballistic attack arcs
            for (let i = 0; i < 3; i++) this._spawnArc();
            setInterval(() => {
                if (this.arcs.length < 5) this._spawnArc();
            }, 2400);

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

        _spawnArc() {
            const src = CITIES[Math.floor(Math.random() * CITIES.length)];
            let dst = CITIES[Math.floor(Math.random() * CITIES.length)];
            while (dst === src) dst = CITIES[Math.floor(Math.random() * CITIES.length)];
            this.arcs.push({
                src,
                dst,
                progress: 0,
                speed: 0.008 + Math.random() * 0.007,
                color: Math.random() < 0.6 ? 'rgba(55, 255, 139, ' : 'rgba(255, 65, 85, '
            });
        },

        _latLonTo3D(lat, lon, radius) {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            const x = -(radius * Math.sin(phi) * Math.cos(theta));
            const z = (radius * Math.sin(phi) * Math.sin(theta));
            const y = (radius * Math.cos(phi));
            return { x, y, z };
        },

        _project(p, cx, cy) {
            // Rotate Y
            const cosY = Math.cos(this.rotY), sinY = Math.sin(this.rotY);
            const x1 = p.x * cosY + p.z * sinY;
            const z1 = -p.x * sinY + p.z * cosY;

            // Rotate X
            const cosX = Math.cos(this.rotX), sinX = Math.sin(this.rotX);
            const y2 = p.y * cosX - z1 * sinX;
            const z2 = p.y * sinX + z1 * cosX;

            return {
                x: cx + x1,
                y: cy - y2,
                z: z2,
                visible: z2 > -10
            };
        },

        loop() {
            if (!this.isDragging) this.rotY += this.autoSpeed;
            this.t += 0.04;
            this.draw();
            this.raf = requestAnimationFrame(this.loop);
        },

        draw() {
            const ctx = this.ctx;
            const W = this.canvas.width, H = this.canvas.height;
            if (W <= 10 || H <= 10) return;
            ctx.clearRect(0, 0, W, H);
            const dpr = this.dpr;
            const cx = W / 2, cy = H / 2;
            const radius = Math.min(W, H) * 0.42;

            // Globe Outer Glow & Silhouette Rim
            const grad = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.05);
            grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
            grad.addColorStop(0.8, 'rgba(55, 255, 139, 0.05)');
            grad.addColorStop(1, 'rgba(55, 255, 139, 0.22)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(55, 255, 139, 0.35)';
            ctx.lineWidth = 1.2 * dpr;
            ctx.stroke();

            // Draw Latitude Rings
            const latSteps = [-60, -30, 0, 30, 60];
            for (const lat of latSteps) {
                ctx.beginPath();
                let started = false;
                for (let lon = -180; lon <= 180; lon += 10) {
                    const p3d = this._latLonTo3D(lat, lon, radius);
                    const proj = this._project(p3d, cx, cy);
                    if (proj.visible) {
                        ctx.strokeStyle = lat === 0 ? 'rgba(63, 224, 255, 0.35)' : 'rgba(45, 220, 130, 0.14)';
                        ctx.lineWidth = dpr;
                        if (!started) { ctx.moveTo(proj.x, proj.y); started = true; }
                        else { ctx.lineTo(proj.x, proj.y); }
                    } else {
                        started = false;
                    }
                }
                ctx.stroke();
            }

            // Draw Longitude Meridians
            const lonSteps = [-150, -100, -50, 0, 50, 100, 150];
            for (const lon of lonSteps) {
                ctx.beginPath();
                let started = false;
                for (let lat = -80; lat <= 80; lat += 8) {
                    const p3d = this._latLonTo3D(lat, lon, radius);
                    const proj = this._project(p3d, cx, cy);
                    if (proj.visible) {
                        ctx.strokeStyle = 'rgba(45, 220, 130, 0.12)';
                        ctx.lineWidth = dpr;
                        if (!started) { ctx.moveTo(proj.x, proj.y); started = true; }
                        else { ctx.lineTo(proj.x, proj.y); }
                    } else {
                        started = false;
                    }
                }
                ctx.stroke();
            }

            // Draw Cities & Hubs
            for (const city of CITIES) {
                const p3d = this._latLonTo3D(city.lat, city.lon, radius);
                const proj = this._project(p3d, cx, cy);
                if (proj.visible) {
                    // Node Dot
                    ctx.fillStyle = 'rgba(77, 255, 160, 0.95)';
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, 2.5 * dpr, 0, Math.PI * 2);
                    ctx.fill();

                    // Label
                    ctx.fillStyle = 'rgba(127, 230, 171, 0.7)';
                    ctx.font = '700 ' + (6.5 * dpr) + 'px "JetBrains Mono", monospace';
                    ctx.fillText(city.name, proj.x + 4 * dpr, proj.y - 3 * dpr);
                }
            }

            // Draw Ballistic Cyber Missile Arcs
            for (let i = this.arcs.length - 1; i >= 0; i--) {
                const arc = this.arcs[i];
                arc.progress += arc.speed;

                const p1_3d = this._latLonTo3D(arc.src.lat, arc.src.lon, radius);
                const p2_3d = this._latLonTo3D(arc.dst.lat, arc.dst.lon, radius);

                // Draw arc trajectory
                ctx.beginPath();
                let started = false;
                const steps = 24;
                const curStep = Math.floor(steps * Math.min(1, arc.progress));

                for (let s = 0; s <= curStep; s++) {
                    const ratio = s / steps;
                    const ix = p1_3d.x + (p2_3d.x - p1_3d.x) * ratio;
                    const iy = p1_3d.y + (p2_3d.y - p1_3d.y) * ratio;
                    const iz = p1_3d.z + (p2_3d.z - p1_3d.z) * ratio;

                    const altitude = Math.sin(ratio * Math.PI) * (radius * 0.28);
                    const len = Math.sqrt(ix * ix + iy * iy + iz * iz) || 1;
                    const normAlt = (radius + altitude) / len;

                    const cur3d = { x: ix * normAlt, y: iy * normAlt, z: iz * normAlt };
                    const proj = this._project(cur3d, cx, cy);

                    if (proj.visible) {
                        if (!started) { ctx.moveTo(proj.x, proj.y); started = true; }
                        else { ctx.lineTo(proj.x, proj.y); }
                    }
                }
                ctx.strokeStyle = arc.color + '0.85)';
                ctx.lineWidth = 1.4 * dpr;
                ctx.stroke();

                // Check impact
                if (arc.progress >= 1) {
                    const impactProj = this._project(p2_3d, cx, cy);
                    if (impactProj.visible) {
                        this.impacts.push({
                            x: impactProj.x,
                            y: impactProj.y,
                            r: 1,
                            maxR: 16 * dpr,
                            color: arc.color
                        });
                        if (window.NexusAudio && Math.random() < 0.3) window.NexusAudio.sonar();
                    }
                    this.arcs.splice(i, 1);
                }
            }

            // Draw Impacts & Shockwaves
            for (let i = this.impacts.length - 1; i >= 0; i--) {
                const imp = this.impacts[i];
                imp.r += 0.8 * dpr;
                const alpha = Math.max(0, 1 - imp.r / imp.maxR);
                ctx.beginPath();
                ctx.arc(imp.x, imp.y, imp.r, 0, Math.PI * 2);
                ctx.strokeStyle = imp.color + alpha + ')';
                ctx.lineWidth = 1.5 * dpr;
                ctx.stroke();
                if (imp.r >= imp.maxR) this.impacts.splice(i, 1);
            }
        }
    };

    window.WorldMap = WireGlobe;
})();
