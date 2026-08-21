/* ============================================================
   SPECTRE-9 // LIVE MEMORY DISASSEMBLER & INSPECTOR
   Simulated virtual memory byte grid and x86_64 opcode
   disassembly stream. All client-side procedural generation.
   ============================================================ */
(function () {
    'use strict';

    const Memory = {
        el: null,
        lines: [],
        maxLines: 7,
        baseAddr: 0x7FFF4200,

        init() {
            this.el = document.getElementById('mem-disasm-content');
            if (!this.el) return;

            // Seed initial memory disassembly lines
            for (let i = 0; i < this.maxLines; i++) {
                this.lines.push(window.NX.disasmLine(this.baseAddr + i * 0x10));
            }
            this.render();
            setInterval(() => this._tick(), 750);
        },

        _tick() {
            this.baseAddr += 0x10;
            this.lines.push(window.NX.disasmLine(this.baseAddr + this.maxLines * 0x10));
            if (this.lines.length > this.maxLines) {
                this.lines.shift();
            }
            this.render();
        },

        // Trigger dramatic heap corruption / memory injection effect
        corrupt(count) {
            count = count || 6;
            const corruptOpcodes = ['CORRUPT', 'OVERFLOW', 'INJECT', 'INT3', 'PWN_ROP'];
            for (let i = 0; i < count; i++) {
                this.lines.push({
                    addr: '0x' + (this.baseAddr + 0x90 + i * 4).toString(16).toUpperCase(),
                    bytes: 'CC CC CC',
                    op: window.NX.pick(corruptOpcodes),
                    args: '<span class="imm">0xDEADBEEF</span> <span class="sym">/* HEAP_INJECT */</span>'
                });
            }
            while (this.lines.length > this.maxLines) this.lines.shift();
            this.render();
            if (window.NexusAudio) window.NexusAudio.glitch();
        },

        render() {
            if (!this.el) return;
            let html = '';
            for (const item of this.lines) {
                html += '<div class="mem-row">' +
                    '<span class="mem-addr">' + item.addr + '</span>' +
                    '<span class="mem-bytes">' + item.bytes + '</span>' +
                    '<span class="mem-op">' + item.op + '</span>' +
                    '<span class="mem-args">' + item.args + '</span>' +
                    '</div>';
            }
            this.el.innerHTML = html;
        }
    };

    window.Memory = Memory;
})();
