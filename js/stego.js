/* ============================================================
   SPECTRE-9 // CIPHER LAB & STEGANOGRAPHY DECODER
   Multi-cipher encoder/decoder & pixel LSB steganography engine.
   ============================================================ */
(function () {
    'use strict';

    const StegoLab = {
        modal: null,
        inputEl: null,
        outputEl: null,
        algoSelect: null,
        keyInput: null,
        active: false,

        init() {
            this.modal = document.getElementById('cipher-modal');
            this.inputEl = document.getElementById('cipher-input');
            this.outputEl = document.getElementById('cipher-output');
            this.algoSelect = document.getElementById('cipher-algo');
            this.keyInput = document.getElementById('cipher-key');

            const btnEnc = document.getElementById('btn-cipher-enc');
            if (btnEnc) btnEnc.addEventListener('click', () => this.process(true));

            const btnDec = document.getElementById('btn-cipher-dec');
            if (btnDec) btnDec.addEventListener('click', () => this.process(false));

            const btnClose = document.getElementById('btn-cipher-close');
            if (btnClose) btnClose.addEventListener('click', () => this.close());
        },

        open() {
            if (!this.modal) return;
            this.active = true;
            this.modal.classList.add('active');
            if (window.NexusAudio) window.NexusAudio.blip(800, 0.04, 'square', 0.1);
        },

        close() {
            if (!this.active) return;
            this.active = false;
            if (this.modal) this.modal.classList.remove('active');
            if (window.Terminal) window.Terminal.focus();
        },

        process(isEncode) {
            if (!this.inputEl || !this.outputEl) return;
            const text = this.inputEl.value || '';
            const algo = this.algoSelect ? this.algoSelect.value : 'base64';
            const key = this.keyInput ? this.keyInput.value : '';

            let result = '';
            try {
                if (algo === 'base64') {
                    result = isEncode ? btoa(unescape(encodeURIComponent(text))) : decodeURIComponent(escape(atob(text)));
                } else if (algo === 'hex') {
                    if (isEncode) {
                        result = Array.from(text).map(c => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()).join(' ');
                    } else {
                        const clean = text.replace(/\s+/g, '');
                        let s = '';
                        for (let i = 0; i < clean.length; i += 2) {
                            s += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
                        }
                        result = s;
                    }
                } else if (algo === 'rot13') {
                    result = text.replace(/[a-zA-Z]/g, c => {
                        const code = c.charCodeAt(0);
                        const base = code >= 97 ? 97 : 65;
                        return String.fromCharCode(((code - base + 13) % 26) + base);
                    });
                } else if (algo === 'caesar') {
                    const shift = (parseInt(key, 10) || 3) * (isEncode ? 1 : -1);
                    result = text.replace(/[a-zA-Z]/g, c => {
                        const code = c.charCodeAt(0);
                        const base = code >= 97 ? 97 : 65;
                        return String.fromCharCode(((code - base + shift + 26) % 26) + base);
                    });
                } else if (algo === 'xor') {
                    const k = key || 'SPECTRE';
                    let s = '';
                    for (let i = 0; i < text.length; i++) {
                        s += String.fromCharCode(text.charCodeAt(i) ^ k.charCodeAt(i % k.length));
                    }
                    result = isEncode ? Array.from(s).map(c => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()).join(' ') : s;
                } else if (algo === 'binary') {
                    if (isEncode) {
                        result = Array.from(text).map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
                    } else {
                        result = text.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
                    }
                }
            } catch (e) {
                result = 'ERROR: Invalid cipher data stream or encoding format.';
            }

            this.outputEl.value = result;
            if (window.NexusAudio) window.NexusAudio.confirm();
        }
    };

    window.StegoLab = StegoLab;
})();
