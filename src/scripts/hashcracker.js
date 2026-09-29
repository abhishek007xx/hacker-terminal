/* ============================================================
   SPECTRE-9 // GPU HASH CRACKER SIMULATION
   Simulated distributed GPU cluster password hash cracking.
   Supports MD5, SHA-1, SHA-256, bcrypt (simulated).
   Zero real computation — 100% cinematic fiction.
   ============================================================ */
(function () {
    'use strict';

    const WORDLISTS = {
        rockyou: ['password', '123456', 'iloveyou', 'admin', 'letmein', 'monkey', 'dragon', 'master',
            'sunshine', 'princess', 'qwerty', 'abc123', 'password1', 'shadow', 'superman',
            'michael', 'jessica', 'password123', 'charlie', 'donald', 'football', 'baseball',
            'welcome', 'hello', 'dragon', 'master123', 'login', 'p@ssword', 'passw0rd'],
        common: ['admin', 'root', 'toor', 'pass', 'test', 'guest', 'info', 'adm', 'mysql',
            'user', 'administrator', 'oracle', 'ftp', 'pi', 'puppet', 'ansible', 'ec2-user'],
        spectre: ['spectre9', 'blackops', 'cyberwar', 'quantum', 'nexus', 'phantom', 'cipher',
            'darknet', 'zero-day', 'rootkit', 'shellcode', 'payload', 'meterpreter']
    };

    const ALGOS = {
        md5: { label: 'MD5-128bit', speed: '8.4 GH/s', time: 3200, strength: 1 },
        sha1: { label: 'SHA-1 160bit', speed: '3.2 GH/s', time: 4800, strength: 2 },
        sha256: { label: 'SHA-256 256bit', speed: '1.1 GH/s', time: 7200, strength: 3 },
        ntlm: { label: 'NTLM (Windows)', speed: '16.2 GH/s', time: 2400, strength: 1 },
        bcrypt: { label: 'bcrypt $2b$12$', speed: '23.4 KH/s', time: 18000, strength: 5 }
    };

    const HASH_SAMPLES = {
        md5: ['5f4dcc3b5aa765d61d8327deb882cf99', '098f6bcd4621d373cade4e832627b4f6', 'e99a18c428cb38d5f260853678922e03'],
        sha1: ['da39a3ee5e6b4b0d3255bfef95601890afd80709', '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8', 'aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d'],
        sha256: ['e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b'],
        ntlm: ['8846F7EAEE8FB117AD06BDD830B7586C', '64F12CDDAA88057E06A81B54E73B949B', '161cff084477fe596a5db81874498a24'],
        bcrypt: ['$2b$12$EXRkfkdmXn2gzds2SSitu.MW9.gAVqa9eLS1//RYtYCmB1eLHg.9q', '$2b$12$K6xjSGz8DYwEsE6aGFkVUe5T7ZoGNXrNq8lPYEL82A7RtaREq8L2K']
    };

    const HashCracker = {
        modal: null,
        active: false,
        running: false,
        raf: null,
        startTime: 0,
        currentProgress: 0,
        targetHash: '',
        algoKey: 'md5',
        wordlistKey: 'rockyou',
        cracked: false,
        crackedPass: '',

        init() {
            this.modal = document.getElementById('hashcracker-modal');
            if (!this.modal) return;

            const btnClose = document.getElementById('btn-hc-close');
            if (btnClose) btnClose.addEventListener('click', () => this.close());

            const btnCrack = document.getElementById('btn-hc-crack');
            if (btnCrack) btnCrack.addEventListener('click', () => this.start());

            const btnStop = document.getElementById('btn-hc-stop');
            if (btnStop) btnStop.addEventListener('click', () => this.stop());

            const btnGenHash = document.getElementById('btn-hc-gen');
            if (btnGenHash) btnGenHash.addEventListener('click', () => this.generateHash());

            const algoSel = document.getElementById('hc-algo');
            if (algoSel) algoSel.addEventListener('change', () => {
                this.algoKey = algoSel.value;
                this.generateHash();
            });

            if (this.modal) {
                this.modal.addEventListener('click', (e) => {
                    if (e.target === this.modal) this.close();
                });
            }
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.active) this.close();
            });

            this.generateHash();
        },

        generateHash() {
            const algoSel = document.getElementById('hc-algo');
            if (algoSel) this.algoKey = algoSel.value;
            const hashes = HASH_SAMPLES[this.algoKey] || HASH_SAMPLES.md5;
            const h = hashes[Math.floor(Math.random() * hashes.length)];
            const inp = document.getElementById('hc-hash-input');
            if (inp) inp.value = h;
            this.targetHash = h;
            // Reset state
            this.stop();
            const logEl = document.getElementById('hc-log');
            if (logEl) logEl.innerHTML = '<span class="t-dim">[READY] Paste a hash or click GENERATE HASH to load a sample.</span>';
            this._setProgress(0);
            const statusEl = document.getElementById('hc-status');
            if (statusEl) statusEl.textContent = 'IDLE';
            if (statusEl) statusEl.className = 'hc-status-idle';
        },

        open() {
            if (!this.modal) return;
            this.active = true;
            this.modal.classList.add('active');
            if (window.NexusAudio) window.NexusAudio.blip(920, 0.04, 'square', 0.1);
        },

        close() {
            this.stop();
            this.active = false;
            if (this.modal) this.modal.classList.remove('active');
            if (window.Terminal) window.Terminal.focus();
        },

        start() {
            if (this.running) return;
            const inp = document.getElementById('hc-hash-input');
            if (inp) this.targetHash = inp.value.trim();
            if (!this.targetHash) return;

            const wlSel = document.getElementById('hc-wordlist');
            if (wlSel) this.wordlistKey = wlSel.value;

            this.running = true;
            this.cracked = false;
            this.currentProgress = 0;
            this.startTime = Date.now();

            const algo = ALGOS[this.algoKey] || ALGOS.md5;
            const wl = WORDLISTS[this.wordlistKey] || WORDLISTS.rockyou;

            const logEl = document.getElementById('hc-log');
            const statusEl = document.getElementById('hc-status');

            if (statusEl) { statusEl.textContent = 'CRACKING'; statusEl.className = 'hc-status-running'; }
            if (logEl) logEl.innerHTML = '';

            this._log(logEl, '[SPECTRE-9 GPU HASH CRACKER v3.1.7]', 't-head');
            this._log(logEl, 'Algorithm  : ' + algo.label, 't-cyan');
            this._log(logEl, 'GPU Cluster: 8x NVIDIA RTX 4090 Ti [TENSOR CORES ARMED]', 't-ok');
            this._log(logEl, 'Hash Rate  : ' + algo.speed, 't-ok');
            this._log(logEl, 'Target Hash: ' + this.targetHash.substring(0, 32) + (this.targetHash.length > 32 ? '...' : ''), 't-dim');
            this._log(logEl, 'Wordlist   : ' + this.wordlistKey.toUpperCase() + ' (' + wl.length + ' entries)', 't-dim');
            this._log(logEl, '', '');

            // Phase 1: Wordlist
            let phase = 'wordlist';
            let wordIdx = 0;
            let wordlogTimer = 0;

            const tick = () => {
                if (!this.running) return;
                const elapsed = Date.now() - this.startTime;
                const totalTime = algo.time;
                const prog = Math.min(99, (elapsed / totalTime) * 100);
                this._setProgress(prog);

                // Log intermittent guesses
                if (elapsed > wordlogTimer + 400 && phase === 'wordlist' && wordIdx < wl.length) {
                    const guess = wl[wordIdx++];
                    this._log(logEl, '  ● Testing: ' + guess.padEnd(20) + ' [' + this._fakeHash(guess) + ']', 't-dim');
                    wordlogTimer = elapsed;
                    if (logEl) logEl.scrollTop = logEl.scrollHeight;
                }

                // Phase transitions
                if (elapsed > totalTime * 0.35 && phase === 'wordlist') {
                    phase = 'rainbow';
                    this._log(logEl, '', '');
                    this._log(logEl, '  ► Wordlist exhausted. Switching to Rainbow Table attack...', 't-warn');
                    this._log(logEl, '  ► Loading 40GB precomputed NTLM/MD5 rainbow table...', 't-dim');
                }
                if (elapsed > totalTime * 0.7 && phase === 'rainbow') {
                    phase = 'bruteforce';
                    this._log(logEl, '', '');
                    this._log(logEl, '  ► Rainbow table miss. Initiating Hybrid Brute-Force...', 't-warn');
                    this._log(logEl, '  ► Mask: ?l?l?l?l?l?d?d?s (8-12 chars, 94 charset)', 't-dim');
                }

                // Success condition
                if (elapsed >= totalTime) {
                    this.running = false;
                    this.cracked = true;
                    const wlArr = WORDLISTS[this.wordlistKey] || WORDLISTS.rockyou;
                    this.crackedPass = wlArr[Math.floor(Math.random() * wlArr.length)];
                    this._setProgress(100);

                    this._log(logEl, '', '');
                    this._log(logEl, '╔══════════════════════════════════════════════════╗', 't-ok');
                    this._log(logEl, '║  ✓  HASH CRACKED SUCCESSFULLY                   ║', 't-ok');
                    this._log(logEl, '╠══════════════════════════════════════════════════╣', 't-ok');
                    this._log(logEl, '║  PLAINTEXT : ' + this.crackedPass.padEnd(36) + '║', 't-head');
                    this._log(logEl, '║  TIME      : ' + (elapsed / 1000).toFixed(1) + 's  //  VECTOR: ' + phase.toUpperCase().padEnd(20) + '║', 't-cyan');
                    this._log(logEl, '╚══════════════════════════════════════════════════╝', 't-ok');

                    if (statusEl) { statusEl.textContent = 'CRACKED'; statusEl.className = 'hc-status-cracked'; }
                    if (window.NexusAudio) { window.NexusAudio.blip(1200, 0.06, 'sine', 0.2); }
                    if (window.FX) window.FX.glitch(false);
                    if (window.EventLog) window.EventLog.push('CRIT', 'Hash cracked! Plaintext recovered: ' + this.crackedPass);
                    logEl.scrollTop = logEl.scrollHeight;
                    return;
                }

                this.raf = requestAnimationFrame(tick);
            };

            this.raf = requestAnimationFrame(tick);
        },

        stop() {
            this.running = false;
            if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
            const statusEl = document.getElementById('hc-status');
            if (statusEl && statusEl.className === 'hc-status-running') {
                statusEl.textContent = 'STOPPED';
                statusEl.className = 'hc-status-idle';
            }
        },

        _setProgress(pct) {
            const bar = document.getElementById('hc-progress-fill');
            const label = document.getElementById('hc-progress-label');
            if (bar) bar.style.width = pct + '%';
            if (label) label.textContent = Math.floor(pct) + '%';
        },

        _log(el, text, cls) {
            if (!el) return;
            const span = document.createElement('span');
            span.className = 't-line ' + (cls || '');
            span.textContent = text;
            el.appendChild(span);
        },

        _fakeHash(s) {
            // Not a real hash, just decorative
            const chars = '0123456789abcdef';
            let h = '';
            for (let i = 0; i < 8; i++) h += chars[Math.floor(Math.random() * 16)];
            return h + '...';
        }
    };

    window.HashCracker = HashCracker;
})();
