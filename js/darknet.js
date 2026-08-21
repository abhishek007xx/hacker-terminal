/* ============================================================
   SPECTRE-9 // DARKNET INTELLIGENCE FEED
   Simulated dark-web threat intelligence scanning, 
   data breach monitor, C2 beacon tracker, and
   zero-day market feed. ALL FICTIONAL / SIMULATED.
   ============================================================ */
(function () {
    'use strict';

    const THREAT_SOURCES = [
        'TOR_EXIT_NODE::185.220.101.43', 'DARKWEB_C2::onion://xqz3u5drneuzhaeo.onion',
        'BOTNET_ALPHA::169.254.12.8', 'APT-NEXUS-29::102.3.88.44',
        'ROGUE_AS::AS64555', 'TOR_RELAY::195.176.3.19', 'I2P_DEST::~MRpLFxnrj3FoZv',
        'RANSOMWARE_C2::77.111.240.182', 'EXFIL_ENDPOINT::45.76.88.12',
        'DGA_DOMAIN::xkqtlvmzn7.pw', 'SHADOWBROKERS::198.98.55.17', 'VOLT_TYPHOON::47.92.0.232'
    ];

    const BREACH_TARGETS = [
        'MegaCorp Industries', 'FinanceFirst Bank', 'QuantumVault LLC', 'CryptoNexus Exchange',
        'ShadowDNS Provider', 'GlobalRoute Telecom', 'NuclearGrid SCADA', 'HealthMatrix Corp',
        'ArmamentEx Defense', 'SpectrePay Wallet', 'DarkCloud CDN', 'PhantomDB Systems'
    ];

    const EXPLOIT_NAMES = [
        'CVE-2024-3094 (XZ Utils RCE)', 'CVE-2024-1708 (ConnectWise SQLi)', 
        'CVE-2024-0519 (Chrome V8 UAF)', 'CVE-2023-44487 (HTTP/2 Rapid Reset)',
        'CVE-2023-34362 (MOVEit SQLi)', 'CVE-2024-21762 (Fortinet Auth Bypass)',
        'CVE-2024-6387 (OpenSSH RCE)', 'CVE-2024-3400 (PAN-OS RCE)',
        'GHOST_WRITE (0-Day: Phantom Kernel Stack Pivot)', 'BLUE_TYPHOON (0-Day: SMBv3 Heap Spray)'
    ];

    const COUNTRIES = ['RU', 'CN', 'KP', 'IR', 'UA', 'BY', 'VN', 'NG', 'BR', 'US', 'DE', 'FR'];

    const DarknetFeed = {
        modal: null,
        active: false,
        ticker: null,
        feedInterval: null,

        init() {
            this.modal = document.getElementById('darknet-modal');
            if (!this.modal) return;

            const btnClose = document.getElementById('btn-dn-close');
            if (btnClose) btnClose.addEventListener('click', () => this.close());

            const btnRefresh = document.getElementById('btn-dn-refresh');
            if (btnRefresh) btnRefresh.addEventListener('click', () => this.refresh());

            const btnScan = document.getElementById('btn-dn-scan');
            if (btnScan) btnScan.addEventListener('click', () => this.startScan());

            if (this.modal) {
                this.modal.addEventListener('click', (e) => {
                    if (e.target === this.modal) this.close();
                });
            }
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.active) this.close();
            });
        },

        open() {
            if (!this.modal) return;
            this.active = true;
            this.modal.classList.add('active');
            if (window.NexusAudio) window.NexusAudio.blip(880, 0.04, 'square', 0.1);
            this.refresh();
            this._startLiveFeed();
        },

        close() {
            this.active = false;
            if (this.modal) this.modal.classList.remove('active');
            this._stopLiveFeed();
            if (window.Terminal) window.Terminal.focus();
        },

        refresh() {
            this._renderBreachList();
            this._renderC2Tracker();
            this._renderExploitMarket();
        },

        _startLiveFeed() {
            this._stopLiveFeed();
            this.feedInterval = setInterval(() => {
                this._addLiveFeedEntry();
            }, 1200);
        },

        _stopLiveFeed() {
            if (this.feedInterval) { clearInterval(this.feedInterval); this.feedInterval = null; }
        },

        _renderBreachList() {
            const el = document.getElementById('dn-breach-list');
            if (!el) return;
            el.innerHTML = '';
            const count = 5 + Math.floor(Math.random() * 4);
            for (let i = 0; i < count; i++) {
                const target = BREACH_TARGETS[Math.floor(Math.random() * BREACH_TARGETS.length)];
                const records = (Math.floor(Math.random() * 900) + 100) + 'K';
                const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
                const date = this._randomDate();
                const severity = ['CRITICAL', 'HIGH', 'MEDIUM'][Math.floor(Math.random() * 3)];
                const cls = severity === 'CRITICAL' ? 'dn-sev-crit' : severity === 'HIGH' ? 'dn-sev-high' : 'dn-sev-med';
                el.innerHTML += `<div class="dn-breach-row">
                    <span class="dn-target">${target}</span>
                    <span class="dn-meta">[${country}]</span>
                    <span class="dn-records">${records} records</span>
                    <span class="${cls}">${severity}</span>
                    <span class="dn-date">${date}</span>
                </div>`;
            }
        },

        _renderC2Tracker() {
            const el = document.getElementById('dn-c2-list');
            if (!el) return;
            el.innerHTML = '';
            const count = 4 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                const src = THREAT_SOURCES[Math.floor(Math.random() * THREAT_SOURCES.length)];
                const beacons = Math.floor(Math.random() * 850) + 10;
                const threat = ['APT-29', 'LAZARUS', 'COZY BEAR', 'SANDWORM', 'VOLT TYPHOON', 'UNKNOWN'][Math.floor(Math.random() * 6)];
                el.innerHTML += `<div class="dn-c2-row">
                    <span class="dn-c2-src t-warn">${src.split('::')[0]}</span>
                    <span class="dn-c2-addr t-dim">${src.split('::')[1] || ''}</span>
                    <span class="dn-c2-beacons t-ok">${beacons} beacons</span>
                    <span class="dn-c2-actor t-cyan">${threat}</span>
                </div>`;
            }
        },

        _renderExploitMarket() {
            const el = document.getElementById('dn-exploit-list');
            if (!el) return;
            el.innerHTML = '';
            const count = 4 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                const exploit = EXPLOIT_NAMES[Math.floor(Math.random() * EXPLOIT_NAMES.length)];
                const price = '$' + (Math.floor(Math.random() * 950) + 50) + 'K';
                const status = ['AVAILABLE', 'SOLD', 'RESERVED', 'AUCTION'][Math.floor(Math.random() * 4)];
                const cls = status === 'AVAILABLE' ? 't-ok' : status === 'SOLD' ? 't-err' : 't-warn';
                el.innerHTML += `<div class="dn-exploit-row">
                    <span class="dn-exp-name t-cyan">${exploit}</span>
                    <span class="dn-exp-price t-warn">${price}</span>
                    <span class="${cls} dn-exp-status">${status}</span>
                </div>`;
            }
        },

        startScan() {
            const scanEl = document.getElementById('dn-scan-output');
            if (!scanEl) return;
            scanEl.innerHTML = '';
            const entries = [
                { delay: 0, text: '[INITIATING DARKNET RECON SWEEP...]', cls: 't-head' },
                { delay: 300, text: '  ► Routing through 5 TOR exit nodes...', cls: 't-dim' },
                { delay: 700, text: '  ► DNS-over-HTTPS resolver armed...', cls: 't-dim' },
                { delay: 1100, text: '  ► Scanning .onion surface for IOCs...', cls: 't-warn' },
                { delay: 1600, text: '  ► Matched 3 new IOCs in threat feeds...', cls: 't-ok' },
                { delay: 2100, text: '  ► Enumerating botnet C2 beacons...', cls: 't-warn' },
                { delay: 2700, text: '  ► C2 detected: ' + THREAT_SOURCES[Math.floor(Math.random() * THREAT_SOURCES.length)], cls: 't-crit' },
                { delay: 3300, text: '  ► Cross-referencing leaked credential dumps...', cls: 't-dim' },
                { delay: 4000, text: '  ► ALERT: New zero-day listing detected on exploit market!', cls: 't-crit' },
                { delay: 4700, text: '  ► ' + EXPLOIT_NAMES[Math.floor(Math.random() * EXPLOIT_NAMES.length)], cls: 't-warn' },
                { delay: 5500, text: '[SCAN COMPLETE] — 7 CRITICAL IOCs LOGGED', cls: 't-ok' }
            ];

            entries.forEach(({ delay, text, cls }) => {
                setTimeout(() => {
                    const span = document.createElement('span');
                    span.className = 't-line ' + cls;
                    span.textContent = text;
                    scanEl.appendChild(span);
                    scanEl.scrollTop = scanEl.scrollHeight;
                    if (window.NexusAudio) window.NexusAudio.blip(500 + Math.random() * 300, 0.02, 'square', 0.03);
                }, delay);
            });

            if (window.EventLog) window.EventLog.push('WARN', 'Darknet scan initiated — IOC sweep active.');
        },

        _addLiveFeedEntry() {
            const el = document.getElementById('dn-live-feed');
            if (!el) return;
            const templates = [
                () => `[${this._ts()}] BREACH ALERT: ${BREACH_TARGETS[Math.floor(Math.random() * BREACH_TARGETS.length)]} — ${Math.floor(Math.random() * 500) + 10}K records leaked`,
                () => `[${this._ts()}] C2 BEACON: ${THREAT_SOURCES[Math.floor(Math.random() * THREAT_SOURCES.length)]}`,
                () => `[${this._ts()}] EXPLOIT SALE: ${EXPLOIT_NAMES[Math.floor(Math.random() * EXPLOIT_NAMES.length)]}`,
                () => `[${this._ts()}] RANSOMWARE DEPLOY: LockBit 3.0 targeting ${BREACH_TARGETS[Math.floor(Math.random() * BREACH_TARGETS.length)]}`,
                () => `[${this._ts()}] IOC MATCH: Suspicious DNS → ${window.NX ? window.NX.hex(6).toLowerCase() : 'a4f2e1'}.darkpages.pw`,
            ];
            const fn = templates[Math.floor(Math.random() * templates.length)];
            const span = document.createElement('span');
            span.className = 't-line ' + (Math.random() < 0.3 ? 't-crit' : Math.random() < 0.5 ? 't-warn' : 't-dim');
            span.textContent = fn();
            el.appendChild(span);
            // Keep max 50 entries
            while (el.children.length > 50) el.removeChild(el.firstChild);
            el.scrollTop = el.scrollHeight;
        },

        _ts() {
            const n = new Date();
            return n.getHours().toString().padStart(2,'0') + ':' +
                   n.getMinutes().toString().padStart(2,'0') + ':' +
                   n.getSeconds().toString().padStart(2,'0');
        },

        _randomDate() {
            const days = Math.floor(Math.random() * 30) + 1;
            return days + 'd ago';
        }
    };

    window.DarknetFeed = DarknetFeed;
})();
