# battle-engine Specification

## Purpose
Pure-function battle simulator — takes attacker and defender armies and produces a movement+attack event log. Owns phase ordering, per-layer positions, movement, targeting, damage calculation, and counter-strikes.

## Requirements

### Requirement: Phase-based round execution
The battle engine SHALL execute each round in four sequential phases ordered by troop speed (fastest first): Ground (speed 350), Mounted (speed 300), Ranged (speed 100), Siege (speed 75). When two troop types have the same speed, the defender's troops of that type SHALL act first. Within each phase, the attacker's troops of that type SHALL strike first, then the defender's surviving troops of that type SHALL counter-attack.

#### Scenario: Phase order within a round
- **WHEN** a battle round is executed
- **THEN** Ground phase executes first (speed 350), then Mounted (speed 300), then Ranged (speed 100), then Siege (speed 75)

#### Scenario: Attacker strikes before defender in each phase
- **WHEN** the Ranged phase executes with both sides having ranged troops
- **THEN** the attacker's ranged troops deal damage first, reducing the defender's troop counts, before the defender's surviving ranged troops counter-attack

#### Scenario: Speed tie resolution
- **WHEN** two troop types have identical actual speed values
- **THEN** the defender's troops of that type SHALL act before the attacker's troops

### Requirement: Battlefield length
The battlefield SHALL be 1500 units long. The attacker SHALL start at position 0 and the defender SHALL start at position 1500.

#### Scenario: Initial positions
- **WHEN** a battle begins
- **THEN** every attacker layer starts at position 0 and every defender layer starts at position 1500

### Requirement: Per-layer position tracking
The engine SHALL track an independent battlefield position for each layer (type + tier combination) on each side, keyed as `TYPE_TIER` (e.g. `SIEGE_14`, `RANGED_12`). Layers of the same type but different tiers MAY occupy different positions. For visualization compatibility, the engine SHALL expose a helper that derives a per-type position from per-layer positions, using the frontmost alive layer on each side.

#### Scenario: Position snapshot keys
- **WHEN** a battle event is emitted with the attacker having T14 Siege and T1 Siege
- **THEN** the event's `positions.ATT` contains `SIEGE_14` and `SIEGE_1` keys with independent values

#### Scenario: Different tiers hold at different positions
- **WHEN** attacker T14 Siege (range 1400) is at position 100 and attacker T1 Siege (range 900) is also at position 100, and the only defender is at position 1500
- **THEN** T14 Siege holds at 100 (distance 1400 = range 1400) while T1 Siege advances (distance 1400 > range 900)

#### Scenario: Per-type position derivation
- **WHEN** attacker has T14 Siege at 300 and T1 Siege at 100 (both alive)
- **THEN** the derived per-type position for attacker Siege is 300 (frontmost alive layer)

