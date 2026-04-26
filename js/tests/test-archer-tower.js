describe('Archer Tower (defender-only fixture)', function () {

    function buildAtArmy(opts) {
        // opts: { atk, hp, range, phantomFire, troops }
        return BattleEngine.createArmy(opts.troops || {}, undefined, {
            atk: opts.atk, hp: opts.hp, range: opts.range, phantomFire: !!opts.phantomFire
        });
    }

    it('AT fires in the ARCHER_TOWER tail phase after Siege (defender side)', function () {
        const att = BattleEngine.createArmy({ MOUNTED: { 14: 1000 } });
        const def = buildAtArmy({ atk: 5000, hp: 100000, range: 1500, phantomFire: false });
        const result = BattleEngine.simulate(att, def, { maxRounds: 50 });

        const atAttacks = result.events.filter(function (e) {
            return e.eventType === 'attack' && e.phase === 'ARCHER_TOWER';
        });
        assert.greaterThan(atAttacks.length, 0, 'AT fired at least once');
        atAttacks.forEach(function (e) {
            assert.equal(e.side, 'DEF', 'AT events are defender-side');
            assert.equal(e.sourceType, 'ARCHER_TOWER', 'source is AT');
        });

        // Within each round, every AT event must come after every SIEGE event of that round.
        const roundIndex = {};
        result.events.forEach(function (e, i) {
            if (!roundIndex[e.round]) roundIndex[e.round] = { siegeMax: -1, atMin: Infinity };
            if (e.eventType === 'attack' && e.phase === 'SIEGE') {
                roundIndex[e.round].siegeMax = Math.max(roundIndex[e.round].siegeMax, i);
            } else if (e.eventType === 'attack' && e.phase === 'ARCHER_TOWER') {
                roundIndex[e.round].atMin = Math.min(roundIndex[e.round].atMin, i);
            }
        });
        Object.keys(roundIndex).forEach(function (r) {
            const r2 = roundIndex[r];
            if (r2.siegeMax >= 0 && r2.atMin < Infinity) {
                assert.greaterThan(r2.atMin, r2.siegeMax, 'AT after SIEGE in round ' + r);
            }
        });
    });

    it('AT does not move — defender position constant at 1500', function () {
        const att = BattleEngine.createArmy({ GROUND: { 1: 1000 } });
        const def = buildAtArmy({ atk: 1000, hp: 100000, range: 800 });
        const result = BattleEngine.simulate(att, def, { maxRounds: 10 });

        let snapshots = 0;
        result.events.forEach(function (e) {
            if (e.positions && e.positions.DEF && e.positions.DEF.ARCHER_TOWER_1 !== undefined) {
                snapshots++;
                assert.equal(e.positions.DEF.ARCHER_TOWER_1, 1500, 'AT pos constant at 1500');
            }
        });
        assert.greaterThan(snapshots, 0, 'at least one snapshot included AT position');
    });

    it('defender %-buffs do not scale AT.atk', function () {
        // Run A: no buffs
        const buffsA = {
            GROUND: { atk: 0, def: 0, hp: 0 }, RANGED: { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 },
            MOUNTED: { atk: 0, def: 0, hp: 0 }, SIEGE: { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 }
        };
        // Run B: huge defender buffs (no ARCHER_TOWER key — should not affect AT)
        const buffsB = {
            GROUND: { atk: 100, def: 100, hp: 100 }, RANGED: { atk: 100, def: 100, hp: 100, range: 0, rangeFlat: 0 },
            MOUNTED: { atk: 100, def: 100, hp: 100 }, SIEGE: { atk: 100, def: 100, hp: 100, range: 0, rangeFlat: 0 }
        };

        function firstAtDamage(defBuffs) {
            const att = BattleEngine.createArmy({ MOUNTED: { 1: 100 } });
            const def = BattleEngine.createArmy({}, defBuffs, { atk: 5000, hp: 1000000, range: 1500 });
            const r = BattleEngine.simulate(att, def, { maxRounds: 5 });
            const atShot = r.events.find(function (e) {
                return e.eventType === 'attack' && e.phase === 'ARCHER_TOWER';
            });
            return atShot ? atShot.damage : null;
        }
        const dmgA = firstAtDamage(buffsA);
        const dmgB = firstAtDamage(buffsB);
        assert.truthy(dmgA, 'AT fired in run A');
        assert.truthy(dmgB, 'AT fired in run B');
        assert.equal(dmgA, dmgB, 'AT damage identical regardless of defender %-buffs');
    });

    it('AT counter-strikes when attacker is in range', function () {
        const att = BattleEngine.createArmy({ MOUNTED: { 1: 1000 } });
        // Range large enough that AT can counter the moment Mounted fires
        const def = buildAtArmy({ atk: 5000, hp: 1000000, range: 1500 });
        const result = BattleEngine.simulate(att, def, { maxRounds: 5 });
        const atCounter = result.events.find(function (e) {
            return e.eventType === 'counter' && e.sourceType === 'ARCHER_TOWER';
        });
        assert.truthy(atCounter, 'AT emitted a counter event');
    });

    it('AT does not counter when attacker is out of range', function () {
        // AT range 100 — too short to ever hit a Mounted attacker that closes from 0
        // before the Mounted fires from melee at AT's edge. Mounted fires at AT from
        // distance ~50 (melee), well within AT range 100, so this exact setup would
        // counter. Use a tiny AT range (1) to ensure no counter triggers.
        const att = BattleEngine.createArmy({ MOUNTED: { 1: 1000 } });
        const def = buildAtArmy({ atk: 5000, hp: 1000000, range: 1 });
        const result = BattleEngine.simulate(att, def, { maxRounds: 5 });
        const atCounter = result.events.find(function (e) {
            return e.eventType === 'counter' && e.sourceType === 'ARCHER_TOWER';
        });
        assert.falsy(atCounter, 'no AT counter when attacker out of range');
    });

    it('phantom-fire OFF: AT killed mid-round produces no AT event in dying round', function () {
        // Massive Siege attacker wipes AT in round 1 SIEGE phase before AT phase fires.
        // AT range 1500 lets it engage from start (Siege at pos 0, AT at pos 1500).
        const att = BattleEngine.createArmy({ SIEGE: { 16: 1000000 } });
        const def = buildAtArmy({ atk: 100, hp: 100, range: 1500, phantomFire: false });
        const result = BattleEngine.simulate(att, def, { maxRounds: 5 });
        const dyingRound = result.events.find(function (e) {
            return e.eventType === 'attack' && e.targetType === 'ARCHER_TOWER';
        });
        const dyingRoundNum = dyingRound ? dyingRound.round : null;
        assert.truthy(dyingRoundNum, 'AT was attacked');
        const atShotsInDyingRound = result.events.filter(function (e) {
            return e.eventType === 'attack' && e.phase === 'ARCHER_TOWER' && e.round === dyingRoundNum;
        });
        assert.equal(atShotsInDyingRound.length, 0, 'no phantom shot when toggle off');
    });

    it('phantom-fire ON: AT killed mid-round fires once in dying round, none after', function () {
        const att = BattleEngine.createArmy({ SIEGE: { 16: 1000000 } });
        const def = buildAtArmy({ atk: 100, hp: 100, range: 1500, phantomFire: true });
        const result = BattleEngine.simulate(att, def, { maxRounds: 5 });
        const atKill = result.events.find(function (e) {
            return e.eventType === 'attack' && e.targetType === 'ARCHER_TOWER' && e.remaining <= 0;
        });
        assert.truthy(atKill, 'AT was killed');
        const dyingRound = atKill.round;
        const atShotsInDyingRound = result.events.filter(function (e) {
            return e.eventType === 'attack' && e.phase === 'ARCHER_TOWER' && e.round === dyingRound;
        });
        assert.equal(atShotsInDyingRound.length, 1, 'exactly one phantom shot in dying round');
        const atShotsAfter = result.events.filter(function (e) {
            return e.eventType === 'attack' && e.phase === 'ARCHER_TOWER' && e.round > dyingRound;
        });
        assert.equal(atShotsAfter.length, 0, 'no AT shots after dying round');
    });

    it('defender alone with AT keeps battle alive past round 1', function () {
        const att = BattleEngine.createArmy({ MOUNTED: { 14: 1000 } });
        const def = buildAtArmy({ atk: 1, hp: 10000000, range: 1500 });
        const result = BattleEngine.simulate(att, def, { maxRounds: 50 });
        assert.greaterThan(result.rounds, 1, 'battle continued past round 1');
    });

    it('AT-as-attacker provisional multiplier ARCHER_TOWER -> MOUNTED = 1.2', function () {
        assert.equal(TroopData.getMultiplier('ARCHER_TOWER', 'MOUNTED'), 1.2);
    });

    it('AT-as-target provisional multiplier SIEGE -> ARCHER_TOWER = 0.4', function () {
        assert.equal(TroopData.getMultiplier('SIEGE', 'ARCHER_TOWER', 5), 0.4);
        assert.equal(TroopData.getMultiplier('SIEGE', 'ARCHER_TOWER', 13), 0.4);
    });

    it('AT priority chain default mirrors RANGED', function () {
        const chain = TroopData.TARGET_PRIORITY['ARCHER_TOWER'];
        assert.equal(chain.length, 4, 'four entries');
        assert.equal(chain[0], 'MOUNTED');
        assert.equal(chain[1], 'RANGED');
        assert.equal(chain[2], 'GROUND');
        assert.equal(chain[3], 'SIEGE');
    });

    it('battles without AT inputs are unaffected (no AT layer constructed)', function () {
        const att = BattleEngine.createArmy({ RANGED: { 1: 1000 } });
        const def = BattleEngine.createArmy({ RANGED: { 1: 1000 } });
        const hasAt = att.layers.some(function (l) { return l.type === 'ARCHER_TOWER'; })
                   || def.layers.some(function (l) { return l.type === 'ARCHER_TOWER'; });
        assert.falsy(hasAt, 'no AT layer when archerTower omitted');
    });

    it('AT skipped when all numeric inputs are zero', function () {
        const def = BattleEngine.createArmy({}, undefined, { atk: 0, hp: 0, range: 0, phantomFire: true });
        const hasAt = def.layers.some(function (l) { return l.type === 'ARCHER_TOWER'; });
        assert.falsy(hasAt, 'no AT layer when atk/hp/range all zero');
    });

    it('AT layer shape: count=1, def=0, tier=1, speed=0', function () {
        const def = BattleEngine.createArmy({}, undefined, { atk: 5000, hp: 100000, range: 800, phantomFire: true });
        const at = def.layers.find(function (l) { return l.type === 'ARCHER_TOWER'; });
        assert.truthy(at, 'AT layer exists');
        assert.equal(at.count, 1);
        assert.equal(at.startCount, 1);
        assert.equal(at.def, 0);
        assert.equal(at.tier, 1);
        assert.equal(at.speed, 0);
        assert.equal(at.atk, 5000);
        assert.equal(at.hp, 100000);
        assert.equal(at.range, 800);
        assert.equal(at.phantomFire, true);
    });
});
