describe('Spec anomalies and stat constants', function () {

    it('Siege ATK equals HP for T1-T15 (spec pattern)', function () {
        // Check three representative tiers in the T1-T15 band.
        [1, 5, 15].forEach(function (tier) {
            const s = TroopData.getStats('SIEGE', tier);
            assert.equal(s.atk, s.hp, 'T' + tier + ' Siege ATK == HP');
        });
    });

    it('Siege T16 breaks the ATK=HP pattern (4440 vs 4400, 40-unit gap)', function () {
        const s = TroopData.getStats('SIEGE', 16);
        assert.equal(s.atk, 4440, 'T16 Siege ATK');
        assert.equal(s.hp, 4400, 'T16 Siege HP');
        assert.equal(s.atk - s.hp, 40, '40-unit gap at T16');
    });

    it('Siege speed is 75 for T1-T15 and 76 for T16', function () {
        [1, 5, 10, 15].forEach(function (tier) {
            assert.equal(TroopData.getStats('SIEGE', tier).speed, 75, 'T' + tier + ' Siege speed');
        });
        assert.equal(TroopData.getStats('SIEGE', 16).speed, 76, 'T16 Siege speed');
    });

    it('actual speeds match spec (Ground 350, Mounted 300, Ranged 100)', function () {
        // Spec: Mounted displayed speed 600 but actual 300. This is the critical anomaly.
        assert.equal(TroopData.getStats('GROUND', 1).speed, 350, 'Ground actual speed 350');
        assert.equal(TroopData.getStats('MOUNTED', 1).speed, 300, 'Mounted actual speed 300 (not displayed 600)');
        assert.equal(TroopData.getStats('RANGED', 1).speed, 100, 'Ranged actual speed 100');
    });

    it('base ranges: Ground 50, Mounted 50, Ranged 500, Siege tier-banded', function () {
        assert.equal(TroopData.getStats('GROUND', 1).range, 50);
        assert.equal(TroopData.getStats('MOUNTED', 1).range, 50);
        assert.equal(TroopData.getStats('RANGED', 1).range, 500);
        // Siege range bands from spec
        assert.equal(TroopData.getStats('SIEGE', 1).range, 900, 'T1-T4 = 900');
        assert.equal(TroopData.getStats('SIEGE', 5).range, 1000, 'T5-T8 = 1000');
        assert.equal(TroopData.getStats('SIEGE', 9).range, 1100, 'T9-T10 = 1100');
        assert.equal(TroopData.getStats('SIEGE', 11).range, 1200, 'T11-T12 = 1200');
        assert.equal(TroopData.getStats('SIEGE', 13).range, 1400, 'T13-T16 = 1400');
    });
});
