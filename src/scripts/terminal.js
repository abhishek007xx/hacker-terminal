/* ============================================================
   SPECTRE-9 // TACTICAL CYBER WARFARE TERMINAL
   High-intensity, multi-stage simulated black-ops commands.
   All data, scans, breaches, and exploits are 100% simulated locally.
   ============================================================ */
(function () {
    'use strict';

    const Terminal = {
        out: null, input: null, mirror: null, caret: null, inputline: null,
        history: [], histIdx: -1, busy: false, booted: false,
        vfs: {
            'exploit.py': '#!/usr/bin/env python3\nimport sys, socket\nTARGET = "10.99.14.88"\nPORT = 443\nprint(f"[+] Connecting to {TARGET}:{PORT}...")\npayload = b"\\x90"*32 + b"\\x31\\xc0\\x50\\x48\\xbb...\\x0f\\x05"\nprint("[+] Exploit payload synthesized successfully.")\n',
            'target_hashes.txt': '8F7A2C91D4E8A92F :: root_admin (AES-256)\n4B2199AF012C88EA :: sys_sec_lead (SHA-512)\nDE8841029FA77312 :: sat_relay_09 (Grover Quantum)\n',
            'recon_notes.md': '# SPECTRE-9 TARGET DOSSIER\n- Subnet: 10.99.14.0/24\n- Critical Nodes: SPECTRE-ALPHA (10.99.14.01), SPECTRE-DELTA (10.99.14.04)\n- Defense: WPA3 / Quantum-AES Cloak Active\n',
            'mission_brief.sp9': '[CLASSIFIED] OPERATION BLACKOUT :: INITIATE MESH TAKEDOWN\nAUTHORIZATION: LEVEL-5 ROOT\n'
        },

        mode: 'typer', // 'typer' (Option 1: Hacker Typer) or 'command' (Option 2: Command Run CLI)

        init() {
            this.out = document.getElementById('terminal-output');
            this.input = document.getElementById('terminal-input');
            this.mirror = document.getElementById('terminal-input-mirror');
            this.inputline = document.getElementById('terminal-inputline');
            this.body = document.getElementById('terminal-body');
            this.promptEl = document.getElementById('terminal-prompt');

            // Wire the 2 mode options (Option 1: Hacker Typer | Option 2: Command Run)
            this._wireTabs();

            if (this.input) {
                this.input.addEventListener('keydown', (e) => {
                    // Option 1: Hacker Typer Mode — any keypress streams code
                    if (this.mode === 'typer' && window.HackerTyper) {
                        if (e.ctrlKey || e.metaKey || e.altKey) return;
                        const k = e.key;
                        if (k === 'Escape' || k === 'Tab' || k === 'CapsLock' ||
                            k === 'Shift' || k === 'Control' || k === 'Alt' ||
                            k === 'Meta' || k === 'ContextMenu' ||
                            (k && k.startsWith('Arrow')) ||
                            (k && k.startsWith('F') && k.length > 1 && !isNaN(k.slice(1)))) {
                            return;
                        }
                        if (k === '?') return;

                        e.preventDefault();
                        e.stopPropagation();
                        this.input.value = '';
                        this._syncMirror();
                        this.input.blur();
                        if (!window.HackerTyper.active) window.HackerTyper.start();
                        window.HackerTyper._emit();
                        return;
                    }

                    // Option 2: Command Run Mode — standard interactive CLI execution!
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

                this.input.addEventListener('input', () => {
                    if (this.mode === 'typer' && window.HackerTyper && this.input.value.length > 0) {
                        this.input.value = '';
                        this._syncMirror();
                        this.input.blur();
                        if (!window.HackerTyper.active) window.HackerTyper.start();
                        window.HackerTyper._emit();
                        return;
                    }
                    this._syncMirror();
                });
            }

            // Click terminal focuses input if in command mode
            if (this.body) {
                this.body.addEventListener('click', () => {
                    if (this.mode === 'typer' && document.body.classList.contains('hacker-typing')) return;
                    if (this.input && !this.busy) this.input.focus();
                });
            }
            this._syncMirror();
        },

        setMode(mode) {
            this.mode = mode;
            const tabTyper = document.getElementById('tab-mode-typer');
            const tabCmd = document.getElementById('tab-mode-command');
            const pill = document.getElementById('term-active-pill');

            if (tabTyper) {
                tabTyper.classList.toggle('active', mode === 'typer');
                tabTyper.setAttribute('aria-selected', mode === 'typer' ? 'true' : 'false');
            }
            if (tabCmd) {
                tabCmd.classList.toggle('active', mode === 'command');
                tabCmd.setAttribute('aria-selected', mode === 'command' ? 'true' : 'false');
            }
            if (pill) {
                const ptext = pill.querySelector('.pill-text');
                if (ptext) {
                    ptext.textContent = mode === 'typer' ? 'MODE: HACKER TYPER' : 'MODE: COMMAND RUN';
                }
                pill.className = 'term-active-pill mode-' + mode;
            }

            if (window.NX && this.out) {
                window.NX.spacer(this.out);
                if (mode === 'typer') {
                    window.NX.line(this.out, '<span class="t-ok">&gt;&gt;&gt; OPTION 1 ACTIVE: HACKER TYPER</span> <span class="t-dim">— mash any keys on keyboard to stream code.</span>', 't-ok');
                } else {
                    window.NX.line(this.out, '<span class="t-cyan">&gt;&gt;&gt; OPTION 2 ACTIVE: COMMAND RUN</span> <span class="t-dim">— type commands (e.g. </span><span class="t-key">help</span><span class="t-dim">, </span><span class="t-key">scan</span><span class="t-dim">, </span><span class="t-key">breach</span><span class="t-dim">) and press Enter.</span>', 't-cyan');
                }
                window.NX.spacer(this.out);
            }

            if (mode === 'typer') {
                if (window.HackerTyper) window.HackerTyper.start();
            } else {
                if (window.HackerTyper && window.HackerTyper.active) {
                    window.HackerTyper.stop();
                }
                this._setInputEnabled(true);
                this.focus();
            }

            if (window.NexusAudio) window.NexusAudio.blip(mode === 'typer' ? 880 : 660, 0.04, 'square', 0.05);
            this._scrollToBottom();
        },

        _wireTabs() {
            const tabTyper = document.getElementById('tab-mode-typer');
            const tabCmd = document.getElementById('tab-mode-command');

            if (tabTyper) {
                tabTyper.onclick = (e) => {
                    e.preventDefault();
                    this.setMode('typer');
                };
            }
            if (tabCmd) {
                tabCmd.onclick = (e) => {
                    e.preventDefault();
                    this.setMode('command');
                };
            }
        },

        _scrollToBottom() {
            if (this.body) this.body.scrollTop = this.body.scrollHeight;
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
            const extra = [
                'sudo matrix', 'sudo coffee', 'hack the planet', 'hacker typer',
                'scan 192.168.1.1', 'connect 10.99.14.88', 'decrypt 0x8F7A', 'trace 172.16.0.4',
                'payload meterpreter', 'ddos target', 'airmon wlan0', 'sat link', 'purge data',
                'cam', 'drone', 'synth', 'cipher', 'exploit', 'nano exploit.py', 'ls', 'cat target_hashes.txt'
            ];
            const cmds = Object.keys(COMMANDS).concat(extra);
            const match = cmds.find((c) => c.startsWith(val));
            if (match) { this.input.value = match; this._syncMirror(); }
        },

        // Echo the command as a prompt line
        _echo(cmd) {
            const NX = window.NX;
            const p = (this.sessions && this.sessions[this.activeTab]) ? this.sessions[this.activeTab].prompt : 'operator@spectre-9:~$';
            NX.line(this.out,
                '<span class="t-prompt">' + this._esc(p) + '</span> ' +
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

            // Check for command piping: e.g. "nodes | grep 10.99"
            if (cmd.includes('|')) {
                const pipeParts = cmd.split('|').map(s => s.trim());
                const firstCmd = pipeParts[0];
                const pipeCmd = pipeParts[1] || '';

                if (pipeCmd.toLowerCase().startsWith('grep ')) {
                    const pattern = pipeCmd.slice(5).trim();
                    const NX = window.NX;
                    NX.line(this.out, '>> PIPING OUTPUT THROUGH GREP FILTER: [' + pattern + '] <<', 't-cyan');
                    // Execute base command and display filter notice
                    await this._dispatch(firstCmd);
                    return;
                }
            }

            // multi-word easter eggs first
            if (EGGS[lower]) { await EGGS[lower].call(this); return; }
            const parts = lower.split(/\s+/);
            const name = parts[0];
            const args = parts.slice(1);
            if (COMMANDS[name]) { await COMMANDS[name].call(this, args, cmd); return; }
            
            // unknown
            const NX = window.NX;
            NX.line(this.out, 'COMMAND NOT RECOGNIZED BY SPECTRE TACTICAL CORE', 't-err');
            NX.line(this.out, "Type '<span class=\"t-key\">help</span>' to inspect classified black-ops toolset.", 't-dim');
            NX.spacer(this.out);
            if (window.NexusAudio) window.NexusAudio.warn();
        },

        clear() {
            if (this.out) this.out.innerHTML = '';
        },

        // ---------- AUTO-PLAY CINEMATIC INTRO ----------
        async playIntro() {
            if (this.booted) return;
            this.booted = true;
            const NX = window.NX;
            const A = window.NexusAudio;
            this._setInputEnabled(false);
            this.busy = true;

            const P = (t, cls, opts) => NX.type(this.out, t, Object.assign({ className: cls, speed: 8 }, opts || {}));
            const L = (h, cls) => NX.line(this.out, h, cls);
            const S = () => NX.spacer(this.out);

            // If prompt line is not pre-rendered, type it
            if (!this.out.querySelector('.t-prompt-line')) {
                await P('operator@spectre-9:~$ initializing black-ops tactical shell...', 't-prompt-line', { sound: true, speed: 8 });
            }
            const bootItems = [
                ['Microkernel Memory Map', 'AMD64 HARDENED [OK]'],
                ['AES-XTS-512 RAMDISK', 'MOUNTED [OK]'],
                ['Anti-Forensic Memory Cloak', 'ARMED [OK]'],
                ['Multi-Hop Onion Mesh (5-Node)', 'ROUTED [OK]'],
                ['Zero-Day Exploit Framework', 'STANDBY [OK]']
            ];
            for (const [k, v] of bootItems) {
                await NX.sleep(70);
                const dots = '.'.repeat(Math.max(3, 30 - k.length));
                L('<span class="t-dim">&gt;</span> ' + k + ' <span class="t-dim">' + dots + '</span> <span class="t-ok">' + v + '</span>', 't-indent');
                if (A) A.blip(580, 0.02, 'square', 0.04);
            }
            S();

            await P('operator@spectre-9:~$ establishing classified satellite link...', 't-prompt-line', { sound: true, speed: 8 });
            if (A) A.connect();
            await NX.animateBar(this.out, { width: 24, duration: 600, className: 't-indent t-bar-green', label: 'UPLINK ' });
            const hops = ['RELAY_REYKJAVIK', 'RELAY_ZURICH', 'RELAY_TOKYO', 'SHADOW_NODE_09'];
            for (let i = 0; i < hops.length; i++) {
                await NX.sleep(70);
                L('<span class="t-arrow">&gt;&gt;</span> hop 0' + (i + 1) + ' :: ' + hops[i] + ' [' + NX.hex(2) + '.' + NX.hex(2) + '.' + NX.hex(2) + '] <span class="t-cyan">' + NX.randInt(14, 88) + 'ms</span>', 't-indent t-dim');
            }
            L('<span class="t-ok">&gt;&gt; SECURE MESH ESTABLISHED // ORIGIN ZEROIZED</span>', 't-indent');
            S();

            await P('operator@spectre-9:~$ scanning darknet sector grid...', 't-prompt-line', { sound: true, speed: 8 });
            S();
            const sectorNodes = [
                ['[01]', 'SPECTRE-ALPHA', '10.99.14.01', 'ARMED // ONLINE', 't-ok'],
                ['[02]', 'SPECTRE-BRAVO', '10.99.14.02', 'STEALTH ACTIVE', 't-cyan'],
                ['[03]', 'SPECTRE-CHARLIE', '10.99.14.03', 'SHIELD OVERRIDE', 't-warn'],
                ['[04]', 'SPECTRE-DELTA', '10.99.14.04', 'TARGET ACQUIRED', 't-ok']
            ];
            for (const [idx, nm, ip, st, cls] of sectorNodes) {
                await NX.sleep(70);
                const label = idx + ' ' + nm + ' (' + ip + ') ';
                const dots = '.'.repeat(Math.max(3, 38 - label.length));
                L('<span class="t-dim">' + idx + '</span> <b>' + nm + '</b> <span class="t-dim">' + dots + '</span> <span class="' + cls + '">' + st + '</span>', 't-indent');
                if (A) A.blip(640, 0.03, 'square', 0.05);
            }
            S();

            L('<span class="t-arrow">&gt;</span> SPECTRE-9 TACTICAL SUITE READY // OPERATIVE CLEARANCE: LEVEL-5', 't-sim-line');
            S();
            if (A) A.confirm();

            L("Type '<span class=\"t-key\">help</span>' to inspect tactical arsenal or '<span class=\"t-key\">scan</span>' to initiate reconnaissance.", 't-dim');
            S();

            this.busy = false;
            this._setInputEnabled(true);
            this.focus();
        }
    };

    /* =====================================================
       TACTICAL BLACK-OPS COMMAND IMPLEMENTATIONS
       ===================================================== */
    const NXref = () => window.NX;

    const COMMANDS = {
        async help() {
            const NX = NXref();
            const A = window.NexusAudio;
            if (A) A.blip(740, 0.04, 'square', 0.08);

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  SPECTRE-9 // TACTICAL BLACK-OPS COMMAND MATRIX', 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            const categories = [
                {
                    title: '▶ RECONNAISSANCE & GEO-INTELLIGENCE',
                    cls: 't-cyan',
                    cmds: [
                        ['scan [target]', 'deep multi-port scan, subnet ARP sweep & CVE mapping'],
                        ['trace [ip]', 'orbital satellite triangulation & multi-hop route tracking'],
                        ['geoip [ip]', 'orbital geo-intelligence dossier & AS routing lookup'],
                        ['sat', 'lock orbital reconnaissance satellite & intercept telemetry'],
                        ['nodes', 'display live darknet routing table with defense metrics'],
                        ['airmon', 'simulate 802.11 RF monitor mode & WPA3 handshake capture']
                    ]
                },
                {
                    title: '▶ OFFENSIVE WARFARE & EXPLOITATION',
                    cls: 't-crit',
                    cmds: [
                        ['mitm [target]', 'man-in-the-middle ARP poison & session token interceptor'],
                        ['nuke [target]', 'orbital EMP pulse shockwave & subnet blackout simulation'],
                        ['inject [pid]', 'memory thread hijack & DLL injection diagnostics'],
                        ['breach', 'launch full 6-tier military-grade penetration simulation'],
                        ['decrypt [hash]', 'multi-threaded quantum rainbow table brute-force solver'],
                        ['payload', 'synthesize polymorphic x86_64 shellcode / memory stager'],
                        ['ddos [target]', 'high-bandwidth 256-node virtual botnet swarm assault']
                    ]
                },
                {
                    title: '▶ CYBER DEFENSE & WARGAMES',
                    cls: 't-ok',
                    cmds: [
                        ['game / defend', 'launch real-time interactive APT attack defense wargame'],
                        ['defcon [1-5]', 'change military cyber readiness level & alarm strobes'],
                        ['theme [name]', 'switch CRT phosphor color (green, cyan, amber, red, purple)'],
                        ['matrix', 'enter fullscreen falling-glyph cyber construct mode'],
                        ['hacker', 'toggle HACKER TYPER mode (mash any keys to pour code)']
                    ]
                },
                {
                    title: '▶ SYSTEM & CLASSIFIED UTILITIES',
                    cls: 't-warn',
                    cmds: [
                        ['status', 'inspect 8-core CPU distribution, entropy reserves & defenses'],
                        ['connect [ip]', 'establish 5-hop encrypted onion tunnel with anti-DPI cloak'],
                        ['keygen', 'procedural black-ops serial license key generator'],
                        ['whoami', 'print operative clearance dossier & cryptographic keys'],
                        ['audio [sfx]', 'synthesize tactical SFX (emp, sonar, static, siren, morse)'],
                        ['purge', 'emergency DoD 3-pass cryptographic data zeroization'],
                        ['clear', 'sanitize terminal buffer (alias: cls)'],
                        ['about', 'inspect SPECTRE-9 black-ops engine specifications'],
                        ['privacy', 'inspect data privacy policy & cookie compliance'],
                        ['terms', 'review simulation terms of service & fair use'],
                        ['contact', 'secure communication uplink & operative dispatch'],
                        ['exit', 'attempt disconnection from tactical grid']
                    ]
                }
            ];

            for (const cat of categories) {
                NX.line(this.out, cat.title, cat.cls);
                for (const [c, d] of cat.cmds) {
                    const pad = '                 '.slice(0, Math.max(1, 18 - c.length));
                    NX.line(this.out, '  <span class="t-key">' + c + '</span>' + pad + '<span class="t-dim">' + d + '</span>', '');
                }
                NX.spacer(this.out);
                await NX.sleep(30);
            }

            NX.line(this.out, '>> SYSTEM STATUS // HARDENED BLACK-OPS CONSOLE ACTIVE <<', 't-cyan');
            NX.spacer(this.out);
        },

        async scan(args) {
            const NX = NXref();
            const A = window.NexusAudio;
            const target = args && args[0] ? args[0] : '192.168.1.0/24';

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  [STAGE 1/5] INITIATING TACTICAL RECONNAISSANCE :: ' + target, 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            if (A) A.connect();
            if (window.Topology) window.Topology.surge();

            // Phase 1: ARP probe
            await NX.type(this.out, '> Broadcast ARP sweep across subnet mask...', { className: 't-dim', speed: 10 });
            await NX.animateBar(this.out, { width: 26, duration: 1800, className: 't-bar-green', label: 'ARP PROBE ' });
            
            const liveIPs = [
                ['192.168.1.1', '00:1A:2B:3C:4D:5E', 'GATEWAY / CISCO-CORE', '0.4ms', 't-ok'],
                ['192.168.1.10', 'A4:5E:60:77:88:99', 'UBUNTU-HARDENED-SERVER', '1.2ms', 't-ok'],
                ['192.168.1.45', 'B8:27:EB:11:22:33', 'EMBEDDED SCADA CONTROLLER', '2.8ms', 't-warn'],
                ['192.168.1.88', '70:85:C2:AA:BB:CC', 'KUBERNETES MASTER NODE', '0.9ms', 't-ok'],
                ['192.168.1.105', 'F0:18:98:DD:EE:FF', 'ACTIVE DIRECTORY DOMAIN CONTROLLER', '1.6ms', 't-crit']
            ];

            NX.spacer(this.out);
            NX.line(this.out, 'DISCOVERED ACTIVE TARGET HOSTS:', 't-cyan');
            for (const [ip, mac, host, ping, cls] of liveIPs) {
                await NX.sleep(120);
                NX.line(this.out, '  <span class="t-key">' + ip + '</span>  <span class="t-dim">[' + mac + ']</span>  <span class="' + cls + '">[' + host + ']</span>  <span class="t-dim">' + ping + '</span>', 't-indent');
                if (A) A.blip(520, 0.02, 'square', 0.04);
            }
            NX.spacer(this.out);

            // Phase 2: Multi-port socket scan
            NX.line(this.out, '  [STAGE 2/5] MULTI-PORT SOCKET ENUMERATION & BANNER GRAB', 't-head');
            NX.spacer(this.out);

            const ports = [
                ['21/TCP', 'FTP', 'vsftpd 3.0.3 (Anonymous Enabled)', 'VULNERABLE', 't-warn'],
                ['22/TCP', 'SSH', 'OpenSSH 8.9p1 Ubuntu-3ubuntu0.1', 'OPEN', 't-ok'],
                ['53/UDP', 'DNS', 'BIND 9.18.1-1ubuntu1.3 (Recursion Enabled)', 'FILTERED', 't-dim'],
                ['80/TCP', 'HTTP', 'nginx/1.22.0 (Reverse Proxy)', 'OPEN', 't-ok'],
                ['443/TCP', 'HTTPS', 'OpenSSL/3.0.2 TLSv1.3 Hardened', 'SECURED', 't-cyan'],
                ['3306/TCP', 'MYSQL', 'MySQL 8.0.32-commercial', 'OPEN', 't-ok'],
                ['6443/TCP', 'K8S-API', 'Kubernetes API Server v1.27.1', 'EXPOSED', 't-crit'],
                ['8080/TCP', 'HTTP-ALT', 'Apache Tomcat/9.0.58 [JMX Invoker Active]', 'CRITICAL', 't-crit'],
                ['9200/TCP', 'ELASTIC', 'Elasticsearch 7.17.0 (Cluster: PROD-ALPHA)', 'OPEN', 't-ok'],
                ['27017/TCP', 'MONGODB', 'MongoDB Enterprise v6.0.4', 'SECURED', 't-cyan']
            ];

            for (const [port, svc, banner, st, cls] of ports) {
                await NX.sleep(140);
                const pad = '         '.slice(0, Math.max(1, 10 - port.length));
                const svcPad = '          '.slice(0, Math.max(1, 10 - svc.length));
                NX.line(this.out, '  <span class="t-key">' + port + '</span>' + pad + '<span class="t-cyan">' + svc + '</span>' + svcPad + '<span class="t-dim">' + banner + '</span>  <span class="' + cls + '">[' + st + ']</span>', '');
                if (A) A.blip(600 + Math.random() * 200, 0.02, 'square', 0.03);
            }
            NX.spacer(this.out);

            // Phase 3: OS Fingerprint
            NX.line(this.out, '  [STAGE 3/5] OS KERNEL & TOPOLOGY FINGERPRINTING', 't-head');
            await NX.sleep(180);
            NX.line(this.out, '  ├─ KERNEL VERSION   : Linux 6.1.0-21-hardened-amd64 (SMP preempt)', 't-dim');
            NX.line(this.out, '  ├─ ARCHITECTURE     : x86_64 / NUMA 4-Node Cluster', 't-dim');
            NX.line(this.out, '  ├─ SECURITY MODULE  : SELinux [Enforcing] // AppArmor Active', 't-warn');
            NX.line(this.out, '  ├─ DEFENSE SHIELD   : Quantum Entropy Guard & Anti-DPI Active', 't-cyan');
            NX.line(this.out, '  └─ FINGERPRINT HASH : 0x' + NX.hex(16) + ' [CONFIDENCE: 99.4%]', 't-ok');
            NX.spacer(this.out);

            // Phase 4: CVE Vulnerability Matrix
            NX.line(this.out, '  [STAGE 4/5] AUTOMATED CVE EXPLOITATION MAPPING', 't-head');
            NX.spacer(this.out);

            const cves = [
                ['CVE-2026-9182', 'CRITICAL', 'TLS Handshake Memory Leak / Remote Code Execution', 'CVSS 9.8', 't-crit'],
                ['CVE-2025-4419', 'HIGH', 'JMX Invoker Deserialization Privilege Escalation', 'CVSS 8.6', 't-warn'],
                ['CVE-2024-8831', 'HIGH', 'Kubernetes RBAC Secret Enumeration Bypass', 'CVSS 8.1', 't-warn'],
                ['CVE-2024-3112', 'MEDIUM', 'OpenSSL Timing Discrepancy Side-Channel', 'CVSS 6.5', 't-cyan']
            ];

            for (const [cve, sev, desc, cvss, cls] of cves) {
                await NX.sleep(160);
                NX.line(this.out, '  <span class="t-key">' + cve + '</span>  <span class="' + cls + '">[' + sev + ' - ' + cvss + ']</span>', 't-indent');
                NX.line(this.out, '  └─ ' + desc, 't-indent t-dim');
            }
            NX.spacer(this.out);

            // Phase 5: Final Summary
            NX.line(this.out, '  [STAGE 5/5] RECONNAISSANCE REPORT GENERATED', 't-head');
            NX.line(this.out, '  >> TARGET PERIMETER VULNERABLE // 3 ZERO-DAY VECTORS IDENTIFIED <<', 't-crit');
            NX.line(this.out, '  Hint: Run \'<span class="t-key">payload</span>\' or \'<span class="t-key">breach</span>\' to simulate exploitation.', 't-dim');
            NX.line(this.out, '  (All scan results purely simulated locally — zero packets sent)', 't-dim');
            NX.spacer(this.out);

            if (A) A.confirm();
        },

        async connect(args) {
            const NX = NXref();
            const A = window.NexusAudio;
            const dest = args && args[0] ? args[0] : '10.99.14.88';

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  NEGOTIATING BLACK-OPS ONION TUNNEL :: ' + dest, 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            if (A) A.connect();

            await NX.type(this.out, '> Generating ephemeral Curve25519 keypair...', { className: 't-dim', speed: 10 });
            await NX.sleep(200);
            NX.line(this.out, '  PUBLIC KEY  : 0x' + NX.hex(32), 't-cyan');
            NX.line(this.out, '  SESSION HASH: ' + NX.keyBlock(4), 't-dim');
            NX.spacer(this.out);

            await NX.type(this.out, '> Building 5-hop distributed proxy circuit...', { className: 't-dim', speed: 10 });
            const circuit = [
                ['HOP 1 [ENTRY] ', 'REYKJAVIK, IS', '185.220.101.4', '12ms', 'AES-256-GCM'],
                ['HOP 2 [RELAY] ', 'ZURICH, CH   ', '194.26.29.112', '24ms', 'CHACHA20-POLY1305'],
                ['HOP 3 [RELAY] ', 'TOKYO, JP    ', '103.251.167.8', '94ms', 'AES-256-CTR'],
                ['HOP 4 [RELAY] ', 'SINGAPORE, SG', '139.99.120.45', '142ms', 'XCHACHA20'],
                ['HOP 5 [EXIT]  ', 'DARKNET-SECTOR', dest, '165ms', 'SPECTRE-CASCADE']
            ];

            for (const [hop, loc, ip, lat, cipher] of circuit) {
                await NX.sleep(240);
                NX.line(this.out, '  <span class="t-arrow">&gt;&gt;</span> ' + hop + ' :: <b>' + loc + '</b> [' + ip + '] <span class="t-cyan">' + lat + '</span> <span class="t-ok">[' + cipher + ']</span>', 't-indent');
                if (A) A.blip(540 + Math.random() * 180, 0.03, 'square', 0.04);
            }
            NX.spacer(this.out);

            await NX.animateBar(this.out, { width: 26, duration: 1600, className: 't-bar-green', label: 'OBFUSCATION ' });
            NX.spacer(this.out);

            NX.line(this.out, '>> ENCRYPTED TUNNEL ACTIVE // STEALTH PROTOCOL ARMED <<', 't-ok');
            NX.line(this.out, 'Origin IP: CLASSIFIED // Anti-DPI Noise Injected // Bandwidth: 1.2 Gbps', 't-dim');
            NX.spacer(this.out);

            const metaConn = document.getElementById('meta-connection');
            if (metaConn) metaConn.textContent = 'SPECTRE-MESH';
            const metaNode = document.getElementById('meta-node');
            if (metaNode) metaNode.textContent = dest;

            if (A) A.confirm();
        },

        async decrypt(args) {
            const NX = NXref();
            const A = window.NexusAudio;
            const hash = args && args[0] ? args[0] : '0x' + NX.hex(32);

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  HIGH-ENTROPY CIPHERTEXT DECRYPTION ENGINE', 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            NX.line(this.out, 'CIPHERTEXT PAYLOAD : ' + hash, 't-key');
            NX.line(this.out, 'CIPHER ALGORITHM   : AES-256-GCM + ChaCha20 Multi-Layer Cascade', 't-dim');
            NX.line(this.out, 'KEYSPACE SEARCH    : 2^256 Combinations // CUDA GPU Cluster Engaged', 't-dim');
            NX.spacer(this.out);

            if (A) A.connect();

            // Rapid live dictionary scramble
            await NX.type(this.out, '> Executing parallel rainbow table search & key derivation...', { className: 't-dim', speed: 10 });
            const scrambleLine = NX.line(this.out, '', 't-cyan');
            for (let i = 0; i < 22; i++) {
                scrambleLine.textContent = '  [DERIVING] 0x' + NX.hex(8) + '  KEY: ' + NX.keyBlock(3) + '  HASH: ' + NX.hexBytes(8);
                if (A && i % 2 === 0) A.key();
                await NX.sleep(65);
            }
            scrambleLine.textContent = '  [DERIVING] KEY COLLISION FOUND IN SHADOW RAINBOW TABLE!';
            scrambleLine.className = 't-line t-ok';
            NX.spacer(this.out);

            // Block solving sequence
            const blocks = ['BLOCK 01 (HEADER)', 'BLOCK 02 (PAYLOAD)', 'BLOCK 03 (AUTH TAG)', 'BLOCK 04 (SIGNATURE)'];
            for (let b = 0; b < blocks.length; b++) {
                await NX.animateBar(this.out, { width: 22, duration: 650, className: 't-bar-green', label: blocks[b] + ' ' });
                if (A) A.blip(700 + b * 100, 0.03, 'sine', 0.05);
            }
            NX.spacer(this.out);

            // Glitch payoff
            if (window.FX) window.FX.glitch(true);
            if (A) A.glitch();
            await NX.sleep(300);

            NX.line(this.out, '>> DECRYPTION COMPLETE // PLAINTEXT EXTRACTED <<', 't-ok');
            NX.spacer(this.out);
            NX.line(this.out, '================ CLASSIFIED INTELLIGENCE REPORT ===============', 't-head');
            NX.line(this.out, 'OPERATIVE DIRECTIVE : PROJECT SPECTRE // SECTOR-09', 't-cyan');
            NX.line(this.out, 'TARGET FACILITY     : GLOBAL SATELLITE COMMAND HUB', 't-dim');
            NX.line(this.out, 'ROOT CREDENTIALS    : master_admin : $6$rounds=50000$q8Z9x7... [AUTHENTICATED]', 't-ok');
            NX.line(this.out, 'ENCRYPTED PAYLOAD   : "THE GRID BELONGS TO THOSE WHO CONTROL THE ELECTRONS"', 't-warn');
            NX.line(this.out, '===============================================================', 't-head');
            NX.spacer(this.out);

            if (A) A.confirm();
        },

        async trace(args) {
            const NX = NXref();
            const A = window.NexusAudio;
            const target = args && args[0] ? args[0] : '172.16.0.4';

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  ORBITAL SATELLITE REVERSE-TRACE PROTOCOL :: ' + target, 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            if (A) A.connect();

            await NX.type(this.out, '> Aligning orbital telemetry with SPECTRE-SAT-04...', { className: 't-dim', speed: 10 });
            await NX.sleep(250);
            NX.line(this.out, '  SATELLITE POSITION: LAT 52.5200° N, LON 13.4050° E // ALTITUDE: 420.5 KM', 't-cyan');
            NX.spacer(this.out);

            const hops = [
                ['1', '10.99.14.1', 'FRANKFURT, DE', 'DE-CIX BACKBONE', '4.2ms'],
                ['2', '80.81.192.1', 'AMSTERDAM, NL', 'AMS-IX EXCHANGE', '12.8ms'],
                ['3', '195.66.224.1', 'LONDON, UK', 'LINX TELECOM NODE', '19.4ms'],
                ['4', '206.108.255.1', 'ASHBURN, US', 'EQUINIX DATA CENTER', '84.1ms'],
                ['5', '180.87.180.1', 'SEOUL, KR', 'KT GIGA INFRASTRUCTURE', '162.0ms'],
                ['6', target, 'CLASSIFIED SECTOR', 'TARGET HOST NODE', '188.5ms']
            ];

            for (const [idx, ip, loc, isp, ping] of hops) {
                await NX.sleep(280);
                NX.line(this.out, '  hop 0' + idx + '  <span class="t-key">' + (ip + '                ').slice(0, 16) + '</span>  <span class="t-cyan">' + (loc + '            ').slice(0, 14) + '</span>  <span class="t-dim">' + (isp + '                    ').slice(0, 22) + '</span>  <span class="t-val">' + ping + '</span>', '');
                if (A) A.blip(500 + idx * 70, 0.03, 'sine', 0.04);
            }
            NX.spacer(this.out);

            // Trigger simulated trace spike warning
            NX.line(this.out, '>> ALERT: TARGET HOST INITIATING REVERSE-TRACE PROBE! <<', 't-crit');
            if (window.FX) window.FX.raiseTrace(82);
            if (A) A.warn();
            document.body.classList.add('screen-shake');
            setTimeout(() => document.body.classList.remove('screen-shake'), 350);

            await NX.sleep(600);
            await NX.type(this.out, '> Deploying anti-trace decoy swarm & burning relay hops...', { className: 't-warn', speed: 12 });
            for (let i = 1; i <= 3; i++) {
                await NX.sleep(220);
                NX.line(this.out, '  [DEFENSE] BURNING HOP 0' + i + ' ... PROXY SANITIZED [OK]', 't-indent t-ok');
            }

            await NX.sleep(400);
            NX.spacer(this.out);
            NX.line(this.out, '>> REVERSE TRACE DEFLECTED // OPERATIVE IDENTITY 100% PRESERVED <<', 't-ok');
            NX.line(this.out, 'Active Trace Risk: 0% // Decoy telemetry successfully fed to target.', 't-dim');
            NX.spacer(this.out);
        },

        async nodes() {
            const NX = NXref();
            const A = window.NexusAudio;
            const total = window.Monitor ? window.Monitor.getNodes() : 27;

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  SPECTRE-9 DARKNET ROUTING & NODE INFRASTRUCTURE', 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            NX.line(this.out, 'NODE ID       IP ADDRESS       PROTO   PORT    LATENCY  ENCRYPTION      STATUS', 't-cyan');
            NX.line(this.out, '----------------------------------------------------------------------', 't-dim');

            const nodesList = [
                ['NODE-001', '10.99.14.10', 'TCP/TLS', '443', '12ms', 'AES-256-GCM', 'ONLINE', 't-ok'],
                ['NODE-002', '10.99.14.22', 'UDP/DTLS', '8443', '18ms', 'CHACHA20', 'ONLINE', 't-ok'],
                ['NODE-003', '10.99.14.35', 'QUIC', '9000', '24ms', 'QUANTUM-G', 'STEALTH', 't-cyan'],
                ['NODE-004', '10.99.14.48', 'TCP/TOR', '9050', '88ms', 'XCHACHA20', 'FILTERED', 't-warn'],
                ['NODE-005', '10.99.14.61', 'SSH/MESH', '2222', '32ms', 'RSA-4096', 'ONLINE', 't-ok'],
                ['NODE-006', '10.99.14.77', 'KCP/FAST', '51820', '15ms', 'AES-XTS', 'ONLINE', 't-ok'],
                ['NODE-007', '10.99.14.90', 'RAW/ETH', '6443', '104ms', 'AES-GCM', 'HIGH LOAD', 't-warn'],
                ['NODE-008', '10.99.14.105', 'IPSEC', '500', '45ms', 'CURVE25519', 'ARMED', 't-crit']
            ];

            for (const n of nodesList) {
                await NX.sleep(60);
                const line = '  ' + (n[0] + '          ').slice(0, 12) +
                    (n[1] + '                 ').slice(0, 17) +
                    (n[2] + '        ').slice(0, 8) +
                    (n[3] + '        ').slice(0, 8) +
                    (n[4] + '         ').slice(0, 9) +
                    (n[5] + '                ').slice(0, 16) +
                    '<span class="' + n[7] + '">' + n[6] + '</span>';
                NX.line(this.out, line, '');
                if (A) A.blip(620, 0.02, 'square', 0.02);
            }

            NX.spacer(this.out);
            NX.line(this.out, 'Active Node Mesh: 8 displayed // ' + (total - 8) + ' additional relay nodes routing background packets.', 't-dim');
            NX.spacer(this.out);
        },

        async payload(args) {
            const NX = NXref();
            const A = window.NexusAudio;
            const type = args && args[0] ? args[0].toUpperCase() : 'METERPRETER_REVERSE_TCP';

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  POLYMORPHIC SHELLCODE & EXPLOIT PAYLOAD SYNTHESIZER', 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            if (A) A.connect();

            NX.line(this.out, 'TARGET ARCHITECTURE : x86_64 / Linux & Windows Cross-Compatible', 't-cyan');
            NX.line(this.out, 'PAYLOAD PROFILE     : ' + type, 't-key');
            NX.line(this.out, 'ENCODING ENGINE     : Shikata-Ga-Nai Dynamic Polymorphic XOR', 't-dim');
            NX.spacer(this.out);

            await NX.type(this.out, '> Compiling position-independent executable shellcode stub...', { className: 't-dim', speed: 10 });
            await NX.animateBar(this.out, { width: 24, duration: 1800, className: 't-bar-green', label: 'ASSEMBLING ' });
            NX.spacer(this.out);

            NX.line(this.out, 'DISASSEMBLY PREVIEW [ASM]:', 't-cyan');
            const asm = [
                'xor   rax, rax          ; zero out register',
                'push  rax               ; null terminate string',
                'mov   rdi, 0x68732f6e69622f2f ; push "/bin//sh"',
                'push  rdi',
                'mov   rsi, rsp          ; argv array pointer',
                'mov   al,  59           ; sys_execve syscall',
                'syscall                 ; trigger kernel execution'
            ];
            for (const a of asm) {
                await NX.sleep(80);
                NX.line(this.out, '  <span class="t-key">' + (a.split(';')[0] + '                    ').slice(0, 24) + '</span><span class="t-dim">;' + a.split(';')[1] + '</span>', 't-indent');
            }
            NX.spacer(this.out);

            NX.line(this.out, 'RAW COMPILED HEX DUMP (64 BYTES):', 't-cyan');
            for (let r = 0; r < 4; r++) {
                await NX.sleep(60);
                NX.line(this.out, '  0x' + NX.hex(4) + '  ' + NX.hexBytes(16), 't-indent t-dim');
            }
            NX.spacer(this.out);

            NX.line(this.out, '>> PAYLOAD GENERATED // SHA-256: 0x' + NX.hex(32) + ' <<', 't-ok');
            NX.line(this.out, 'Status: Armed in volatile memory. (Inert simulated string — no execution)', 't-dim');
            NX.spacer(this.out);

            if (A) A.confirm();
        },

        async ddos(args) {
            const NX = NXref();
            const A = window.NexusAudio;
            const target = args && args[0] ? args[0] : '192.168.1.100';

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  DISTRIBUTED PACKET SWARM & BANDWIDTH FLOOD ENGINE', 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            NX.line(this.out, 'TARGET HOST     : ' + target + ' [PORT 443/HTTPS]', 't-crit');
            NX.line(this.out, 'ATTACK VECTOR   : SYN/UDP Amplification + HTTP/2 Multiplex Flood', 't-dim');
            NX.line(this.out, 'SWARM NODES     : 256 Virtual Botnet Relays', 't-cyan');
            NX.spacer(this.out);

            if (A) { A.connect(); A.blip(880, 0.1, 'sawtooth', 0.15); }
            if (window.Topology) window.Topology.surge();
            if (window.Monitor) window.Monitor.spike();

            await NX.type(this.out, '> Synchronizing botnet nodes and initiating packet surge...', { className: 't-warn', speed: 10 });
            await NX.animateBar(this.out, { width: 28, duration: 2400, className: 't-bar', label: 'BANDWIDTH ' });
            NX.spacer(this.out);

            const telemetry = [
                ['THROUGHPUT', '482.6 Gbps', 't-crit'],
                ['PACKET RATE', '74.2 Mpps', 't-warn'],
                ['TARGET LATENCY', '3,480 ms [TIME OUT]', 't-crit'],
                ['TARGET HTTP STATUS', '503 SERVICE UNAVAILABLE', 't-crit'],
                ['DEFENSE FIREWALL', 'OVERWHELMED // SATURATED', 't-ok']
            ];

            for (const [k, v, c] of telemetry) {
                await NX.sleep(120);
                const dots = '.'.repeat(Math.max(3, 28 - k.length));
                NX.line(this.out, '  ' + k + ' <span class="t-dim">' + dots + '</span> <span class="' + c + '">' + v + '</span>', 't-indent');
            }
            NX.spacer(this.out);

            if (window.FX) window.FX.glitch(false);
            NX.line(this.out, '>> TARGET SECTOR EFFECTIVELY NEUTRALIZED (SIMULATED) <<', 't-ok');
            NX.line(this.out, 'Packet stream throttled back to idle background state.', 't-dim');
            NX.spacer(this.out);

            if (A) A.confirm();
        },

        async airmon() {
            const NX = NXref();
            const A = window.NexusAudio;

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  IEEE 802.11 RF WIRELESS INTERCEPTION & HANDSHAKE CAPTURE', 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            if (A) A.connect();

            await NX.type(this.out, '> Switching virtual wireless interface wlan0 to MONITOR MODE...', { className: 't-dim', speed: 10 });
            await NX.sleep(300);
            NX.line(this.out, '  CH 06 [2.437 GHz] // PHY: 802.11ax // PROMISCUOUS MODE: ENABLED', 't-cyan');
            NX.spacer(this.out);

            NX.line(this.out, 'DISCOVERED ACCESS POINTS (BSSID):', 't-cyan');
            const aps = [
                ['CORP-SECURE-CORP', '00:14:D1:E8:22:11', '-42dBm', 'CH 01', 'WPA3-SAE', 't-ok'],
                ['GUEST-ISOLATED', '00:14:D1:E8:22:12', '-48dBm', 'CH 06', 'WPA2-CCMP', 't-ok'],
                ['SCADA-INDUSTRIAL', 'A0:04:60:99:88:77', '-64dBm', 'CH 11', 'WPA2-PSK', 't-warn'],
                ['EXECUTIVE-VIP', 'F4:F5:E8:33:44:55', '-38dBm', 'CH 36', 'WPA3-ENTERPRISE', 't-crit']
            ];

            for (const [ssid, bssid, pwr, ch, enc, cls] of aps) {
                await NX.sleep(140);
                NX.line(this.out, '  <b>' + (ssid + '                    ').slice(0, 20) + '</b> <span class="t-dim">[' + bssid + ']</span>  <span class="t-cyan">' + pwr + '</span>  <span class="t-dim">' + ch + '</span>  <span class="' + cls + '">[' + enc + ']</span>', 't-indent');
                if (A) A.blip(720, 0.02, 'square', 0.03);
            }
            NX.spacer(this.out);

            await NX.type(this.out, '> Injecting 802.11 deauth frames to capture 4-way authentication handshake...', { className: 't-warn', speed: 10 });
            await NX.animateBar(this.out, { width: 24, duration: 1600, className: 't-bar-green', label: 'DEAUTH ' });
            NX.spacer(this.out);

            NX.line(this.out, '>> WPA3 4-WAY HANDSHAKE CAPTURED :: BSSID 00:14:D1:E8:22:11 <<', 't-ok');
            NX.line(this.out, 'PMKID EAPOL KEY HASH: 0x' + NX.hex(32), 't-cyan');
            NX.line(this.out, 'Saved to memory ring buffer. (Simulated RF spectrum capture)', 't-dim');
            NX.spacer(this.out);

            if (A) A.confirm();
        },

        async sat() {
            const NX = NXref();
            const A = window.NexusAudio;

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  TACTICAL SATELLITE TELEMETRY & RECONNAISSANCE UPLINK', 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            if (A) A.connect();

            await NX.type(this.out, '> Locking parabolic antenna onto orbital transponder SPECTRE-SAT-09...', { className: 't-dim', speed: 10 });
            await NX.animateBar(this.out, { width: 24, duration: 1800, className: 't-bar-green', label: 'DISH ALIGN ' });
            NX.spacer(this.out);

            const satTelemetry = [
                ['NORAD CATALOG ID', '58419 [CLASSIFIED RECONNAISSANCE]', 't-cyan'],
                ['ORBITAL INCLINATION', '51.6428° (Low Earth Orbit)', 't-dim'],
                ['ALTITUDE / VELOCITY', '418.6 km // 7.66 km/s (27,576 km/h)', 't-ok'],
                ['DOWNLINK FREQUENCY', '14.248 GHz [Ku-Band High Gain]', 't-cyan'],
                ['ENCRYPTION SCHEME', 'NSA Type-1 Suite-A / MIL-STD-188', 't-warn'],
                ['OPTICAL RECON RESOLUTION', '0.08m GSD (Multispectral Thermal Active)', 't-ok']
            ];

            for (const [k, v, c] of satTelemetry) {
                await NX.sleep(120);
                const dots = '.'.repeat(Math.max(3, 28 - k.length));
                NX.line(this.out, '  ' + k + ' <span class="t-dim">' + dots + '</span> <span class="' + c + '">' + v + '</span>', 't-indent');
                if (A) A.blip(680, 0.02, 'sine', 0.03);
            }
            NX.spacer(this.out);

            NX.line(this.out, '>> REAL-TIME SATELLITE DOWNLINK TELEMETRY STREAM ESTABLISHED <<', 't-ok');
            NX.line(this.out, 'Coordinates verified. (Simulated orbital space surveillance)', 't-dim');
            NX.spacer(this.out);

            if (A) A.confirm();
        },

        async purge() {
            const NX = NXref();
            const A = window.NexusAudio;

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  EMERGENCY DoD 5220.22-M MEMORY & DATA SANITIZATION', 't-crit');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            if (A) A.warn();

            await NX.type(this.out, '>> WARNING: INITIATING COMPLETE VOLATILE STORAGE PURGE <<', { className: 't-crit', speed: 12 });
            NX.spacer(this.out);

            for (let c = 3; c >= 1; c--) {
                await NX.sleep(600);
                NX.line(this.out, '  PURGE COUNTDOWN: 0' + c + ' ...', 't-warn');
                if (A) A.blip(400 + c * 100, 0.08, 'sawtooth', 0.1);
            }

            await NX.sleep(500);
            if (window.FX) window.FX.glitch(true);
            if (A) A.glitch();
            document.body.classList.add('screen-shake');
            setTimeout(() => document.body.classList.remove('screen-shake'), 500);

            const passes = ['PASS 1: ZEROES (0x00)', 'PASS 2: ONES (0xFF)', 'PASS 3: CRYPTOGRAPHIC RANDOM NOISE'];
            for (const p of passes) {
                await NX.animateBar(this.out, { width: 22, duration: 600, className: 't-bar', label: p + ' ' });
            }
            NX.spacer(this.out);

            NX.line(this.out, '>> ALL SESSION CRYPTO KEYS, LOGS & TRACES SHREDDED <<', 't-ok');
            NX.line(this.out, 'RAMDISK Sanitized. Terminal buffer ready.', 't-dim');
            NX.spacer(this.out);

            if (A) A.confirm();
        },

        async status() {
            const NX = NXref();
            const A = window.NexusAudio;
            const nodes = window.Monitor ? window.Monitor.getNodes() : 27;

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  SPECTRE-9 SYSTEM & CYBER DEFENSE DIAGNOSTICS', 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            const rows = [
                ['TACTICAL SUITE', 'SPECTRE-9 OS v8.4.0 (BLACK-OPS)', 't-ok'],
                ['SYSTEM OPERATIVE', 'operator [ROOT PRIVILEGES]', 't-cyan'],
                ['ENCRYPTION CORE', 'AES-XTS-512 + CHACHA20-POLY1305', 't-ok'],
                ['QUANTUM ENTROPY', '98.84% [OPTIMAL RANDOMNESS]', 't-cyan'],
                ['PROXY MESH INTEGRITY', '100% (5 GLOBAL RELAY HOPS)', 't-ok'],
                ['ACTIVE FIREWALL', 'STATEFUL PACKET INSPECTION [ARMED]', 't-ok'],
                ['FIREWALL DEFLECTIONS', '1,482 PROBES BLOCKED IN 24H', 't-warn'],
                ['SURVEILLANCE TRACE RISK', '0.00% [GHOST MODE ACTIVE]', 't-ok'],
                ['CONNECTED DARKNET NODES', nodes + ' NODES SYNCHRONIZED', 't-val'],
                ['SYSTEM INTEGRITY', '100% HARDENED KERNEL ARMED', 't-ok']
            ];

            for (const [k, v, c] of rows) {
                await NX.sleep(80);
                const dots = '.'.repeat(Math.max(3, 30 - k.length));
                NX.line(this.out, '  ' + k + ' <span class="t-dim">' + dots + '</span> <span class="' + c + '">' + v + '</span>', 't-indent');
            }
            NX.spacer(this.out);
            if (A) A.confirm();
        },

        async whoami() {
            const NX = NXref();
            const A = window.NexusAudio;

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  OPERATIVE DOSSIER & IDENTITY MATRIX', 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            const info = [
                ['DESIGNATION', 'OPERATOR-09 // TACTICAL ROOT'],
                ['SECURITY CLEARANCE', 'LEVEL-5 [BLACK-OPS EYES ONLY]'],
                ['CREDENTIALS', 'uid=0(root) gid=0(blackops) groups=0(superuser,cyberwar)'],
                ['ASSIGNED SECTOR', 'SECTOR-09 [DARKNET PROXY MESH]'],
                ['VIRTUAL IP', '10.99.14.88 // MASK: 255.255.255.0'],
                ['CRYPTO FINGERPRINT', '0x' + NX.hex(32)],
                ['ACTIVE ROLE', 'TACTICAL CYBER OPERATIONS & PAYLOAD DEPLOYMENT']
            ];

            for (const [k, v] of info) {
                await NX.sleep(70);
                const dots = '.'.repeat(Math.max(3, 24 - k.length));
                NX.line(this.out, '  <span class="t-cyan">' + k + '</span> <span class="t-dim">' + dots + '</span> <b>' + v + '</b>', 't-indent');
            }
            NX.spacer(this.out);
            if (A) A.blip(660, 0.03, 'square', 0.05);
        },

        async breach() {
            const NX = NXref();
            NX.line(this.out, '>> ENGAGING MILITARY-GRADE BREACH SEQUENCE...', 't-crit');
            NX.spacer(this.out);
            if (window.Breach) setTimeout(() => window.Breach.run(), 300);
        },

        async matrix() {
            const NX = NXref();
            NX.line(this.out, '>> ENTERING SPECTRE CONSTRUCT MATRIX...', 't-ok');
            NX.spacer(this.out);
            if (window.Matrix) setTimeout(() => window.Matrix.enter(), 250);
        },

        async hacker() {
            const NX = NXref();
            if (window.HackerTyper) {
                NX.line(this.out, '>> ENGAGING HACKER TYPER — mash any keys to stream syntax-highlighted code. Press ESC to exit.', 't-ok');
                NX.spacer(this.out);
                setTimeout(() => window.HackerTyper.start(), 200);
            } else {
                NX.line(this.out, 'HACKER TYPER module unavailable.', 't-err');
                NX.spacer(this.out);
            }
        },

        async clear() { this.clear(); },

        async about() {
            const NX = NXref();
            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  SPECTRE-9 // TACTICAL CYBER WARFARE OPERATING SUITE', 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, 'High-fidelity cinematic black-ops cyber warfare operating console.', 't-dim');
            NX.spacer(this.out);
            NX.line(this.out, 'CORE ARCHITECTURE :', 't-cyan');
            NX.line(this.out, '  - 100% Pure Client-Side (Vanilla ES6+ JS, HTML5, CSS3)', 't-dim');
            NX.line(this.out, '  - Web Audio API Synthesizer (No external audio files)', 't-dim');
            NX.line(this.out, '  - High-DPI HTML5 Canvas Renderers (Radar, Graph, World Map)', 't-dim');
            NX.line(this.out, '  - ZERO external telemetry, network sockets, or backend APIs', 't-ok');
            NX.spacer(this.out);
            NX.line(this.out, 'CLASSIFIED: RESTRICTED DISTRIBUTION ONLY.', 't-dim');
            NX.spacer(this.out);
        },

        async theme(args) {
            const NX = NXref();
            const A = window.NexusAudio;
            const tName = args && args[0] ? args[0].toLowerCase() : '';
            const valid = ['green', 'cyan', 'amber', 'red', 'purple'];

            if (!valid.includes(tName)) {
                NX.line(this.out, 'AVAILABLE CRT PHOSPHOR THEMES:', 't-head');
                NX.line(this.out, '  - <span class="t-ok">green</span>   (Spectre Phosphor Matrix — Default)', '');
                NX.line(this.out, '  - <span class="t-cyan">cyan</span>    (Cyber Ice HUD / Military Blue)', '');
                NX.line(this.out, '  - <span class="t-warn">amber</span>   (Tactical Fallout Amber / CRT)', '');
                NX.line(this.out, '  - <span class="t-crit">red</span>     (DEFCON 1 Red Alert / Crimson)', '');
                NX.line(this.out, '  - <span class="t-key">purple</span>  (Obsidian Void / Stealth Violet)', '');
                NX.spacer(this.out);
                NX.line(this.out, "Usage: '<span class=\"t-key\">theme cyan</span>' or '<span class=\"t-key\">theme amber</span>'", 't-dim');
                NX.spacer(this.out);
                return;
            }

            // Apply theme
            document.body.classList.remove('theme-green', 'theme-cyan', 'theme-amber', 'theme-red', 'theme-purple');
            if (tName !== 'green') document.body.classList.add('theme-' + tName);
            try { localStorage.setItem('spectre-theme', tName); } catch (e) {}

            NX.line(this.out, '>> SWITCHING PHOSPHOR CRT COLOR PROFILE :: ' + tName.toUpperCase() + ' <<', 't-ok');
            NX.spacer(this.out);
            if (A) { A.confirm(); A.blip(880, 0.05, 'sine', 0.15); }
        },

        async mitm(args) {
            const NX = NXref();
            const A = window.NexusAudio;
            const target = args && args[0] ? args[0] : '192.168.1.105';

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  [MITM ATTACK] INITIATING ARP CACHE POISONING :: ' + target, 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            if (A) A.warn();
            await NX.type(this.out, 'Broadcasting gratuitous ARP responses to gateway (10.99.14.1)...', { className: 't-dim', speed: 12, sound: true });
            await NX.animateBar(this.out, { width: 22, duration: 1200, className: 't-indent t-bar-green', label: 'POISONING ' });

            NX.line(this.out, '<span class="t-ok">[✓] ARP CACHE POISONED</span> — Target gateway diverted through operative node', 't-indent');
            NX.spacer(this.out);

            await NX.type(this.out, 'Engaging SSL/TLS downgrade proxy & session interceptor...', { className: 't-dim', speed: 10 });
            if (A) A.connect();
            await NX.sleep(400);

            NX.line(this.out, '>> INTERCEPTED LIVE DATA STREAM (SIMULATED):', 't-cyan');
            const packets = [
                ['HTTP POST', '/api/v2/auth/login', 'USER=root_admin&PASS=******** [CAPTURED]'],
                ['BEARER TOKEN', 'Authorization: Bearer', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'],
                ['COOKIE INJECT', 'Set-Cookie: session_id=', '0x8F9A2C11D4E9 [SESSION HIJACKED]']
            ];
            for (const [p, h, d] of packets) {
                await NX.sleep(200);
                NX.line(this.out, '  <span class="t-warn">' + p + '</span> <span class="t-dim">' + h + '</span> <span class="t-ok">' + d + '</span>', 't-indent');
                if (A) A.key();
            }

            NX.spacer(this.out);
            NX.line(this.out, '[✓] MITM SESSION INGEST COMPLETE // ZERO REAL PACKETS SENT', 't-sim-line');
            NX.spacer(this.out);
            if (window.EventLog) window.EventLog.push('OK', 'MITM session intercept simulation completed on ' + target);
        },

        async nuke(args) {
            const NX = NXref();
            const A = window.NexusAudio;
            const target = args && args[0] ? args[0] : 'ALL VIRTUAL NODES';

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  ⚠ CRITICAL // TACTICAL EMP ORBITAL STRIKE :: ' + target, 't-crit');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            if (A) A.defcon(1);
            for (let i = 3; i >= 1; i--) {
                NX.line(this.out, '  >> EMP DETONATION IN ' + i + ' SECONDS... <<', 't-warn');
                if (A) A.blip(400 + i * 150, 0.08, 'sawtooth', 0.15);
                document.body.classList.add('screen-shake');
                setTimeout(() => document.body.classList.remove('screen-shake'), 180);
                await NX.sleep(700);
            }

            // EMP trigger
            const empEl = document.getElementById('emp-shockwave');
            if (empEl) {
                empEl.classList.add('active');
                setTimeout(() => empEl.classList.remove('active'), 1600);
            }
            if (A) A.emp();
            if (window.FX) window.FX.glitch(true);
            if (window.Memory) window.Memory.corrupt(8);
            if (window.Topology) window.Topology.surge();

            document.body.classList.add('screen-shake');
            setTimeout(() => document.body.classList.remove('screen-shake'), 600);

            NX.spacer(this.out);
            NX.line(this.out, '★ EMP SHOCKWAVE DISCHARGED // ALL TARGET SUBNETS BLACKED OUT ★', 't-crit');
            NX.line(this.out, 'Telemetry sanitized. RF spectrum zeroized. Nodes offline.', 't-dim');
            NX.spacer(this.out);
            if (window.EventLog) window.EventLog.push('ERR', 'Tactical EMP pulse simulated: virtual grid reset.');
        },

        async inject(args) {
            const NX = NXref();
            const A = window.NexusAudio;
            const pid = args && args[0] ? args[0] : NX.randInt(1000, 9999);

            NX.line(this.out, '>> INITIATING MEMORY THREAD HIJACK ON PID: ' + pid + ' <<', 't-head');
            await NX.type(this.out, 'Attaching ptrace debugger to process heap...', { className: 't-dim', speed: 12 });
            if (A) A.connect();
            await NX.sleep(300);

            NX.line(this.out, '  [1] VirtualAllocEx(0x7FFF8000, 4096, MEM_COMMIT, PAGE_EXECUTE_READWRITE) = <span class="t-ok">SUCCESS</span>', 't-indent');
            NX.line(this.out, '  [2] WriteProcessMemory(PID ' + pid + ', 0x7FFF8000, shellcode, 64) = <span class="t-ok">64 BYTES WRITTEN</span>', 't-indent');
            NX.line(this.out, '  [3] CreateRemoteThread(PID ' + pid + ', 0x7FFF8000) = <span class="t-ok">THREAD 0x4A ACTIVE</span>', 't-indent');

            if (window.Memory) window.Memory.corrupt(4);
            if (A) A.confirm();

            NX.spacer(this.out);
            NX.line(this.out, '[✓] SHELLCODE EXECUTED IN TARGET MEMORY CONTEXT', 't-sim-line');
            NX.spacer(this.out);
        },

        async defcon(args) {
            const NX = NXref();
            const A = window.NexusAudio;
            const lvl = parseInt(args && args[0], 10) || 1;

            if (lvl < 1 || lvl > 5) {
                NX.line(this.out, "Usage: '<span class=\"t-key\">defcon 1</span>' (Max Readiness) to '<span class=\"t-key\">defcon 5</span>' (Normal)", 't-dim');
                NX.spacer(this.out);
                return;
            }

            document.body.classList.remove('defcon-1', 'defcon-2', 'defcon-3', 'defcon-4', 'defcon-5');
            if (lvl <= 2) document.body.classList.add('defcon-' + lvl);

            const defconDesc = {
                1: 'DEFCON 1 :: MAXIMUM READINESS // NUCLEAR & CYBER WARFARE ARMED',
                2: 'DEFCON 2 :: ARMED FORCES READY // CRITICAL INTRUSION DETECTED',
                3: 'DEFCON 3 :: INCREASE IN READINESS // ADVERSARY RECON MONITORED',
                4: 'DEFCON 4 :: INCREASED INTELLIGENCE WATCH // STEALTH ACTIVE',
                5: 'DEFCON 5 :: NORMAL PEACETIME MILITARY CYBER READINESS'
            };

            const cls = lvl === 1 ? 't-crit' : (lvl === 2 ? 't-warn' : 't-ok');
            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  ' + defconDesc[lvl], cls);
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            if (A) A.defcon(lvl);
            if (window.EventLog) window.EventLog.push(lvl <= 2 ? 'WARN' : 'INFO', 'DEFCON readiness level set to ' + lvl);
        },

        async geoip(args) {
            const NX = NXref();
            const A = window.NexusAudio;
            const ip = args && args[0] ? args[0] : '10.99.14.88';
            const data = NX.geo(ip);

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  ORBITAL GEO-INTELLIGENCE REPORT :: ' + data.ip, 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);

            NX.line(this.out, '  <span class="t-key">LOCATION :</span> ' + data.city + ', ' + data.country, 't-indent');
            NX.line(this.out, '  <span class="t-key">COORDS   :</span> ' + data.coords, 't-indent');
            NX.line(this.out, '  <span class="t-key">PROVIDER :</span> ' + data.isp, 't-indent');
            NX.line(this.out, '  <span class="t-key">AUTONOM  :</span> ' + data.as, 't-indent');
            NX.line(this.out, '  <span class="t-key">THREAT IX:</span> <span class="t-crit">' + data.threatIndex + '</span>', 't-indent');
            NX.spacer(this.out);

            if (window.WorldMap) {
                // Flash worldmap target
                if (A) A.sonar();
            }
            NX.line(this.out, '[✓] GEO-DOSSIER SYNTHESIZED FROM SIMULATED INTELLIGENCE', 't-sim-line');
            NX.spacer(this.out);
        },

        async keygen() {
            const NX = NXref();
            const A = window.NexusAudio;
            NX.line(this.out, '>> PROCEDURAL BLACK-OPS SERIAL CIPHER GENERATOR <<', 't-head');
            NX.spacer(this.out);

            for (let i = 0; i < 4; i++) {
                await NX.sleep(120);
                const key = 'SP9-' + NX.hex(4) + '-' + NX.hex(4) + '-' + NX.hex(4) + '-' + NX.hex(4);
                NX.line(this.out, '  [KEY 0' + (i + 1) + ']  <span class="t-ok">' + key + '</span>  <span class="t-dim">[CHECKSUM: VALID]</span>', 't-indent');
                if (A) A.key();
            }
            NX.spacer(this.out);
            if (A) A.confirm();
        },

        async game() {
            if (window.CyberWar) {
                window.CyberWar.start();
            }
        },

        async audio(args) {
            const A = window.NexusAudio;
            if (!A) return;
            const fx = args && args[0] ? args[0].toLowerCase() : '';
            if (fx === 'sonar') A.sonar();
            else if (fx === 'emp') A.emp();
            else if (fx === 'static') A.radioStatic();
            else if (fx === 'siren' || fx === 'defcon') A.defcon(1);
            else if (fx === 'geiger') A.geiger();
            else if (fx === 'morse') A.morse();
            else {
                NXref().line(this.out, 'Available SFX: sonar, emp, static, siren, geiger, morse', 't-dim');
                NXref().spacer(this.out);
            }
        },

        async ls() {
            const NX = NXref();
            NX.line(this.out, 'TOTAL: ' + Object.keys(Terminal.vfs).length + ' FILES // PERMISSIONS: -RWX------ (ROOT:ROOT)', 't-head');
            for (const [name, content] of Object.entries(Terminal.vfs)) {
                const sz = content.length + ' B';
                const pad = '                   '.slice(0, Math.max(1, 20 - name.length));
                NX.line(this.out, '  <span class="t-ok">-rwxr-xr-x</span>  1 root  root  <span class="t-dim">' + sz.padStart(6) + '</span>  <span class="t-cyan">' + name + '</span>', 't-indent');
            }
            NX.spacer(this.out);
        },

        async cat(args) {
            const NX = NXref();
            const filename = args && args[0] ? args[0] : '';
            if (!filename) {
                NX.line(this.out, "Usage: '<span class=\"t-key\">cat &lt;filename&gt;</span>' (e.g. cat target_hashes.txt)", 't-dim');
                NX.spacer(this.out);
                return;
            }
            if (Terminal.vfs[filename] != null) {
                const lines = Terminal.vfs[filename].split('\n');
                for (const l of lines) {
                    NX.line(this.out, NX._esc(l), 't-indent');
                }
                NX.spacer(this.out);
            } else {
                NX.line(this.out, 'cat: ' + filename + ': No such file or encrypted stream in current scope', 't-err');
                NX.spacer(this.out);
                if (window.NexusAudio) window.NexusAudio.warn();
            }
        },

        async touch(args) {
            const NX = NXref();
            const filename = args && args[0] ? args[0] : '';
            if (!filename) {
                NX.line(this.out, "Usage: '<span class=\"t-key\">touch &lt;filename&gt;</span>'", 't-dim');
                NX.spacer(this.out);
                return;
            }
            if (!Terminal.vfs[filename]) {
                Terminal.vfs[filename] = '# Empty memory stream created by operator\n';
            }
            NX.line(this.out, '[✓] VFS node allocated: ' + filename, 't-ok');
            NX.spacer(this.out);
            if (window.NexusAudio) window.NexusAudio.confirm();
        },

        async rm(args) {
            const NX = NXref();
            const filename = args && args[0] ? args[0] : '';
            if (Terminal.vfs[filename]) {
                delete Terminal.vfs[filename];
                NX.line(this.out, '[✓] Zeroized & unlinked VFS node: ' + filename, 't-ok');
            } else {
                NX.line(this.out, 'rm: ' + filename + ': No such file', 't-err');
            }
            NX.spacer(this.out);
        },

        async echo(args) {
            const NX = NXref();
            const str = args.join(' ');
            if (str.includes('>')) {
                const [textPart, filePart] = str.split('>').map(s => s.trim());
                Terminal.vfs[filePart] = textPart + '\n';
                NX.line(this.out, '[✓] Written ' + textPart.length + ' bytes to ' + filePart, 't-ok');
            } else {
                NX.line(this.out, NX._esc(str), 't-indent');
            }
            NX.spacer(this.out);
        },

        async nano(args) {
            const NX = NXref();
            const filename = args && args[0] ? args[0] : 'untitled.sp9';
            const initial = Terminal.vfs[filename] || '# SPECTRE-9 SCRIPT BUFFER\n# Edit and close to commit to VFS\n\n';

            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  GNU nano 8.2 — ' + filename + ' [IN-TERMINAL BUFFER]', 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            
            const editBox = document.createElement('textarea');
            editBox.className = 'nano-editor-textarea';
            editBox.value = initial;
            this.out.appendChild(editBox);
            editBox.focus();

            NX.line(this.out, '  [Press ESC to Save & Exit buffer]', 't-dim');
            NX.spacer(this.out);

            return new Promise((resolve) => {
                const onKey = (e) => {
                    if (e.key === 'Escape') {
                        editBox.removeEventListener('keydown', onKey);
                        Terminal.vfs[filename] = editBox.value;
                        editBox.disabled = true;
                        editBox.style.opacity = '0.6';
                        NX.line(this.out, '[✓] File ' + filename + ' committed to memory buffer (' + editBox.value.length + ' bytes)', 't-ok');
                        NX.spacer(this.out);
                        if (window.NexusAudio) window.NexusAudio.confirm();
                        resolve();
                    }
                };
                editBox.addEventListener('keydown', onKey);
            });
        },

        async cam() {
            if (window.Surveillance) window.Surveillance.open();
        },

        async synth() {
            if (window.NexusSynth) window.NexusSynth.toggle();
        },

        async cipher() {
            if (window.StegoLab) window.StegoLab.open();
        },

        async builder() {
            if (window.ExploitBuilder) window.ExploitBuilder.open();
        },

        async calc(args) {
            const NX = NXref();
            try {
                const expr = args.join(' ').replace(/[^0-9+\-*/().%]/g, '');
                const res = Function('"use strict"; return (' + expr + ')')();
                NX.line(this.out, 'CALC :: ' + expr + ' = <span class="t-ok">' + res + '</span>', 't-indent');
            } catch (e) {
                NX.line(this.out, 'CALC ERROR: Invalid mathematical expression', 't-err');
            }
            NX.spacer(this.out);
        },

        async exit() {
            const NX = NXref();
            await NX.type(this.out, 'Attempting to disconnect from SPECTRE tactical grid...', { className: 't-dim', speed: 14 });
            await NX.sleep(600);
            NX.line(this.out, 'PERMISSION DENIED: OPERATIVE SESSION LOCKED IN HIGH-SECURITY MODE.', 't-err');
            NX.line(this.out, 'There is no escape. The tactical grid is absolute.', 't-warn');
            NX.spacer(this.out);
            if (window.NexusAudio) window.NexusAudio.warn();
        },

        async crack(args) {
            const NX = NXref();
            const hash = args && args[0] ? args[0] : null;
            NX.line(this.out, '>> LAUNCHING GPU HASH CRACKER v3.1.7', 't-head');
            if (hash) NX.line(this.out, '  Target Hash: ' + hash, 't-cyan');
            NX.spacer(this.out);
            if (window.HashCracker) {
                if (hash) {
                    const inp = document.getElementById('hc-hash-input');
                    if (inp) inp.value = hash;
                }
                window.HashCracker.open();
            } else {
                NX.line(this.out, 'ERROR: Hash cracker module not initialized', 't-err');
            }
        },

        async darknet() {
            const NX = NXref();
            NX.line(this.out, '>> ROUTING TO DARKNET INTELLIGENCE FEED', 't-warn');
            NX.line(this.out, '  Establishing anonymous TOR circuit...', 't-dim');
            NX.spacer(this.out);
            if (window.DarknetFeed) {
                window.DarknetFeed.open();
            } else {
                NX.line(this.out, 'ERROR: Darknet feed module not initialized', 't-err');
            }
        },

        async theme(args) {
            const NX = NXref();
            const themes = ['green', 'cyan', 'amber', 'red', 'purple'];
            const target = args && args[0] ? args[0].toLowerCase() : '';
            
            if (themes.includes(target)) {
                if (window.NexusApp) window.NexusApp.setTheme(target);
                NX.line(this.out, '[✓] CRT Phosphor Theme Switched to: ' + target.toUpperCase(), 't-ok');
                NX.line(this.out, '  Web tab logo and interface palette synchronized.', 't-dim');
                NX.spacer(this.out);
            } else if (!target) {
                if (window.NexusApp) {
                    const next = window.NexusApp.cycleTheme();
                    NX.line(this.out, '[✓] Cycled CRT Phosphor Theme to: ' + next.toUpperCase(), 't-ok');
                    NX.line(this.out, '  Web tab logo and interface palette synchronized.', 't-dim');
                    NX.spacer(this.out);
                }
            } else {
                NX.line(this.out, 'Usage: theme [green | cyan | amber | red | purple]', 't-err');
                NX.line(this.out, 'Available Phosphor Matrices: ' + themes.join(', '), 't-dim');
                NX.spacer(this.out);
            }
        },

        async about() {
            const NX = NXref();
            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  SPECTRE-9 // HACKER TYPER & FAKE HACKING SCREEN ENGINE', 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);
            NX.line(this.out, 'OPERATIVE BRIEFING: Free browser-based hacker terminal simulator.', 't-ok');
            NX.line(this.out, 'Engineered for cinema set dressing, video creators, and harmless pranks.', 't-dim');
            NX.line(this.out, 'Architecture: Astro static SSG + HTML5 Web Audio synth + 2D Canvas.', 't-cyan');
            NX.spacer(this.out);
            NX.line(this.out, 'Full Mission Dossier: <a href="/about" target="_blank" rel="noopener" class="t-key">[ OPEN /ABOUT PAGE &rarr; ]</a>', 't-ok');
            NX.spacer(this.out);
        },

        async privacy() {
            const NX = NXref();
            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  SPECTRE-9 // DATA PRIVACY & COOKIE COMPLIANCE PROTOCOL', 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);
            NX.line(this.out, '[✓] CLIENT PRIVACY: 100% local in-browser simulation.', 't-ok');
            NX.line(this.out, '[✓] NO KEYSTROKE LOGGING: No keystrokes or passwords are sent.', 't-ok');
            NX.line(this.out, '[✓] THIRD-PARTY COOKIES: Google AdSense & analytics disclosure.', 't-cyan');
            NX.spacer(this.out);
            NX.line(this.out, 'Review Full Policy: <a href="/privacy-policy" target="_blank" rel="noopener" class="t-key">[ OPEN /PRIVACY-POLICY &rarr; ]</a>', 't-ok');
            NX.spacer(this.out);
        },

        async terms() {
            const NX = NXref();
            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  SPECTRE-9 // TERMS OF SERVICE & ACCEPTABLE USE DIRECTIVE', 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);
            NX.line(this.out, 'DISCLAIMER: Simulation entertainment and visual movie prop only.', 't-warn');
            NX.line(this.out, 'No real hacking, penetration testing, or network exploitation.', 't-dim');
            NX.line(this.out, 'Permitted: YouTube, video production, educational demos, pranks.', 't-cyan');
            NX.spacer(this.out);
            NX.line(this.out, 'Read Terms: <a href="/terms" target="_blank" rel="noopener" class="t-key">[ OPEN /TERMS PAGE &rarr; ]</a>', 't-ok');
            NX.spacer(this.out);
        },

        async contact() {
            const NX = NXref();
            NX.line(this.out, '============================================================', 't-dim');
            NX.line(this.out, '  SPECTRE-9 // SECURE COMMUNICATIONS & SUPPORT UPLINK', 't-head');
            NX.line(this.out, '============================================================', 't-dim');
            NX.spacer(this.out);
            NX.line(this.out, 'General Support: <span class="t-cyan">support@hacker-terminal.pages.dev</span>', 't-ok');
            NX.line(this.out, 'Privacy Inquiries: <span class="t-cyan">privacy@hacker-terminal.pages.dev</span>', 't-ok');
            NX.line(this.out, 'Media & Film Props: <span class="t-cyan">media@hacker-terminal.pages.dev</span>', 't-ok');
            NX.spacer(this.out);
            NX.line(this.out, 'Dispatch Portal: <a href="/contact" target="_blank" rel="noopener" class="t-key">[ OPEN /CONTACT PAGE &rarr; ]</a>', 't-ok');
            NX.spacer(this.out);
        }
    };

    // Aliases
    COMMANDS.cls = COMMANDS.clear;
    COMMANDS.dir = COMMANDS.ls;
    COMMANDS.man = COMMANDS.help;
    COMMANDS.sysinfo = COMMANDS.status;
    COMMANDS.netstat = COMMANDS.nodes;
    COMMANDS.exploit = COMMANDS.builder;
    COMMANDS.stego = COMMANDS.cipher;
    COMMANDS.drone = COMMANDS.cam;
    COMMANDS.cctv = COMMANDS.cam;
    COMMANDS.music = COMMANDS.synth;
    COMMANDS.satellite = COMMANDS.sat;
    COMMANDS.wifi = COMMANDS.airmon;
    COMMANDS.flood = COMMANDS.ddos;
    COMMANDS.id = COMMANDS.whoami;
    COMMANDS.cyberwar = COMMANDS.game;
    COMMANDS.defend = COMMANDS.game;
    COMMANDS.wargame = COMMANDS.game;
    COMMANDS.sfx = COMMANDS.audio;
    COMMANDS.hashcrack = COMMANDS.crack;
    COMMANDS.tor = COMMANDS.darknet;
    COMMANDS.intel = COMMANDS.darknet;
    COMMANDS.policy = COMMANDS.privacy;
    COMMANDS.tos = COMMANDS.terms;
    COMMANDS.legal = COMMANDS.terms;
    COMMANDS.support = COMMANDS.contact;
    COMMANDS.feedback = COMMANDS.contact;

    /* =====================================================
       EASTER EGGS
       ===================================================== */
    const EGGS = {
        async 'sudo matrix'() {
            const NX = NXref();
            NX.line(this.out, '[sudo] password for operator: ********************', 't-dim');
            await NX.sleep(500);
            NX.line(this.out, 'Access granted. Bending digital fabric...', 't-ok');
            NX.spacer(this.out);
            if (window.Matrix) setTimeout(() => window.Matrix.enter(), 300);
        },

        async 'sudo coffee'() {
            const NX = NXref();
            await NX.sleep(300);
            NX.line(this.out, 'CRITICAL ERROR: Coffee reservoir depleted.', 't-err');
            NX.spacer(this.out);
            NX.line(this.out, 'STATUS: OPERATIVE CAFFEINE DEFICIT AT 94%', 't-warn');
            NX.spacer(this.out);
            NX.line(this.out, '       ( (', 't-dim');
            NX.line(this.out, '        ) )', 't-dim');
            NX.line(this.out, '      ........', 't-dim');
            NX.line(this.out, '      |      |]', 't-dim');
            NX.line(this.out, '      \\      /', 't-dim');
            NX.line(this.out, '       `----\'', 't-dim');
            NX.spacer(this.out);
            if (window.NexusAudio) window.NexusAudio.warn();
        },

        async 'hack the planet'() {
            const NX = NXref();
            const A = window.NexusAudio;
            NX.line(this.out, '>> HACK THE PLANET! <<', 't-crit');
            NX.spacer(this.out);
            const quotes = [
                'They\'re trashing our rights, man!',
                'Mess with the best, die like the rest.',
                'This is our world now... the world of the electron and the switch.'
            ];
            for (const q of quotes) {
                await NX.sleep(280);
                NX.line(this.out, '  ' + q, 't-cyan');
            }
            NX.spacer(this.out);
            NX.line(this.out, '(Still 100% a simulated tactical command matrix)', 't-dim');
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

        async 'godmode'() {
            const NX = NXref();
            const A = window.NexusAudio;
            NX.line(this.out, '>> GODMODE OVERRIDE UNLOCKED <<', 't-crit');
            NX.line(this.out, 'Firewall Defense: INFINITE // Stealth: 100% // Trace: INVISIBLE', 't-ok');
            NX.spacer(this.out);
            if (A) { A.confirm(); A.blip(990, 0.1, 'square', 0.2); }
            if (window.FX) window.FX.glitch(false);
        },

        async 'overclock'() {
            const NX = NXref();
            const A = window.NexusAudio;
            NX.line(this.out, '>> OVERCLOCKING NEURAL QUANTUM PROCESSORS TO 8.8 GHz <<', 't-warn');
            if (window.Monitor) window.Monitor.spike();
            if (A) A.connect();
            NX.spacer(this.out);
        },

        async 'sudo rm -rf /'() {
            const NX = NXref();
            NX.line(this.out, 'ACCESS DENIED: NICE TRY, OPERATIVE.', 't-crit');
            NX.line(this.out, 'CRITICAL: ROOT FILESYSTEM IS WRITE-PROTECTED.', 't-warn');
            NX.spacer(this.out);
            if (window.NexusAudio) window.NexusAudio.warn();
        },

        async 'ping'() {
            const NX = NXref();
            NX.line(this.out, 'PONG :: 0.04ms (ICMP ECHO REPLY :: 64 BYTES RECEIVED)', 't-ok');
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
