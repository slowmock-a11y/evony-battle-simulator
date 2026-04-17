var BattleLog = (function () {
    'use strict';

    let logContainer;
    let entries = [];
    let maxRound = 0;

    function init() {
        logContainer = document.getElementById('battle-log');

        document.getElementById('log-filter-type').addEventListener('change', applyFilters);
        document.getElementById('log-filter-round').addEventListener('change', applyFilters);
        document.getElementById('log-filter-att').addEventListener('change', applyFilters);
        document.getElementById('log-filter-def').addEventListener('change', applyFilters);
    }

    function fmtCount(n) {
        return Math.round(n).toLocaleString();
    }

    function addEntry(event, index, total) {
        const info = TroopData.TYPES[event.phase];
        const el = document.createElement('div');
        el.className = 'log-entry';
        el.dataset.phase = event.phase;
        el.dataset.round = event.round;
        el.dataset.side = event.side || 'MOVE';

        if (event.eventType === 'move') {
            const parts = event.moves.map((m) => {
                const typeName = TroopData.TYPES[m.type].name;
                const colorClass = TroopData.TYPES[m.type].colorClass;
                const body = m.held
                    ? `${m.side} ${typeName} holds at ${Math.round(m.to)}`
                    : `${m.side} ${typeName} \u2192 ${Math.round(m.to)}`;
                return `<span class="${colorClass}">${body}</span>`;
            });
            el.innerHTML = `<span class="log-round">R${event.round}.${info.name}</span> ${parts.join(', ')}`;
        } else if (event.eventType === 'counter') {
            const sideLabel = event.side;
            const sourceName = TroopData.TYPES[event.sourceType].name;
            const targetName = TroopData.TYPES[event.targetType].name;
            const srcColor = TroopData.TYPES[event.sourceType].colorClass;
            const tgtColor = TroopData.TYPES[event.targetType].colorClass;

            el.className = 'log-entry log-counter';
            el.innerHTML = `
                <span class="log-round">R${event.round}.${info.name}</span>
                <span class="log-counter-label">\u21A9</span>
                <span class="${srcColor}">${sourceName} T${event.sourceTier}</span>
                counters
                <span class="${tgtColor}">${sideLabel} ${targetName} T${event.targetTier}</span>:
                <span class="log-kills">${fmtCount(event.kills)} killed</span>
                (${fmtCount(event.remaining)} left)
            `;
        } else {
            const sideLabel = event.side;
            const sourceName = TroopData.TYPES[event.sourceType].name;
            const targetName = TroopData.TYPES[event.targetType].name;
            const srcColor = TroopData.TYPES[event.sourceType].colorClass;
            const tgtColor = TroopData.TYPES[event.targetType].colorClass;

            el.innerHTML = `
                <span class="log-round">R${event.round}.${info.name}</span>
                <span class="${srcColor}">${sideLabel} ${sourceName} T${event.sourceTier} (${fmtCount(event.sourceCount)})</span>
                \u2192
                <span class="${tgtColor}">${targetName} T${event.targetTier}</span>:
                <span class="log-damage">${fmtCount(event.damage)} dmg</span>,
                <span class="log-kills">${fmtCount(event.kills)} killed</span>
                (${fmtCount(event.remaining)} left)
            `;
        }

        entries.push(el);
        logContainer.appendChild(el);

        if (event.round > maxRound) {
            maxRound = event.round;
            const opt = document.createElement('option');
            opt.value = event.round;
            opt.textContent = `Round ${event.round}`;
            document.getElementById('log-filter-round').appendChild(opt);
        }

        applyFilterToEntry(el);

        logContainer.scrollTop = logContainer.scrollHeight;
    }

    function applyFilters() {
        entries.forEach(applyFilterToEntry);
    }

    function applyFilterToEntry(el) {
        const typeFilter = document.getElementById('log-filter-type').value;
        const roundFilter = document.getElementById('log-filter-round').value;
        const showAtt = document.getElementById('log-filter-att').checked;
        const showDef = document.getElementById('log-filter-def').checked;

        let visible = true;
        if (typeFilter && el.dataset.phase !== typeFilter) visible = false;
        if (roundFilter && el.dataset.round !== roundFilter) visible = false;
        if (el.dataset.side === 'ATT' && !showAtt) visible = false;
        if (el.dataset.side === 'DEF' && !showDef) visible = false;
        // Movement events show both sides — hide only if both are filtered out
        if (el.dataset.side === 'MOVE' && !showAtt && !showDef) visible = false;

        el.classList.toggle('hidden', !visible);
    }

    function clear() {
        logContainer.innerHTML = '';
        entries = [];
        maxRound = 0;
        const roundSelect = document.getElementById('log-filter-round');
        roundSelect.innerHTML = '<option value="">All Rounds</option>';
    }

    return {
        init: init,
        addEntry: addEntry,
        clear: clear
    };
})();
