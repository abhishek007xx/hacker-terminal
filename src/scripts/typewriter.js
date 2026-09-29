/* ============================================================
   NEXUS // TYPEWRITER + shared helpers
   Progressive text rendering, sleep, random utilities
   ============================================================ */
(function () {
    'use strict';

    const NX = {
        // Promise-based delay
        sleep(ms) {
            return new Promise((res) => setTimeout(res, ms));
        },

        rand(min, max) {
            return Math.random() * (max - min) + min;
        },

        randInt(min, max) {
            return Math.floor(this.rand(min, max + 1));
        },

        pick(arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        },

        // Random hex string of n chars (uppercase)
        hex(n) {
            const c = '0123456789ABCDEF';
            let s = '';
            for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * 16)];
            return s;
        },

        // Grouped hex bytes e.g. "7F 45 4C 46"
        hexBytes(n) {
            const out = [];
            for (let i = 0; i < n; i++) out.push(this.hex(2));
            return out.join(' ');
        },

        // Session-key style block A91F-72CD-8841-29FA
        keyBlock(groups) {
            const out = [];
            for (let i = 0; i < (groups || 4); i++) out.push(this.hex(4));
            return out.join('-');
        },

        binary(n) {
            let s = '';
            for (let i = 0; i < n; i++) s += Math.random() < 0.5 ? '0' : '1';
            return s;
        },

        // Build a text progress bar: [██████░░░░] using block chars
        progressBar(pct, width) {
            width = width || 20;
            const filled = Math.round((pct / 100) * width);
            const empty = width - filled;
            return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
        },

        // Dotted alignment: "CPU .......... 41%"
        dotline(label, value, total) {
            total = total || 34;
            const dots = Math.max(2, total - label.length - String(value).length);
            return label + ' ' + '.'.repeat(dots) + ' ' + value;
        },

        /**
         * Type text into an element progressively.
         * opts: { speed, className, sound, jitter, instant }
         * Returns a promise that resolves when done.
         */
        async type(container, text, opts) {
            opts = opts || {};
            const speed = opts.speed != null ? opts.speed : 14;
            const line = document.createElement('span');
            line.className = 't-line ' + (opts.className || '');
            container.appendChild(line);

            if (opts.instant || speed <= 0) {
                line.textContent = text;
                this._scroll(container);
                return line;
            }

            for (let i = 0; i < text.length; i++) {
                line.textContent += text[i];
                if (opts.sound && window.NexusAudio && text[i] !== ' ') {
                    if (Math.random() < 0.55) window.NexusAudio.key();
                }
                if (i % 3 === 0 || i === text.length - 1) {
                    this._scroll(container);
                }
                const jitter = opts.jitter ? this.rand(0, opts.jitter) : 0;
                await this.sleep(speed + jitter);
            }
            return line;
        },

        // Append a fully-formed HTML line (no typing)
        line(container, html, className) {
            const el = document.createElement('span');
            el.className = 't-line ' + (className || '');
            el.innerHTML = html;
            container.appendChild(el);
            this._scroll(container);
            return el;
        },

        // Blank spacer line
        spacer(container) {
            const el = document.createElement('span');
            el.className = 't-line t-spacer';
            container.appendChild(el);
            this._scroll(container);
            return el;
        },

        /**
         * Animate a progress bar line in place.
         * Updates a single line element from 0..100.
         */
        async animateBar(container, opts) {
            opts = opts || {};
            const width = opts.width || 20;
            const label = opts.label || '';
            const suffix = opts.suffix || '';
            const dur = opts.duration || 1400;
            const cls = opts.className || 't-bar';
            const el = document.createElement('span');
            el.className = 't-line ' + cls;
            container.appendChild(el);

            const start = performance.now();
            return new Promise((resolve) => {
                const step = (now) => {
                    let pct = Math.min(100, ((now - start) / dur) * 100);
                    // ease
                    const shown = Math.floor(pct);
                    el.textContent = label + this.progressBar(pct, width) + ' ' + shown + '%' + suffix;
                    this._scroll(container);
                    if (pct < 100) {
                        requestAnimationFrame(step);
                    } else {
                        resolve(el);
                    }
                };
                requestAnimationFrame(step);
            });
        },

        _scroll(container) {
            if (!container) return;
            // Direct scroll container fast-path without forced style recalculation
            const parent = container.parentElement;
            if (parent) {
                parent.scrollTop = parent.scrollHeight;
            } else {
                container.scrollTop = container.scrollHeight;
            }
        },

        // Generate procedural x86_64 disassembly instruction
        disasmLine(addr) {
            const hexAddr = '0x' + (addr || (0x7FFF0000 + Math.floor(Math.random() * 0xFFFF))).toString(16).toUpperCase();
            const opcodes = [
                { op: 'MOV', bytes: '48 89 E5', args: '<span class="reg">RAX</span>, [<span class="reg">RSP</span>+<span class="imm">0x18</span>]' },
                { op: 'XOR', bytes: '31 C0', args: '<span class="reg">EAX</span>, <span class="reg">EAX</span>' },
                { op: 'LEA', bytes: '48 8D 3D', args: '<span class="reg">RDI</span>, [<span class="sym">.rodata</span>]' },
                { op: 'CALL', bytes: 'E8 72 04', args: '<span class="sym">sys_ptrace_scope</span>' },
                { op: 'TEST', bytes: '85 C0', args: '<span class="reg">EAX</span>, <span class="reg">EAX</span>' },
                { op: 'JNZ', bytes: '75 1A', args: '<span class="imm">0x' + (addr ? (addr + 0x1A).toString(16) : '7FFF0042') + '</span>' },
                { op: 'PUSH', bytes: '55', args: '<span class="reg">RBP</span>' },
                { op: 'SYSCALL', bytes: '0F 05', args: '<span class="sym">/* sys_execve */</span>' },
                { op: 'NOP', bytes: '90', args: '<span class="sym">/* sled-pad */</span>' },
                { op: 'INT', bytes: 'CD 80', args: '<span class="imm">0x80</span>' }
            ];
            const item = this.pick(opcodes);
            return {
                addr: hexAddr,
                bytes: item.bytes,
                op: item.op,
                args: item.args
            };
        },

        // Generate procedural Geo-Intelligence dossier
        geo(ip) {
            const locations = [
                { city: 'Reykjavik', country: 'Iceland', lat: '64.1466° N', lon: '21.9426° W', isp: 'Fjarskipti Darknet Grid', as: 'AS44192 (IS-NORD)' },
                { city: 'Zurich', country: 'Switzerland', lat: '47.3769° N', lon: '8.5417° E', isp: 'Helvetia Quantum Backbone', as: 'AS13030 (CH-SEC)' },
                { city: 'Tokyo', country: 'Japan', lat: '35.6762° N', lon: '139.6503° E', isp: 'NTT Cyber Warfare Uplink', as: 'AS2516 (JP-CORE)' },
                { city: 'Frankfurt', country: 'Germany', lat: '50.1109° N', lon: '8.6821° E', isp: 'DE-CIX Shadow Exchange', as: 'AS8800 (EU-DE)' },
                { city: 'Singapore', country: 'Singapore', lat: '1.3521° N', lon: '103.8198° E', isp: 'SingTel Classified Gateway', as: 'AS7473 (SG-NODE)' }
            ];
            const loc = this.pick(locations);
            return {
                ip: ip || ('10.' + this.randInt(10, 240) + '.' + this.randInt(1, 254) + '.' + this.randInt(1, 254)),
                city: loc.city,
                country: loc.country,
                coords: loc.lat + ', ' + loc.lon,
                isp: loc.isp,
                as: loc.as,
                threatIndex: this.randInt(78, 99) + '%'
            };
        }
    };

    window.NX = NX;
})();
