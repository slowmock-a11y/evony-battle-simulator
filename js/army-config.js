var ArmyConfig = (function () {
    'use strict';

    var TYPE_KEYS = ['GROUND', 'RANGED', 'MOUNTED', 'SIEGE'];
    var TIER_GROUPS = [
        { label: 'High Tiers (T14–T10)', tiers: [14, 13, 12, 11, 10], collapsed: false },
        { label: 'Mid Tiers (T9–T5)',    tiers: [9, 8, 7, 6, 5],     collapsed: true },
        { label: 'Low Tiers (T4–T1)',    tiers: [4, 3, 2, 1],         collapsed: true }
    ];

    var PRESETS = {
        '': null,
        'Empty March': function () { return makeUniform(0); },
        'T14 Only': function () {
            var c = makeUniform(0);
            TYPE_KEYS.forEach(function (t) { c[t][14] = 1000; });
            return c;
        },
        'T12-T14 Mix': function () {
            var c = makeUniform(0);
            TYPE_KEYS.forEach(function (t) { c[t][14] = 1000; c[t][13] = 500; c[t][12] = 500; });
            return c;
        },
        'Full Layers': function () {
            var c = makeUniform(0);
            TYPE_KEYS.forEach(function (t) { c[t][14] = 1000; c[t][1] = 200; });
            return c;
        }
    };

    function makeUniform(val) {
        var c = {};
        TYPE_KEYS.forEach(function (t) {
            c[t] = {};
            TroopData.TIERS.forEach(function (tier) { c[t][tier] = val; });
        });
        return c;
    }

    function init(panelId) {
        var panel = document.getElementById(panelId);
        var buffSection = panel.querySelector('.buff-section');
        var gridSection = panel.querySelector('.troop-grid');
        var presetSelect = panel.querySelector('.preset-select');

        buildPresets(presetSelect, panelId);
        buildBuffInputs(buffSection, panelId);
        buildTroopGrid(gridSection, panelId);
        setupBulkActions(panel, panelId);
    }

    // --- Presets ---

    function buildPresets(select, panelId) {
        Object.keys(PRESETS).forEach(function (name) {
            if (name === '') return; // skip empty
            var opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            select.appendChild(opt);
        });
        select.addEventListener('change', function () {
            var fn = PRESETS[select.value];
            if (fn) {
                var counts = fn();
                setAllCounts(panelId, counts);
            }
            select.value = '';
        });
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
                '<input type="number" value="0" data-panel="' + panelId + '" data-buff-type="' + type + '" data-buff-stat="atk" />%' +
                '<span class="buff-stat-label">DEF</span>' +
                '<input type="number" value="0" data-panel="' + panelId + '" data-buff-type="' + type + '" data-buff-stat="def" />%' +
                '<span class="buff-stat-label">HP</span>' +
                '<input type="number" value="0" data-panel="' + panelId + '" data-buff-type="' + type + '" data-buff-stat="hp" />%';
            container.appendChild(row);
        });
    }

    // --- Troop Grid ---

    function buildTroopGrid(container, panelId) {
        TIER_GROUPS.forEach(function (group, gi) {
            var header = document.createElement('div');
            header.className = 'tier-group-header';
            header.innerHTML = '<span class="arrow ' + (group.collapsed ? 'collapsed' : '') + '">&#9660;</span> ' + group.label;
            container.appendChild(header);

            var body = document.createElement('div');
            body.className = 'tier-group-body' + (group.collapsed ? ' collapsed' : '');
            container.appendChild(body);

            header.addEventListener('click', function () {
                body.classList.toggle('collapsed');
                header.querySelector('.arrow').classList.toggle('collapsed');
            });

            // Column headers (only for first group or when expanded)
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
            body.appendChild(gh);

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

    // --- Bulk Actions ---

    function setupBulkActions(panel, panelId) {
        panel.querySelector('.bulk-zero').addEventListener('click', function () {
            setAllCountsUniform(panelId, 0);
        });
        panel.querySelector('.bulk-default').addEventListener('click', function () {
            setAllCountsUniform(panelId, 1000);
        });
        panel.querySelector('.bulk-custom').addEventListener('click', function () {
            var val = parseInt(panel.querySelector('.bulk-custom-val').value) || 0;
            setAllCountsUniform(panelId, val);
        });
    }

    function setAllCountsUniform(panelId, val) {
        var inputs = document.querySelectorAll('input[data-panel="' + panelId + '"][data-type]');
        inputs.forEach(function (inp) { inp.value = val; });
    }

    function setAllCounts(panelId, counts) {
        var inputs = document.querySelectorAll('input[data-panel="' + panelId + '"][data-type]');
        inputs.forEach(function (inp) {
            var type = inp.dataset.type;
            var tier = parseInt(inp.dataset.tier);
            inp.value = (counts[type] && counts[type][tier] != null) ? counts[type][tier] : 0;
        });
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

    // --- Mirror ---

    function mirror(fromPanelId, toPanelId) {
        // Copy troop counts
        var fromInputs = document.querySelectorAll('input[data-panel="' + fromPanelId + '"][data-type]');
        fromInputs.forEach(function (inp) {
            var target = document.querySelector(
                'input[data-panel="' + toPanelId + '"][data-type="' + inp.dataset.type + '"][data-tier="' + inp.dataset.tier + '"]'
            );
            if (target) target.value = inp.value;
        });
        // Copy buffs
        var fromBuffs = document.querySelectorAll('input[data-panel="' + fromPanelId + '"][data-buff-type]');
        fromBuffs.forEach(function (inp) {
            var target = document.querySelector(
                'input[data-panel="' + toPanelId + '"][data-buff-type="' + inp.dataset.buffType + '"][data-buff-stat="' + inp.dataset.buffStat + '"]'
            );
            if (target) target.value = inp.value;
        });
    }

    return {
        init: init,
        getTroopCounts: getTroopCounts,
        getBuffs: getBuffs,
        mirror: mirror
    };
})();
