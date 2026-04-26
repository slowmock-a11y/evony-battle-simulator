describe('SetupPersistence — sanitizeFilename', function () {

    it('replaces spaces with single dashes', function () {
        assert.equal(SetupPersistence.sanitizeFilename('Anti-Cav v3'), 'Anti-Cav-v3');
    });

    it('replaces disallowed characters with dashes', function () {
        assert.equal(SetupPersistence.sanitizeFilename('foo/bar:baz'), 'foo-bar-baz');
    });

    it('collapses runs of disallowed/whitespace characters', function () {
        assert.equal(SetupPersistence.sanitizeFilename('a   b'), 'a-b');
        assert.equal(SetupPersistence.sanitizeFilename('a/// b'), 'a-b');
    });

    it('falls back to "setup" for empty or all-disallowed names', function () {
        assert.equal(SetupPersistence.sanitizeFilename(''), 'setup');
        assert.equal(SetupPersistence.sanitizeFilename('   '), 'setup');
        assert.equal(SetupPersistence.sanitizeFilename('////'), 'setup');
        assert.equal(SetupPersistence.sanitizeFilename(null), 'setup');
        assert.equal(SetupPersistence.sanitizeFilename(undefined), 'setup');
    });

    it('trims leading and trailing dashes after replacement', function () {
        assert.equal(SetupPersistence.sanitizeFilename(' foo '), 'foo');
        assert.equal(SetupPersistence.sanitizeFilename('/foo/'), 'foo');
    });

});

describe('SetupPersistence — encode (sparse)', function () {

    function fullSetup(overrides) {
        const base = {
            name: 'Test',
            notes: 'hello',
            att: {
                troops: { GROUND: {}, RANGED: {}, MOUNTED: {}, SIEGE: {} },
                buffs: {
                    GROUND:  { atk: 0, def: 0, hp: 0 },
                    RANGED:  { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 },
                    MOUNTED: { atk: 0, def: 0, hp: 0 },
                    SIEGE:   { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 }
                },
                default: 1000
            },
            def: {
                troops: { GROUND: {}, RANGED: {}, MOUNTED: {}, SIEGE: {} },
                buffs: {
                    GROUND:  { atk: 0, def: 0, hp: 0 },
                    RANGED:  { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 },
                    MOUNTED: { atk: 0, def: 0, hp: 0 },
                    SIEGE:   { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 }
                },
                default: 1000,
                archerTower: null
            },
            global: { maxRounds: 100 }
        };
        if (overrides) {
            if (overrides.att) Object.assign(base.att, overrides.att);
            if (overrides.def) Object.assign(base.def, overrides.def);
            if (overrides.global) Object.assign(base.global, overrides.global);
            if (overrides.name) base.name = overrides.name;
        }
        return base;
    }

    it('zero troop counts are omitted', function () {
        const setup = fullSetup();
        setup.att.troops.RANGED[12] = 1000;
        const enc = SetupPersistence.encode(setup);
        assert.truthy(enc.att.troops.RANGED, 'RANGED present');
        assert.equal(enc.att.troops.RANGED['12'], 1000);
        assert.equal(enc.att.troops.GROUND, undefined, 'GROUND with no counts omitted');
        assert.equal(enc.att.troops.MOUNTED, undefined);
        assert.equal(enc.att.troops.SIEGE, undefined);
    });

    it('zero buff stats are omitted, type omitted if all zero', function () {
        const setup = fullSetup();
        setup.att.buffs.RANGED.atk = 1500;
        const enc = SetupPersistence.encode(setup);
        assert.equal(enc.att.buffs.RANGED.atk, 1500);
        assert.equal(enc.att.buffs.RANGED.def, undefined, 'zero def stat omitted');
        assert.equal(enc.att.buffs.GROUND, undefined, 'all-zero type omitted');
    });

    it('range/rangeFlat only emitted for RANGED and SIEGE', function () {
        const setup = fullSetup();
        setup.att.buffs.RANGED.range = 200;
        setup.att.buffs.SIEGE.rangeFlat = 50;
        const enc = SetupPersistence.encode(setup);
        assert.equal(enc.att.buffs.RANGED.range, 200);
        assert.equal(enc.att.buffs.SIEGE.rangeFlat, 50);
    });

    it('archerTower omitted when all zero, even on defender', function () {
        const setup = fullSetup();
        setup.def.archerTower = { atk: 0, hp: 0, range: 0, phantomFire: false };
        const enc = SetupPersistence.encode(setup);
        assert.equal(enc.def.archerTower, undefined);
    });

    it('archerTower present when any of atk/hp/range > 0', function () {
        const setup = fullSetup();
        setup.def.archerTower = { atk: 5000000, hp: 0, range: 0, phantomFire: true };
        const enc = SetupPersistence.encode(setup);
        assert.truthy(enc.def.archerTower);
        assert.equal(enc.def.archerTower.atk, 5000000);
        assert.equal(enc.def.archerTower.phantomFire, true);
    });

    it('schema and exportedAt populated', function () {
        const enc = SetupPersistence.encode(fullSetup());
        assert.equal(enc.schema, SetupPersistence.SCHEMA_VERSION);
        assert.truthy(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(enc.exportedAt), 'ISO 8601 UTC');
    });

    it('maxRounds clamps to 1..1000', function () {
        const tooHigh = SetupPersistence.encode(fullSetup({ global: { maxRounds: 5000 } }));
        assert.equal(tooHigh.global.maxRounds, 1000);
        const tooLow = SetupPersistence.encode(fullSetup({ global: { maxRounds: 0 } }));
        assert.equal(tooLow.global.maxRounds, 1);
    });

});

