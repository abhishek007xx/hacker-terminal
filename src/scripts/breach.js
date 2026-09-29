/* ============================================================
   NEXUS // BREACH SIMULATION
   A dramatic, entirely fictional sequence. No real system
   is accessed. Ends with a glitch payoff.
   ============================================================ */
(function () {
    'use strict';

    const Breach = {
        overlay: null, out: null, running: false,

        init() {
            this.overlay = document.getElementById('breach-overlay');
            this.out = document.getElementById('breach-output');
            const closeOnEsc = (e) => {
                if (e.key === 'Escape' && this.overlay.classList.contains('active') && !this.running) {
                    this.close();
                }
            };
            document.addEventListener('keydown', closeOnEsc);
            if (this.overlay) {
                this.overlay.addEventListener('click', (e) => {
                    if (e.target === this.overlay && !this.running) this.close();
                });
            }
        },

        close() {
            if (this.overlay) this.overlay.classList.remove('active');
        },

        async run() {
            if (this.running || !this.overlay) return;
            this.running = true;
            this.out.innerHTML = '';
            this.overlay.classList.add('active');
            const NX = window.NX;
            const A = window.NexusAudio;
            if (A) { A.arm(); A.resume(); }

            const layers = [
                'SECURITY LAYER 01', 'SECURITY LAYER 02', 'SECURITY LAYER 03',
                'ENCRYPTION', 'ACCESS CONTROL'
            ];

            await NX.type(this.out, 'INITIALIZING...', { className: 'b-title', speed: 26, sound: true });
            NX.spacer(this.out);
            await NX.sleep(400);

            if (A) A.connect();
            await NX.type(this.out, 'TARGET IDENTIFIED', { className: 'b-warn', speed: 22, sound: true });
            await NX.type(this.out, '  └─ SIMULATION-NODE-' + NX.hex(2), { className: 'b-tree', speed: 14 });
            NX.spacer(this.out);
            if (window.Topology) window.Topology.surge();
            if (window.Monitor) window.Monitor.spike();

            const results = ['BYPASSED', 'BYPASSED', 'ANALYZED', 'SIMULATED', 'OVERRIDDEN'];
            for (let i = 0; i < layers.length; i++) {
                const branch = (i === layers.length - 1) ? '└──' : '├──';
                const label = layers[i];
                const line = NX.line(this.out,
                    '<span class="b-tree">' + branch + ' ' + label + ' </span>' +
                    '<span class="b-warn">…</span>', '');
                // simulate work
                await NX.sleep(500 + Math.random() * 500);
                const dots = '.'.repeat(Math.max(3, 26 - label.length));
                line.innerHTML =
                    '<span class="b-tree">' + branch + ' ' + label + ' ' + dots + ' </span>' +
                    '<span class="b-ok">' + results[i] + '</span>';
                if (A) A.blip(700 + i * 120, 0.05, 'square', 0.08);
                document.body.classList.add('screen-shake');
                setTimeout(() => document.body.classList.remove('screen-shake'), 200);
            }

            NX.spacer(this.out);
            await NX.animateBar(this.out, { width: 28, duration: 2200, className: 'b-bar' });
            NX.spacer(this.out);

            // Glitch payoff
            if (window.FX) window.FX.glitch(true);
            if (A) A.glitch();
            document.body.classList.add('screen-shake');
            setTimeout(() => document.body.classList.remove('screen-shake'), 400);

            await NX.sleep(300);
            await NX.type(this.out, 'SIMULATION COMPLETE', { className: 'b-title', speed: 30, sound: true });
            NX.spacer(this.out);
            await NX.type(this.out, 'ACCESS LEVEL:', { className: 'b-tree', speed: 18 });
            const root = NX.line(this.out, 'ROOT // SIMULATED', 'b-root glitch-text');
            root.setAttribute('data-text', 'ROOT // SIMULATED');
            if (A) A.confirm();
            NX.spacer(this.out);
            NX.spacer(this.out);
            await NX.type(this.out, 'NO REAL SYSTEM WAS ACCESSED', { className: 'b-safe', speed: 16 });

            NX.spacer(this.out);
            const hint = NX.line(this.out, '[ CLICK ANYWHERE OR PRESS ESC TO CLOSE ]', 'b-safe');
            hint.style.opacity = '0.6';

            this.running = false;

            // reset topology states after a bit
            setTimeout(() => {
                if (window.Topology) {
                    window.Topology.nodes.forEach((n) => {
                        if (!n.core && n.state === 'SIM ACCESS') n.state = 'ONLINE';
                    });
                }
            }, 5000);
        }
    };

    window.Breach = Breach;
})();
