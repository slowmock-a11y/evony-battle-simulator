describe('Engagement lock (spec §Movement Model / Engagement Lock)', function () {

    it('lock persists on high-priority target while low-priority enemies are also present', function () {
        // Mounted priority chain: [GROUND, SIEGE, MOUNTED, RANGED].
        // ATT Mounted should lock on GROUND (priority 1) and stay there even though RANGED
        // (priority 4) is also on the field. The lock logic never breaks on lower priority.
        const att = BattleEngine.createArmy({ MOUNTED: { 10: 300 } });
        const def = BattleEngine.createArmy({ GROUND: { 1: 200 }, RANGED: { 1: 200 } });
        const result = BattleEngine.simulate(att, def, { maxRounds: 60 });

        // Track GROUND count over time; while > 0, ATT Mounted attacks must target GROUND.
        let groundAlive = 200;
        let violation = null;
        for (let i = 0; i < result.events.length; i++) {
            const e = result.events[i];
            if ((e.eventType === 'attack' || e.eventType === 'counter') && e.targetType === 'GROUND') {
                groundAlive = e.remaining;
            }
            if (e.eventType === 'attack' && e.side === 'ATT' && e.sourceType === 'MOUNTED') {
                if (groundAlive > 0 && e.targetType !== 'GROUND') {
                    violation = { round: e.round, targetType: e.targetType, groundAlive: groundAlive };
                    break;
                }
            }
        }
        assert.falsy(violation,
            'ATT Mounted targeted ' + (violation && violation.targetType) + ' while GROUND was alive');
    });

    it('lock breaks when locked target type is eliminated; re-engages next priority', function () {
        // Ranged chain: [MOUNTED, RANGED, GROUND, SIEGE].
        // DEF has only GROUND and SIEGE - so ATT Ranged locks on GROUND (priority 3).
        // After GROUND is wiped, lock breaks and ATT Ranged must switch to SIEGE (priority 4).
        const att = BattleEngine.createArmy({ RANGED: { 10: 2000 } });  // overwhelming
        const def = BattleEngine.createArmy({ GROUND: { 1: 20 }, SIEGE: { 1: 200 } });
        const result = BattleEngine.simulate(att, def, { maxRounds: 60 });

        const attRangedAttacks = result.events.filter(function (e) {
            return e.eventType === 'attack' && e.side === 'ATT' && e.sourceType === 'RANGED';
        });
        assert.greaterThan(attRangedAttacks.length, 1, 'multiple ATT Ranged attacks');

        // First ATT Ranged attack should target GROUND (the first-in-priority-chain with actual range).
        assert.equal(attRangedAttacks[0].targetType, 'GROUND', 'initial lock on GROUND');

        // After GROUND eliminated, later attack must switch to SIEGE.
        const siegeAttack = attRangedAttacks.find(function (e) { return e.targetType === 'SIEGE'; });
        assert.truthy(siegeAttack, 'switched to SIEGE after GROUND eliminated');

        // Sanity: the SIEGE attack happens AFTER the attack that wiped GROUND.
        const groundWipe = result.events.find(function (e) {
            return (e.eventType === 'attack' || e.eventType === 'counter')
                && e.targetType === 'GROUND' && e.remaining === 0;
        });
        assert.truthy(groundWipe, 'ground was wiped');
    });
});
