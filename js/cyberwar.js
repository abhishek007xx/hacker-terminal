/* ============================================================
   SPECTRE-9 // CYBER DEFENSE WARGAME ENGINE
   Interactive simulated APT attack interception mini-game.
   Type counter-measures under countdown timer and alarms.
   ============================================================ */
(function () {
    'use strict';

    const THREATS = [
        {
            title: 'APT-29 DDOS BOTNET SURGE DETECTED',
            detail: '256 virtual nodes flooding port 443 with SYN packets.',
            cmd: 'firewall drop',
            pts: 250
        },
        {
            title: 'LATERAL PRIVILEGE ESCALATION ON NODE-03',
            detail: 'Unauthorized root escalation attempt on satellite node.',
            cmd: 'isolate node-03',
            pts: 300
        },
        {
            title: 'MAN-IN-THE-MIDDLE ARP CACHE POISON',
            detail: 'Rogue gateway spoofing MAC 00:0F:D3:21:A4.',
            cmd: 'flush arp',
            pts: 200
        },
        {
            title: 'QUANTUM ENTROPY DEPLETION ATTACK',
            detail: 'Adversary draining session key cryptographic entropy.',
            cmd: 'encrypt pool',
            pts: 350
        },
        {
            title: 'ZERO-DAY REVERSE SHELL INJECTION (PID 4410)',
            detail: 'Remote memory payload executing unauthorized thread.',
            cmd: 'kill proc 4410',
            pts: 400
        },
        {
            title: 'SATELLITE KU-BAND DOWNLINK JAMMING',
            detail: 'Hostile electronic countermeasures disrupting telemetry.',
            cmd: 'freq hop 14.2',
            pts: 300
        }
    ];

    const CyberWar = {
        modal: null,
        input: null,
        titleEl: null,
        detailEl: null,
        cmdNeededEl: null,
        timerFillEl: null,
        scoreEl: null,
        threatEl: null,

        active: false,
        score: 0,
        wave: 1,
        maxWaves: 5,
        currentThreat: null,
        timerDur: 8000,
        timerStart: 0,
        rafTimer: null,

        init() {
            this.modal = document.getElementById('cyberwar-modal');
            this.input = document.getElementById('cw-input');
            this.titleEl = document.getElementById('cw-vector-title');
            this.detailEl = document.getElementById('cw-vector-detail');
            this.cmdNeededEl = document.getElementById('cw-command-needed');
            this.timerFillEl = document.getElementById('cw-timer-fill');
            this.scoreEl = document.getElementById('cw-score');
            this.threatEl = document.getElementById('cw-threat');

            if (this.input) {
                this.input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') this._handleSubmit();
                    if (e.key === 'Escape') this.exit();
                });
            }

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.active) this.exit();
            });
        },

        start() {
            if (this.active || !this.modal) return;
            this.active = true;
            this.score = 0;
            this.wave = 1;
            this.modal.classList.add('active');
            if (this.input) {
                this.input.value = '';
                this.input.focus();
            }
            if (window.NexusAudio) {
                window.NexusAudio.defcon(2);
                window.NexusAudio.radioStatic();
            }
            this._nextWave();
        },

        exit() {
            if (!this.active) return;
            this.active = false;
            if (this.rafTimer) cancelAnimationFrame(this.rafTimer);
            if (this.modal) this.modal.classList.remove('active');
            if (window.Terminal) window.Terminal.focus();
        },

        _nextWave() {
            if (!this.active) return;
            if (this.wave > this.maxWaves) {
                this._victory();
                return;
            }

            this.currentThreat = THREATS[Math.floor(Math.random() * THREATS.length)];
            if (this.titleEl) this.titleEl.textContent = '[WAVE ' + this.wave + '/' + this.maxWaves + '] ' + this.currentThreat.title;
            if (this.detailEl) this.detailEl.textContent = this.currentThreat.detail;
            if (this.cmdNeededEl) this.cmdNeededEl.innerHTML = 'TYPE COUNTERMEASURE: <b>' + this.currentThreat.cmd + '</b>';
            if (this.scoreEl) this.scoreEl.textContent = 'SCORE: ' + this.score;
            if (this.threatEl) this.threatEl.textContent = 'THREAT LEVEL: ' + (75 + this.wave * 5) + '%';
            if (this.input) {
                this.input.value = '';
                this.input.focus();
            }

            // Start countdown timer
            this.timerStart = performance.now();
            this._runTimer();
        },

        _runTimer() {
            const step = (now) => {
                if (!this.active) return;
                const elapsed = now - this.timerStart;
                const remainPct = Math.max(0, 1 - elapsed / this.timerDur) * 100;

                if (this.timerFillEl) {
                    this.timerFillEl.style.width = remainPct + '%';
                    this.timerFillEl.classList.toggle('warn', remainPct < 50 && remainPct >= 25);
                    this.timerFillEl.classList.toggle('crit', remainPct < 25);
                }

                if (remainPct <= 0) {
                    this._failure();
                } else {
                    this.rafTimer = requestAnimationFrame(step);
                }
            };
            this.rafTimer = requestAnimationFrame(step);
        },

        _handleSubmit() {
            if (!this.active || !this.currentThreat) return;
            const val = this.input.value.trim().toLowerCase();
            if (val === this.currentThreat.cmd) {
                if (this.rafTimer) cancelAnimationFrame(this.rafTimer);
                this.score += this.currentThreat.pts;
                if (window.NexusAudio) window.NexusAudio.confirm();
                if (window.EventLog) window.EventLog.push('OK', 'Threat countermeasure executed: ' + this.currentThreat.cmd);
                this.wave++;
                this._nextWave();
            } else {
                if (window.NexusAudio) window.NexusAudio.warn();
                if (this.input) this.input.value = '';
            }
        },

        _victory() {
            if (this.rafTimer) cancelAnimationFrame(this.rafTimer);
            if (this.titleEl) this.titleEl.textContent = '★ ALL THREAT VECTORS NEUTRALIZED ★';
            if (this.detailEl) this.detailEl.textContent = 'The SPECTRE-9 tactical grid is secure. Clearance verified.';
            if (this.cmdNeededEl) this.cmdNeededEl.innerHTML = 'FINAL SCORE: <b>' + this.score + ' PTS</b> — [PRESS ESC TO RETURN]';
            if (window.NexusAudio) window.NexusAudio.confirm();
            if (window.EventLog) window.EventLog.push('OK', 'DEFENSE VICTORY: All 5 attack vectors repelled.');
        },

        _failure() {
            if (this.rafTimer) cancelAnimationFrame(this.rafTimer);
            if (this.titleEl) this.titleEl.textContent = '⚠ BREACH CONTAINMENT FAILED ⚠';
            if (this.detailEl) this.detailEl.textContent = 'Adversary penetrated security defenses. Threat escalated.';
            if (this.cmdNeededEl) this.cmdNeededEl.innerHTML = 'SCORE: <b>' + this.score + ' PTS</b> — [PRESS ESC TO RETRY]';
            if (window.NexusAudio) window.NexusAudio.glitch();
            if (window.FX) window.FX.glitch(true);
        }
    };

    window.CyberWar = CyberWar;
})();
