var InfoPages = (function () {
    'use strict';

    const VIEWS = ['simulator', 'about', 'mechanics'];

    function switchView(name) {
        VIEWS.forEach((v) => {
            const el = document.getElementById('view-' + v);
            if (el) el.style.display = v === name ? '' : 'none';
        });
        document.querySelectorAll('.view-tab').forEach((tab) => {
            tab.classList.toggle('active', tab.getAttribute('data-view') === name);
        });
    }

    function init() {
        document.querySelectorAll('.view-tab').forEach((tab) => {
            tab.addEventListener('click', function () {
                const view = this.getAttribute('data-view');
                if (this.classList.contains('active')) {
                    switchView('simulator');
                } else {
                    switchView(view);
                }
            });
        });
        document.querySelectorAll('.back-link[data-view]').forEach((link) => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                switchView(this.getAttribute('data-view'));
            });
        });
    }

    document.addEventListener('DOMContentLoaded', init);

    return { switchView: switchView };
})();
