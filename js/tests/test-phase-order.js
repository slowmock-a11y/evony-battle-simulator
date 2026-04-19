describe('Phase order and tie-breaks (spec §Phase Order)', function () {

    function firstIndex(events, predicate) {
        for (let i = 0; i < events.length; i++) {
            if (predicate(events[i])) return i;
        }
        return -1;
    }

    it('mirror match: defender acts before attacker in same phase (same-speed tie)', function () {
        const att = BattleEngine.createArmy({ RANGED: { 1: 1000 } });
        const def = BattleEngine.createArmy({ RANGED: { 1: 1000 } });
        const result = BattleEngine.simulate(att, def, { maxRounds: 50 });

        // Find first attack event in the Ranged phase. It should be side='DEF'.
        const firstAttack = result.events.find(function (e) {
            return e.eventType === 'attack' && e.phase === 'RANGED';
        });
        assert.truthy(firstAttack, 'at least one ranged attack event');
        assert.equal(firstAttack.side, 'DEF', 'defender acts first on same-speed tie');
    });

    it('higher tier fires before lower tier within same type', function () {
        // ATT has T10 and T1 Ranged, both will fire in the Ranged phase of the same round.
        const att = BattleEngine.createArmy({ RANGED: { 10: 100, 1: 100 } });
        const def = BattleEngine.createArmy({ RANGED: { 5: 2000 } });
        const result = BattleEngine.simulate(att, def, { maxRounds: 50 });

        // Look at attacker-side events in the Ranged phase for the first round they appear.
        const attRangedAttacks = result.events.filter(function (e) {
            return e.eventType === 'attack' && e.phase === 'RANGED' && e.side === 'ATT';
        });
        assert.greaterThan(attRangedAttacks.length, 1, 'multiple ATT ranged attacks recorded');

        // Group by round, check first round with both tiers present has T10 before T1.
        const byRound = {};
        attRangedAttacks.forEach(function (e) {
            if (!byRound[e.round]) byRound[e.round] = [];
            byRound[e.round].push(e);
        });
        let verified = false;
        Object.keys(byRound).forEach(function (r) {
            const inRound = byRound[r];
            const tiers = inRound.map(function (e) { return e.sourceTier; });
            if (tiers.indexOf(10) !== -1 && tiers.indexOf(1) !== -1) {
                assert.lessThan(tiers.indexOf(10), tiers.indexOf(1), 'round ' + r + ': T10 before T1');
                verified = true;
            }
        });
        assert.truthy(verified, 'at least one round exercised higher-tier-first');
    });

    it('cross-type phase order: Ground -> Mounted -> Ranged -> Siege', function () {
        // Populate all 4 types on both sides; any round's move events must come in that order.
        const troops = { GROUND: { 5: 100 }, MOUNTED: { 5: 100 }, RANGED: { 5: 100 }, SIEGE: { 5: 100 } };
        const att = BattleEngine.createArmy(troops);
        const def = BattleEngine.createArmy(troops);
        const result = BattleEngine.simulate(att, def, { maxRounds: 3 });

        // Collect the phases in order for round 1 move events.
        const round1Moves = result.events.filter(function (e) {
            return e.eventType === 'move' && e.round === 1;
        });
        const phases = round1Moves.map(function (e) { return e.phase; });
        // Expected sequence
        const expected = ['GROUND', 'MOUNTED', 'RANGED', 'SIEGE'];
        // Could be subset if some types skip movement, but with matching armies at distance 1500 every type moves.
        assert.equal(phases.length, 4, 'four phases moved in round 1');
        for (let i = 0; i < 4; i++) {
            assert.equal(phases[i], expected[i], 'phase index ' + i);
        }
    });
});
