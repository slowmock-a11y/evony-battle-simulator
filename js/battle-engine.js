var BattleEngine = (function () {
    'use strict';

    // --- Model ---

    var BATTLEFIELD_LENGTH = 5200;

    function createLayer(type, tier, count) {
        var stats = TroopData.getStats(type, tier);
        return {
            type: type,
            tier: tier,
            count: count,
            startCount: count,
            atk: stats.atk,
            def: stats.def,
            hp: stats.hp,
            range: stats.range
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

    // --- Position Tracking ---

    function layerKey(type, tier) {
        return type + '_' + tier;
    }

    function initPositions(attackerArmy, defenderArmy) {
        var att = {};
        var def = {};
        for (var i = 0; i < attackerArmy.layers.length; i++) {
            var l = attackerArmy.layers[i];
            att[layerKey(l.type, l.tier)] = 0;
        }
        for (var i = 0; i < defenderArmy.layers.length; i++) {
            var l = defenderArmy.layers[i];
            def[layerKey(l.type, l.tier)] = BATTLEFIELD_LENGTH;
        }
        return { ATT: att, DEF: def };
    }

    function snapshotPositions(positions) {
        var att = {};
        var def = {};
        for (var key in positions.ATT) att[key] = positions.ATT[key];
        for (var key in positions.DEF) def[key] = positions.DEF[key];
        return { ATT: att, DEF: def };
    }

    function deriveTypePositions(sidePositions, side) {
        var result = {};
        for (var key in sidePositions) {
            var type = key.split('_')[0];
            var pos = sidePositions[key];
            if (result[type] === undefined) {
                result[type] = pos;
            } else if (side === 'ATT') {
                result[type] = Math.max(result[type], pos);
            } else {
                result[type] = Math.min(result[type], pos);
            }
        }
        return result;
    }

    function getMaxRange(army, type) {
        var maxR = 0;
        for (var i = 0; i < army.layers.length; i++) {
            var l = army.layers[i];
            if (l.type === type && l.count > 0) {
                maxR = Math.max(maxR, l.range);
            }
        }
        return maxR;
    }

    function hasAliveLayers(army, type) {
        for (var i = 0; i < army.layers.length; i++) {
            if (army.layers[i].type === type && army.layers[i].count > 0) return true;
        }
        return false;
    }

    function evaluateMovement(type, positions, attackerArmy, defenderArmy) {
        var speed = TroopData.getStats(type, 1).speed;
        var moves = [];

        // Collect alive enemy layer positions for range/collision checks
        var aliveDefPositions = [];
        for (var i = 0; i < defenderArmy.layers.length; i++) {
            var l = defenderArmy.layers[i];
            if (l.count > 0) aliveDefPositions.push(positions.DEF[layerKey(l.type, l.tier)]);
        }
        var aliveAttPositions = [];
        for (var i = 0; i < attackerArmy.layers.length; i++) {
            var l = attackerArmy.layers[i];
            if (l.count > 0) aliveAttPositions.push(positions.ATT[layerKey(l.type, l.tier)]);
        }

        // Attacker layers: each independently holds or advances
        for (var i = 0; i < attackerArmy.layers.length; i++) {
            var layer = attackerArmy.layers[i];
            if (layer.type !== type || layer.count <= 0) continue;
            var key = layerKey(type, layer.tier);
            var from = positions.ATT[key];
            var held = false;

            for (var j = 0; j < aliveDefPositions.length; j++) {
                if (aliveDefPositions[j] - from <= layer.range) {
                    held = true;
                    break;
                }
            }

            var newPos = from;
            if (!held) {
                newPos = from + speed;
                // Collision: can't pass any alive enemy layer
                for (var j = 0; j < aliveDefPositions.length; j++) {
                    newPos = Math.min(newPos, aliveDefPositions[j] - 50);
                }
            }

            positions.ATT[key] = newPos;
            moves.push({ side: 'ATT', type: type, tier: layer.tier, from: from, to: newPos, held: held });
        }

        // Recompute ATT positions after attacker movement for defender checks
        var updatedAttPositions = [];
        for (var i = 0; i < attackerArmy.layers.length; i++) {
            var l = attackerArmy.layers[i];
            if (l.count > 0) updatedAttPositions.push(positions.ATT[layerKey(l.type, l.tier)]);
        }

        // Defender layers: each independently holds or advances
        for (var i = 0; i < defenderArmy.layers.length; i++) {
            var layer = defenderArmy.layers[i];
            if (layer.type !== type || layer.count <= 0) continue;
            var key = layerKey(type, layer.tier);
            var from = positions.DEF[key];
            var held = false;

            for (var j = 0; j < updatedAttPositions.length; j++) {
                if (from - updatedAttPositions[j] <= layer.range) {
                    held = true;
                    break;
                }
            }

            var newPos = from;
            if (!held) {
                newPos = from - speed;
                // Collision: can't pass any alive enemy layer
                for (var j = 0; j < updatedAttPositions.length; j++) {
                    newPos = Math.max(newPos, updatedAttPositions[j] + 50);
                }
            }

            positions.DEF[key] = newPos;
            moves.push({ side: 'DEF', type: type, tier: layer.tier, from: from, to: newPos, held: held });
        }

        return moves;
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
        var modifier = TroopData.getMultiplier(attackerLayer.type, targetLayer.type, attackerLayer.tier);
        var damage = attackerLayer.count * atkVal * modifier * (atkVal / (atkVal + defVal));
        var targetHp = effectiveHp(targetLayer, defenderBuffs);
        var kills = Math.min(damage / targetHp, targetLayer.count);
        return { damage: damage, kills: kills, modifier: modifier };
    }

    // Counter-strike: simplified flat formula — target's ATK / attacker's HP, no modifier, no DEF ratio
    // Not scaled by troop count — represents incidental return damage per engagement
    function calculateCounterKills(attackerLayer, targetLayer, attackerBuffs, defenderBuffs) {
        var targetAtk = effectiveAtk(targetLayer, defenderBuffs);
        var sourceHp = effectiveHp(attackerLayer, attackerBuffs);
        return Math.min(targetAtk / sourceHp, attackerLayer.count);
    }

    // --- Target Selection ---

    function selectTarget(attackerLayer, enemyArmy, sourcePos, enemyPositions) {
        var layerRange = attackerLayer.range;
        var chain = TroopData.TARGET_PRIORITY[attackerLayer.type];
        for (var i = 0; i < chain.length; i++) {
            var targetType = chain[i];

            // Find alive layers of this type that are within firing range
            var candidates = [];
            for (var j = 0; j < enemyArmy.layers.length; j++) {
                var l = enemyArmy.layers[j];
                if (l.count > 0 && l.type === targetType) {
                    var distance = Math.abs(enemyPositions[layerKey(l.type, l.tier)] - sourcePos);
                    if (distance <= layerRange) {
                        candidates.push(l);
                    }
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

    function simulate(attackerArmy, defenderArmy, options) {
        var opts = options || {};
        var events = [];
        var round = 0;
        var maxRounds = opts.maxRounds || 100;
        var positions = initPositions(attackerArmy, defenderArmy);

        while (armyAlive(attackerArmy) && armyAlive(defenderArmy) && round < maxRounds) {
            round++;
            for (var p = 0; p < TroopData.PHASE_ORDER.length; p++) {
                var phase = TroopData.PHASE_ORDER[p];

                // Movement evaluation for this type
                var moves = evaluateMovement(phase, positions, attackerArmy, defenderArmy);
                if (moves.length > 0) {
                    events.push({
                        eventType: 'move',
                        round: round,
                        phase: phase,
                        moves: moves,
                        positions: snapshotPositions(positions)
                    });
                }

                // Attacker strikes (range-gated)
                executePhase(phase, attackerArmy, defenderArmy, 'ATTACKER', round, events, positions);
                // Defender survivors counter-attack (range-gated)
                executePhase(phase, defenderArmy, attackerArmy, 'DEFENDER', round, events, positions);

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
            defender: armySummary(defenderArmy),
            positions: snapshotPositions(positions)
        };
    }

    function executePhase(phase, actingArmy, enemyArmy, side, round, events, positions) {
        // Get layers of this type, sorted highest tier first
        var layers = [];
        for (var i = 0; i < actingArmy.layers.length; i++) {
            var l = actingArmy.layers[i];
            if (l.count > 0 && l.type === phase) {
                layers.push(l);
            }
        }
        layers.sort(function (a, b) { return b.tier - a.tier; });

        var sourceKey = side === 'ATTACKER' ? 'ATT' : 'DEF';
        var enemyKey = side === 'ATTACKER' ? 'DEF' : 'ATT';
        var enemyPositions = positions[enemyKey];

        for (var j = 0; j < layers.length; j++) {
            var attacker = layers[j];
            if (attacker.count <= 0) continue;

            var layerPos = positions[sourceKey][layerKey(phase, attacker.tier)];
            var target = selectTarget(attacker, enemyArmy, layerPos, enemyPositions);
            if (!target) continue;

            var countBefore = target.count;
            var result = calculateDamage(attacker, target, actingArmy.buffs, enemyArmy.buffs);
            target.count -= result.kills;

            events.push({
                eventType: 'attack',
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
                modifier: result.modifier,
                positions: snapshotPositions(positions)
            });

            // Counter-strike: surviving target strikes back if within range
            var targetPos = positions[enemyKey][layerKey(target.type, target.tier)];
            var distance = Math.abs(targetPos - layerPos);
            if (target.count > 0 && attacker.count > 0 && distance <= target.range) {
                var attackerCountBefore = attacker.count;
                var counterKills = calculateCounterKills(attacker, target, actingArmy.buffs, enemyArmy.buffs);
                attacker.count -= counterKills;

                events.push({
                    eventType: 'counter',
                    round: round,
                    phase: phase,
                    side: side,
                    sourceType: target.type,
                    sourceTier: target.tier,
                    sourceCount: target.count,
                    targetType: attacker.type,
                    targetTier: attacker.tier,
                    targetCountBefore: attackerCountBefore,
                    kills: counterKills,
                    remaining: attacker.count,
                    positions: snapshotPositions(positions)
                });
            }
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
        effectiveHp: effectiveHp,
        deriveTypePositions: deriveTypePositions
    };
})();
