describe('Damage multipliers (spec §Damage Multipliers)', function () {

    it('T10 Mounted->Siege is 0.9 (penalty)', function () {
        assert.equal(TroopData.getMultiplier('MOUNTED', 'SIEGE', 10), 0.9);
    });

    it('T11 Mounted->Siege is 1.1 (bonus) -- T10/T11 break', function () {
        assert.equal(TroopData.getMultiplier('MOUNTED', 'SIEGE', 11), 1.1);
    });

    it('T10 Siege->Siege is 0.5, T11 Siege->Siege is 0.6 -- T10/T11 break', function () {
        assert.equal(TroopData.getMultiplier('SIEGE', 'SIEGE', 10), 0.5);
        assert.equal(TroopData.getMultiplier('SIEGE', 'SIEGE', 11), 0.6);
    });

    it('T16 uses the T11+ table (no new band at T16)', function () {
        assert.equal(TroopData.getMultiplier('MOUNTED', 'SIEGE', 16), 1.1, 'T16 Mounted->Siege');
        assert.equal(TroopData.getMultiplier('SIEGE', 'SIEGE', 16), 0.6, 'T16 Siege->Siege');
    });

    it('counter triangle is preserved across both tables', function () {
        // Range->Mounted 1.2 / Mounted->Range 0.8
        assert.equal(TroopData.getMultiplier('RANGED', 'MOUNTED', 5), 1.2);
        assert.equal(TroopData.getMultiplier('MOUNTED', 'RANGED', 5), 0.8);
        assert.equal(TroopData.getMultiplier('RANGED', 'MOUNTED', 15), 1.2);
        assert.equal(TroopData.getMultiplier('MOUNTED', 'RANGED', 15), 0.8);
        // Mounted->Ground 1.2 / Ground->Mounted 0.7
        assert.equal(TroopData.getMultiplier('MOUNTED', 'GROUND', 5), 1.2);
        assert.equal(TroopData.getMultiplier('GROUND', 'MOUNTED', 5), 0.7);
        // Ground->Range 1.2 / Range->Ground 0.8
        assert.equal(TroopData.getMultiplier('GROUND', 'RANGED', 5), 1.2);
        assert.equal(TroopData.getMultiplier('RANGED', 'GROUND', 5), 0.8);
    });
});
