describe('Battle end conditions (spec §Battle End Condition)', function () {

    it('winner = ATTACKER when defender is wiped', function () {
        const att = BattleEngine.createArmy({ RANGED: { 10: 10000 } });
        const def = BattleEngine.createArmy({ RANGED: { 1: 1 } });
        const result = BattleEngine.simulate(att, def, { maxRounds: 50 });
        assert.equal(result.winner, 'ATTACKER');
        assert.lessThan(result.rounds, 50, 'battle ended before cap');
    });

    it('winner = DEFENDER when attacker is wiped', function () {
        const att = BattleEngine.createArmy({ RANGED: { 1: 1 } });
        const def = BattleEngine.createArmy({ RANGED: { 10: 10000 } });
        const result = BattleEngine.simulate(att, def, { maxRounds: 50 });
        assert.equal(result.winner, 'DEFENDER');
    });

    it('maxRounds cap is honored', function () {
        const att = BattleEngine.createArmy({ GROUND: { 16: 100000 } });
        const def = BattleEngine.createArmy({ GROUND: { 16: 100000 } });
        const result = BattleEngine.simulate(att, def, { maxRounds: 2 });
        assert.equal(result.rounds, 2, 'rounds capped at 2');
        // Both sides should still be alive (huge mirror, 2 rounds is not enough to wipe).
        assert.greaterThan(result.attacker._total, 0, 'attacker survives');
        assert.greaterThan(result.defender._total, 0, 'defender survives');
    });
});
