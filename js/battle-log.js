var BattleLog = (function () {
    'use strict';

    var logContainer;
    var entries = [];
    var maxRound = 0;

    function init() {
        logContainer = document.getElementById('battle-log');

        // Bind filter events
        document.getElementById('log-filter-type').addEventListener('change', applyFilters);
        document.getElementById('log-filter-round').addEventListener('change', applyFilters);
        document.getElementById('log-filter-att').addEventListener('change', applyFilters);
        document.getElementById('log-filter-def').addEventListener('change', applyFilters);
    }

    function fmtCount(n) {
        return Math.round(n).toLocaleString();
    }

    function addEntry(event, index, total) {
        var info = TroopData.TYPES[event.phase];
        var el = document.createElement('div');
        el.className = 'log-entry';
        el.dataset.phase = event.phase;
        el.dataset.round = event.round;
        el.dataset.side = event.side || 'MOVE';

        if (event.eventType === 'move') {
            // Compact movement lines
            var moveHtml = '<span class="log-round">R' + event.round + '.' + info.name + '</span> ';
            var parts = [];
            for (var i = 0; i < event.moves.length; i++) {
                var m = event.moves[i];
                var typeName = TroopData.TYPES[m.type].name;
                var colorClass = TroopData.TYPES[m.type].colorClass;
                if (m.held) {
                    parts.push('<span class="' + colorClass + '">' + m.side + ' ' + typeName + ' holds at ' + Math.round(m.to) + '</span>');
                } else {
                    parts.push('<span class="' + colorClass + '">' + m.side + ' ' + typeName + ' \u2192 ' + Math.round(m.to) + '</span>');
                }
            }
            moveHtml += parts.join(', ');
            el.innerHTML = moveHtml;
        } else if (event.eventType === 'counter') {
            // Counter-strike entry
            var sideLabel = event.side === 'ATTACKER' ? 'ATT' : 'DEF';
            var sourceName = TroopData.TYPES[event.sourceType].name;
            var targetName = TroopData.TYPES[event.targetType].name;

            el.className = 'log-entry log-counter';
            el.innerHTML =
                '<span class="log-round">R' + event.round + '.' + info.name + '</span> ' +
                '<span class="log-counter-label">\u21A9</span> ' +
                '<span class="' + TroopData.TYPES[event.sourceType].colorClass + '">' +
                sourceName + ' T' + event.sourceTier + '</span>' +
                ' counters ' +
                '<span class="' + TroopData.TYPES[event.targetType].colorClass + '">' +
                sideLabel + ' ' + targetName + ' T' + event.targetTier + '</span>: ' +
                '<span class="log-kills">' + fmtCount(event.kills) + ' killed</span>' +
                ' (' + fmtCount(event.remaining) + ' left)';
        } else {
            // Attack entry
            var sideLabel = event.side === 'ATTACKER' ? 'ATT' : 'DEF';
            var sourceName = TroopData.TYPES[event.sourceType].name;
            var targetName = TroopData.TYPES[event.targetType].name;

            el.innerHTML =
                '<span class="log-round">R' + event.round + '.' + info.name + '</span> ' +
                '<span class="' + TroopData.TYPES[event.sourceType].colorClass + '">' +
                sideLabel + ' ' + sourceName + ' T' + event.sourceTier + ' (' + fmtCount(event.sourceCount) + ')</span>' +
                ' \u2192 ' +
                '<span class="' + TroopData.TYPES[event.targetType].colorClass + '">' +
                targetName + ' T' + event.targetTier + '</span>: ' +
                '<span class="log-damage">' + fmtCount(event.damage) + ' dmg</span>, ' +
                '<span class="log-kills">' + fmtCount(event.kills) + ' killed</span>' +
                ' (' + fmtCount(event.remaining) + ' left)';
        }

        entries.push(el);
        logContainer.appendChild(el);

        // Update round filter dropdown
        if (event.round > maxRound) {
            maxRound = event.round;
            var opt = document.createElement('option');
            opt.value = event.round;
            opt.textContent = 'Round ' + event.round;
            document.getElementById('log-filter-round').appendChild(opt);
        }

        applyFilterToEntry(el);

        // Auto-scroll
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    function applyFilters() {
        entries.forEach(applyFilterToEntry);
    }

    function applyFilterToEntry(el) {
        var typeFilter = document.getElementById('log-filter-type').value;
        var roundFilter = document.getElementById('log-filter-round').value;
        var showAtt = document.getElementById('log-filter-att').checked;
        var showDef = document.getElementById('log-filter-def').checked;

        var visible = true;
        if (typeFilter && el.dataset.phase !== typeFilter) visible = false;
        if (roundFilter && el.dataset.round !== roundFilter) visible = false;
        if (el.dataset.side === 'ATTACKER' && !showAtt) visible = false;
        if (el.dataset.side === 'DEFENDER' && !showDef) visible = false;
        // Movement events show both sides — hide only if both are filtered out
        if (el.dataset.side === 'MOVE' && !showAtt && !showDef) visible = false;

        el.classList.toggle('hidden', !visible);
    }

    function clear() {
        logContainer.innerHTML = '';
        entries = [];
        maxRound = 0;
        var roundSelect = document.getElementById('log-filter-round');
        roundSelect.innerHTML = '<option value="">All Rounds</option>';
    }

    return {
        init: init,
        addEntry: addEntry,
        clear: clear
    };
})();
