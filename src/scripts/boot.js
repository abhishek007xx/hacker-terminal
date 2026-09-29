/* ============================================================
   SPECTRE-9 // BOOT SEQUENCE (DIRECT START)
   Loading screen removed — tactical interface engages directly.
   ============================================================ */
(function () {
    'use strict';

    const Boot = {
        started: true,
        done: true,

        init(onEnter) {
            this.onEnter = onEnter;
            if (typeof this.onEnter === 'function') {
                this.onEnter();
            }
        },

        run() {
            if (typeof this.onEnter === 'function') {
                this.onEnter();
            }
        },

        enter() {
            if (typeof this.onEnter === 'function') {
                this.onEnter();
            }
        }
    };

    window.Boot = Boot;
})();
