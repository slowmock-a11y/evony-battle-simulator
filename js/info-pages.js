var InfoPages = (function () {
    'use strict';

    const VIEWS = ['simulator', 'about', 'mechanics', 'battlefield-investigation', 'generals'];
    let suppressHash = false;

    function parseHash() {
        const raw = (window.location.hash || '').replace(/^#/, '');
        if (!raw) return { view: 'simulator', subpath: [] };
        const parts = raw.split('/').map(decodeURIComponent);
        const view = parts[0];
        if (VIEWS.indexOf(view) === -1) return { view: 'simulator', subpath: [] };
        return { view: view, subpath: parts.slice(1) };
    }

    function setHashSilently(hash) {
        suppressHash = true;
        window.location.hash = hash;
        // hashchange fires asynchronously; release the flag on the next tick
        setTimeout(function () { suppressHash = false; }, 0);
    }

    function viewToHash(name, subpath) {
        const suffix = (subpath && subpath.length)
            ? '/' + subpath.map(encodeURIComponent).join('/')
            : '';
        return name === 'simulator' && !suffix ? '' : '#' + name + suffix;
    }

    function switchView(name, opts) {
        opts = opts || {};
        VIEWS.forEach((v) => {
            const el = document.getElementById('view-' + v);
            if (el) el.style.display = v === name ? '' : 'none';
        });
        document.querySelectorAll('.view-tab').forEach((tab) => {
            tab.classList.toggle('active', tab.getAttribute('data-view') === name);
        });

        if (!opts.fromHash) {
            const expected = viewToHash(name, opts.subpath || []);
            if (window.location.hash !== expected) {
                suppressHash = true;
                if (expected) {
                    window.location.hash = expected;
                } else if (history.replaceState) {
                    history.replaceState(null, '', window.location.pathname + window.location.search);
                } else {
                    window.location.hash = '';
                }
                setTimeout(function () { suppressHash = false; }, 0);
            }
        }

        if (name === 'generals' && typeof GeneralsPage !== 'undefined' && GeneralsPage.activate) {
            const detailName = opts.subpath && opts.subpath[0] ? opts.subpath[0] : null;
            GeneralsPage.activate({ detailName: detailName });
        }
    }

    function handleHash() {
        if (suppressHash) return;
        const parsed = parseHash();
        switchView(parsed.view, { fromHash: true, subpath: parsed.subpath });
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
                window.scrollTo(0, 0);
            });
        });
        document.querySelectorAll('a[data-view]').forEach((link) => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                switchView(this.getAttribute('data-view'));
                window.scrollTo(0, 0);
            });
        });
        window.addEventListener('hashchange', handleHash);
        // honour the initial URL
        handleHash();
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        switchView: switchView,
        setHashSilently: setHashSilently
    };
})();
