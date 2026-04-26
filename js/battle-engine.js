var BattleEngine = (function () {
    'use strict';

    // --- Model ---

    const BATTLEFIELD_LENGTH = 1500;

    function createLayer(type, tier, count) {
        const stats = TroopData.getStats(type, tier);
        return {
            type: type,
            tier: tier,
            count: count,
            startCount: count,
            atk: stats.atk,
            def: stats.def,
            hp: stats.hp,
            speed: stats.speed,
            range: stats.range,
            engagedTargetType: null  // engagement lock: current target type
        };
    }

    function createArmy(troopCounts, buffs, archerTower) {
        // troopCounts: { GROUND: { 1: 1000, 2: 500, ... }, RANGED: {...}, ... }
        // buffs: { GROUND: { atk: 0, def: 0, hp: 0 }, ... }
        // archerTower (optional, defender-only): { atk, hp, range, phantomFire }
        const layers = [];
        TroopData.PHASE_ORDER.forEach((type) => {
            if (type === 'ARCHER_TOWER') return; // synthetic layer added below
            TroopData.TIERS.forEach((tier) => {
                const count = (troopCounts[type] && troopCounts[type][tier]) || 0;
                if (count > 0) {
                    const layer = createLayer(type, tier, count);
                    const rangeBuff = buffs && buffs[type] && buffs[type].range || 0;
                    const rangeFlat = buffs && buffs[type] && buffs[type].rangeFlat || 0;
                    if (rangeBuff || rangeFlat) {
                        layer.range = Math.max(0, Math.round(layer.range * (1 + rangeBuff / 100)) + rangeFlat);
                    }
                    layers.push(layer);
                }
            });
        });
        // Archer Tower is defender-only and synthesized as a count=1 fractional-HP layer.
        // The buffs object intentionally has no ARCHER_TOWER key so effective* helpers
        // fall through to the raw layer values — AT bypasses %-buff multiplication.
        if (archerTower && (archerTower.atk > 0 || archerTower.hp > 0 || archerTower.range > 0)) {
            layers.push({
                type: 'ARCHER_TOWER',
                tier: 1,
                count: 1,
                startCount: 1,
                atk: archerTower.atk || 0,
                def: 0,
                hp: archerTower.hp || 0,
                speed: 0,
                range: archerTower.range || 0,
                engagedTargetType: null,
                phantomFire: !!archerTower.phantomFire,
                aliveAtRoundStart: true,
                phantomFireUsed: false
            });
        }
        return {
            layers: layers,
            buffs: buffs || {
                GROUND:  { atk: 0, def: 0, hp: 0 },
                RANGED:  { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 },
                MOUNTED: { atk: 0, def: 0, hp: 0 },
                SIEGE:   { atk: 0, def: 0, hp: 0, range: 0, rangeFlat: 0 }
            }
        };
    }

    // --- Position Tracking ---

    function layerKey(type, tier) {
        return `${type}_${tier}`;
    }

    function initPositions(attackerArmy, defenderArmy) {
        const att = {};
        const def = {};
        attackerArmy.layers.forEach((l) => { att[layerKey(l.type, l.tier)] = 0; });
        defenderArmy.layers.forEach((l) => { def[layerKey(l.type, l.tier)] = BATTLEFIELD_LENGTH; });
        return { ATT: att, DEF: def };
    }

    function snapshotPositions(positions) {
        return { ATT: { ...positions.ATT }, DEF: { ...positions.DEF } };
    }

    function deriveTypePositions(sidePositions, side) {
        const result = {};
        for (const key in sidePositions) {
            const type = key.split('_')[0];
            const pos = sidePositions[key];
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
        let maxR = 0;
        army.layers.forEach((l) => {
            if (l.type === type && l.count > 0) {
                maxR = Math.max(maxR, l.range);
            }
        });
        return maxR;
    }

    function hasAliveLayers(army, type) {
        return army.layers.some((l) => l.type === type && l.count > 0);
    }

    // Find the nearest enemy position of a specific type for minimum-distance calculation
    function findPriorityTargetDistance(layer, myPos, enemyArmy, enemyPositions, direction) {
        const chain = TroopData.TARGET_PRIORITY[layer.type];
        for (let i = 0; i < chain.length; i++) {
            const targetType = chain[i];
            for (let j = 0; j < enemyArmy.layers.length; j++) {
                const el = enemyArmy.layers[j];
                if (el.count > 0 && el.type === targetType) {
                    const ePos = enemyPositions[layerKey(el.type, el.tier)];
                    return direction === 1 ? (ePos - myPos) : (myPos - ePos);
                }
            }
        }
        return Infinity;
    }

    function evaluateMovement(type, positions, attackerArmy, defenderArmy) {
        // Archer Tower never moves — it's a stationary defender fixture at the wall.
        if (type === 'ARCHER_TOWER') return [];

        // Speed is read per-layer (layer.speed) because Siege T16 has speed 76
        // while Siege T1–T15 has speed 75. All other types are flat across tiers.
        //
        // Defender moves first (defender-first rule on same-speed tie). Within each
        // phase both sides have the same troop type and therefore the same speed, so
        // the defender always goes first. ATT then evaluates movement against DEF's
        // already-updated positions, which causes ATT to be "held" naturally once DEF
        // has advanced to within attack range — no post-collision logic required.
        const moves = [];

        // Step 1: snapshot ATT positions for DEF's movement reference.
        const preMoveAtt = { ...positions.ATT };

        const aliveAttPositions = [];
        attackerArmy.layers.forEach((l) => {
            if (l.count > 0) aliveAttPositions.push(preMoveAtt[layerKey(l.type, l.tier)]);
        });

        // Step 2: compute and apply DEF moves (uses ATT pre-move snapshot).
        const defMoves = [];
        for (let i = 0; i < defenderArmy.layers.length; i++) {
            const layer = defenderArmy.layers[i];
            if (layer.type !== type || layer.count <= 0) continue;
            const key = layerKey(type, layer.tier);
            const from = positions.DEF[key];
            const effectiveRange = layer.speed + layer.range;
            let held = false;

            for (let j = 0; j < aliveAttPositions.length; j++) {
                if (from - aliveAttPositions[j] <= layer.range) {
                    held = true;
                    break;
                }
            }

            let newPos = from;
            if (!held) {
                const distToTarget = findPriorityTargetDistance(layer, from, attackerArmy, preMoveAtt, -1);
                if (distToTarget <= effectiveRange) {
                    const moveNeeded = distToTarget - layer.range;
                    newPos = from - Math.max(0, moveNeeded);
                } else {
                    newPos = from - layer.speed;
                }
                for (let j = 0; j < aliveAttPositions.length; j++) {
                    newPos = Math.max(newPos, aliveAttPositions[j] + 50);
                }
            }

            defMoves.push({ key: key, from: from, to: newPos, tier: layer.tier, held: held });
            positions.DEF[key] = newPos;
        }

        // Step 3: compute and apply ATT moves against DEF's updated positions.
        const aliveDefPositions = [];
        defenderArmy.layers.forEach((l) => {
            if (l.count > 0) aliveDefPositions.push(positions.DEF[layerKey(l.type, l.tier)]);
        });

        const attMoves = [];
        for (let i = 0; i < attackerArmy.layers.length; i++) {
            const layer = attackerArmy.layers[i];
            if (layer.type !== type || layer.count <= 0) continue;
            const key = layerKey(type, layer.tier);
            const from = positions.ATT[key];
            const effectiveRange = layer.speed + layer.range;
            let held = false;

            for (let j = 0; j < aliveDefPositions.length; j++) {
                if (aliveDefPositions[j] - from <= layer.range) {
                    held = true;
                    break;
                }
            }

            let newPos = from;
            if (!held) {
                const distToTarget = findPriorityTargetDistance(layer, from, defenderArmy, positions.DEF, 1);
                if (distToTarget <= effectiveRange) {
                    const moveNeeded = distToTarget - layer.range;
                    newPos = from + Math.max(0, moveNeeded);
                } else {
                    newPos = from + layer.speed;
                }
                for (let j = 0; j < aliveDefPositions.length; j++) {
                    newPos = Math.min(newPos, aliveDefPositions[j] - 50);
                }
            }

            attMoves.push({ key: key, from: from, to: newPos, tier: layer.tier, held: held });
            positions.ATT[key] = newPos;
        }

        // Build event moves: DEF first (it moved first), then ATT.
        defMoves.forEach((m) => {
            moves.push({ side: 'DEF', type: type, tier: m.tier, from: m.from, to: m.to, held: m.held });
        });
        attMoves.forEach((m) => {
            moves.push({ side: 'ATT', type: type, tier: m.tier, from: m.from, to: m.to, held: m.held });
        });

        return moves;
    }

    // --- Effective stats with buffs ---

    function effectiveAtk(layer, buffs) {
        const b = buffs[layer.type] || { atk: 0 };
        return layer.atk * (1 + (b.atk || 0) / 100);
    }

    function effectiveDef(layer, buffs) {
        const b = buffs[layer.type] || { def: 0 };
        return layer.def * (1 + (b.def || 0) / 100);
    }

    function effectiveHp(layer, buffs) {
        const b = buffs[layer.type] || { hp: 0 };
        return layer.hp * (1 + (b.hp || 0) / 100);
    }

    // --- Damage Calculation ---

    function calculateDamage(attackerLayer, targetLayer, attackerBuffs, defenderBuffs) {
        const atkVal = effectiveAtk(attackerLayer, attackerBuffs);
        const defVal = effectiveDef(targetLayer, defenderBuffs);
        const modifier = TroopData.getMultiplier(attackerLayer.type, targetLayer.type, attackerLayer.tier);
        const damage = attackerLayer.count * atkVal * modifier * (atkVal / (atkVal + defVal));
        const targetHp = effectiveHp(targetLayer, defenderBuffs);
        const kills = Math.min(damage / targetHp, targetLayer.count);
        return { damage: damage, kills: kills, modifier: modifier };
    }

    // Counter-strike: casualties-counter form. The troops killed in the main strike
    // fire back one last time using the full damage formula (target as attacker,
    // attacker as target). Target modifier and DEF ratio both apply.
    function calculateCounterKills(attackerLayer, targetLayer, attackerBuffs, defenderBuffs, killsDealt) {
        const targetAtk = effectiveAtk(targetLayer, defenderBuffs);
        const sourceDef = effectiveDef(attackerLayer, attackerBuffs);
        const sourceHp = effectiveHp(attackerLayer, attackerBuffs);
        const modifier = TroopData.getMultiplier(targetLayer.type, attackerLayer.type, targetLayer.tier);
        const counterDamage = killsDealt * targetAtk * modifier * targetAtk / (targetAtk + sourceDef);
        return Math.min(counterDamage / sourceHp, attackerLayer.count);
    }

    // --- Target Selection ---

    function selectTarget(attackerLayer, enemyArmy, sourcePos, enemyPositions) {
        const layerRange = attackerLayer.range;
        const effectiveRange = attackerLayer.speed + layerRange;
        const chain = TroopData.TARGET_PRIORITY[attackerLayer.type];

        // Engagement lock: if locked on a type, check if we should stay locked
        if (attackerLayer.engagedTargetType) {
            const lockedType = attackerLayer.engagedTargetType;

            // Check if locked type still has alive troops in actual range
            const lockedCandidates = [];
            for (let j = 0; j < enemyArmy.layers.length; j++) {
                const l = enemyArmy.layers[j];
                if (l.count > 0 && l.type === lockedType) {
                    const distance = Math.abs(enemyPositions[layerKey(l.type, l.tier)] - sourcePos);
                    if (distance <= layerRange) {
                        lockedCandidates.push(l);
                    }
                }
            }

            if (lockedCandidates.length > 0) {
                // Check if a higher-priority type has entered effective range
                let higherPriorityAvailable = false;
                for (let i = 0; i < chain.length; i++) {
                    if (chain[i] === lockedType) break; // reached current lock, nothing higher
                    for (let j = 0; j < enemyArmy.layers.length; j++) {
                        const l = enemyArmy.layers[j];
                        if (l.count > 0 && l.type === chain[i]) {
                            const distance = Math.abs(enemyPositions[layerKey(l.type, l.tier)] - sourcePos);
                            if (distance <= effectiveRange) {
                                higherPriorityAvailable = true;
                                break;
                            }
                        }
                    }
                    if (higherPriorityAvailable) break;
                }

                if (!higherPriorityAvailable) {
                    // Stay locked — pick best candidate of locked type
                    lockedCandidates.sort((a, b) => {
                        if (b.tier !== a.tier) return b.tier - a.tier;
                        return b.count - a.count;
                    });
                    return lockedCandidates[0];
                }
            }

            // Lock broken — target type eliminated or higher priority available
            attackerLayer.engagedTargetType = null;
        }

        // Standard priority chain selection (in actual range)
        for (let i = 0; i < chain.length; i++) {
            const targetType = chain[i];
            const candidates = [];
            for (let j = 0; j < enemyArmy.layers.length; j++) {
                const l = enemyArmy.layers[j];
                if (l.count > 0 && l.type === targetType) {
                    const distance = Math.abs(enemyPositions[layerKey(l.type, l.tier)] - sourcePos);
                    if (distance <= layerRange) {
                        candidates.push(l);
                    }
                }
            }
            if (candidates.length > 0) {
                candidates.sort((a, b) => {
                    if (b.tier !== a.tier) return b.tier - a.tier;
                    return b.count - a.count;
                });
                // Set engagement lock
                attackerLayer.engagedTargetType = targetType;
                return candidates[0];
            }
        }
        return null;
    }

    // --- Battle Simulation ---

    function simulate(attackerArmy, defenderArmy, options) {
        const opts = options || {};
        const events = [];
        let round = 0;
        const maxRounds = opts.maxRounds ?? 100;
        const positions = initPositions(attackerArmy, defenderArmy);

        while (armyAlive(attackerArmy) && armyAlive(defenderArmy) && round < maxRounds) {
            round++;
            // Snapshot AT alive-state at round start so phantom-fire eligibility
            // is judged against the round's starting condition, not its current one.
            defenderArmy.layers.forEach((l) => {
                if (l.type === 'ARCHER_TOWER') l.aliveAtRoundStart = l.count > 0;
            });
            for (let p = 0; p < TroopData.PHASE_ORDER.length; p++) {
                const phase = TroopData.PHASE_ORDER[p];

                // Movement evaluation for this type
                const moves = evaluateMovement(phase, positions, attackerArmy, defenderArmy);
                if (moves.length > 0) {
                    events.push({
                        eventType: 'move',
                        round: round,
                        phase: phase,
                        moves: moves,
                        positions: snapshotPositions(positions)
                    });
                }

                // Defender strikes first (same-speed tie rule).
                executePhase(phase, defenderArmy, attackerArmy, 'DEF', round, events, positions);
                // Attacker strikes second.
                executePhase(phase, attackerArmy, defenderArmy, 'ATT', round, events, positions);

                // Allow the round to proceed into ARCHER_TOWER phase if defender's AT
                // just died but is still phantom-fire-eligible — it gets one final volley.
                const phantomFirePending = defenderArmy.layers.some((l) =>
                    l.type === 'ARCHER_TOWER' && l.phantomFire && l.aliveAtRoundStart
                    && !l.phantomFireUsed && l.count <= 0
                );
                if (!armyAlive(attackerArmy) || (!armyAlive(defenderArmy) && !phantomFirePending)) break;
            }
        }

        const winner = armyAlive(attackerArmy) ? 'ATTACKER' :
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
        // Get layers of this type, sorted highest tier first.
        // ARCHER_TOWER may also fire on the round it dies if phantom-fire is enabled.
        const layers = actingArmy.layers
            .filter((l) => {
                if (l.type !== phase) return false;
                if (l.count > 0) return true;
                return l.type === 'ARCHER_TOWER' && l.phantomFire && l.aliveAtRoundStart && !l.phantomFireUsed;
            })
            .sort((a, b) => b.tier - a.tier);

        const sourceKey = side;
        const enemyKey = side === 'ATT' ? 'DEF' : 'ATT';
        const enemyPositions = positions[enemyKey];

        for (let j = 0; j < layers.length; j++) {
            const attacker = layers[j];
            const isPhantomShot = attacker.type === 'ARCHER_TOWER' && attacker.count <= 0;
            if (attacker.count <= 0 && !isPhantomShot) continue;

            const layerPos = positions[sourceKey][layerKey(phase, attacker.tier)];

            // Phantom-fire: temporarily restore count to 1 so the damage formula
            // produces a full-strength final volley, then restore and lock the flag
            // so subsequent rounds do not fire again.
            const savedCount = attacker.count;
            if (isPhantomShot) {
                attacker.count = 1;
                attacker.phantomFireUsed = true;
            }

            const target = selectTarget(attacker, enemyArmy, layerPos, enemyPositions);
            if (!target) {
                if (isPhantomShot) attacker.count = savedCount;
                continue;
            }

            // Range guard: verify target is within attacker's actual range
            const targetPos = positions[enemyKey][layerKey(target.type, target.tier)];
            const distance = Math.abs(targetPos - layerPos);
            if (distance > attacker.range) {
                if (isPhantomShot) attacker.count = savedCount;
                continue;
            }

            const countBefore = target.count;
            const result = calculateDamage(attacker, target, actingArmy.buffs, enemyArmy.buffs);
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
                distance: distance,
                positions: snapshotPositions(positions)
            });

            // Restore pre-shot count so the dead AT cannot counter-strike. The
            // `attacker.count > 0` guard below then naturally rejects the counter.
            if (isPhantomShot) attacker.count = savedCount;

            if (target.count > 0 && attacker.count > 0 && distance <= target.range) {
                const attackerCountBefore = attacker.count;
                const counterKills = calculateCounterKills(attacker, target, actingArmy.buffs, enemyArmy.buffs, result.kills);
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
        return army.layers.some((l) => l.count > 0);
    }

    function armySummary(army) {
        const summary = {};
        let total = 0, totalStart = 0;
        army.layers.forEach((l) => {
            if (!summary[l.type]) summary[l.type] = { remaining: 0, start: 0, layers: [] };
            summary[l.type].remaining += l.count;
            summary[l.type].start += l.startCount;
            summary[l.type].layers.push({ tier: l.tier, count: l.count, start: l.startCount });
            total += l.count;
            totalStart += l.startCount;
        });
        summary._total = total;
        summary._totalStart = totalStart;
        return summary;
    }

    return {
        createArmy: createArmy,
        createLayer: createLayer,
        simulate: simulate,
        effectiveAtk: effectiveAtk,
        effectiveDef: effectiveDef,
        effectiveHp: effectiveHp,
        deriveTypePositions: deriveTypePositions,
        calculateDamage: calculateDamage,
        calculateCounterKills: calculateCounterKills
    };
})();
