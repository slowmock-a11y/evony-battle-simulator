var ArmyConfig = (function () {
    'use strict';

    const TYPE_KEYS = ['GROUND', 'RANGED', 'MOUNTED', 'SIEGE'];
    const TIER_GROUPS = [
        { label: 'High Tiers (T16–T10)', tiers: [16, 15, 14, 13, 12, 11, 10] },
        { label: 'Mid Tiers (T9–T5)',    tiers: [9, 8, 7, 6, 5] },
        { label: 'Low Tiers (T4–T1)',    tiers: [4, 3, 2, 1] }
    ];

    function init(panelId) {
        const buffSection = document.querySelector(`.buff-section[data-for="${panelId}"]`);
        const gridSection = document.querySelector(`.troop-grid[data-for="${panelId}"]`);

        buildBuffInputs(buffSection, panelId);
        buildTroopGrid(gridSection, panelId);
    }

    // --- Buff Inputs ---

    const RANGE_BUFF_TYPES = new Set(['RANGED', 'SIEGE']);

    function buildBuffInputs(container, panelId) {
        TYPE_KEYS.forEach((type) => {
            const info = TroopData.TYPES[type];
            const rangeField = RANGE_BUFF_TYPES.has(type)
                ? `<span class="buff-stat-label">Range</span>
                   <input type="number" value="0" data-panel="${panelId}" data-buff-type="${type}" data-buff-stat="range" />%
                   <input type="number" value="0" data-panel="${panelId}" data-buff-type="${type}" data-buff-stat="rangeFlat" title="Flat range bonus (added after %)" />`
                : '';
            const row = document.createElement('div');
            row.className = 'buff-row';
            row.innerHTML = `
                <span class="buff-label ${info.colorClass}">${info.name}</span>
                <span class="buff-stat-label">ATK</span>
                <input type="number" value="1500" data-panel="${panelId}" data-buff-type="${type}" data-buff-stat="atk" />%
                <span class="buff-stat-label">DEF</span>
                <input type="number" value="1500" data-panel="${panelId}" data-buff-type="${type}" data-buff-stat="def" />%
                <span class="buff-stat-label">HP</span>
                <input type="number" value="1500" data-panel="${panelId}" data-buff-type="${type}" data-buff-stat="hp" />%
                ${rangeField}
            `;
            container.appendChild(row);
        });

        // Defender-only Archer Tower row: three absolute-value inputs + phantom-fire toggle.
        // The data-archer-stat namespace keeps these out of getBuffs's [data-buff-type] selector.
        if (panelId === 'defender-panel') {
            const atInfo = TroopData.TYPES.ARCHER_TOWER;
            const row = document.createElement('div');
            row.className = 'buff-row archer-tower-row';
            row.innerHTML = `
                <span class="buff-label ${atInfo.colorClass}">${atInfo.name} <span class="absolute-cue">(absolute)</span></span>
                <span class="buff-stat-label">ATK</span>
                <input type="number" min="0" value="0" data-panel="${panelId}" data-archer-stat="atk" />
                <span class="buff-stat-label">HP</span>
                <input type="number" min="0" value="0" data-panel="${panelId}" data-archer-stat="hp" />
                <span class="buff-stat-label">Range</span>
                <input type="number" min="0" value="0" data-panel="${panelId}" data-archer-stat="range" />
                <label class="archer-phantom-toggle" title="Fires one final volley on the round it dies">
                    <input type="checkbox" data-panel="${panelId}" data-archer-stat="phantomFire" />
                    Attack after death
                </label>
            `;
            container.appendChild(row);
        }
    }

    // --- Troop Grid ---

    function buildTroopGrid(container, panelId) {
        const controlsRow = document.createElement('div');
        controlsRow.className = 'grid-controls';

        const label = document.createElement('label');
        label.className = 'grid-controls-label';
        label.textContent = 'Count';
        controlsRow.appendChild(label);

        const defaultInput = document.createElement('input');
        defaultInput.type = 'number';
        defaultInput.className = 'default-count-input';
        defaultInput.min = '0';
        defaultInput.value = '1000';
        defaultInput.dataset.panel = panelId;
        controlsRow.appendChild(defaultInput);

        const setBtn = document.createElement('button');
        setBtn.className = 'btn btn-sm';
        setBtn.textContent = 'Set Default';
        setBtn.addEventListener('click', () => {
            const val = parseInt(defaultInput.value, 10) || 0;
            setAllCountsUniform(panelId, val);
        });
        controlsRow.appendChild(setBtn);

        const clearBtn = document.createElement('button');
        clearBtn.className = 'btn btn-sm';
        clearBtn.textContent = 'Clear All';
        clearBtn.addEventListener('click', () => {
            setAllCountsUniform(panelId, 0);
        });
        controlsRow.appendChild(clearBtn);

        container.appendChild(controlsRow);

        const gh = document.createElement('div');
        gh.className = 'grid-header';
        gh.innerHTML = '<span></span>';
        TYPE_KEYS.forEach((type) => {
            const info = TroopData.TYPES[type];
            const span = document.createElement('span');
            span.className = info.colorClass;
            span.title = `Click to set all ${info.name}`;
            span.addEventListener('click', () => {
                const val = prompt(`Set all ${info.name} tiers to:`, '0');
                if (val !== null) setColumnValue(panelId, type, parseInt(val, 10) || 0);
            });

            const letter = document.createElement('span');
            letter.textContent = info.name.charAt(0); // G, R, M, S
            span.appendChild(letter);

            const clr = document.createElement('span');
            clr.className = 'clear-col-btn';
            clr.textContent = '×';
            clr.title = `Clear all ${info.name}`;
            clr.addEventListener('click', (e) => {
                e.stopPropagation();
                setColumnValue(panelId, type, 0);
            });
            span.appendChild(clr);

            gh.appendChild(span);
        });
        container.appendChild(gh);

        TIER_GROUPS.forEach((group, gi) => {
            const body = document.createElement('div');
            body.className = 'tier-group-body';
            if (gi > 0) body.style.marginTop = '0.5rem';
            container.appendChild(body);

            group.tiers.forEach((tier) => {
                const row = document.createElement('div');
                row.className = 'grid-row';

                const tierLabel = document.createElement('span');
                tierLabel.className = 'tier-label';
                tierLabel.textContent = `T${tier}`;
                tierLabel.title = `Click to set all T${tier}`;
                tierLabel.addEventListener('click', () => {
                    const val = prompt(`Set all types for T${tier} to:`, '0');
                    if (val !== null) setRowValue(panelId, tier, parseInt(val, 10) || 0);
                });
                row.appendChild(tierLabel);

                TYPE_KEYS.forEach((type) => {
                    const input = document.createElement('input');
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
        document.querySelectorAll(`input[data-panel="${panelId}"][data-type]`).forEach((inp) => {
            inp.value = val;
        });
    }

    function setColumnValue(panelId, type, val) {
        document.querySelectorAll(`input[data-panel="${panelId}"][data-type="${type}"]`).forEach((inp) => {
            inp.value = val;
        });
    }

    function setRowValue(panelId, tier, val) {
        document.querySelectorAll(`input[data-panel="${panelId}"][data-tier="${tier}"]`).forEach((inp) => {
            inp.value = val;
        });
    }

    // --- Read Values ---

    function getTroopCounts(panelId) {
        const counts = {};
        TYPE_KEYS.forEach((t) => { counts[t] = {}; });
        document.querySelectorAll(`input[data-panel="${panelId}"][data-type]`).forEach((inp) => {
            const type = inp.dataset.type;
            const tier = parseInt(inp.dataset.tier, 10);
            const val = parseInt(inp.value, 10) || 0;
            counts[type][tier] = Math.max(0, val);
        });
        return counts;
    }

    function getBuffs(panelId) {
        const buffs = {};
        TYPE_KEYS.forEach((t) => {
            buffs[t] = { atk: 0, def: 0, hp: 0 };
            if (RANGE_BUFF_TYPES.has(t)) { buffs[t].range = 0; buffs[t].rangeFlat = 0; }
        });
        document.querySelectorAll(`input[data-panel="${panelId}"][data-buff-type]`).forEach((inp) => {
            buffs[inp.dataset.buffType][inp.dataset.buffStat] = parseFloat(inp.value) || 0;
        });
        return buffs;
    }

    function getArcherTower(panelId) {
        if (panelId !== 'defender-panel') return null;
        function readNum(stat) {
            const el = document.querySelector(`input[data-panel="${panelId}"][data-archer-stat="${stat}"]`);
            return el ? (parseFloat(el.value) || 0) : 0;
        }
        const atk = readNum('atk');
        const hp = readNum('hp');
        const range = readNum('range');
        if (atk <= 0 && hp <= 0 && range <= 0) return null;
        const phantomEl = document.querySelector(`input[data-panel="${panelId}"][data-archer-stat="phantomFire"]`);
        return { atk: atk, hp: hp, range: range, phantomFire: phantomEl ? phantomEl.checked : false };
    }

    function getDefaultCount(panelId) {
        const inp = document.querySelector(`.default-count-input[data-panel="${panelId}"]`);
        if (!inp) return 0;
        const v = parseInt(inp.value, 10);
        return (isNaN(v) || v < 0) ? 0 : v;
    }

    // --- Write Values ---

    function setTroopCounts(panelId, counts) {
        document.querySelectorAll(`input[data-panel="${panelId}"][data-type]`).forEach((inp) => {
            const type = inp.dataset.type;
            const tier = parseInt(inp.dataset.tier, 10);
            const v = counts && counts[type] && typeof counts[type][tier] === 'number' ? counts[type][tier] : 0;
            inp.value = String(Math.max(0, Math.floor(v)));
        });
    }

    function setBuffs(panelId, buffs) {
        document.querySelectorAll(`input[data-panel="${panelId}"][data-buff-type]`).forEach((inp) => {
            const type = inp.dataset.buffType;
            const stat = inp.dataset.buffStat;
            const v = (buffs && buffs[type] && typeof buffs[type][stat] === 'number') ? buffs[type][stat] : 0;
            inp.value = String(v);
        });
    }

    function setArcherTower(panelId, archer) {
        if (panelId !== 'defender-panel') return;
        const a = archer || { atk: 0, hp: 0, range: 0, phantomFire: false };
        ['atk', 'hp', 'range'].forEach((stat) => {
            const el = document.querySelector(`input[data-panel="${panelId}"][data-archer-stat="${stat}"]`);
            if (el) el.value = String(Math.max(0, parseFloat(a[stat]) || 0));
        });
        const phantomEl = document.querySelector(`input[data-panel="${panelId}"][data-archer-stat="phantomFire"]`);
        if (phantomEl) phantomEl.checked = !!a.phantomFire;
    }

    function setDefaultCount(panelId, value) {
        const inp = document.querySelector(`.default-count-input[data-panel="${panelId}"]`);
        if (!inp) return;
        const v = parseInt(value, 10);
        inp.value = String(isNaN(v) || v < 0 ? 0 : v);
    }

    return {
        init: init,
        getTroopCounts: getTroopCounts,
        getBuffs: getBuffs,
        getArcherTower: getArcherTower,
        getDefaultCount: getDefaultCount,
        setTroopCounts: setTroopCounts,
        setBuffs: setBuffs,
        setArcherTower: setArcherTower,
        setDefaultCount: setDefaultCount
    };
})();
