var TroopData = (function () {
    'use strict';

    var TYPES = {
        SIEGE:   { name: 'Siege',   color: '#e07040', bgClass: 'bg-siege',   borderClass: 'border-siege',   colorClass: 'color-siege'   },
        RANGED:  { name: 'Ranged',  color: '#4caf6e', bgClass: 'bg-ranged',  borderClass: 'border-ranged',  colorClass: 'color-ranged'  },
        MOUNTED: { name: 'Mounted', color: '#5b9bd5', bgClass: 'bg-mounted', borderClass: 'border-mounted', colorClass: 'color-mounted' },
        GROUND:  { name: 'Ground',  color: '#d4a843', bgClass: 'bg-ground',  borderClass: 'border-ground',  colorClass: 'color-ground'  }
    };

    // Phase order: longest range fires first, speed tiebreak
    var PHASE_ORDER = ['SIEGE', 'RANGED', 'MOUNTED', 'GROUND'];

    // Targeting priority chains (1 = first choice)
    var TARGET_PRIORITY = {
        SIEGE:   ['SIEGE', 'RANGED', 'GROUND', 'MOUNTED'],
        RANGED:  ['MOUNTED', 'RANGED', 'GROUND', 'SIEGE'],
        MOUNTED: ['GROUND', 'SIEGE', 'MOUNTED', 'RANGED'],
        GROUND:  ['RANGED', 'SIEGE', 'GROUND', 'MOUNTED']
    };

    // Damage multipliers: ATTACKER_TYPE -> DEFENDER_TYPE -> multiplier
    var DAMAGE_MULTIPLIERS = {
        RANGED:  { MOUNTED: 1.2 },
        MOUNTED: { GROUND: 1.2 },
        GROUND:  { RANGED: 1.2 },
        SIEGE:   { SIEGE: 1.5 }
    };

    function getMultiplier(attackerType, defenderType) {
        var m = DAMAGE_MULTIPLIERS[attackerType];
        return (m && m[defenderType]) || 1.0;
    }

    var TIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

    // Base stats: [ATK, DEF, HP, Speed, Range]
    var STATS = {
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
            14: [3570, 10330, 20440,   350, 50]
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
            14: [4070, 3280,  8000,   100, 500]
        },
        MOUNTED: {
            1:  [220,   150,   400,   600, 50],
            2:  [300,   200,   540,   600, 50],
            3:  [410,   270,   730,   600, 50],
            4:  [550,   360,   990,   600, 50],
            5:  [740,   490,  1340,   600, 50],
            6:  [1000,  660,  1810,   600, 50],
            7:  [1350,  890,  2440,   600, 50],
            8:  [1820, 1200,  3290,   600, 50],
            9:  [2460, 1620,  4440,   600, 50],
            10: [3320, 2190,  5990,   600, 50],
            11: [4150, 2740,  7490,   600, 50],
            12: [5187, 3425,  9362,   600, 50],
            13: [5800, 3830, 10480,   600, 50],
            14: [6670, 4400, 12050,   600, 50]
        },
        SIEGE: {
            1:  [100,   50,   100,   75, 1400],
            2:  [140,   70,   140,   75, 1400],
            3:  [190,   90,   190,   75, 1400],
            4:  [260,  120,   260,   75, 1400],
            5:  [350,  160,   350,   75, 1556],
            6:  [470,  220,   470,   75, 1556],
            7:  [630,  300,   630,   75, 1556],
            8:  [850,  410,   850,   75, 1556],
            9:  [1150, 550,  1150,   75, 1711],
            10: [1550, 740,  1550,   75, 1711],
            11: [1940, 930,  1940,   75, 1867],
            12: [2425, 1162, 2425,   75, 1867],
            13: [2780, 1330, 2780,   75, 2178],
            14: [3280, 1560, 3280,   75, 2178]
        }
    };

    function getStats(type, tier) {
        var s = STATS[type][tier];
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
