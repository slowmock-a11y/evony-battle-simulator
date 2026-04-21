describe('Generals dataset schema', function () {

    const VALID_TROOP_TYPES = ['GROUND', 'RANGED', 'MOUNTED', 'SIEGE', 'SUB_CITY', 'DUTY', 'WALL'];
    const BUFF_TROOP_KEYS = ['mounted', 'ground', 'ranged', 'siege'];
    const BUFF_STAT_KEYS = ['atk', 'def', 'hp'];

    function assertBuffObject(e, key, buffs) {
        if (buffs === null || buffs === undefined) return;
        if (typeof buffs !== 'object') {
            throw new Error('entry ' + e.name + ' has non-object ' + key + ': ' + JSON.stringify(buffs));
        }
        for (let i = 0; i < BUFF_TROOP_KEYS.length; i++) {
            const t = BUFF_TROOP_KEYS[i];
            const group = buffs[t];
            if (!group || typeof group !== 'object') {
                throw new Error('entry ' + e.name + ' missing troop-type group ' + t + ' in ' + key);
            }
            for (let j = 0; j < BUFF_STAT_KEYS.length; j++) {
                const s = BUFF_STAT_KEYS[j];
                if (typeof group[s] !== 'number' || isNaN(group[s])) {
                    throw new Error('entry ' + e.name + ' has non-numeric ' + key + '.' + t + '.' + s + ': ' + JSON.stringify(group[s]));
                }
            }
        }
    }

    const data = GENERALS_DATA;

    it('is a non-empty array', function () {
        assert.truthy(Array.isArray(data), 'top-level is array');
        assert.greaterThan(data.length, 0, 'has entries');
    });

    it('every entry has a non-empty string name', function () {
        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            if (typeof e.name !== 'string' || e.name.length === 0) {
                throw new Error('entry ' + i + ' has invalid name: ' + JSON.stringify(e.name));
            }
        }
    });

    it('every entry has a recognised troop_type', function () {
        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            if (VALID_TROOP_TYPES.indexOf(e.troop_type) === -1) {
                throw new Error('entry ' + i + ' (' + e.name + ') has invalid troop_type: ' + JSON.stringify(e.troop_type));
            }
        }
    });

    it('combat-entry main skill buff percentages are numeric or null', function () {
        const combatTypes = ['GROUND', 'RANGED', 'MOUNTED', 'SIEGE'];
        const required = ['main_skill_atk_pct', 'main_skill_def_pct', 'main_skill_hp_pct', 'main_skill_march_size_pct'];
        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            if (combatTypes.indexOf(e.troop_type) === -1) continue;
            for (let k = 0; k < required.length; k++) {
                const key = required[k];
                const v = e[key];
                if (v === null || v === undefined) continue;
                if (typeof v !== 'number' || isNaN(v)) {
                    throw new Error('entry ' + i + ' (' + e.name + ') has non-numeric ' + key + ': ' + JSON.stringify(v));
                }
            }
        }
    });

    it('non-combat entries have null main skill buff percentages', function () {
        const nonCombatTypes = ['SUB_CITY', 'DUTY'];
        const skillKeys = ['main_skill_atk_pct', 'main_skill_def_pct', 'main_skill_hp_pct', 'main_skill_march_size_pct'];
        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            if (nonCombatTypes.indexOf(e.troop_type) === -1) continue;
            for (let k = 0; k < skillKeys.length; k++) {
                const key = skillKeys[k];
                if (e[key] !== null && e[key] !== undefined) {
                    if (typeof e[key] !== 'number') {
                        throw new Error('entry ' + i + ' (' + e.name + ') has non-null-non-number ' + key + ': ' + JSON.stringify(e[key]));
                    }
                }
            }
        }
    });

    it('runestone_discount values are in the allowed set when present', function () {
        const allowed = ['runestone', 'runestone_blood'];
        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            if (e.runestone_discount === undefined || e.runestone_discount === null) continue;
            if (allowed.indexOf(e.runestone_discount) === -1) {
                throw new Error('entry ' + i + ' (' + e.name + ') has invalid runestone_discount: ' + JSON.stringify(e.runestone_discount));
            }
        }
    });

    it('troop_type distribution covers all categories', function () {
        const seen = {};
        data.forEach(function (e) { seen[e.troop_type] = true; });
        VALID_TROOP_TYPES.forEach(function (t) {
            assert.truthy(seen[t], 'at least one entry with troop_type ' + t);
        });
    });

    it('sub_city_buffs, when present, has the full 4x3 troop-type/stat shape', function () {
        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            if (e.sub_city_buffs !== undefined) assertBuffObject(e, 'sub_city_buffs', e.sub_city_buffs);
        }
    });

    it('SUB_CITY entries have sub_city_buffs populated', function () {
        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            if (e.troop_type !== 'SUB_CITY') continue;
            if (!e.sub_city_buffs) {
                throw new Error('entry ' + e.name + ' (SUB_CITY) missing sub_city_buffs');
            }
        }
    });

    it('sub_city_debuffs, when present, has the four troop-type keys as numbers', function () {
        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            if (e.sub_city_debuffs === undefined) continue;
            for (let j = 0; j < BUFF_TROOP_KEYS.length; j++) {
                const t = BUFF_TROOP_KEYS[j];
                if (typeof e.sub_city_debuffs[t] !== 'number' || isNaN(e.sub_city_debuffs[t])) {
                    throw new Error('entry ' + e.name + ' has non-numeric sub_city_debuffs.' + t);
                }
            }
        }
    });

    it('wall_buffs, when present, has the full 4x3 troop-type/stat shape', function () {
        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            if (e.wall_buffs !== undefined) assertBuffObject(e, 'wall_buffs', e.wall_buffs);
        }
    });

    it('WALL entries have wall_buffs populated', function () {
        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            if (e.troop_type !== 'WALL') continue;
            if (!e.wall_buffs) {
                throw new Error('entry ' + e.name + ' (WALL) missing wall_buffs');
            }
        }
    });

    it('covenants, when present, is a non-empty array of strings', function () {
        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            if (e.covenants === undefined) continue;
            if (!Array.isArray(e.covenants) || e.covenants.length === 0) {
                throw new Error('entry ' + e.name + ' has invalid covenants: ' + JSON.stringify(e.covenants));
            }
            for (let j = 0; j < e.covenants.length; j++) {
                if (typeof e.covenants[j] !== 'string' || e.covenants[j].length === 0) {
                    throw new Error('entry ' + e.name + ' has invalid covenant name at index ' + j);
                }
            }
        }
    });
});
