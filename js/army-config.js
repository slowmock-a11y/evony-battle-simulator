var ArmyConfig = (function () {
    'use strict';

    var TYPE_KEYS = ['GROUND', 'RANGED', 'MOUNTED', 'SIEGE'];
    var TIER_GROUPS = [
        { label: 'High Tiers (T14–T10)', tiers: [14, 13, 12, 11, 10] },
        { label: 'Mid Tiers (T9–T5)',    tiers: [9, 8, 7, 6, 5] },
        { label: 'Low Tiers (T4–T1)',    tiers: [4, 3, 2, 1] }
    ];

    function init(panelId) {
        var buffSection = document.querySelector('.buff-section[data-for="' + panelId + '"]');
        var gridSection = document.querySelector('.troop-grid[data-for="' + panelId + '"]');

        buildBuffInputs(buffSection, panelId);
        buildTroopGrid(gridSection, panelId);
    }

    // --- Buff Inputs ---

    function buildBuffInputs(container, panelId) {
        TYPE_KEYS.forEach(function (type) {
            var info = TroopData.TYPES[type];
            var row = document.createElement('div');
            row.className = 'buff-row';
            row.innerHTML =
                '<span class="buff-label ' + info.colorClass + '">' + info.name + '</span>' +
                '<span class="buff-stat-label">ATK</span>' +
                '<input type="number" value="1500" data-panel="' + panelId + '" data-buff-type="' + type + '" data-buff-stat="atk" />%' +
                '<span class="buff-stat-label">DEF</span>' +
                '<input type="number" value="1500" data-panel="' + panelId + '" data-buff-type="' + type + '" data-buff-stat="def" />%' +
                '<span class="buff-stat-label">HP</span>' +
                '<input type="number" value="1500" data-panel="' + panelId + '" data-buff-type="' + type + '" data-buff-stat="hp" />%';
            container.appendChild(row);
        });
    }

    // --- Troop Grid ---

    function buildTroopGrid(container, panelId) {
        var controlsRow = document.createElement('div');
        controlsRow.className = 'grid-controls';

        var label = document.createElement('label');
        label.className = 'grid-controls-label';
        label.textContent = 'Count';
        controlsRow.appendChild(label);

        var defaultInput = document.createElement('input');
        defaultInput.type = 'number';
        defaultInput.className = 'default-count-input';
        defaultInput.min = '0';
        defaultInput.value = '1000';
        defaultInput.dataset.panel = panelId;
        controlsRow.appendChild(defaultInput);

        var setBtn = document.createElement('button');
        setBtn.className = 'btn btn-sm';
        setBtn.textContent = 'Set Default';
        setBtn.addEventListener('click', function () {
            var val = parseInt(defaultInput.value) || 0;
            setAllCountsUniform(panelId, val);
        });
        controlsRow.appendChild(setBtn);

        var clearBtn = document.createElement('button');
        clearBtn.className = 'btn btn-sm';
        clearBtn.textContent = 'Clear All';
        clearBtn.addEventListener('click', function () {
            setAllCountsUniform(panelId, 0);
        });
        controlsRow.appendChild(clearBtn);

        container.appendChild(controlsRow);

        var gh = document.createElement('div');
        gh.className = 'grid-header';
        gh.innerHTML = '<span></span>';
        TYPE_KEYS.forEach(function (type) {
            var info = TroopData.TYPES[type];
            var span = document.createElement('span');
            span.className = info.colorClass;
            span.textContent = info.name.charAt(0); // G, R, M, S
            span.title = 'Click to set all ' + info.name;
            span.addEventListener('click', function () {
                var val = prompt('Set all ' + info.name + ' tiers to:', '0');
                if (val !== null) setColumnValue(panelId, type, parseInt(val) || 0);
            });
            gh.appendChild(span);
        });
        container.appendChild(gh);

        TIER_GROUPS.forEach(function (group, gi) {
            var body = document.createElement('div');
            body.className = 'tier-group-body';
            if (gi > 0) body.style.marginTop = '0.5rem';
            container.appendChild(body);

            group.tiers.forEach(function (tier) {
                var row = document.createElement('div');
                row.className = 'grid-row';

                var label = document.createElement('span');
                label.className = 'tier-label';
                label.textContent = 'T' + tier;
                label.title = 'Click to set all T' + tier;
                label.addEventListener('click', function () {
                    var val = prompt('Set all types for T' + tier + ' to:', '0');
                    if (val !== null) setRowValue(panelId, tier, parseInt(val) || 0);
                });
                row.appendChild(label);

                TYPE_KEYS.forEach(function (type) {
                    var input = document.createElement('input');
                    input.type = 'number';
                    input.min = '0';
                    input.value = '1000';
                    input.dataset.panel = panelId;
                    input.dataset.type = type;
                    input.dataset.tier = tier;
                    row.appendChild(input);
                });

                body.appendChild(row);
            });
        });
    }

    function setAllCountsUniform(panelId, val) {
        var inputs = document.querySelectorAll('input[data-panel="' + panelId + '"][data-type]');
        inputs.forEach(function (inp) { inp.value = val; });
    }

    function setColumnValue(panelId, type, val) {
        var inputs = document.querySelectorAll('input[data-panel="' + panelId + '"][data-type="' + type + '"]');
        inputs.forEach(function (inp) { inp.value = val; });
    }

    function setRowValue(panelId, tier, val) {
        var inputs = document.querySelectorAll('input[data-panel="' + panelId + '"][data-tier="' + tier + '"]');
        inputs.forEach(function (inp) { inp.value = val; });
    }

    // --- Read Values ---

    function getTroopCounts(panelId) {
        var counts = {};
        TYPE_KEYS.forEach(function (t) { counts[t] = {}; });
        var inputs = document.querySelectorAll('input[data-panel="' + panelId + '"][data-type]');
        inputs.forEach(function (inp) {
            var type = inp.dataset.type;
            var tier = parseInt(inp.dataset.tier);
            var val = parseInt(inp.value) || 0;
            counts[type][tier] = Math.max(0, val);
        });
        return counts;
    }

    function getBuffs(panelId) {
        var buffs = {};
        TYPE_KEYS.forEach(function (t) { buffs[t] = { atk: 0, def: 0, hp: 0 }; });
        var inputs = document.querySelectorAll('input[data-panel="' + panelId + '"][data-buff-type]');
        inputs.forEach(function (inp) {
            buffs[inp.dataset.buffType][inp.dataset.buffStat] = parseFloat(inp.value) || 0;
        });
        return buffs;
    }

    return {
        init: init,
        getTroopCounts: getTroopCounts,
        getBuffs: getBuffs
    };
})();
