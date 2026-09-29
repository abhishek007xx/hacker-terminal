/* ============================================================
   NEXUS // SYSTEM MONITOR
   Animated fake metrics. Everything simulated locally.
   ============================================================ */
(function () {
    'use strict';

    const Monitor = {
        cpu: 41, mem: 67, net: 81,
        threads: 143, nodes: 27,
        uptimeSec: 17 * 3600 + 42 * 60 + 8, // 17:42:08 start
        els: {},

        init() {
            this.els = {
                cpuBar: document.getElementById('bar-cpu'),
                memBar: document.getElementById('bar-mem'),
                netBar: document.getElementById('bar-net'),
                cpuVal: document.getElementById('val-cpu'),
                memVal: document.getElementById('val-mem'),
                netVal: document.getElementById('val-net'),
                uptime: document.getElementById('val-uptime'),
                threads: document.getElementById('val-threads'),
                nodes: document.getElementById('val-nodes')
            };
            this._render();
            // metrics drift
            setInterval(() => this._tickMetrics(), 1400);
            // uptime clock
            setInterval(() => this._tickUptime(), 1000);
            // threads/nodes occasional change
            setInterval(() => this._tickCounts(), 2600);
        },

        _drift(val, min, max, amp) {
            val += (Math.random() - 0.5) * amp;
            return Math.max(min, Math.min(max, val));
        },

        _tickMetrics() {
            this.cpu = this._drift(this.cpu, 18, 96, 14);
            this.mem = this._drift(this.mem, 35, 92, 8);
            this.net = this._drift(this.net, 25, 99, 20);
            this._render();
        },

        _tickCounts() {
            this.threads = Math.max(90, Math.min(320, this.threads + Math.round((Math.random() - 0.5) * 12)));
            if (Math.random() < 0.35) {
                this.nodes = Math.max(12, Math.min(48, this.nodes + (Math.random() < 0.5 ? -1 : 1)));
            }
            if (this.els.threads) this.els.threads.textContent = this.threads;
            if (this.els.nodes) this.els.nodes.textContent = this.nodes;
        },

        _tickUptime() {
            this.uptimeSec++;
            if (this.els.uptime) this.els.uptime.textContent = this._fmt(this.uptimeSec);
        },

        _fmt(s) {
            const h = String(Math.floor(s / 3600)).padStart(2, '0');
            const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
            const sec = String(s % 60).padStart(2, '0');
            return h + ':' + m + ':' + sec;
        },

        _setBar(barEl, valEl, v) {
            if (!barEl) return;
            const r = Math.round(v);
            barEl.style.width = r + '%';
            valEl.textContent = r + '%';
            const parent = barEl.parentElement;
            parent.classList.toggle('warn', r >= 75 && r < 90);
            parent.classList.toggle('crit', r >= 90);
        },

        _render() {
            this._setBar(this.els.cpuBar, this.els.cpuVal, this.cpu);
            this._setBar(this.els.memBar, this.els.memVal, this.mem);
            this._setBar(this.els.netBar, this.els.netVal, this.net);
        },

        // Public: spike metrics during dramatic events
        spike() {
            this.cpu = 88 + Math.random() * 10;
            this.net = 90 + Math.random() * 9;
            this._render();
        },

        getNodes() { return this.nodes; }
    };

    window.Monitor = Monitor;
})();
