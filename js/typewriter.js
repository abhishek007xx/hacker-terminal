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
                this._scroll(container);
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
            // scroll nearest scrollable ancestor to bottom
            let el = container;
            while (el && el !== document.body) {
                if (el.scrollHeight > el.clientHeight &&
                    getComputedStyle(el).overflowY !== 'visible') {
                    el.scrollTop = el.scrollHeight;
                    return;
                }
                el = el.parentElement;
            }
        }
    };

    window.NX = NX;
})();
