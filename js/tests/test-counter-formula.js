describe('Counter-strike formula (spec §Damage Formula)', function () {

    const noBuffs = {
        GROUND:  { atk: 0, def: 0, hp: 0 },
        RANGED:  { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 },
        MOUNTED: { atk: 0, def: 0, hp: 0 },
        SIEGE:   { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 }
    };

    it('worked example: 500 vs 1000 T1 Ranged counter is ~43.2 kills after 147 main kills', function () {
        const attacker = BattleEngine.createLayer('RANGED', 1, 500);
        const target   = BattleEngine.createLayer('RANGED', 1, 1000);
        const counterKills = BattleEngine.calculateCounterKills(attacker, target, noBuffs, noBuffs, 147);
        // counter_damage = 147 * 130 * 1.0 * 130/(130+100) = 10,801.30
        // counter_kills  = 10,801.30 / 250 = 43.205
        assert.approx(counterKills, 43.205, 0.01, 'counter kills');
    });

    it('counter uses target\'s tier for the modifier (asymmetric)', function () {
        // T10 Siege (attacker/source) firing on T11 Siege (target).
        // Main  mod: Siege->Siege T10 = 0.5 (LOW table)  -- not under test here
        // Counter mod: Siege->Siege T11 = 0.6 (HIGH table) -- target's tier drives this
        const attacker = BattleEngine.createLayer('SIEGE', 10, 1000);  // T10 Siege
        const target   = BattleEngine.createLayer('SIEGE', 11, 1000);  // T11 Siege
        const counterKills = BattleEngine.calculateCounterKills(attacker, target, noBuffs, noBuffs, 100);
        // counter_damage = 100 * 1940 * 0.6 * 1940/(1940+740) = 84,263.4
        // counter_kills  = 84,263.4 / 1550 = 54.363
        assert.approx(counterKills, 54.363, 0.01, 'counter uses T11 mod = 0.6');
        // If it wrongly used T10 mod 0.5, result would be ~45.303 -- clearly distinct.
    });

    it('overkill cliff: exact wipe produces no counter event', function () {
        // 100000 Ranged vs 1 Ranged: attacker main strike kills exactly 1, target -> 0, no counter.
        const att = BattleEngine.createArmy({ RANGED: { 1: 100000 } });
        const def = BattleEngine.createArmy({ RANGED: { 1: 1 } });
        const result = BattleEngine.simulate(att, def, { maxRounds: 50 });
        // Find any counter event directed at the ATT side (would indicate the wiped defender counter-fired)
        const counterFromDef = result.events.filter(function (e) {
            return e.eventType === 'counter' && e.side === 'ATT';  // ATT means the attacker acted main, defender countered
        });
        // The defender was wiped by attacker's main strike; no counter from defender.
        const wipeCounters = counterFromDef.filter(function (e) {
            return e.targetType === 'RANGED' && e.sourceType === 'RANGED';
        });
        assert.equal(wipeCounters.length, 0, 'no counter after exact wipe');
        assert.equal(result.winner, 'ATTACKER', 'attacker wins');
    });

    it('overkill cliff: sliver survivor (<1 troop) still triggers counter', function () {
        // Engineer a main strike that leaves ~<1 survivors but > 0.
        // 600 T1 Ranged vs 1000 T1 Ranged: 600 * 0.29391 * 1000 / 1000 = 176.35 kills.
        // Too many survive. Need near-wipe but not exact.
        // Easier: direct call to the formula - just verify it returns a positive counter when target has sliver.
        // But the cliff is in executePhase, not the formula. Instead: pick counts where attacker's main
        // barely leaves a fractional survivor, and confirm a counter event is emitted.
        //
        // 400 T1 Ranged vs 100 T1 Ranged. Defender fires first: kills 400 * 0.29391 * 100/100 = 117.56 capped at 400.
        //   Wait - defender has 100, attacker has 400. defender main: 100 * 0.29391 = 29.39 kills. attacker counter: 29.39 * 0.29391 = 8.64.
        //   Attacker strikes with survivors ~391: kills = 391 * 0.29391 = 114.9, capped at 100. target wiped -> no counter.
        //
        // Use slightly under-wipe counts: 340 attackers vs 100 defenders.
        //   Defender main: 100 * 0.29391 = 29.39 kills on attacker (340 -> 310.6). Counter (from attacker's casualties): 29.39 * 0.29391 = 8.64 counter kills (defender 100 -> 91.36).
        //   Attacker main: 310.6 * 0.29391 = 91.29 kills (defender 91.36 -> 0.07 sliver).
        //   Counter fires from 0.07 sliver: 91.29 * 0.29391 = 26.83 counter kills.
        const att = BattleEngine.createArmy({ RANGED: { 1: 340 } });
        const def = BattleEngine.createArmy({ RANGED: { 1: 100 } });
        const result = BattleEngine.simulate(att, def, { maxRounds: 50 });
        // Find the counter fired by the sliver survivor back at the attacker.
        const sliverCounter = result.events.find(function (e) {
            return e.eventType === 'counter' && e.sourceType === 'RANGED'
                && e.sourceCount > 0 && e.sourceCount < 1;
        });
        assert.truthy(sliverCounter, 'sliver survivor fired a counter');
    });
});
