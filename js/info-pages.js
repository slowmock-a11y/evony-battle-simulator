var InfoPages = (function () {
    'use strict';

    var VIEWS = ['simulator', 'about', 'mechanics'];

    function switchView(name) {
        VIEWS.forEach(function (v) {
            var el = document.getElementById('view-' + v);
            if (el) el.style.display = v === name ? '' : 'none';
        });
        var tabs = document.querySelectorAll('.view-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('active', tabs[i].getAttribute('data-view') === name);
        }
    }

    function init() {
        var tabs = document.querySelectorAll('.view-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].addEventListener('click', function () {
                var view = this.getAttribute('data-view');
                if (this.classList.contains('active')) {
                    switchView('simulator');
                } else {
                    switchView(view);
                }
            });
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    return { switchView: switchView };
})();
