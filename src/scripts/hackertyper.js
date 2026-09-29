/* ============================================================
   SPECTRE-9 // HACKER TYPER
   The classic "mash any key, cinematic code pours out" mode.
   When active, every keystroke reveals the next chunk of a
   pre-written, syntax-highlighted code corpus. Nothing here is
   executed or sent anywhere — it is 100% decorative simulation.
   Press ESC (or the button) to stop.
   ============================================================ */
(function () {
    'use strict';

    /* --- Decorative "hacking" code corpus. Non-functional, local-only.
       Generic systems / networking / crypto-flavored source used purely
       as on-screen set dressing (like a movie prop). --- */
    var CODE = [
        "#include <spectre/tactical.h>",
        "#include <spectre/onion_mesh.h>",
        "#include <stdint.h>",
        "#include <string.h>",
        "",
        "#define NX_MAX_NODES      256",
        "#define NX_PACKET_MAGIC   0x7F454C46",
        "#define NX_STATE_ONLINE   0x01",
        "#define NX_STATE_SECURED  0x02",
        "#define NX_AUTH_ROOT      0xFF",
        "",
        "typedef struct nx_node {",
        "    uint32_t id;",
        "    uint8_t  addr[4];",
        "    uint16_t port;",
        "    uint8_t  state;",
        "    char     label[32];",
        "} nx_node_t;",
        "",
        "static nx_node_t g_nodes[NX_MAX_NODES];",
        "static uint32_t  g_node_count = 0;",
        "static uint64_t  g_session_key = 0xA91F72CD884129FAULL;",
        "",
        "static uint32_t nx_hash32(const uint8_t *buf, size_t len) {",
        "    uint32_t h = 0x811C9DC5;",
        "    for (size_t i = 0; i < len; i++) {",
        "        h ^= buf[i];",
        "        h *= 0x01000193;",
        "    }",
        "    return h ^ (h >> 15);",
        "}",
        "",
        "int nx_proxy_chain_init(nx_proxy_t *chain, int hops) {",
        "    if (chain == NULL || hops <= 0) return -1;",
        "    for (int i = 0; i < hops; i++) {",
        "        chain->hop[i].latency_ms = nx_rand(8, 240);",
        "        chain->hop[i].masked = 1;",
        "        nx_log(\"routing through node_%02d ... [OK]\", i + 1);",
        "    }",
        "    chain->established = 1;",
        "    return 0;",
        "}",
        "",
        "static void nx_scan_mesh(nx_node_t *out, uint32_t *count) {",
        "    uint32_t n = nx_rand(16, 48);",
        "    for (uint32_t i = 0; i < n; i++) {",
        "        out[i].id = 0x1000 + i;",
        "        out[i].addr[0] = 192; out[i].addr[1] = 168;",
        "        out[i].addr[2] = nx_rand(0, 4); out[i].addr[3] = nx_rand(2, 254);",
        "        out[i].port  = nx_rand(1024, 65535);",
        "        out[i].state = (i % 7 == 0) ? NX_STATE_SECURED : NX_STATE_ONLINE;",
        "        snprintf(out[i].label, 32, \"NODE-%04X\", nx_rand(0, 0xFFFF));",
        "    }",
        "    *count = n;",
        "    nx_log(\"%u remote nodes discovered\", n);",
        "}",
        "",
        "int nx_handshake(nx_socket_t *s, const uint8_t *nonce, size_t nlen) {",
        "    uint8_t buf[64];",
        "    uint32_t sig = nx_hash32(nonce, nlen);",
        "    memcpy(buf, &sig, sizeof(sig));",
        "    if (nx_send_payload(s, buf, sizeof(sig)) < 0) {",
        "        nx_log(\"[WARN] handshake re-routing...\");",
        "        return -1;",
        "    }",
        "    nx_log(\"[OK] uplink accepted :: 0x%08X\", sig);",
        "    return 0;",
        "}",
        "",
        "static void nx_expand_key(const uint8_t key[32], uint32_t rk[60]) {",
        "    for (int i = 0; i < 8; i++)",
        "        rk[i] = nx_load32(&key[i * 4]);",
        "    for (int i = 8; i < 60; i++) {",
        "        uint32_t t = rk[i - 1];",
        "        if (i % 8 == 0) t = nx_subword(nx_rotr(t, 8)) ^ NX_RCON[i / 8];",
        "        else if (i % 8 == 4) t = nx_subword(t);",
        "        rk[i] = rk[i - 8] ^ t;",
        "    }",
        "}",
        "",
        "void nx_render_packet_stream(nx_frame_t *f) {",
        "    while (nx_active()) {",
        "        f->magic = NX_PACKET_MAGIC;",
        "        f->seq++;",
        "        f->ts = nx_now_ms();",
        "        for (int b = 0; b < f->len; b++)",
        "            f->payload[b] = (uint8_t)nx_rand(0, 255);",
        "        nx_emit(f);",
        "        nx_sleep_ms(nx_rand(40, 120));",
        "    }",
        "}",
        "",
        "int nx_bypass_layer(nx_target_t *t, int layer) {",
        "    nx_log(\"injecting payload into security layer %02d ...\", layer);",
        "    double p = nx_entropy(t->fingerprint, layer);",
        "    if (p < 0.5) { nx_log(\"[..] layer %02d :: ANALYZED\", layer); }",
        "    else         { nx_log(\"[OK] layer %02d :: BYPASSED\", layer); }",
        "    return NX_AUTH_ROOT;",
        "}",
        "",
        "int main(int argc, char **argv) {",
        "    nx_banner(\"SPECTRE-9 OS v8.4.0 // TACTICAL OVERRIDE\");",
        "    nx_proxy_t chain = {0};",
        "    if (nx_proxy_chain_init(&chain, 3) != 0) return 1;",
        "    nx_scan_mesh(g_nodes, &g_node_count);",
        "    for (int l = 1; l <= 5; l++) nx_bypass_layer(&g_target, l);",
        "    nx_log(\">>> ROOT ACCESS GRANTED <<<\");",
        "    return 0;",
        "}",
        ""
    ].join('\n');

    var KEYWORDS = {
        'int': 1, 'char': 1, 'void': 1, 'for': 1, 'while': 1, 'if': 1, 'else': 1,
        'return': 1, 'struct': 1, 'static': 1, 'const': 1, 'unsigned': 1, 'sizeof': 1,
        'switch': 1, 'case': 1, 'break': 1, 'continue': 1, 'define': 1, 'include': 1,
        'uint8_t': 1, 'uint16_t': 1, 'uint32_t': 1, 'uint64_t': 1, 'size_t': 1,
        'NULL': 1, 'goto': 1, 'typedef': 1, 'enum': 1, 'extern': 1, 'volatile': 1,
        'double': 1, 'float': 1, 'long': 1, 'short': 1, 'do': 1, 'default': 1,
        'union': 1, 'register': 1, 'bool': 1, 'true': 1, 'false': 1
    };

    // Pre-tokenize the corpus once into colored runs.
    function colorize(code) {
        var runs = [];
        var push = function (text, cls) { if (text) runs.push({ t: text, c: cls }); };
        var i = 0, n = code.length;
        var isIdent = function (ch) { return /[A-Za-z0-9_]/.test(ch); };
        while (i < n) {
            var c = code[i];
            // line comment
            if (c === '/' && code[i + 1] === '/') {
                var j = i; while (j < n && code[j] !== '\n') j++;
                push(code.slice(i, j), 'hc-com'); i = j; continue;
            }
            // block comment
            if (c === '/' && code[i + 1] === '*') {
                var k = i + 2; while (k < n && !(code[k] === '*' && code[k + 1] === '/')) k++;
                k = Math.min(n, k + 2); push(code.slice(i, k), 'hc-com'); i = k; continue;
            }
            // preprocessor to end of line
            if (c === '#') {
                var p = i; while (p < n && code[p] !== '\n') p++;
                push(code.slice(i, p), 'hc-pre'); i = p; continue;
            }
            // string
            if (c === '"' || c === '\'') {
                var q = c, s = i + 1;
                while (s < n && code[s] !== q) { if (code[s] === '\\') s++; s++; }
                s = Math.min(n, s + 1); push(code.slice(i, s), 'hc-str'); i = s; continue;
            }
            // number / hex
            if (/[0-9]/.test(c)) {
                var d = i; while (d < n && /[0-9a-fA-FxXULul._]/.test(code[d])) d++;
                push(code.slice(i, d), 'hc-num'); i = d; continue;
            }
            // identifier / keyword / function
            if (/[A-Za-z_]/.test(c)) {
                var w = i; while (w < n && isIdent(code[w])) w++;
                var word = code.slice(i, w);
                var m = w; while (m < n && code[m] === ' ') m++;
                var cls = KEYWORDS[word] ? 'hc-kw' : (code[m] === '(' ? 'hc-fn' : null);
                push(word, cls); i = w; continue;
            }
            // punctuation / operators
            if (/[{}()\[\];,<>=+\-*&|!%^~:.?\/]/.test(c)) { push(c, 'hc-op'); i++; continue; }
            // whitespace / other
            push(c, null); i++;
        }
        return runs;
    }

    var HackerTyper = {
        active: false,
        runs: [],
        runIdx: 0,
        charInRun: 0,
        out: null,
        badge: null,
        btn: null,
        curLine: null,
        curSpan: null,
        curCls: undefined,
        _handler: null,
        MAX_LINES: 600,

        init() {
            this.out = document.getElementById('terminal-output');
            this.badge = document.getElementById('hacker-badge');
            this.btn = document.getElementById('btn-hacker');
            this.runs = colorize(CODE);
            this._handler = (e) => this._onKey(e);
        },

        toggle() { this.active ? this.stop() : this.start(); },

        start() {
            if (this.active) return;
            if (!this.out) this.init();
            this.active = true;
            document.body.classList.add('hacker-typing');
            if (this.badge) { this.badge.classList.add('show'); this.badge.setAttribute('aria-hidden', 'false'); }
            if (this.btn) this.btn.classList.add('active');

            // Move focus off the command input so keystrokes feed the typer.
            if (window.Terminal && window.Terminal.input) {
                window.Terminal.input.blur();
                window.Terminal._setInputEnabled && window.Terminal._setInputEnabled(false);
            }

            if (window.NX && this.out) {
                window.NX.spacer(this.out);
                window.NX.line(this.out,
                    '<span class="t-ok">&gt;&gt;&gt; HACKER TYPER ENGAGED</span> ' +
                    '<span class="t-dim">— mash any keys. Press </span><span class="t-key">ESC</span>' +
                    '<span class="t-dim"> to stop.</span>', 't-ok');
            }

            // Capture-phase listener so we intercept keys before the terminal input.
            document.addEventListener('keydown', this._handler, true);

            if (window.NexusAudio) { window.NexusAudio.arm(); window.NexusAudio.resume(); window.NexusAudio.connect(); }
            this._scroll();
        },

        stop() {
            if (!this.active) return;
            this.active = false;
            document.body.classList.remove('hacker-typing');
            if (this.badge) { this.badge.classList.remove('show'); this.badge.setAttribute('aria-hidden', 'true'); }
            if (this.btn) this.btn.classList.remove('active');
            document.removeEventListener('keydown', this._handler, true);

            this.curLine = null; this.curSpan = null; this.curCls = undefined;

            if (window.NX && this.out) {
                window.NX.spacer(this.out);
                window.NX.line(this.out, '<span class="t-warn">&gt;&gt;&gt; HACKER TYPER DISENGAGED</span> <span class="t-dim">— switched to COMMAND RUN mode</span>', 't-dim');
                window.NX.spacer(this.out);
            }
            if (window.NexusAudio) window.NexusAudio.blip(300, 0.09, 'sine', 0.1);

            if (window.Terminal) {
                window.Terminal.setMode('command');
            }
        },

        _onKey(e) {
            if (!this.active) return;
            if (e.key === 'Escape') {
                e.preventDefault(); e.stopImmediatePropagation();
                this.stop();
                return;
            }
            // Ignore standalone modifier / navigation keys (let shortcuts like F5 work)
            var k = e.key;
            if (k === 'Shift' || k === 'Control' || k === 'Alt' || k === 'Meta' ||
                k === 'CapsLock' || k === 'Tab' || k === 'ContextMenu' ||
                (k && k.indexOf('Arrow') === 0) || (k && k[0] === 'F' && k.length > 1 && !isNaN(k.slice(1)))) {
                return;
            }
            // Let real browser shortcuts through (Ctrl/Cmd + key), but still feed a burst.
            if (e.ctrlKey || e.metaKey || e.altKey) return;

            e.preventDefault();
            e.stopImmediatePropagation();
            this._emit();
        },

        _emit() {
            var NX = window.NX;
            var count = NX ? NX.randInt(2, 6) : 4;
            for (var i = 0; i < count; i++) {
                var run = this.runs[this.runIdx];
                if (!run) { this.runIdx = 0; this.charInRun = 0; continue; }
                var ch = run.t[this.charInRun];
                this._putChar(ch, run.c);
                this.charInRun++;
                if (this.charInRun >= run.t.length) {
                    this.runIdx = (this.runIdx + 1) % this.runs.length;
                    this.charInRun = 0;
                }
            }
            this._trim();
            this._scroll();
            if (window.NexusAudio) window.NexusAudio.key();
        },

        _putChar(ch, cls) {
            if (ch === '\n') { this.curLine = null; this.curSpan = null; this.curCls = undefined; return; }
            if (!this.curLine) {
                this.curLine = document.createElement('span');
                this.curLine.className = 't-line hc-line';
                this.out.appendChild(this.curLine);
                this.curSpan = null; this.curCls = undefined;
            }
            if (!this.curSpan || this.curCls !== cls) {
                this.curSpan = document.createElement('span');
                if (cls) this.curSpan.className = cls;
                this.curLine.appendChild(this.curSpan);
                this.curCls = cls;
            }
            this.curSpan.textContent += ch;
        },

        _trim() {
            if (!this.out) return;
            var over = this.out.childElementCount - this.MAX_LINES;
            while (over-- > 0 && this.out.firstChild) {
                if (this.out.firstChild === this.curLine) break;
                this.out.removeChild(this.out.firstChild);
            }
        },

        _scroll() {
            var b = (window.Terminal && window.Terminal.body) || (this.out && this.out.parentElement);
            if (b) b.scrollTop = b.scrollHeight;
            else if (this.out) this.out.scrollTop = this.out.scrollHeight;
        }
    };

    window.HackerTyper = HackerTyper;
})();