### Requirement: Minimum-distance movement
Each round, before attacking, the engine SHALL evaluate movement for each alive layer whose type matches the active phase. Layers of other types SHALL NOT move during this phase. For each active layer, movement resolves as follows:
1. If any enemy troop is within the layer's actual range from current position -> HOLD (do not move)
2. Else if the highest-priority enemy target is within effective range (actual speed + the layer's own range) -> move the MINIMUM distance needed to bring that target into actual range
3. Else -> advance by full speed toward the enemy side

Attacker and defender moves SHALL be computed from a pre-move position snapshot so both sides decide from the same state. Layers SHALL never reverse direction. Layers SHALL never pass through or closer than 50 units to any alive enemy layer.

#### Scenario: Hold when enemy in range
- **WHEN** an attacker Ranged layer (range 500) is at position 800 and a defender troop is at position 1200 (distance 400)
- **THEN** the Ranged layer holds at position 800 (400 < 500, enemy in range)

#### Scenario: Minimum distance move
- **WHEN** an attacker Ranged layer (range 500, speed 100) is at position 200 and the highest-priority target is at position 900 (distance 700)
- **THEN** effective range = 600, target IS within effective range, layer moves forward by 200 (minimum to bring distance to 500), new position = 400

#### Scenario: Full speed advance when no target in effective range
- **WHEN** an attacker Ground layer (range 50, speed 350) is at position 0 and nearest enemy is at position 1500 (distance 1500)
- **THEN** effective range = 400, target NOT within effective range, layer advances full speed to position 350

#### Scenario: Melee collision
- **WHEN** an attacker Mounted layer would move to position 1100 but a defender troop is at position 1100
- **THEN** the Mounted layer stops at position 1050 (50-unit minimum gap)

### Requirement: Engagement lock
Once a troop layer begins attacking a target troop type, it SHALL continue attacking that same type (targeting the highest-tier layer within it) until one of two conditions is met:
1. All enemy troops of that type are eliminated
2. A higher-priority target type (per the targeting priority chain) enters the layer's effective range

When either condition triggers, the layer SHALL re-evaluate its target using the standard priority chain.

#### Scenario: Locked on target type
- **WHEN** an attacker Ranged layer is attacking defender Mounted troops and defender Mounted still has surviving troops
- **THEN** the Ranged layer continues targeting Mounted (highest tier first) in the next round

#### Scenario: Target type eliminated, re-evaluate
- **WHEN** an attacker Ranged layer was attacking defender Mounted and all defender Mounted are now eliminated
- **THEN** the Ranged layer re-evaluates targeting using priority chain [Mounted, Range, Ground, Siege], selecting the next available type

#### Scenario: Higher priority enters effective range
- **WHEN** an attacker Ranged layer is locked on defender Ranged (priority 2), and defender Mounted (priority 1) moves into the Ranged layer's effective range
- **THEN** the Ranged layer switches target to defender Mounted

### Requirement: Targeting priority chains
Each troop layer SHALL independently select targets using a fixed priority chain filtered by that layer's own range and position. The engine SHALL walk the chain in order, selecting the first enemy type that has surviving troops within the layer's actual range. Within a priority level, the engine SHALL target the highest-tier layer first, then the layer with the largest troop count.

The engine SHALL verify that the selected target is within the attacker's actual range before applying damage. If the target is beyond range, the attack SHALL be skipped.

Priority chains:
- Siege: [Siege, Range, Ground, Mounted]
- Range: [Mounted, Range, Ground, Siege]
- Mounted: [Ground, Siege, Mounted, Range]
- Ground: [Range, Siege, Ground, Mounted]

#### Scenario: Primary target available and in range
- **WHEN** an attacker's Range T14 layer at position 1000 selects a target and the defender has surviving Mounted troops at position 1400 (distance 400, within range 500)
- **THEN** the Range T14 layer targets the highest-tier Mounted layer

#### Scenario: Primary target eliminated, fallback to next priority
- **WHEN** an attacker's Range T14 layer selects a target and the defender has no surviving Mounted troops but has surviving Range troops within range
- **THEN** the Range T14 layer targets the highest-tier Range layer (priority 2)

#### Scenario: Target type out of range, skip to next in chain
- **WHEN** attacker T1 Siege (range 900) is at position 200 and the only surviving enemy Siege is at position 1400 (distance 1200, beyond range 900) but enemy Ranged is at position 1000 (distance 800, within range)
- **THEN** T1 Siege skips Siege (priority 1, out of range) and targets the highest-tier Ranged layer (priority 2)

#### Scenario: Tier-based selection within priority
- **WHEN** an attacker's Range layer targets enemy Mounted and the defender has T14 Mounted (3000) and T12 Mounted (5000)
- **THEN** the Range layer targets T14 Mounted (highest tier first)

#### Scenario: Ground does not attack Siege beyond melee range
- **WHEN** attacker Ground T14 (range 50) is at position 700 and the only surviving enemy is Siege T14 at position 1200 (distance 500)
- **THEN** Ground T14 does not attack (Siege is beyond Ground's 50-unit range) and no damage event is emitted

#### Scenario: Ground attacks Siege only at melee range
- **WHEN** attacker Ground T14 (range 50) is at position 1150 and defender Siege T14 is at position 1200 (distance 50)
- **THEN** Ground T14 attacks Siege T14 (distance 50 equals Ground's range)

### Requirement: Range guard before damage application
The engine SHALL perform an independent range check in the attack execution path, after target selection and before damage calculation. If the distance between the attacker layer's position and the target layer's position exceeds the attacker's actual range, the attack SHALL be skipped. This check is independent of the range check in target selection.

#### Scenario: Range guard prevents out-of-range attack
- **WHEN** `selectTarget` returns Siege T14 at position 1200 as target for Ground T14 at position 700 (distance 500, Ground range 50)
- **THEN** the range guard detects distance 500 > range 50, skips the attack, and no damage is applied

#### Scenario: Range guard allows in-range attack
- **WHEN** `selectTarget` returns Siege T14 at position 800 as target for Ground T14 at position 750 (distance 50, Ground range 50)
- **THEN** the range guard confirms distance 50 <= range 50 and the attack proceeds normally

### Requirement: Distance in attack events
Each attack event SHALL include a `distance` field recording the distance between the attacker and target positions at the time of the attack. This distance SHALL be the absolute difference between the attacker's position and the target's position.

#### Scenario: Attack event includes distance
- **WHEN** attacker Ranged T14 at position 500 attacks defender Mounted T14 at position 900
- **THEN** the attack event includes `distance: 400`

### Requirement: Movement events
The engine SHALL emit a movement event at the start of each phase, before any attack events for that phase. The event SHALL contain: round number, phase (active troop type), a list of per-layer moves with `{ side, type, tier, from, to, held }`, and a full position snapshot (per-layer keys for both sides).

#### Scenario: Movement event content
- **WHEN** round 3 Mounted phase begins and attacker Mounted T14 advances from 300 to 600 while defender Mounted T10 holds at 900
- **THEN** a movement event is emitted with `eventType: 'move'`, `round: 3`, `phase: 'MOUNTED'`, and `moves` containing both layer moves with `held: false` for the attacker and `held: true` for the defender

#### Scenario: Phase-scoped moves
- **WHEN** the Mounted phase movement event is emitted
- **THEN** the `moves` list contains only Mounted-type layers; Siege, Ranged, and Ground layers do not appear in this phase's moves

### Requirement: Damage formula
The engine SHALL calculate damage using the formula: `damage = troopCount * ATK * modifier * ATK / (ATK + DEF)` where ATK is the effective per-troop attack of the attacker (base * buff), DEF is the effective per-troop defense of the target (base * buff), and modifier is the type matchup multiplier.

#### Scenario: Standard damage calculation
- **WHEN** 10,000 Mounted T14 (ATK=6670) attack Ground T14 (DEF=10330) with modifier 1.2
- **THEN** damage = 10000 * 6670 * 1.2 * (6670 / (6670 + 10330)) = 31,396,235

#### Scenario: Damage with buffs applied
- **WHEN** 10,000 Mounted T14 (base ATK=6670, +100% ATK buff) attack Ground T14 (base DEF=10330, +50% DEF buff)
- **THEN** effective ATK = 13340, effective DEF = 15495, damage = 10000 * 13340 * 1.2 * (13340 / (13340 + 15495))

### Requirement: Kill calculation
The engine SHALL calculate kills as `kills = damage / target_HP_per_troop` (decimal, no floor) where target_HP_per_troop is the effective HP (base * buff). Kills SHALL be capped at the target layer's current troop count. Fractional kills accumulate over rounds.

#### Scenario: Kills from damage
- **WHEN** effective damage is 31,396,235 against Ground T14 (HP=20440)
- **THEN** kills = 31396235 / 20440 = 1536.17

#### Scenario: Kills capped at troop count
- **WHEN** effective damage would produce 5000 kills but the target layer has only 2000 troops
- **THEN** kills = 2000 (capped)

### Requirement: Counter-strike
After each attack action, if the target layer has surviving troops **and the attacker is within the target's range**, the target SHALL counter-strike the attacker using a simplified formula: `counter_kills = targetEffATK / attackerEffHP` (flat, not scaled by troop count). No type modifier or ATK/(ATK+DEF) defense ratio is applied. Counter kills are capped at the attacker layer's current troop count. If the attacker is outside the target's range, no counter-strike occurs.

#### Scenario: Counter-strike after attack
- **WHEN** ATT Siege T13 (1 troop, effHP=58380) attacks DEF Siege T8 (effATK=17850) and the target survives
- **THEN** counter_kills = 17850 / 58380 = 0.306, applied to the attacking layer

### Requirement: Damage multipliers
The engine SHALL apply a full 4x4 type matchup multiplier matrix. Counter-triangle bonuses: Range->Mounted 1.2, Mounted->Ground 1.2, Ground->Range 1.2. Reverse penalties: Mounted->Range 0.8, Ground->Mounted 0.7, Range->Ground 0.8. Mounted->Siege 0.9. Siege offensive penalties: Siege->Ground 0.35, Siege->Range 0.4, Siege->Mounted 0.3, Siege->Siege 0.5. Non-siege same-type and Range->Range, Ground->Ground: 1.0. Ground->Siege 1.1, Range->Siege 1.1.

#### Scenario: Counter bonus applies
- **WHEN** a Mounted layer attacks a Ground layer
- **THEN** damage multiplier is 1.2

#### Scenario: Reverse penalty applies
- **WHEN** a Mounted layer attacks a Ranged layer
- **THEN** damage multiplier is 0.8

#### Scenario: Siege offensive penalty
- **WHEN** a Siege layer attacks a Siege layer
- **THEN** damage multiplier is 0.5

### Requirement: Buff application
The engine SHALL apply buff percentages to base stats using the formula: `effectiveStat = baseStat * (1 + buffPercent / 100)`. Buffs are per troop type and apply equally to all tiers of that type. Negative buff values (debuffs) SHALL be supported.

#### Scenario: Positive buff
- **WHEN** Mounted has a +150% ATK buff and base ATK for Mounted T14 is 6670
- **THEN** effective ATK = 6670 * (1 + 150/100) = 16675

#### Scenario: Negative debuff
- **WHEN** Ground has a -20% DEF buff and base DEF for Ground T14 is 10330
- **THEN** effective DEF = 10330 * (1 + (-20)/100) = 8264

### Requirement: Event log generation
The engine SHALL produce a list of BattleEvent objects, one per layer attack action. Each event SHALL contain: round number, phase (troop type), attacking side, attacking layer (type + tier + count before attack), target layer (type + tier + count before attack), damage dealt, kills inflicted, target remaining count after attack.

#### Scenario: Event content
- **WHEN** ATT Range T14 (2000 troops) attacks DEF Mounted T14 (5000 troops), dealing 23472 damage and 1948 kills
- **THEN** the event records round=1, phase=RANGED, side=ATTACKER, source={RANGED, T14, 2000}, target={MOUNTED, T14, 5000}, damage=23472, kills=1948, remaining=3052

### Requirement: Battle termination
The battle SHALL end when one side has zero total surviving troops. The engine SHALL return a summary indicating the winner, total rounds, and surviving troop counts per layer.

#### Scenario: Defender eliminated
- **WHEN** after a phase all defender layers have troopCount = 0
- **THEN** the battle ends with attacker as winner

#### Scenario: Both sides eliminated in same phase
- **WHEN** the attacker's strike eliminates the defender's last troops, and the defender had no surviving troops to counter-attack
- **THEN** the battle ends with attacker as winner

### Requirement: Dead troops cannot attack
A layer that is reduced to zero troops earlier in the round SHALL NOT attack in its phase or counter-attack. The engine SHALL check troop count > 0 before each attack action.

#### Scenario: Layer killed before its phase
- **WHEN** Ground phase kills all of the defender's Range T14 troops
- **THEN** defender's Range T14 does not attack in the Ranged phase
