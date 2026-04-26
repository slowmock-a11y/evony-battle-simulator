var SetupPersistence = (function () {
    'use strict';

    const SCHEMA_VERSION = 1;

    const VALID_TYPES = ['GROUND', 'RANGED', 'MOUNTED', 'SIEGE'];
    const RANGE_BUFF_TYPES = { RANGED: true, SIEGE: true };
    const VALID_BUFF_STATS_BASE = ['atk', 'def', 'hp'];
    const VALID_BUFF_STATS_RANGE = ['range', 'rangeFlat'];
    const TIER_MIN = 1;
    const TIER_MAX = 16;
    const MAX_ROUNDS_MIN = 1;
    const MAX_ROUNDS_MAX = 1000;

    // Registry of fields added in each schema version > 1. Empty at v1.
    // When bumping SCHEMA_VERSION, list new field paths under the new version key
    // so files from older versions get a specific "Added since vN" warning.
    const FIELDS_ADDED_AT = {};

    let cachedFileHandle = null;
    let fallbackNoteShown = false;

    function fsaSupported() {
        return (typeof window !== 'undefined') &&
            typeof window.showOpenFilePicker === 'function' &&
            typeof window.showSaveFilePicker === 'function';
    }

    // ---------- Codec ----------

    function encode(setupObj) {
        return {
            schema: SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            name: typeof setupObj.name === 'string' ? setupObj.name : '',
            notes: typeof setupObj.notes === 'string' ? setupObj.notes : '',
            att: encodeSide(setupObj.att, false),
            def: encodeSide(setupObj.def, true),
            global: { maxRounds: clampMaxRounds(setupObj.global && setupObj.global.maxRounds) }
        };
    }

    function clampMaxRounds(n) {
        if (typeof n !== 'number' || !isFinite(n)) return 100;
        const v = Math.floor(n);
        if (v < MAX_ROUNDS_MIN) return MAX_ROUNDS_MIN;
        if (v > MAX_ROUNDS_MAX) return MAX_ROUNDS_MAX;
        return v;
    }

    function encodeSide(side, isDefender) {
        const out = { troops: {}, buffs: {} };
        if (!side) side = {};

        VALID_TYPES.forEach(function (type) {
            const tiers = (side.troops && side.troops[type]) || {};
            const compact = {};
            Object.keys(tiers).forEach(function (tierKey) {
                const v = tiers[tierKey];
                if (typeof v === 'number' && isFinite(v) && v > 0) {
                    compact[String(parseInt(tierKey, 10))] = Math.floor(v);
                }
            });
            if (hasKeys(compact)) out.troops[type] = compact;
        });

        VALID_TYPES.forEach(function (type) {
            const stats = (side.buffs && side.buffs[type]) || {};
            const compact = {};
            const allowed = VALID_BUFF_STATS_BASE.slice();
            if (RANGE_BUFF_TYPES[type]) Array.prototype.push.apply(allowed, VALID_BUFF_STATS_RANGE);
            allowed.forEach(function (stat) {
                const v = stats[stat];
                if (typeof v === 'number' && isFinite(v) && v !== 0) compact[stat] = v;
            });
            if (hasKeys(compact)) out.buffs[type] = compact;
        });

        if (typeof side.default === 'number' && isFinite(side.default)) {
            out.default = Math.max(0, Math.floor(side.default));
        } else {
            out.default = 0;
        }

        if (isDefender && side.archerTower) {
            const at = side.archerTower;
            const atk = numberOrZero(at.atk);
            const hp = numberOrZero(at.hp);
            const range = numberOrZero(at.range);
            if (atk > 0 || hp > 0 || range > 0) {
                out.archerTower = {
                    atk: atk,
                    hp: hp,
                    range: range,
                    phantomFire: !!at.phantomFire
                };
            }
        }

        return out;
    }

    function numberOrZero(v) {
        return (typeof v === 'number' && isFinite(v) && v >= 0) ? v : 0;
    }

    function hasKeys(obj) {
        for (const k in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, k)) return true;
        }
        return false;
    }

    function emptySide(isDefender) {
        const side = { troops: {}, buffs: {}, default: 0 };
        VALID_TYPES.forEach(function (t) {
            side.troops[t] = {};
            side.buffs[t] = { atk: 0, def: 0, hp: 0 };
            if (RANGE_BUFF_TYPES[t]) {
                side.buffs[t].range = 0;
                side.buffs[t].rangeFlat = 0;
            }
        });
        if (isDefender) side.archerTower = null;
        return side;
    }

    function decode(rawObj) {
        const warnings = [];
        const setup = {
            name: '',
            notes: '',
            att: emptySide(false),
            def: emptySide(true),
            global: { maxRounds: 100 }
        };

        if (!rawObj || typeof rawObj !== 'object' || Array.isArray(rawObj)) {
            warnings.push({ path: '(root)', reason: 'not an object' });
            return { setup: setup, warnings: warnings, fatal: true };
        }
        if (!rawObj.att && !rawObj.def) {
            warnings.push({ path: '(root)', reason: 'missing both att and def' });
            return { setup: setup, warnings: warnings, fatal: true };
        }

        const fileSchema = (typeof rawObj.schema === 'number' && isFinite(rawObj.schema))
            ? Math.floor(rawObj.schema) : null;
        if (fileSchema !== null && fileSchema !== SCHEMA_VERSION) {
            if (fileSchema < SCHEMA_VERSION) {
                const added = [];
                for (let v = fileSchema + 1; v <= SCHEMA_VERSION; v++) {
                    if (FIELDS_ADDED_AT[v]) Array.prototype.push.apply(added, FIELDS_ADDED_AT[v]);
                }
                if (added.length > 0) {
                    warnings.push({
                        path: '(schema)',
                        reason: 'Added since v' + fileSchema + ': ' + added.join(', ')
                    });
                }
            } else {
                const knownTop = ['schema', 'exportedAt', 'name', 'notes', 'att', 'def', 'global'];
                const unknown = Object.keys(rawObj).filter(function (k) {
                    return knownTop.indexOf(k) === -1;
                });
                warnings.push({
                    path: '(schema)',
                    reason: 'Ignored from v' + fileSchema + ': ' + (unknown.length ? unknown.join(', ') : '(no unknown top-level sections)')
                });
            }
        }

        if (typeof rawObj.name === 'string') setup.name = rawObj.name;
        else if ('name' in rawObj) warnings.push({ path: 'name', reason: 'not a string' });

        if (typeof rawObj.notes === 'string') setup.notes = rawObj.notes;
        else if ('notes' in rawObj) warnings.push({ path: 'notes', reason: 'not a string' });

        decodeSide(rawObj.att, setup.att, 'att', false, warnings);
        decodeSide(rawObj.def, setup.def, 'def', true, warnings);

        if (rawObj.global && typeof rawObj.global === 'object' && !Array.isArray(rawObj.global)) {
            const known = ['maxRounds'];
            Object.keys(rawObj.global).forEach(function (k) {
                if (known.indexOf(k) === -1) warnings.push({ path: 'global.' + k, reason: 'unknown key' });
            });
            if ('maxRounds' in rawObj.global) {
                const mr = rawObj.global.maxRounds;
                if (typeof mr === 'number' && isFinite(mr) && mr >= MAX_ROUNDS_MIN && mr <= MAX_ROUNDS_MAX) {
                    setup.global.maxRounds = Math.floor(mr);
                } else {
                    warnings.push({ path: 'global.maxRounds', reason: 'out of range ' + MAX_ROUNDS_MIN + '..' + MAX_ROUNDS_MAX });
                }
            }
        } else if ('global' in rawObj && rawObj.global !== undefined) {
            warnings.push({ path: 'global', reason: 'not an object' });
        }

        const knownTop = ['schema', 'exportedAt', 'name', 'notes', 'att', 'def', 'global'];
        Object.keys(rawObj).forEach(function (k) {
            if (knownTop.indexOf(k) === -1) warnings.push({ path: k, reason: 'unknown key' });
        });

        return { setup: setup, warnings: warnings, fatal: false };
    }

    function decodeSide(rawSide, outSide, sideKey, isDefender, warnings) {
        if (rawSide === undefined) return;
        if (!rawSide || typeof rawSide !== 'object' || Array.isArray(rawSide)) {
            warnings.push({ path: sideKey, reason: 'not an object' });
            return;
        }
        if ('troops' in rawSide) decodeTroops(rawSide.troops, outSide.troops, sideKey + '.troops', warnings);
        if ('buffs' in rawSide) decodeBuffs(rawSide.buffs, outSide.buffs, sideKey + '.buffs', warnings);
        if ('default' in rawSide) {
            const d = rawSide.default;
            if (typeof d === 'number' && isFinite(d) && d >= 0) {
                outSide.default = Math.floor(d);
            } else {
                warnings.push({ path: sideKey + '.default', reason: 'not a non-negative number' });
            }
        }
        if ('archerTower' in rawSide) {
            if (!isDefender) {
                warnings.push({ path: sideKey + '.archerTower', reason: 'unknown key' });
            } else {
                decodeArcherTower(rawSide.archerTower, outSide, sideKey + '.archerTower', warnings);
            }
        }
        const known = ['troops', 'buffs', 'default'];
        if (isDefender) known.push('archerTower');
        Object.keys(rawSide).forEach(function (k) {
            if (known.indexOf(k) === -1) warnings.push({ path: sideKey + '.' + k, reason: 'unknown key' });
        });
    }

    function decodeTroops(rawTroops, outTroops, basePath, warnings) {
        if (!rawTroops || typeof rawTroops !== 'object' || Array.isArray(rawTroops)) {
            warnings.push({ path: basePath, reason: 'not an object' });
            return;
        }
        Object.keys(rawTroops).forEach(function (type) {
            if (VALID_TYPES.indexOf(type) === -1) {
                warnings.push({ path: basePath + '.' + type, reason: 'unknown troop type' });
                return;
            }
            const rawTiers = rawTroops[type];
            if (!rawTiers || typeof rawTiers !== 'object' || Array.isArray(rawTiers)) {
                warnings.push({ path: basePath + '.' + type, reason: 'not an object' });
                return;
            }
            Object.keys(rawTiers).forEach(function (tierKey) {
                const tier = parseInt(tierKey, 10);
                if (!isFinite(tier) || tier < TIER_MIN || tier > TIER_MAX || String(tier) !== String(tierKey).replace(/^t/i, '')) {
                    warnings.push({ path: basePath + '.' + type + '.' + tierKey, reason: 'invalid tier' });
                    return;
                }
                const v = rawTiers[tierKey];
                if (typeof v === 'number' && isFinite(v) && v >= 0) {
                    outTroops[type][tier] = Math.floor(v);
                } else {
                    warnings.push({ path: basePath + '.' + type + '.' + tierKey, reason: 'not a non-negative integer' });
                }
            });
        });
    }

    function decodeBuffs(rawBuffs, outBuffs, basePath, warnings) {
        if (!rawBuffs || typeof rawBuffs !== 'object' || Array.isArray(rawBuffs)) {
            warnings.push({ path: basePath, reason: 'not an object' });
            return;
        }
        Object.keys(rawBuffs).forEach(function (type) {
            if (VALID_TYPES.indexOf(type) === -1) {
                warnings.push({ path: basePath + '.' + type, reason: 'unknown troop type' });
                return;
            }
            const rawStats = rawBuffs[type];
            if (!rawStats || typeof rawStats !== 'object' || Array.isArray(rawStats)) {
                warnings.push({ path: basePath + '.' + type, reason: 'not an object' });
                return;
            }
            const allowed = VALID_BUFF_STATS_BASE.slice();
            if (RANGE_BUFF_TYPES[type]) Array.prototype.push.apply(allowed, VALID_BUFF_STATS_RANGE);
            Object.keys(rawStats).forEach(function (stat) {
                if (allowed.indexOf(stat) === -1) {
                    warnings.push({ path: basePath + '.' + type + '.' + stat, reason: 'unknown buff stat' });
                    return;
                }
                const v = rawStats[stat];
                if (typeof v === 'number' && isFinite(v)) {
                    outBuffs[type][stat] = v;
                } else {
                    warnings.push({ path: basePath + '.' + type + '.' + stat, reason: 'not a number' });
                }
            });
        });
    }

    function decodeArcherTower(raw, outSide, basePath, warnings) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            warnings.push({ path: basePath, reason: 'not an object' });
            return;
        }
        const at = { atk: 0, hp: 0, range: 0, phantomFire: false };
        ['atk', 'hp', 'range'].forEach(function (k) {
            if (k in raw) {
                const v = raw[k];
                if (typeof v === 'number' && isFinite(v) && v >= 0) {
                    at[k] = v;
                } else {
                    warnings.push({ path: basePath + '.' + k, reason: 'not a non-negative number' });
                }
            }
        });
        if ('phantomFire' in raw) {
            if (typeof raw.phantomFire === 'boolean') {
                at.phantomFire = raw.phantomFire;
            } else {
                warnings.push({ path: basePath + '.phantomFire', reason: 'not a boolean' });
            }
        }
        const known = ['atk', 'hp', 'range', 'phantomFire'];
        Object.keys(raw).forEach(function (k) {
            if (known.indexOf(k) === -1) warnings.push({ path: basePath + '.' + k, reason: 'unknown key' });
        });
        outSide.archerTower = at;
    }

    function serialize(setupObj) {
        return JSON.stringify(setupObj, null, 2) + '\n';
    }

    function parse(text) {
        try {
            return { ok: true, value: JSON.parse(text) };
        } catch (e) {
            return { ok: false, error: e && e.message ? e.message : String(e) };
        }
    }

    function sanitizeFilename(name) {
        if (typeof name !== 'string') name = '';
        const replaced = name.replace(/[\/\\:*?"<>|]/g, '-');
        const collapsed = replaced.replace(/\s+/g, '-').replace(/-+/g, '-');
        const trimmed = collapsed.replace(/^-+|-+$/g, '');
        return trimmed || 'setup';
    }

    // ---------- DOM bridge ----------

    function getSetupObject() {
        const nameEl = document.getElementById('setup-name');
        const notesEl = document.getElementById('setup-notes');
        const mrEl = document.getElementById('max-rounds');
        return {
            name: nameEl ? nameEl.value || '' : '',
            notes: notesEl ? notesEl.value || '' : '',
            att: getSideObject('attacker-panel', false),
            def: getSideObject('defender-panel', true),
            global: { maxRounds: mrEl ? (parseInt(mrEl.value, 10) || 100) : 100 }
        };
    }

    function getSideObject(panelId, isDefender) {
        const side = {
            troops: ArmyConfig.getTroopCounts(panelId),
            buffs: ArmyConfig.getBuffs(panelId),
            default: ArmyConfig.getDefaultCount(panelId)
        };
        if (isDefender) side.archerTower = ArmyConfig.getArcherTower(panelId);
        return side;
    }

    function applySetupObject(setupObj) {
        const nameEl = document.getElementById('setup-name');
        const notesEl = document.getElementById('setup-notes');
        const mrEl = document.getElementById('max-rounds');
        if (nameEl) nameEl.value = setupObj.name || '';
        if (notesEl) notesEl.value = setupObj.notes || '';
        if (mrEl) mrEl.value = String(setupObj.global.maxRounds);
        applySide('attacker-panel', setupObj.att, false);
        applySide('defender-panel', setupObj.def, true);
    }

    function applySide(panelId, side, isDefender) {
        ArmyConfig.setTroopCounts(panelId, side.troops);
        ArmyConfig.setBuffs(panelId, side.buffs);
        ArmyConfig.setDefaultCount(panelId, side.default);
        if (isDefender) {
            const at = side.archerTower || { atk: 0, hp: 0, range: 0, phantomFire: false };
            ArmyConfig.setArcherTower(panelId, at);
        }
    }

    // ---------- UI flows ----------

    function exportToFile() {
        const setupObj = getSetupObject();
        const encoded = encode(setupObj);
        const text = serialize(encoded);
        const filename = 'setup-' + sanitizeFilename(setupObj.name) + '.json';
        if (fsaSupported()) {
            saveViaFsa(text, filename);
        } else {
            saveViaDownload(text, filename);
            showFallbackNoteOnce();
        }
    }

    function saveViaFsa(text, suggestedName) {
        const writeOne = function (handle) {
            return handle.createWritable().then(function (writable) {
                return writable.write(text).then(function () { return writable.close(); });
            });
        };
        if (cachedFileHandle) {
            writeOne(cachedFileHandle).catch(function (e) {
                if (e && e.name === 'AbortError') return;
                renderWarnings([{ path: '(save)', reason: e && e.message ? e.message : String(e) }]);
            });
            return;
        }
        window.showSaveFilePicker({
            suggestedName: suggestedName,
            types: [{ description: 'Setup JSON', accept: { 'application/json': ['.json'] } }]
        }).then(function (handle) {
            cachedFileHandle = handle;
            return writeOne(handle);
        }).catch(function (e) {
            if (e && e.name === 'AbortError') return;
            renderWarnings([{ path: '(save)', reason: e && e.message ? e.message : String(e) }]);
        });
    }

    function saveViaDownload(text, filename) {
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function loadFromFile() {
        if (fsaSupported()) {
            loadViaFsa();
        } else {
            const fb = document.getElementById('setup-file-fallback');
            if (fb) fb.click();
        }
    }

    function loadViaFsa() {
        window.showOpenFilePicker({
            types: [{ description: 'Setup JSON', accept: { 'application/json': ['.json'] } }],
            multiple: false
        }).then(function (handles) {
            const handle = handles[0];
            cachedFileHandle = handle;
            return handle.getFile();
        }).then(function (file) {
            return importFromFile(file);
        }).catch(function (e) {
            if (e && e.name === 'AbortError') return;
            renderWarnings([{ path: '(load)', reason: e && e.message ? e.message : String(e) }]);
        });
    }

    function importFromFile(file) {
        return file.text().then(function (text) {
            const parsed = parse(text);
            if (!parsed.ok) {
                renderWarnings([{ path: '(parse)', reason: parsed.error }]);
                return;
            }
            const result = decode(parsed.value);
            if (result.fatal) {
                renderWarnings(result.warnings);
                return;
            }
            applySetupObject(result.setup);
            renderWarnings(result.warnings);
        });
    }

    // ---------- Warning banner ----------

    function renderWarnings(warnings) {
        const banner = document.getElementById('setup-warning');
        if (!banner) return;
        if (!warnings || warnings.length === 0) {
            banner.style.display = 'none';
            banner.innerHTML = '';
            return;
        }
        const items = warnings.map(function (w) {
            return '<li><code>' + escapeHtml(w.path) + '</code>: ' + escapeHtml(w.reason) + '</li>';
        }).join('');
        banner.innerHTML =
            '<button type="button" class="setup-warning-close" aria-label="Dismiss">&times;</button>' +
            '<strong>Imported with warnings.</strong>' +
            '<ul>' + items + '</ul>';
        banner.style.display = 'block';
        const close = banner.querySelector('.setup-warning-close');
        if (close) {
            close.addEventListener('click', function () {
                banner.style.display = 'none';
                banner.innerHTML = '';
            });
        }
    }

    function showFallbackNoteOnce() {
        if (fallbackNoteShown) return;
        fallbackNoteShown = true;
        const note = document.getElementById('setup-fallback-note');
        if (note) note.style.display = 'block';
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ---------- Init ----------

    function init() {
        const loadBtn = document.getElementById('setup-load');
        const saveBtn = document.getElementById('setup-save');
        const fileFallback = document.getElementById('setup-file-fallback');
        if (!loadBtn || !saveBtn) return;

        if (!fsaSupported()) {
            loadBtn.textContent = 'Upload';
            saveBtn.textContent = 'Download';
        }

        loadBtn.addEventListener('click', loadFromFile);
        saveBtn.addEventListener('click', exportToFile);

        if (fileFallback) {
            fileFallback.addEventListener('change', function () {
                const f = fileFallback.files && fileFallback.files[0];
                if (!f) return;
                importFromFile(f).then(function () { fileFallback.value = ''; });
            });
        }
    }

    return {
        init: init,
        SCHEMA_VERSION: SCHEMA_VERSION,
        encode: encode,
        decode: decode,
        serialize: serialize,
        parse: parse,
        sanitizeFilename: sanitizeFilename,
        getSetupObject: getSetupObject,
        applySetupObject: applySetupObject,
        importFromFile: importFromFile
    };
})();
