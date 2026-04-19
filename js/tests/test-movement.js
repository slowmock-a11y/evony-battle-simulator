describe('Movement model (spec §Movement Model)', function () {

    function findMoveEvent(events, round, phase) {
        return events.find(function (e) {
            return e.eventType === 'move' && e.round === round && e.phase === phase;
        });
    }

    it('Mounted advances 300 per round when out of range', function () {
        const att = BattleEngine.createArmy({ MOUNTED: { 1: 100 } });
        const def = BattleEngine.createArmy({ MOUNTED: { 1: 100 } });
        const result = BattleEngine.simulate(att, def, { maxRounds: 2 });

        const r1 = findMoveEvent(result.events, 1, 'MOUNTED');
        assert.truthy(r1, 'round 1 Mounted move event');
        const defMove = r1.moves.find(function (m) { return m.side === 'DEF'; });
        const attMove = r1.moves.find(function (m) { return m.side === 'ATT'; });
        assert.equal(defMove.from - defMove.to, 300, 'DEF Mounted advanced 300');
        assert.equal(attMove.to - attMove.from, 300, 'ATT Mounted advanced 300');
    });

    it('minimum-distance movement: advance only enough to bring target into actual range', function () {
        // Ground T1 mirror: speed 350, range 50, ER 400.
        // R1: DEF 1500->1150, ATT 0->350. R2: DEF 1150->800, ATT 350->700.
        // R3: distance=100, DEF moves first, min-distance = 100-50 = 50 (not full 350).
        const att = BattleEngine.createArmy({ GROUND: { 1: 100 } });
        const def = BattleEngine.createArmy({ GROUND: { 1: 100 } });
        const result = BattleEngine.simulate(att, def, { maxRounds: 3 });

        const r3 = findMoveEvent(result.events, 3, 'GROUND');
        assert.truthy(r3, 'round 3 Ground move event');
        const defMove = r3.moves.find(function (m) { return m.side === 'DEF'; });
        assert.equal(defMove.from, 800, 'DEF at 800 before R3 move');
        assert.equal(defMove.to, 750, 'DEF min-distance to 750 (not full speed)');
        assert.equal(defMove.from - defMove.to, 50, 'moved 50, not 350');
    });

    it('hold-in-range: no movement when enemy is within actual range', function () {
        // After R3 the gap is 50. In R4 both sides are held (distance <= range=50).
        const att = BattleEngine.createArmy({ GROUND: { 1: 100 } });
        const def = BattleEngine.createArmy({ GROUND: { 1: 100 } });
        const result = BattleEngine.simulate(att, def, { maxRounds: 4 });

        const r4 = findMoveEvent(result.events, 4, 'GROUND');
        assert.truthy(r4, 'round 4 Ground move event');
        r4.moves.forEach(function (m) {
            assert.equal(m.held, true, m.side + ' Ground should be held');
            assert.equal(m.from, m.to, m.side + ' position unchanged');
        });
    });

    it('melee collision: troops stop exactly 50 units apart, never pass', function () {
        // Same mirror as above. After R3 positions should be ATT=700, DEF=750.
        const att = BattleEngine.createArmy({ GROUND: { 1: 100 } });
        const def = BattleEngine.createArmy({ GROUND: { 1: 100 } });
        const result = BattleEngine.simulate(att, def, { maxRounds: 4 });

        const r3 = findMoveEvent(result.events, 3, 'GROUND');
        assert.equal(r3.positions.ATT.GROUND_1, 700, 'ATT Ground at 700 after R3');
        assert.equal(r3.positions.DEF.GROUND_1, 750, 'DEF Ground at 750 after R3');
        assert.equal(r3.positions.DEF.GROUND_1 - r3.positions.ATT.GROUND_1, 50, 'gap = 50');
    });

    it('per-round advance equals the speed stat for each type', function () {
        // Round 1 move, all types out of range, advance full speed.
        const troops = { GROUND: { 1: 10 }, MOUNTED: { 1: 10 }, RANGED: { 1: 10 }, SIEGE: { 1: 10 } };
        const att = BattleEngine.createArmy(troops);
        const def = BattleEngine.createArmy(troops);
        const result = BattleEngine.simulate(att, def, { maxRounds: 1 });

        const expected = { GROUND: 350, MOUNTED: 300, RANGED: 100, SIEGE: 75 };
        ['GROUND', 'MOUNTED', 'RANGED', 'SIEGE'].forEach(function (type) {
            const mv = findMoveEvent(result.events, 1, type);
            assert.truthy(mv, 'round 1 move event for ' + type);
            const att1 = mv.moves.find(function (m) { return m.side === 'ATT'; });
            assert.equal(att1.to - att1.from, expected[type], 'ATT ' + type + ' advanced ' + expected[type]);
        });
    });
});
