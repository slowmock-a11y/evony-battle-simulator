describe('Damage formula (spec §Damage Formula)', function () {

    const noBuffs = {
        GROUND:  { atk: 0, def: 0, hp: 0 },
        RANGED:  { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 },
        MOUNTED: { atk: 0, def: 0, hp: 0 },
        SIEGE:   { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 }
    };

    it('worked example: 500 vs 1000 T1 Ranged yields ~147 kills', function () {
        const attacker = BattleEngine.createLayer('RANGED', 1, 500);
        const target   = BattleEngine.createLayer('RANGED', 1, 1000);
        const result   = BattleEngine.calculateDamage(attacker, target, noBuffs, noBuffs);
        // 500 * 130 * 1.0 * 130/(130+100) = 36,739.13 damage
        // 36,739.13 / 250 = 146.957 kills
        assert.approx(result.kills, 146.957, 0.01, 'kills');
        assert.approx(result.damage, 36739.13, 1, 'damage');
        assert.equal(result.modifier, 1.0, 'Ranged->Ranged modifier');
    });

    it('kills are capped at target current count (overkill cap)', function () {
        const attacker = BattleEngine.createLayer('GROUND', 10, 100000);
        const target   = BattleEngine.createLayer('RANGED', 1, 5);
        const result   = BattleEngine.calculateDamage(attacker, target, noBuffs, noBuffs);
        // Raw damage would kill thousands; cap says exactly 5.
        assert.equal(result.kills, 5, 'kills capped at target.count');
    });

    it('ATK buff scales attacker damage multiplicatively', function () {
        const attacker = BattleEngine.createLayer('RANGED', 1, 100);
        const target   = BattleEngine.createLayer('RANGED', 1, 1000);
        const buffedAtt = {
            GROUND:  { atk: 0, def: 0, hp: 0 },
            RANGED:  { atk: 50, def: 0, hp: 0, range: 0, rangeFlat: 0 },  // +50%
            MOUNTED: { atk: 0, def: 0, hp: 0 },
            SIEGE:   { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 }
        };
        const result = BattleEngine.calculateDamage(attacker, target, buffedAtt, noBuffs);
        // effectiveAtk = 130 * 1.5 = 195
        // damage = 100 * 195 * 1.0 * 195/(195+100) = 12,889.83
        // kills  = 12,889.83 / 250 = 51.559
        assert.approx(result.damage, 12889.83, 0.1, 'buffed damage');
        assert.approx(result.kills, 51.559, 0.01, 'buffed kills');
    });

    it('target HP buff reduces kill count proportionally', function () {
        const attacker = BattleEngine.createLayer('RANGED', 1, 100);
        const target   = BattleEngine.createLayer('RANGED', 1, 1000);
        const buffedDef = {
            GROUND:  { atk: 0, def: 0, hp: 0 },
            RANGED:  { atk: 0, def: 0, hp: 100, range: 0, rangeFlat: 0 },  // +100% HP
            MOUNTED: { atk: 0, def: 0, hp: 0 },
            SIEGE:   { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 }
        };
        const result = BattleEngine.calculateDamage(attacker, target, noBuffs, buffedDef);
        // effective HP = 250 * 2 = 500
        // damage = 100 * 130 * 1.0 * 130/(130+100) = 7,347.83
        // kills  = 7,347.83 / 500 = 14.696
        assert.approx(result.kills, 14.696, 0.01, 'kills halved by doubled HP');
    });
});
