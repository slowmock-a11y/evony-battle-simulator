# battle-engine Specification

## Purpose
Pure-function battle simulator — takes attacker and defender armies and produces a movement+attack event log. Owns phase ordering, per-layer positions, movement, targeting, damage calculation, and counter-strikes.
## Requirements
### Requirement: Phase-based round execution
The battle engine SHALL execute each round in five sequential phases ordered by troop speed (fastest first): Ground (speed 350), Mounted (speed 300), Ranged (speed 100), Siege (speed 75), Archer Tower (speed 0; defender-only). When two troop types have the same speed, the defender's troops of that type SHALL act first. Within each phase, the defender's troops of that type SHALL strike first (same-speed tie rule), then the attacker's surviving troops of that type SHALL strike.

The Archer Tower phase SHALL only ever fire defender layers — no attacker-side AT layer can exist.

#### Scenario: Phase order within a round
- **WHEN** a battle round is executed
- **THEN** Ground phase executes first (speed 350), then Mounted (speed 300), then Ranged (speed 100), then Siege (speed 75), then Archer Tower (speed 0)

#### Scenario: Defender strikes before attacker in each phase
- **WHEN** the Ranged phase executes with both sides having ranged troops
- **THEN** the defender's ranged troops deal damage first, reducing the attacker's troop counts, before the attacker's surviving ranged troops strike

#### Scenario: Speed tie resolution
- **WHEN** two troop types have identical actual speed values
- **THEN** the defender's troops of that type SHALL act before the attacker's troops (for both movement and attacks)