describe('SetupPersistence — decode', function () {

    it('missing key in troops decodes as 0 implicitly', function () {
        const r = SetupPersistence.decode({
            schema: 1, att: { troops: { GROUND: { '13': 50000 } }, buffs: {}, default: 0 }, def: {}
        });
        assert.equal(r.fatal, false);
        assert.equal(r.setup.att.troops.GROUND[13], 50000);
        assert.equal(r.setup.att.troops.GROUND[12], undefined);
        assert.equal(r.setup.att.troops.RANGED[13], undefined);
    });

    it('non-numeric buff value is skipped and reported', function () {
        const r = SetupPersistence.decode({
            schema: 1,
            att: { troops: {}, buffs: { GROUND: { atk: 'abc' } } },
            def: {}
        });
        assert.equal(r.fatal, false);
        assert.equal(r.setup.att.buffs.GROUND.atk, 0);
        const found = r.warnings.find(function (w) { return w.path === 'att.buffs.GROUND.atk'; });
        assert.truthy(found, 'warning emitted');
    });

    it('unknown top-level key is reported as warning, not fatal', function () {
        const r = SetupPersistence.decode({
            schema: 1, foo: 42, att: { troops: {}, buffs: {} }, def: {}
        });
        assert.equal(r.fatal, false);
        const found = r.warnings.find(function (w) { return w.path === 'foo' && /unknown key/.test(w.reason); });
        assert.truthy(found);
    });

    it('unknown side-level key is reported', function () {
        const r = SetupPersistence.decode({
            schema: 1, att: { foo: 'bar', troops: {}, buffs: {} }, def: {}
        });
        const found = r.warnings.find(function (w) { return w.path === 'att.foo' && /unknown key/.test(w.reason); });
        assert.truthy(found);
    });

    it('unknown troop type is reported', function () {
        const r = SetupPersistence.decode({
            schema: 1, att: { troops: { ZOMBIE: { '12': 100 } }, buffs: {} }, def: {}
        });
        const found = r.warnings.find(function (w) { return w.path === 'att.troops.ZOMBIE' && /unknown troop type/.test(w.reason); });
        assert.truthy(found);
    });

    it('archerTower on attacker side is unknown key', function () {
        const r = SetupPersistence.decode({
            schema: 1,
            att: { troops: {}, buffs: {}, archerTower: { atk: 100, hp: 100, range: 100 } },
            def: {}
        });
        const found = r.warnings.find(function (w) { return w.path === 'att.archerTower' && /unknown key/.test(w.reason); });
        assert.truthy(found);
    });

    it('archerTower on defender preserved through decode', function () {
        const r = SetupPersistence.decode({
            schema: 1,
            att: {},
            def: { troops: {}, buffs: {}, archerTower: { atk: 5000000, hp: 8000000, range: 12, phantomFire: true } }
        });
        assert.equal(r.fatal, false);
        assert.equal(r.setup.def.archerTower.atk, 5000000);
        assert.equal(r.setup.def.archerTower.phantomFire, true);
    });

    it('out-of-range maxRounds is skipped', function () {
        const r = SetupPersistence.decode({
            schema: 1, att: {}, def: {}, global: { maxRounds: 99999 }
        });
        const found = r.warnings.find(function (w) { return w.path === 'global.maxRounds'; });
        assert.truthy(found);
        assert.equal(r.setup.global.maxRounds, 100);
    });

    it('non-object root is fatal', function () {
        const r = SetupPersistence.decode(null);
        assert.equal(r.fatal, true);
    });

    it('missing both att and def is fatal', function () {
        const r = SetupPersistence.decode({ schema: 1 });
        assert.equal(r.fatal, true);
    });

    it('schema higher than current emits "Ignored from vN" warning', function () {
        const r = SetupPersistence.decode({
            schema: 999, covenants: [], att: {}, def: {}
        });
        const found = r.warnings.find(function (w) { return /Ignored from v999/.test(w.reason); });
        assert.truthy(found);
    });

    it('schema lower than current with empty registry emits no diff warning', function () {
        const r = SetupPersistence.decode({ schema: 0, att: {}, def: {} });
        const found = r.warnings.find(function (w) { return /Added since/.test(w.reason); });
        assert.falsy(found, 'no fields tracked yet for v1, so no "added since" warning');
    });

    it('round-trip preserves a full setup (encode → serialize → parse → decode)', function () {
        const original = {
            name: 'Roundtrip',
            notes: 'test',
            att: {
                troops: { GROUND: {}, RANGED: { 12: 100000, 13: 200000 }, MOUNTED: {}, SIEGE: {} },
                buffs: {
                    GROUND:  { atk: 1500, def: 1500, hp: 1500 },
                    RANGED:  { atk: 2200, def: 1500, hp: 1500, range: 0, rangeFlat: 50 },
                    MOUNTED: { atk: 0, def: 0, hp: 0 },
                    SIEGE:   { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 }
                },
                default: 1000
            },
            def: {
                troops: { GROUND: { 13: 500000 }, RANGED: {}, MOUNTED: {}, SIEGE: { 12: 100000 } },
                buffs: {
                    GROUND:  { atk: 1500, def: 1500, hp: 1500 },
                    RANGED:  { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 },
                    MOUNTED: { atk: 0, def: 0, hp: 0 },
                    SIEGE:   { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 }
                },
                default: 1000,
                archerTower: { atk: 5000000, hp: 8000000, range: 12, phantomFire: true }
            },
            global: { maxRounds: 250 }
        };
        const enc = SetupPersistence.encode(original);
        const text = SetupPersistence.serialize(enc);
        const parsed = SetupPersistence.parse(text);
        assert.equal(parsed.ok, true);
        const dec = SetupPersistence.decode(parsed.value);
        assert.equal(dec.fatal, false);
        assert.equal(dec.warnings.length, 0, 'no warnings on clean roundtrip');
        // Spot check critical values:
        assert.equal(dec.setup.name, 'Roundtrip');
        assert.equal(dec.setup.att.troops.RANGED[12], 100000);
        assert.equal(dec.setup.att.troops.RANGED[13], 200000);
        assert.equal(dec.setup.att.buffs.RANGED.rangeFlat, 50);
        assert.equal(dec.setup.def.troops.GROUND[13], 500000);
        assert.equal(dec.setup.def.archerTower.atk, 5000000);
        assert.equal(dec.setup.def.archerTower.phantomFire, true);
        assert.equal(dec.setup.global.maxRounds, 250);
    });

    it('hand-deleted line (missing tier) decodes as 0', function () {
        const r = SetupPersistence.decode({
            schema: 1,
            att: { troops: { RANGED: { '13': 200000 } }, buffs: {} },
            def: {}
        });
        assert.equal(r.setup.att.troops.RANGED[13], 200000);
        assert.equal(r.setup.att.troops.RANGED[12], undefined, 'missing tier left absent');
        const w = (r.warnings || []).find(function (w) { return /att\.troops\.RANGED/.test(w.path); });
        assert.falsy(w, 'no warning for a simply-missing tier');
    });

});

describe('SetupPersistence — serialize / parse', function () {

    it('serialize uses 2-space indent and trailing newline', function () {
        const text = SetupPersistence.serialize({ a: 1 });
        assert.equal(text, '{\n  "a": 1\n}\n');
    });

    it('parse returns ok:false on invalid JSON', function () {
        const r = SetupPersistence.parse('{not valid');
        assert.equal(r.ok, false);
        assert.truthy(typeof r.error === 'string' && r.error.length > 0);
    });

    it('parse returns ok:true on valid JSON', function () {
        const r = SetupPersistence.parse('{"a":1}');
        assert.equal(r.ok, true);
        assert.equal(r.value.a, 1);
    });

});
