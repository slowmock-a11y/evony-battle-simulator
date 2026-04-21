describe('Covenants dataset schema', function () {

    const data = typeof COVENANTS_DATA !== 'undefined' ? COVENANTS_DATA : null;

    it('is a non-empty array', function () {
        assert.truthy(Array.isArray(data), 'top-level is array');
        assert.greaterThan(data.length, 0, 'has entries');
    });

    it('every entry has a non-empty main name', function () {
        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            if (typeof e.main !== 'string' || e.main.length === 0) {
                throw new Error('covenant ' + i + ' has invalid main: ' + JSON.stringify(e.main));
            }
        }
    });

    it('every entry has 3 members (covenant slots I/II/III)', function () {
        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            if (!Array.isArray(e.members) || e.members.length !== 3) {
                throw new Error('covenant ' + e.main + ' has ' +
                    (e.members ? e.members.length : 'no') + ' members (expected 3)');
            }
            for (let j = 0; j < e.members.length; j++) {
                if (typeof e.members[j] !== 'string' || e.members[j].length === 0) {
                    throw new Error('covenant ' + e.main + ' has empty member at index ' + j);
                }
            }
        }
    });

    it('every entry has 2 gold buffs', function () {
        for (let i = 0; i < data.length; i++) {
            const e = data[i];
            if (!Array.isArray(e.gold_buffs) || e.gold_buffs.length !== 2) {
                throw new Error('covenant ' + e.main + ' has ' +
                    (e.gold_buffs ? e.gold_buffs.length : 'no') + ' gold_buffs (expected 2)');
            }
        }
    });

    it('main names are unique across covenants', function () {
        const seen = {};
        for (let i = 0; i < data.length; i++) {
            const m = data[i].main;
            if (seen[m]) {
                throw new Error('duplicate covenant main: ' + m);
            }
            seen[m] = true;
        }
    });
});