#### Scenario: Archer Tower phase fires only defender
- **WHEN** the Archer Tower phase of any round executes
- **THEN** at most one AT layer SHALL fire (the defender's, if present and eligible) and no attacker AT layer SHALL exist

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

Within each phase, the **defender moves first** (same-speed tie rule: defender acts before attacker when both sides have the same troop type). The defender evaluates movement against the attacker's pre-phase positions. The attacker then evaluates movement against the defender's already-updated positions, which causes the attacker to be "held" naturally when the defender has advanced to within attack range. Layers SHALL never reverse direction. Layers SHALL never pass through or closer than 50 units to any alive enemy layer.

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
- **WHEN** round 3 Mounted phase begins and defender Mounted T10 advances from 900 to 750 while attacker Mounted T14 holds at 700 (defender advanced to within range 50)
- **THEN** a movement event is emitted with `eventType: 'move'`, `round: 3`, `phase: 'MOUNTED'`, and `moves` containing the DEF move first (`held: false`) followed by the ATT move (`held: true`); DEF appears first in the moves list because the defender moved first

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

### Requirement: Counter-strike (casualties-counter)
After each attack action, if the target layer has surviving troops **and the attacker is within the target's range**, the target SHALL counter-strike using the full damage formula with `kills_dealt` (the kills just inflicted on the target) as the effective troop count:

```
counter_damage = kills_dealt × targetEffATK × counter_modifier × targetEffATK / (targetEffATK + sourceEffDEF)
counter_kills  = counter_damage / sourceEffHP
```

The `counter_modifier` is the type matchup multiplier from target → attacker, using the target's tier. Counter kills are capped at the attacker layer's current troop count. If the attacker is outside the target's range, or the target was wiped by the main strike (target_count_after == 0), no counter-strike occurs.

#### Scenario: Counter-strike uses casualties as effective troop count
- **WHEN** DEF Ranged T1 (500 troops, effATK=130) strikes ATT Ranged T1 (1000 troops, effDEF=100, effHP=250) at distance 500, killing 146.96 troops
- **THEN** counter_damage = 146.96 × 130 × 1.0 × 130 / (130+100) = 10,796.5; counter_kills = 10,796.5 / 250 = 43.19, applied to the defender's layer

#### Scenario: No counter-strike on wipe (overkill cliff)
- **WHEN** an attacker's strike reduces the target layer's count from 188.28 to 0 (wipe)
- **THEN** no counter-strike event is emitted and the attacker's layer takes 0 counter damage, even though the main strike dealt 188.28 kills

#### Scenario: Counter-strike respects target range
- **WHEN** ATT Siege T14 (range 1400) at position 100 strikes DEF Ranged T14 (range 500) at position 1100, distance 1000, and the defender survives
- **THEN** no counter-strike occurs (distance 1000 > defender range 500)

### Requirement: Damage multipliers
The engine SHALL apply a 5×5 type matchup multiplier matrix covering Ground, Ranged, Mounted, Siege, and Archer Tower. The 16 cells involving the original four types SHALL be unchanged. The 9 new cells per band involving ARCHER_TOWER SHALL be provisional defaults equal to the matching RANGED cell — see `troop-data` spec for the full matrix.

#### Scenario: Counter bonus applies
- **WHEN** a Mounted layer attacks a Ground layer
- **THEN** damage multiplier is 1.2

#### Scenario: Reverse penalty applies
- **WHEN** a Mounted layer attacks a Ranged layer
- **THEN** damage multiplier is 0.8

#### Scenario: Siege offensive penalty
- **WHEN** a Siege layer attacks a Siege layer
- **THEN** damage multiplier is 0.5

#### Scenario: AT-as-attacker provisional multiplier
- **WHEN** the Archer Tower layer attacks a Mounted layer
- **THEN** damage multiplier is 1.2 (PROVISIONAL — AT row mirrors RANGED row)

#### Scenario: AT-as-target provisional multiplier
- **WHEN** a Siege layer attacks the Archer Tower layer
- **THEN** damage multiplier is 0.4 (PROVISIONAL — equal to SIEGE → RANGED)

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

The `side` field SHALL use the short-form string values `'ATT'` (attacker) and `'DEF'` (defender), matching the spelling already used for position maps (`positions.ATT` / `positions.DEF`) and for DOM `data-side` attributes in the visualizer. Consumers SHALL NOT need to map between multiple spellings.

#### Scenario: Event content
- **WHEN** ATT Range T14 (2000 troops) attacks DEF Mounted T14 (5000 troops), dealing 23472 damage and 1948 kills
- **THEN** the event records round=1, phase=RANGED, side=ATT, source={RANGED, T14, 2000}, target={MOUNTED, T14, 5000}, damage=23472, kills=1948, remaining=3052

#### Scenario: Side field uses short-form spelling
- **WHEN** any `attack`, `counter`, or movement sub-event is emitted by the engine
- **THEN** the `side` field value is exactly `'ATT'` or `'DEF'` (never `'ATTACKER'` or `'DEFENDER'`)

### Requirement: Battle termination
The battle SHALL end when one side has zero total surviving units. The Archer Tower layer SHALL count as a surviving unit while AT.count > 0; therefore a defender with no troops but an alive AT SHALL be considered alive. The engine SHALL return a summary indicating the winner, total rounds, and surviving counts per layer (including AT.count as an HP fraction).

#### Scenario: Defender eliminated
- **WHEN** after a phase all defender layers (including AT) have count = 0
- **THEN** the battle ends with attacker as winner

#### Scenario: Defender alive while AT survives
- **WHEN** all defender troop layers reach zero but the AT layer has count > 0
- **THEN** the battle continues into the next round and the attacker SHALL NOT be declared winner

#### Scenario: Both sides eliminated in same phase
- **WHEN** the attacker's strike eliminates the defender's last surviving unit (troop or AT) and the defender had no surviving units to counter-attack
- **THEN** the battle ends with attacker as winner

### Requirement: Dead troops cannot attack
A layer that is reduced to zero troops earlier in the round SHALL NOT attack in its phase or counter-attack. The engine SHALL check troop count > 0 before each attack action.

#### Scenario: Layer killed before its phase
- **WHEN** Ground phase kills all of the defender's Range T14 troops
- **THEN** defender's Range T14 does not attack in the Ranged phase

### Requirement: createArmy accepts an optional archerTower argument for the defender
`BattleEngine.createArmy(troopCounts, buffs, archerTower)` SHALL accept an optional third argument `archerTower` of shape `{ atk: number, hp: number, range: number, phantomFire: boolean }`. When the caller passes a non-null `archerTower` AND at least one of `atk`, `hp`, `range` is greater than 0 AND the call is constructing the defender army, the engine SHALL push a synthetic Archer Tower layer onto the army. In all other cases (null `archerTower`, all-zero stats, attacker-side construction), no AT layer SHALL be pushed.

The synthetic AT layer SHALL have shape:
```
{ type: 'ARCHER_TOWER', tier: 1, count: 1, startCount: 1,
  atk: archerTower.atk, def: 0, hp: archerTower.hp,
  speed: 0, range: archerTower.range,
  engagedTargetType: null,
  phantomFire: !!archerTower.phantomFire,
  aliveAtRoundStart: true,
  phantomFireUsed: false }
```

#### Scenario: AT layer constructed when defender has non-zero stats
- **WHEN** `BattleEngine.createArmy({}, {}, { atk: 5000, hp: 100000, range: 800, phantomFire: false })` is invoked for the defender
- **THEN** the returned army SHALL contain exactly one layer with `type === 'ARCHER_TOWER'`, `count === 1`, `atk === 5000`, `hp === 100000`, `range === 800`

#### Scenario: AT layer skipped when all stats are zero
- **WHEN** `BattleEngine.createArmy({}, {}, { atk: 0, hp: 0, range: 0, phantomFire: false })` is invoked for the defender
- **THEN** the returned army SHALL contain no layer with `type === 'ARCHER_TOWER'`

#### Scenario: AT layer skipped when archerTower is null
- **WHEN** `BattleEngine.createArmy(troopCounts, buffs, null)` is invoked for any side
- **THEN** the returned army SHALL contain no layer with `type === 'ARCHER_TOWER'`

#### Scenario: phantomFire flag preserved on the layer
- **WHEN** `BattleEngine.createArmy({}, {}, { atk: 5000, hp: 100000, range: 800, phantomFire: true })` is invoked for the defender
- **THEN** the resulting AT layer SHALL have `phantomFire === true`

### Requirement: ARCHER_TOWER initial position is the defender edge
The position-initialisation routine SHALL set `positions.DEF[layerKey('ARCHER_TOWER', 1)] = BATTLEFIELD_LENGTH` for any battle that includes a defender AT layer. No attacker-side AT key SHALL ever be set.

#### Scenario: AT initial position
- **WHEN** the engine initialises positions for a battle with a defender AT layer
- **THEN** the AT key in `positions.DEF` SHALL equal `BATTLEFIELD_LENGTH` (1500 with the current default)

### Requirement: Movement evaluation skips ARCHER_TOWER
The movement evaluation function (`evaluateMovement`) SHALL return immediately without producing any move descriptors when invoked with the type argument `'ARCHER_TOWER'`. AT positions SHALL never change for the duration of a battle.

#### Scenario: AT phase movement is a no-op
- **WHEN** `evaluateMovement('ARCHER_TOWER', positions, attackerArmy, defenderArmy)` is called
- **THEN** the function SHALL return an empty array of moves and SHALL NOT mutate any position

#### Scenario: AT position constant across rounds
- **WHEN** any battle with a defender AT runs to completion
- **THEN** every position snapshot in the event log SHALL show `positions.DEF['ARCHER_TOWER_1'] === BATTLEFIELD_LENGTH`

### Requirement: Phantom-fire eligibility uses round-start snapshot
At the start of each round, the simulate loop SHALL set `aliveAtRoundStart = (count > 0)` on every AT layer. The `executePhase` filter for layers participating in a phase SHALL accept an AT layer when `count > 0` OR `(phantomFire === true AND aliveAtRoundStart === true AND phantomFireUsed === false)`. After AT fires while `count <= 0`, the engine SHALL set `phantomFireUsed = true` on that layer so subsequent rounds do not re-fire.

#### Scenario: AT alive at phase start fires normally
- **WHEN** AT.count > 0 entering the ARCHER_TOWER phase
- **THEN** AT SHALL fire its scheduled attack normally (count-based filter accepts the layer)

#### Scenario: Phantom fire on dying round when toggle on
- **WHEN** AT was alive at round start (`aliveAtRoundStart === true`), AT.count <= 0 by the time the AT phase runs, AT.phantomFire === true, and AT.phantomFireUsed === false
- **THEN** AT SHALL fire one final attack and AT.phantomFireUsed SHALL be set to `true`

#### Scenario: No phantom fire on subsequent round
- **WHEN** AT fired a phantom-fire volley in round N (AT.phantomFireUsed === true) and round N+1 starts
- **THEN** the executePhase filter SHALL reject the AT layer and no attack event SHALL be emitted

#### Scenario: No phantom fire when toggle off
- **WHEN** AT.count drops to 0 mid-round and AT.phantomFire === false
- **THEN** the AT phase SHALL emit no AT attack event regardless of `aliveAtRoundStart`

#### Scenario: No phantom fire when AT was already dead at round start
- **WHEN** AT.count <= 0 at the start of round N (`aliveAtRoundStart === false`)
- **THEN** the AT phase of round N SHALL emit no AT attack event regardless of `phantomFire`

### Requirement: AT damage formulas use absolute layer stats without buff multiplication
The damage and counter-strike formulas, when applied to or by the AT layer, SHALL read the layer's `atk`, `def`, `hp`, and `range` directly and SHALL NOT apply any buff multipliers. Implementation note: the existing `effectiveAtk/Def/Hp` helpers fall through to the layer's raw value when the buffs object has no entry for the layer's type; AT-related buff entries SHALL therefore be omitted, ensuring the multiplication factor `(1 + 0/100) === 1` always applies.

#### Scenario: AT firing with no defender ATK% buff entry
- **WHEN** AT fires at a target with `defenderArmy.buffs.ARCHER_TOWER` undefined
- **THEN** the damage formula SHALL evaluate AT's effective ATK as exactly `layer.atk`

#### Scenario: Defender percent-buffs do not scale AT
- **WHEN** the defender army has `buffs.RANGED.atk = 100` and an AT layer with `atk = 5000`
- **THEN** AT's effective ATK in any damage formula SHALL be 5000, not 10000

#### Scenario: Counter-strike on AT uses absolute AT.atk
- **WHEN** an attacker fires on AT and AT counter-strikes
- **THEN** the counter formula SHALL use `AT.atk` directly, with no buff multiplication

### Requirement: Battles without AT inputs run identically to pre-change baseline
For any battle constructed without an `archerTower` argument (or with all three numeric AT inputs at 0), the engine event log SHALL be byte-identical to the pre-change baseline run for the same `troopCounts` and `buffs` inputs.

#### Scenario: No AT means no behavioural change
- **WHEN** a battle runs with `BattleEngine.createArmy(troopCounts, buffs)` (no third arg) on both sides
- **THEN** the produced event log SHALL be identical to a pre-change baseline log for the same inputs, including event ordering and per-event field values

