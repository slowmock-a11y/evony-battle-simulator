var BattleEngine = (function () {
    'use strict';

    // --- Model ---

    function createLayer(type, tier, count) {
        var stats = TroopData.getStats(type, tier);
        return {
            type: type,
            tier: tier,
            count: count,
            startCount: count,
            atk: stats.atk,
            def: stats.def,
            hp: stats.hp
        };
    }

    function createArmy(troopCounts, buffs) {
        // troopCounts: { GROUND: { 1: 1000, 2: 500, ... }, RANGED: {...}, ... }
        // buffs: { GROUND: { atk: 0, def: 0, hp: 0 }, ... }
        var layers = [];
        TroopData.PHASE_ORDER.forEach(function (type) {
            TroopData.TIERS.forEach(function (tier) {
                var count = (troopCounts[type] && troopCounts[type][tier]) || 0;
                if (count > 0) {
                    layers.push(createLayer(type, tier, count));
                }
            });
        });
        return {
            layers: layers,
            buffs: buffs || {
                GROUND:  { atk: 0, def: 0, hp: 0 },
                RANGED:  { atk: 0, def: 0, hp: 0 },
                MOUNTED: { atk: 0, def: 0, hp: 0 },
                SIEGE:   { atk: 0, def: 0, hp: 0 }
            }
        };
    }

    // --- Effective stats with buffs ---

    function effectiveAtk(layer, buffs) {
        var b = buffs[layer.type] || { atk: 0 };
        return layer.atk * (1 + (b.atk || 0) / 100);
    }

    function effectiveDef(layer, buffs) {
        var b = buffs[layer.type] || { def: 0 };
        return layer.def * (1 + (b.def || 0) / 100);
    }

    function effectiveHp(layer, buffs) {
        var b = buffs[layer.type] || { hp: 0 };
        return layer.hp * (1 + (b.hp || 0) / 100);
    }

    // --- Damage Calculation ---

    function calculateDamage(attackerLayer, targetLayer, attackerBuffs, defenderBuffs) {
        var atkVal = effectiveAtk(attackerLayer, attackerBuffs);
        var defVal = effectiveDef(targetLayer, defenderBuffs);
        var modifier = TroopData.getMultiplier(attackerLayer.type, targetLayer.type);
        var damage = attackerLayer.count * atkVal * modifier * (atkVal / (atkVal + defVal));
        var targetHp = effectiveHp(targetLayer, defenderBuffs);
        var kills = Math.min(Math.floor(damage / targetHp), targetLayer.count);
        return { damage: damage, kills: kills, modifier: modifier };
    }

    // --- Target Selection ---

    function selectTarget(attackerLayer, enemyArmy) {
        var chain = TroopData.TARGET_PRIORITY[attackerLayer.type];
        for (var i = 0; i < chain.length; i++) {
            var targetType = chain[i];
            // Find alive layers of this type, sorted: highest tier first, then largest count
            var candidates = [];
            for (var j = 0; j < enemyArmy.layers.length; j++) {
                var l = enemyArmy.layers[j];
                if (l.count > 0 && l.type === targetType) {
                    candidates.push(l);
                }
            }
            if (candidates.length > 0) {
                candidates.sort(function (a, b) {
                    if (b.tier !== a.tier) return b.tier - a.tier; // highest tier first
                    return b.count - a.count; // largest count first
                });
                return candidates[0];
            }
        }
        return null;
    }

    // --- Battle Simulation ---

    function simulate(attackerArmy, defenderArmy) {
        var events = [];
        var round = 0;
        var maxRounds = 100; // safety cap

        while (armyAlive(attackerArmy) && armyAlive(defenderArmy) && round < maxRounds) {
            round++;
            for (var p = 0; p < TroopData.PHASE_ORDER.length; p++) {
                var phase = TroopData.PHASE_ORDER[p];

                // Attacker strikes
                executePhase(phase, attackerArmy, defenderArmy, 'ATTACKER', round, events);
                // Defender survivors counter-attack
                executePhase(phase, defenderArmy, attackerArmy, 'DEFENDER', round, events);

                if (!armyAlive(attackerArmy) || !armyAlive(defenderArmy)) break;
            }
        }

        var winner = armyAlive(attackerArmy) ? 'ATTACKER' :
                     armyAlive(defenderArmy) ? 'DEFENDER' : 'DRAW';

        return {
            events: events,
            rounds: round,
            winner: winner,
            attacker: armySummary(attackerArmy),
            defender: armySummary(defenderArmy)
        };
    }

    function executePhase(phase, actingArmy, enemyArmy, side, round, events) {
        // Get layers of this type, sorted highest tier first
        var layers = [];
        for (var i = 0; i < actingArmy.layers.length; i++) {
            var l = actingArmy.layers[i];
            if (l.count > 0 && l.type === phase) {
                layers.push(l);
            }
        }
        layers.sort(function (a, b) { return b.tier - a.tier; });

        for (var j = 0; j < layers.length; j++) {
            var attacker = layers[j];
            if (attacker.count <= 0) continue;

            var target = selectTarget(attacker, enemyArmy);
            if (!target) continue;

            var countBefore = target.count;
            var result = calculateDamage(attacker, target, actingArmy.buffs, enemyArmy.buffs);
            target.count -= result.kills;

            events.push({
                round: round,
                phase: phase,
                side: side,
                sourceType: attacker.type,
                sourceTier: attacker.tier,
                sourceCount: attacker.count,
                targetType: target.type,
                targetTier: target.tier,
                targetCountBefore: countBefore,
                damage: Math.round(result.damage),
                kills: result.kills,
                remaining: target.count,
                modifier: result.modifier
            });
        }
    }

    function armyAlive(army) {
        for (var i = 0; i < army.layers.length; i++) {
            if (army.layers[i].count > 0) return true;
        }
        return false;
    }

    function armySummary(army) {
        var summary = {};
        var total = 0, totalStart = 0;
        for (var i = 0; i < army.layers.length; i++) {
            var l = army.layers[i];
            if (!summary[l.type]) summary[l.type] = { remaining: 0, start: 0, layers: [] };
            summary[l.type].remaining += l.count;
            summary[l.type].start += l.startCount;
            summary[l.type].layers.push({ tier: l.tier, count: l.count, start: l.startCount });
            total += l.count;
            totalStart += l.startCount;
        }
        summary._total = total;
        summary._totalStart = totalStart;
        return summary;
    }

    return {
        createArmy: createArmy,
        simulate: simulate,
        effectiveAtk: effectiveAtk,
        effectiveDef: effectiveDef,
        effectiveHp: effectiveHp
    };
})();
