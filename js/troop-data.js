var TroopData = (function () {
    'use strict';

    const TYPES = {
        SIEGE:        { name: 'Siege',        color: '#e07040', bgClass: 'bg-siege',         borderClass: 'border-siege',         colorClass: 'color-siege'        },
        RANGED:       { name: 'Ranged',       color: '#4caf6e', bgClass: 'bg-ranged',        borderClass: 'border-ranged',        colorClass: 'color-ranged'       },
        MOUNTED:      { name: 'Mounted',      color: '#5b9bd5', bgClass: 'bg-mounted',       borderClass: 'border-mounted',       colorClass: 'color-mounted'      },
        GROUND:       { name: 'Ground',       color: '#d4a843', bgClass: 'bg-ground',        borderClass: 'border-ground',        colorClass: 'color-ground'       },
        ARCHER_TOWER: { name: 'Archer Tower', color: '#b48cd9', bgClass: 'bg-archer-tower',  borderClass: 'border-archer-tower',  colorClass: 'color-archer-tower' }
    };

    // Phase order: fastest actual speed first (game-DB values).
    // ARCHER_TOWER is a defender-only tail phase (speed 0).
    const PHASE_ORDER = ['GROUND', 'MOUNTED', 'RANGED', 'SIEGE', 'ARCHER_TOWER'];

    // Targeting priority chains (1 = first choice).
    // Each non-AT chain has ARCHER_TOWER appended last (PROVISIONAL — assumes
    // AT is the lowest-priority target after all troop types). Without this,
    // a defender with only AT alive cannot be engaged.
    const TARGET_PRIORITY = {
        SIEGE:        ['SIEGE', 'RANGED', 'GROUND', 'MOUNTED', 'ARCHER_TOWER' /* PROVISIONAL */],
        RANGED:       ['MOUNTED', 'RANGED', 'GROUND', 'SIEGE', 'ARCHER_TOWER' /* PROVISIONAL */],
        MOUNTED:      ['GROUND', 'SIEGE', 'MOUNTED', 'RANGED', 'ARCHER_TOWER' /* PROVISIONAL */],
        GROUND:       ['RANGED', 'SIEGE', 'GROUND', 'MOUNTED', 'ARCHER_TOWER' /* PROVISIONAL */],
        ARCHER_TOWER: ['MOUNTED', 'RANGED', 'GROUND', 'SIEGE']  // PROVISIONAL — see view-archer-tower-investigation
    };

    // Damage multipliers: ATTACKER_TYPE -> DEFENDER_TYPE -> coefficient
    // Tier-dependent: T1-T10 and T11+ have different matrices
    // Source: community research by @DerrickDefies
    // https://www.youtube.com/watch?v=fZm_MtJ1kyg&t=102s
    //
    // ARCHER_TOWER row + column cells are PROVISIONAL. Each AT cell starts equal
    // to the matching RANGED cell as a deliberate default until the investigation
    // page resolves the open question. Cells are independently editable so future
    // evidence updates a single value without unwinding aliases.
    const DAMAGE_MULTIPLIERS_LOW = {
        GROUND:       { GROUND: 1.0,  RANGED: 1.2, MOUNTED: 0.7,  SIEGE: 1.1, ARCHER_TOWER: 1.2 /* PROVISIONAL */ },
        RANGED:       { GROUND: 0.8,  RANGED: 1.0, MOUNTED: 1.2,  SIEGE: 1.1, ARCHER_TOWER: 1.0 /* PROVISIONAL */ },
        MOUNTED:      { GROUND: 1.2,  RANGED: 0.8, MOUNTED: 1.0,  SIEGE: 0.9, ARCHER_TOWER: 0.8 /* PROVISIONAL */ },
        SIEGE:        { GROUND: 0.35, RANGED: 0.4, MOUNTED: 0.3,  SIEGE: 0.5, ARCHER_TOWER: 0.4 /* PROVISIONAL */ },
        ARCHER_TOWER: { GROUND: 0.8 /* PROVISIONAL */, RANGED: 1.0 /* PROVISIONAL */, MOUNTED: 1.2 /* PROVISIONAL */, SIEGE: 1.1 /* PROVISIONAL */, ARCHER_TOWER: 1.0 /* PROVISIONAL */ }
    };
    const DAMAGE_MULTIPLIERS_HIGH = {
        GROUND:       { GROUND: 1.0,  RANGED: 1.2, MOUNTED: 0.7,  SIEGE: 1.1, ARCHER_TOWER: 1.2 /* PROVISIONAL */ },
        RANGED:       { GROUND: 0.8,  RANGED: 1.0, MOUNTED: 1.2,  SIEGE: 1.1, ARCHER_TOWER: 1.0 /* PROVISIONAL */ },
        MOUNTED:      { GROUND: 1.2,  RANGED: 0.8, MOUNTED: 1.0,  SIEGE: 1.1, ARCHER_TOWER: 0.8 /* PROVISIONAL */ },
        SIEGE:        { GROUND: 0.35, RANGED: 0.4, MOUNTED: 0.3,  SIEGE: 0.6, ARCHER_TOWER: 0.4 /* PROVISIONAL */ },
        ARCHER_TOWER: { GROUND: 0.8 /* PROVISIONAL */, RANGED: 1.0 /* PROVISIONAL */, MOUNTED: 1.2 /* PROVISIONAL */, SIEGE: 1.1 /* PROVISIONAL */, ARCHER_TOWER: 1.0 /* PROVISIONAL */ }
    };

    function getMultiplier(attackerType, defenderType, attackerTier) {
        const table = attackerTier >= 11 ? DAMAGE_MULTIPLIERS_HIGH : DAMAGE_MULTIPLIERS_LOW;
        const m = table[attackerType];
        return (m && m[defenderType]) || 1.0;
    }

    const TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

    // Base stats: [ATK, DEF, HP, Speed, Range]
    const STATS = {
        GROUND: {
            1:  [100,   300,    600,   350, 50],
            2:  [140,   410,    810,   350, 50],
            3:  [190,   550,   1090,   350, 50],
            4:  [260,   740,   1470,   350, 50],
            5:  [350,  1000,   1980,   350, 50],
            6:  [470,  1350,   2670,   350, 50],
            7:  [630,  1820,   3600,   350, 50],
            8:  [850,  2460,   4860,   350, 50],
            9:  [1150, 3320,   6560,   350, 50],
            10: [1550, 4480,   8860,   350, 50],
            11: [1940, 5600,  11080,   350, 50],
            12: [2425, 7000,  13850,   350, 50],
            13: [2910, 8400,  16620,   350, 50],
            14: [3570, 10330, 20440,   350, 50],
            15: [4230, 11760, 24260,   350, 50],
            16: [4920, 13670, 28240,   350, 50]
        },
        RANGED: {
            1:  [130,   100,   250,   100, 500],
            2:  [180,   140,   340,   100, 500],
            3:  [240,   190,   460,   100, 500],
            4:  [320,   260,   620,   100, 500],
            5:  [430,   350,   840,   100, 500],
            6:  [580,   470,  1130,   100, 500],
            7:  [780,   630,  1530,   100, 500],
            8:  [1050,  850,  2070,   100, 500],
            9:  [1420, 1150,  2790,   100, 500],
            10: [1920, 1550,  3770,   100, 500],
            11: [2400, 1940,  4720,   100, 500],
            12: [3000, 2425,  5900,   100, 500],
            13: [3450, 2780,  6780,   100, 500],
            14: [4070, 3280,  8000,   100, 500],
            15: [4690, 3780,  9220,   100, 500],
            16: [5460, 4390, 10730,   100, 500]
        },
        MOUNTED: {
            1:  [220,   150,   400,   300, 50],
            2:  [300,   200,   540,   300, 50],
            3:  [410,   270,   730,   300, 50],
            4:  [550,   360,   990,   300, 50],
            5:  [740,   490,  1340,   300, 50],
            6:  [1000,  660,  1810,   300, 50],
            7:  [1350,  890,  2440,   300, 50],
            8:  [1820, 1200,  3290,   300, 50],
            9:  [2460, 1620,  4440,   300, 50],
            10: [3320, 2190,  5990,   300, 50],
            11: [4150, 2740,  7490,   300, 50],
            12: [5187, 3425,  9362,   300, 50],
            13: [5800, 3830, 10480,   300, 50],
            14: [6670, 4400, 12050,   300, 50],
            15: [7540, 4970, 13620,   300, 50],
            16: [8780, 5780, 15850,   300, 50]
        },
        SIEGE: {
            1:  [100,   50,   100,   75, 900],
            2:  [140,   70,   140,   75, 900],
            3:  [190,   90,   190,   75, 900],
            4:  [260,  120,   260,   75, 900],
            5:  [350,  160,   350,   75, 1000],
            6:  [470,  220,   470,   75, 1000],
            7:  [630,  300,   630,   75, 1000],
            8:  [850,  410,   850,   75, 1000],
            9:  [1150, 550,  1150,   75, 1100],
            10: [1550, 740,  1550,   75, 1100],
            11: [1940, 930,  1940,   75, 1200],
            12: [2425, 1162, 2425,   75, 1200],
            13: [2780, 1330, 2780,   75, 1400],
            14: [3280, 1560, 3280,   75, 1400],
            15: [3780, 1790, 3780,   75, 1400],
            16: [4440, 2080, 4400,   76, 1400]
        }
    };

    function getStats(type, tier) {
        const s = STATS[type][tier];
        return { atk: s[0], def: s[1], hp: s[2], speed: s[3], range: s[4] };
    }

    return {
        TYPES: TYPES,
        PHASE_ORDER: PHASE_ORDER,
        TARGET_PRIORITY: TARGET_PRIORITY,
        TIERS: TIERS,
        STATS: STATS,
        getStats: getStats,
        getMultiplier: getMultiplier
    };
})();
