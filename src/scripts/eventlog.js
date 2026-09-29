/* ============================================================
   NEXUS // EVENT LOG
   Continuously appends simulated, color-coded log entries.
   ============================================================ */
(function () {
    'use strict';

    const MESSAGES = [
        ['INFO', 'Proxy chain initialized'],
        ['INFO', 'Secure tunnel established'],
        ['INFO', 'Analyzing virtual architecture'],
        ['INFO', 'Security layer mapped'],
        ['INFO', 'Enumerating virtual services'],
        ['INFO', 'Rotating proxy identity'],
        ['INFO', 'Handshake renegotiated'],
        ['INFO', 'Packet route optimized'],
        ['INFO', 'Virtual node heartbeat received'],
        ['OK', 'Sandbox execution complete'],
        ['OK', 'Vulnerability scan simulated'],
        ['OK', 'Simulation finished'],
        ['OK', 'Integrity check passed'],
        ['OK', 'Key rotation complete'],
        ['OK', 'No real system was accessed'],
        ['WARN', 'Simulated firewall detected'],
        ['WARN', 'Virtual honeypot flagged'],
        ['WARN', 'Latency spike on node_04'],
        ['WARN', 'Trace probe deflected'],
        ['ERR', 'Simulated port refused connection'],
        ['ERR', 'Virtual auth token expired']
    ];

    const EventLog = {
        el: null,
        max: 60,

        init() {
            this.el = document.getElementById('eventlog-content');
            if (!this.el) return;
            // seed a few
            const seed = [
                ['INFO', 'Proxy chain initialized'],
                ['INFO', 'Secure tunnel established'],
                ['WARN', 'Simulated firewall detected'],
                ['INFO', 'Analyzing virtual architecture'],
                ['INFO', 'Security layer mapped'],
                ['OK', 'Sandbox execution complete'],
                ['INFO', 'Enumerating virtual services'],
                ['OK', 'Vulnerability scan simulated'],
                ['OK', 'Simulation finished'],
                ['INFO', 'No real system was accessed']
            ];
            let base = Date.now() - seed.length * 3000;
            for (const [lvl, msg] of seed) {
                this.push(lvl, msg, new Date(base));
                base += 3000;
            }
            this._schedule();
        },

        _schedule() {
            const delay = 2200 + Math.random() * 3200;
            setTimeout(() => {
                const [lvl, msg] = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
                this.push(lvl, msg);
                if (lvl === 'WARN' && window.NexusAudio) window.NexusAudio.blip(420, 0.05, 'sawtooth', 0.05);
                this._schedule();
            }, delay);
        },

        _stamp(d) {
            d = d || new Date();
            const h = String(d.getHours()).padStart(2, '0');
            const m = String(d.getMinutes()).padStart(2, '0');
            const s = String(d.getSeconds()).padStart(2, '0');
            return h + ':' + m + ':' + s;
        },

        push(level, msg, when) {
            if (!this.el) return;
            const row = document.createElement('div');
            row.className = 'log-line';
            row.innerHTML =
                '<span class="log-time">' + this._stamp(when) + '</span>' +
                '<span class="log-tag ' + level.toLowerCase() + '">[' + level + ']</span>' +
                '<span class="log-msg">' + msg + '</span>';
            this.el.appendChild(row);
            while (this.el.children.length > this.max) {
                this.el.removeChild(this.el.firstChild);
            }
            this.el.scrollTop = this.el.scrollHeight;
        }
    };

    window.EventLog = EventLog;
})();
