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

    function initPositions() {
        return {
            ATT: { SIEGE: 0, RANGED: 0, MOUNTED: 0, GROUND: 0 },
            DEF: { SIEGE: BATTLEFIELD_LENGTH, RANGED: BATTLEFIELD_LENGTH, MOUNTED: BATTLEFIELD_LENGTH, GROUND: BATTLEFIELD_LENGTH }
        };
    }

    function snapshotPositions(positions) {
        return {
            ATT: { SIEGE: positions.ATT.SIEGE, RANGED: positions.ATT.RANGED, MOUNTED: positions.ATT.MOUNTED, GROUND: positions.ATT.GROUND },
            DEF: { SIEGE: positions.DEF.SIEGE, RANGED: positions.DEF.RANGED, MOUNTED: positions.DEF.MOUNTED, GROUND: positions.DEF.GROUND }
        };
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

    function getAlivePositions(army, sidePositions) {
        var result = {};
        var seen = {};
        for (var i = 0; i < army.layers.length; i++) {
            var l = army.layers[i];
            if (l.count > 0 && !seen[l.type]) {
                result[l.type] = sidePositions[l.type];
                seen[l.type] = true;
            }
        }
        return result;
    }

    function evaluateMovement(type, positions, attackerArmy, defenderArmy) {
        var speed = TroopData.getStats(type, 1).speed;
        var attAlive = hasAliveLayers(attackerArmy, type);
        var defAlive = hasAliveLayers(defenderArmy, type);

        var attFrom = positions.ATT[type];
        var defFrom = positions.DEF[type];
        var attNew = attFrom;
        var defNew = defFrom;
        var attHeld = true;
        var defHeld = true;

        var aliveDefPositions = getAlivePositions(defenderArmy, positions.DEF);
        var aliveAttPositions = getAlivePositions(attackerArmy, positions.ATT);

        // Attacker hold-or-advance
        if (attAlive) {
            var attRange = getMaxRange(attackerArmy, type);
            var inRange = false;
            for (var t in aliveDefPositions) {
                if (aliveDefPositions[t] - attFrom <= attRange) {
                    inRange = true;
                    break;
                }
            }
            if (inRange) {
                attHeld = true;
            } else {
                attHeld = false;
                attNew = attFrom + speed;
            }
        }

        // Defender hold-or-advance
        if (defAlive) {
            var defRange = getMaxRange(defenderArmy, type);
            var inRange = false;
            for (var t in aliveAttPositions) {
                if (defFrom - aliveAttPositions[t] <= defRange) {
                    inRange = true;
                    break;
                }
            }
            if (inRange) {
                defHeld = true;
            } else {
                defHeld = false;
                defNew = defFrom - speed;
            }
        }

        // Collision cap against OTHER alive enemy types (non-moving this phase)
        if (attAlive && !attHeld) {
            for (var t in aliveDefPositions) {
                if (t === type && !defHeld) continue; // same-type handled below
                attNew = Math.min(attNew, aliveDefPositions[t] - 50);
            }
        }
        if (defAlive && !defHeld) {
            for (var t in aliveAttPositions) {
                if (t === type && !attHeld) continue;
                defNew = Math.max(defNew, aliveAttPositions[t] + 50);
            }
        }

        // Same-type collision
        if (attAlive && defAlive) {
            if (!attHeld && !defHeld && attNew >= defNew - 50) {
                // Both advancing, would cross — meet at midpoint with 50 gap
                var mid = (attFrom + defFrom) / 2;
                attNew = mid - 25;
                defNew = mid + 25;
            } else if (!attHeld && attNew >= defNew - 50) {
                attNew = defNew - 50;
            } else if (!defHeld && defNew <= attNew + 50) {
                defNew = attNew + 50;
            }
        }

        positions.ATT[type] = attNew;
        positions.DEF[type] = defNew;

        var moves = [];
        if (attAlive) {
            moves.push({ side: 'ATT', type: type, from: attFrom, to: attNew, held: attHeld });
        }
        if (defAlive) {
            moves.push({ side: 'DEF', type: type, from: defFrom, to: defNew, held: defHeld });
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
        var modifier = TroopData.getMultiplier(attackerLayer.type, targetLayer.type);
        var damage = attackerLayer.count * atkVal * modifier * (atkVal / (atkVal + defVal));
        var targetHp = effectiveHp(targetLayer, defenderBuffs);
        var kills = Math.min(Math.floor(damage / targetHp), targetLayer.count);
        return { damage: damage, kills: kills, modifier: modifier };
    }

    // --- Target Selection ---

    function resolveLockedTargetType(phase, actingArmy, enemyArmy, sourcePos, enemyPositions) {
        var maxRange = getMaxRange(actingArmy, phase);
        var chain = TroopData.TARGET_PRIORITY[phase];
        for (var i = 0; i < chain.length; i++) {
            var targetType = chain[i];
            var distance = Math.abs(enemyPositions[targetType] - sourcePos);
            if (distance > maxRange) continue;
            if (hasAliveLayers(enemyArmy, targetType)) return targetType;
        }
        return null;
    }

    function selectTarget(attackerLayer, enemyArmy, sourcePos, enemyPositions, lockedType) {
        var layerRange = attackerLayer.range;
        var chain = lockedType ? [lockedType] : TroopData.TARGET_PRIORITY[attackerLayer.type];
        for (var i = 0; i < chain.length; i++) {
            var targetType = chain[i];
            // Range check: is this target type within firing range?
            var distance = Math.abs(enemyPositions[targetType] - sourcePos);
            if (distance > layerRange) continue;

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
        var positions = initPositions();

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
        var sourcePos = positions[sourceKey][phase];
        var enemyPositions = positions[enemyKey];

        // Lock target type once for all tiers in this phase
        var lockedType = resolveLockedTargetType(phase, actingArmy, enemyArmy, sourcePos, enemyPositions);

        for (var j = 0; j < layers.length; j++) {
            var attacker = layers[j];
            if (attacker.count <= 0) continue;

            var target = selectTarget(attacker, enemyArmy, sourcePos, enemyPositions, lockedType);
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
