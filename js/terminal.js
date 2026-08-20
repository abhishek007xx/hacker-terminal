/* ============================================================
   NEXUS // INTERACTIVE TERMINAL
   Auto-play intro + user command simulation. Every command is
   a purely visual, local simulation. No real network activity.
   ============================================================ */
(function () {
    'use strict';

    const Terminal = {
        out: null, input: null, mirror: null, caret: null, inputline: null,
        history: [], histIdx: -1, busy: false, booted: false,

        init() {
            this.out = document.getElementById('terminal-output');
            this.input = document.getElementById('terminal-input');
            this.mirror = document.getElementById('terminal-input-mirror');
            this.inputline = document.getElementById('terminal-inputline');
            this.body = document.getElementById('terminal-body');

            if (this.input) {
                this.input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = this.input.value;
                        this.input.value = '';
                        this._syncMirror();
                        this.submit(val);
                        return;
                    }
                    this._histKeys(e);
                    if (window.NexusAudio && e.key.length === 1) window.NexusAudio.key();
                });
                this.input.addEventListener('input', () => this._syncMirror());
            }
            // click terminal focuses input
            if (this.body) {
                this.body.addEventListener('click', () => {
                    if (this.input && !this.busy) this.input.focus();
                });
            }
            this._syncMirror();
        },

        focus() { if (this.input && !this.busy) this.input.focus(); },

        _syncMirror() {
            if (this.mirror) this.mirror.textContent = this.input ? this.input.value : '';
        },

        _histKeys(e) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.history.length === 0) return;
                this.histIdx = Math.max(0, (this.histIdx === -1 ? this.history.length : this.histIdx) - 1);
                this.input.value = this.history[this.histIdx] || '';
                this._syncMirror();
                setTimeout(() => this.input.setSelectionRange(this.input.value.length, this.input.value.length), 0);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.histIdx === -1) return;
                this.histIdx++;
                if (this.histIdx >= this.history.length) { this.histIdx = -1; this.input.value = ''; }
                else this.input.value = this.history[this.histIdx];
                this._syncMirror();
            } else if (e.key === 'l' && e.ctrlKey) {
                e.preventDefault();
                this.clear();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this._autocomplete();
            }
        },

        _autocomplete() {
            const val = this.input.value.trim().toLowerCase();
            if (!val) return;
            const cmds = Object.keys(COMMANDS).concat(['sudo matrix', 'sudo coffee', 'hack the planet', 'hacker typer']);
            const match = cmds.find((c) => c.startsWith(val));
            if (match) { this.input.value = match; this._syncMirror(); }
        },

        // Echo the command as a prompt line
        _echo(cmd) {
            const NX = window.NX;
            NX.line(this.out,
                '<span class="t-prompt">root@nexus:~$</span> ' +
                '<span class="t-cmd">' + this._esc(cmd) + '</span>', 't-cmdline');
        },

        _esc(s) {
            return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        },

        async submit(raw) {
            if (this.busy) return;
            const cmd = (raw || '').trim();
            this._echo(cmd);
            if (cmd) {
                this.history.push(cmd);
                if (this.history.length > 100) this.history.shift();
            }
            this.histIdx = -1;
            if (!cmd) return;

            this.busy = true;
            this._setInputEnabled(false);
            try {
                await this._dispatch(cmd);
            } catch (e) { /* ignore */ }
            this.busy = false;
            this._setInputEnabled(true);
            this.focus();
        },

        _setInputEnabled(on) {
            if (!this.input) return;
            this.input.disabled = !on;
            if (this.inputline) this.inputline.classList.toggle('busy', !on);
        },

        async _dispatch(cmd) {
            const lower = cmd.toLowerCase();
            // multi-word easter eggs first
            if (EGGS[lower]) { await EGGS[lower].call(this); return; }
            const name = lower.split(/\s+/)[0];
            if (COMMANDS[name]) { await COMMANDS[name].call(this, cmd); return; }
            // unknown
            const NX = window.NX;
            NX.line(this.out, 'COMMAND NOT RECOGNIZED', 't-err');
            NX.line(this.out, "Type '<span class=\"t-key\">help</span>' for available simulation commands.", 't-dim');
            NX.spacer(this.out);
            if (window.NexusAudio) window.NexusAudio.warn();
        },

        clear() {
            if (this.out) this.out.innerHTML = '';
        },

        // ---------- AUTO-PLAY INTRO ----------
        async playIntro() {
            if (this.booted) return;
            this.booted = true;
            const NX = window.NX;
            const A = window.NexusAudio;
            this._setInputEnabled(false);
            this.busy = true;

            const P = (t, cls, opts) => NX.type(this.out, t, Object.assign({ className: cls, speed: 10 }, opts || {}));
            const L = (h, cls) => NX.line(this.out, h, cls);
            const S = () => NX.spacer(this.out);

            await P('root@nexus:~$ initializing secure shell...', 't-prompt-line', { sound: true, speed: 12 });
            for (const t of ['Kernel loaded', 'Encryption layer initialized', 'Proxy chain established', 'Identity masking enabled']) {
                await NX.sleep(140);
                L('<span class="t-ok">[OK]</span> ' + t, 't-indent');
            }
            S();
            await NX.sleep(200);

            await P('root@nexus:~$ establishing connection...', 't-prompt-line', { sound: true, speed: 12 });
            if (A) A.connect();
            await NX.animateBar(this.out, { width: 22, duration: 1600, className: 't-indent t-bar-green' });
            for (let i = 1; i <= 3; i++) {
                await NX.sleep(200);
                L('<span class="t-arrow">&gt;</span> routing through node_0' + i + '...', 't-indent t-dim');
            }
            await NX.sleep(200);
            L('<span class="t-arrow">&gt;</span> connection established', 't-indent t-ok');
            S();

            await P('root@nexus:~$ running system diagnostics...', 't-prompt-line', { sound: true, speed: 12 });
            S();
            const diag = [
                ['CPU', '41%'], ['MEMORY', '67%'], ['NETWORK', 'ACTIVE'],
                ['FIREWALL', 'ENABLED'], ['ENCRYPTION', 'AES-256']
            ];
            for (const [k, v] of diag) {
                await NX.sleep(120);
                L('<span class="t-indent-inline">' + NX.dotline(k, '', 22).replace(/\s+$/, '') + '</span> <span class="t-val">' + v + '</span>', 't-indent');
            }
            S();

            await P('root@nexus:~$ scanning simulated network...', 't-prompt-line', { sound: true, speed: 12 });
            S();
            const nodes = [
                ['[01]', 'NODE-ALPHA', 'ONLINE', 't-ok'],
                ['[02]', 'NODE-BETA', 'ONLINE', 't-ok'],
                ['[03]', 'NODE-GAMMA', 'FILTERED', 't-warn'],
                ['[04]', 'NODE-DELTA', 'ONLINE', 't-ok']
            ];
            for (const [idx, nm, st, cls] of nodes) {
                await NX.sleep(160);
                const label = idx + ' ' + nm + ' ';
                const dots = '.'.repeat(Math.max(3, 26 - label.length));
                L('<span class="t-dim">' + idx + '</span> ' + nm + ' <span class="t-dim">' + dots + '</span> <span class="' + cls + '">' + st + '</span>', 't-indent');
                if (A) A.blip(600, 0.03, 'square', 0.05);
            }
            L('4 nodes discovered.', 't-indent t-dim');
            S();

            await P('root@nexus:~$ analyzing security layers...', 't-prompt-line', { sound: true, speed: 12 });
            S();
            for (const k of ['FIREWALL', 'AUTHENTICATION', 'ENCRYPTION', 'ACCESS CONTROL']) {
                await NX.sleep(140);
                const label = k + ' ';
                const dots = '.'.repeat(Math.max(3, 24 - label.length));
                L(k + ' <span class="t-dim">' + dots + '</span> <span class="t-cyan">DETECTED</span>', 't-indent');
            }
            S();
            await NX.sleep(200);
            L('<span class="t-arrow">&gt;</span> SIMULATION MODE ENABLED', 't-sim-line');
            S();
            if (A) A.confirm();

            L("Type '<span class=\"t-key\">help</span>' for available simulation commands.", 't-dim');
            S();

            this.busy = false;
            this._setInputEnabled(true);
            this.focus();
        }
    };

    /* =====================================================
       COMMAND IMPLEMENTATIONS  (all visual-only)
       ===================================================== */
    const NXref = () => window.NX;

    const COMMANDS = {
        async help() {
            const NX = NXref();
            NX.line(this.out, 'AVAILABLE SIMULATION COMMANDS', 't-head');
            NX.spacer(this.out);
            const rows = [
                ['help', 'show this command list'],
                ['status', 'display simulated system status'],
                ['scan', 'run a simulated network scan'],
                ['connect', 'simulate a secure connection'],
                ['decrypt', 'run a fake decryption routine'],
                ['trace', 'simulate a proxy trace'],
                ['nodes', 'list simulated network nodes'],
                ['breach', 'launch dramatic breach simulation'],
                ['hacker', 'toggle HACKER TYPER (mash keys = code)'],
                ['matrix', 'enter matrix mode'],
                ['clear', 'clear the terminal'],
                ['whoami', 'print current operator'],
                ['exit', 'attempt to log out'],
                ['about', 'about this simulation']
            ];
            for (const [c, d] of rows) {
                NX.line(this.out, '  <span class="t-key">' + (c + '        ').slice(0, 9) + '</span> <span class="t-dim">' + d + '</span>', '');
            }
            NX.spacer(this.out);
            NX.line(this.out, 'SIMULATION MODE // NO REAL NETWORK ACTIVITY', 't-sim-line');
            NX.spacer(this.out);
        },

        async status() {
            const NX = NXref();
            const nodes = window.Monitor ? window.Monitor.getNodes() : 27;
            NX.line(this.out, 'SYSTEM STATUS', 't-head');
            NX.spacer(this.out);
            const rows = [
                ['CONNECTION', 'ENCRYPTED', 't-ok'],
                ['PROXY CHAIN', 'ACTIVE (3 HOPS)', 't-ok'],
                ['FIREWALL', 'ENABLED', 't-ok'],
                ['ENCRYPTION', 'AES-256-GCM', 't-cyan'],
                ['TRACE RISK', '0%', 't-ok'],
                ['NODES', nodes + ' SIMULATED', 't-val'],
                ['MODE', 'SIMULATION', 't-warn']
            ];
            for (const [k, v, c] of rows) {
                await NX.sleep(90);
                const label = k + ' ';
                const dots = '.'.repeat(Math.max(3, 24 - label.length));
                NX.line(this.out, k + ' <span class="t-dim">' + dots + '</span> <span class="' + c + '">' + v + '</span>', 't-indent');
            }
            NX.spacer(this.out);
        },

        async scan() {
            const NX = NXref();
            const A = window.NexusAudio;
            NX.line(this.out, 'Initializing simulated scan...', 't-dim');
            NX.spacer(this.out);
            if (window.Topology) window.Topology.surge();
            if (A) A.connect();
            await NX.animateBar(this.out, { width: 24, duration: 2000, className: 't-bar-green' });
            NX.spacer(this.out);
            const n = window.Monitor ? window.Monitor.getNodes() : 27;
            await NX.type(this.out, n + ' virtual nodes discovered.', { className: 't-ok', speed: 14 });
            NX.line(this.out, 'No real network activity performed.', 't-dim');
            NX.spacer(this.out);
            if (A) A.confirm();
        },

        async connect() {
            const NX = NXref();
            const A = window.NexusAudio;
            if (A) A.connect();
            await NX.type(this.out, 'Negotiating simulated secure tunnel...', { className: 't-dim', speed: 12, sound: true });
            for (let i = 1; i <= 3; i++) {
                await NX.sleep(260);
                NX.line(this.out, '<span class="t-arrow">&gt;</span> proxy hop ' + i + ' :: ' + NX.hex(2) + '.' + NX.hex(2) + '.' + NX.hex(2) + '.' + NX.hex(2) + ' <span class="t-ok">[OK]</span>', 't-indent');
            }
            await NX.sleep(200);
            NX.line(this.out, 'SIMULATED CONNECTION ESTABLISHED', 't-ok');
            NX.line(this.out, 'Session: ' + NX.keyBlock(2), 't-dim');
            NX.spacer(this.out);
            if (A) A.confirm();
        },

        async decrypt() {
            const NX = NXref();
            const A = window.NexusAudio;
            await NX.type(this.out, 'Loading simulated ciphertext block...', { className: 't-dim', speed: 12 });
            const scramble = NX.line(this.out, '', 't-cyan');
            // scramble effect
            for (let i = 0; i < 16; i++) {
                scramble.textContent = NX.hexBytes(12);
                if (A && i % 2 === 0) A.key();
                await NX.sleep(70);
            }
            await NX.animateBar(this.out, { width: 24, duration: 1600, className: 't-bar-green', label: 'KEY ' });
            scramble.textContent = 'PLAINTEXT: "the quick brown fox // SIMULATED"';
            scramble.className = 't-line t-ok';
            NX.line(this.out, 'Decryption simulated locally. No real data processed.', 't-dim');
            NX.spacer(this.out);
            if (A) A.confirm();
        },

        async trace() {
            const NX = NXref();
            const A = window.NexusAudio;
            NX.line(this.out, 'Simulating outbound trace (reverse proxy)...', 't-dim');
            NX.spacer(this.out);
            const cities = ['REYKJAVIK', 'ZURICH', 'SINGAPORE', 'SAO PAULO', 'TOKYO', 'AMSTERDAM'];
            const count = 5;
            for (let i = 0; i < count; i++) {
                await NX.sleep(300);
                const ms = NX.randInt(8, 240);
                const city = cities[NX.randInt(0, cities.length - 1)];
                NX.line(this.out, '  hop ' + (i + 1) + '  ' + NX.hex(2) + '.' + NX.hex(2) + '.' + NX.hex(2) + '.' + NX.hex(2) +
                    '  <span class="t-dim">' + (city + '        ').slice(0, 10) + '</span> <span class="t-cyan">' + ms + 'ms</span>', 't-indent');
                if (A) A.blip(500 + i * 80, 0.03, 'sine', 0.05);
            }
            NX.spacer(this.out);
            NX.line(this.out, 'TRACE TERMINATED — origin masked. (simulated)', 't-ok');
            NX.line(this.out, 'TRACE RISK: 0%', 't-dim');
            NX.spacer(this.out);
        },

        async nodes() {
            const NX = NXref();
            NX.line(this.out, 'SIMULATED NETWORK NODES', 't-head');
            NX.spacer(this.out);
            const states = [['ONLINE', 't-ok'], ['SECURED', 't-cyan'], ['UNKNOWN', 't-warn'], ['FILTERED', 't-warn']];
            const total = window.Monitor ? window.Monitor.getNodes() : 27;
            const show = Math.min(8, total);
            for (let i = 0; i < show; i++) {
                await NX.sleep(70);
                const st = states[NX.randInt(0, states.length - 1)];
                const id = '[' + String(i + 1).padStart(2, '0') + ']';
                const nm = 'NODE-' + NX.hex(4);
                const label = id + ' ' + nm + ' ';
                const dots = '.'.repeat(Math.max(3, 28 - label.length));
                NX.line(this.out, '<span class="t-dim">' + id + '</span> ' + nm + ' <span class="t-dim">' + dots + '</span> <span class="' + st[1] + '">' + st[0] + '</span>', 't-indent');
            }
            NX.line(this.out, '... ' + (total - show) + ' more (simulated)', 't-dim');
            NX.spacer(this.out);
        },

        async breach() {
            const NX = NXref();
            NX.line(this.out, 'Launching breach simulation overlay...', 't-dim');
            NX.spacer(this.out);
            if (window.Breach) setTimeout(() => window.Breach.run(), 300);
        },

        async matrix() {
            const NX = NXref();
            NX.line(this.out, 'Entering the construct...', 't-ok');
            NX.spacer(this.out);
            if (window.Matrix) setTimeout(() => window.Matrix.enter(), 250);
        },

        async hacker() {
            const NX = NXref();
            if (window.HackerTyper) {
                NX.line(this.out, 'Engaging HACKER TYPER — mash any keys, press ESC to stop.', 't-ok');
                NX.spacer(this.out);
                setTimeout(() => window.HackerTyper.start(), 200);
            } else {
                NX.line(this.out, 'HACKER TYPER module unavailable.', 't-err');
                NX.spacer(this.out);
            }
        },


        async clear() { this.clear(); },

        async whoami() {
            const NX = NXref();
            NX.line(this.out, 'root', 't-ok');
            NX.line(this.out, 'uid=0(root) gid=0(root) groups=0(root) // SIMULATED OPERATOR', 't-dim');
            NX.spacer(this.out);
        },

        async about() {
            const NX = NXref();
            NX.line(this.out, 'NEXUS // SECURE TERMINAL', 't-head');
            NX.line(this.out, 'A cinematic, 100% fictional cybersecurity simulation.', 't-dim');
            NX.line(this.out, 'No real scanning, exploitation, or network activity occurs.', 't-dim');
            NX.line(this.out, 'All nodes, packets, keys, and targets are generated locally.', 't-dim');
            NX.spacer(this.out);
            NX.line(this.out, 'SIMULATION MODE // NO REAL NETWORK ACTIVITY', 't-sim-line');
            NX.spacer(this.out);
        },

        async exit() {
            const NX = NXref();
            await NX.type(this.out, 'Attempting to close secure shell...', { className: 't-dim', speed: 14 });
            await NX.sleep(600);
            NX.line(this.out, 'PERMISSION DENIED: operator cannot escape the simulation.', 't-err');
            NX.line(this.out, 'There is no exit. There is only NEXUS.', 't-warn');
            NX.spacer(this.out);
            if (window.NexusAudio) window.NexusAudio.warn();
        }
    };

    // aliases
    COMMANDS.cls = COMMANDS.clear;
    COMMANDS.ls = COMMANDS.nodes;
    COMMANDS.man = COMMANDS.help;

    /* =====================================================
       EASTER EGGS
       ===================================================== */
    const EGGS = {
        async 'sudo matrix'() {
            const NX = NXref();
            NX.line(this.out, '[sudo] password for operator: ************', 't-dim');
            await NX.sleep(500);
            NX.line(this.out, 'Access granted. Bending reality...', 't-ok');
            NX.spacer(this.out);
            if (window.Matrix) setTimeout(() => window.Matrix.enter(), 300);
        },

        async 'sudo coffee'() {
            const NX = NXref();
            await NX.sleep(300);
            NX.line(this.out, 'ERROR:', 't-err');
            NX.line(this.out, 'Coffee module depleted.', 't-indent');
            NX.spacer(this.out);
            NX.line(this.out, 'STATUS:', 't-warn');
            NX.line(this.out, 'OPERATOR NEEDS CAFFEINE.', 't-indent');
            NX.spacer(this.out);
            NX.line(this.out, '   ( (', 't-dim');
            NX.line(this.out, '    ) )', 't-dim');
            NX.line(this.out, '  ........', 't-dim');
            NX.line(this.out, '  |      |]', 't-dim');
            NX.line(this.out, '  \\      /', 't-dim');
            NX.line(this.out, '   `----\'', 't-dim');
            NX.spacer(this.out);
            if (window.NexusAudio) window.NexusAudio.warn();
        },

        async 'hack the planet'() {
            const NX = NXref();
            const A = window.NexusAudio;
            NX.line(this.out, 'HACK THE PLANET!', 't-crit');
            NX.spacer(this.out);
            const arts = [
                'They\'re trashing our rights, man!',
                'Mess with the best, die like the rest.',
                'This is our world now... the world of the electron and the switch.'
            ];
            for (const a of arts) {
                await NX.sleep(300);
                NX.line(this.out, '  ' + a, 't-cyan');
            }
            NX.spacer(this.out);
            NX.line(this.out, '(still just a simulation, though)', 't-dim');
            NX.spacer(this.out);
            if (A) { A.glitch(); A.confirm(); }
            if (window.FX) window.FX.glitch(true);
        },

        async '42'() {
            const NX = NXref();
            NX.line(this.out, 'The Answer to the Ultimate Question of Life,', 't-cyan');
            NX.line(this.out, 'the Universe, and Everything.', 't-cyan');
            NX.spacer(this.out);
            NX.line(this.out, 'Unfortunately, nobody knows the Question.', 't-dim');
            NX.spacer(this.out);
        },

        async 'sudo rm -rf /'() {
            const NX = NXref();
            NX.line(this.out, 'NICE TRY.', 't-crit');
            NX.line(this.out, 'This is a simulation. Nothing here is real enough to delete.', 't-dim');
            NX.spacer(this.out);
            if (window.NexusAudio) window.NexusAudio.warn();
        },

        async 'ping'() {
            const NX = NXref();
            NX.line(this.out, 'PONG. (no packets actually sent — simulation)', 't-ok');
            NX.spacer(this.out);
        },

        async 'hacker typer'() {
            await COMMANDS.hacker.call(this);
        }
    };
    EGGS['the planet'] = EGGS['hack the planet'];
    EGGS['sudo hacker'] = EGGS['hacker typer'];

    window.Terminal = Terminal;
})();
