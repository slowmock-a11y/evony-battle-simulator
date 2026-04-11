## ADDED Requirements

### Requirement: Phase-based round execution
The battle engine SHALL execute each round in four sequential phases ordered by troop range: Siege (range 1400+), Ranged (range 500), Mounted (range 50, speed 600), Ground (range 50, speed 350). Within each phase, the attacker's troops of that type SHALL strike first, then the defender's surviving troops of that type SHALL counter-attack.

#### Scenario: Phase order within a round
- **WHEN** a battle round is executed
- **THEN** Siege phase executes first, then Ranged, then Mounted, then Ground

#### Scenario: Attacker strikes before defender in each phase
- **WHEN** the Ranged phase executes with both sides having ranged troops
- **THEN** the attacker's ranged troops deal damage first, reducing the defender's troop counts, before the defender's surviving ranged troops counter-attack

### Requirement: Tier ordering within a phase
Within a phase, when a side has multiple layers of the same troop type (different tiers), higher-tier layers SHALL attack before lower-tier layers.

#### Scenario: Multiple tiers of same type
- **WHEN** the attacker has T14 Ranged and T12 Ranged layers
- **THEN** T14 Ranged attacks first, then T12 Ranged attacks

### Requirement: Targeting priority chains
Each troop type SHALL select targets using a fixed priority chain. The engine SHALL walk the chain in order, selecting the first enemy type that has surviving troops. Within a priority level, the engine SHALL target the highest-tier layer first, then the layer with the largest troop count.

Priority chains:
- Siege: [Siege, Range, Ground, Mounted]
- Range: [Mounted, Range, Ground, Siege]
- Mounted: [Ground, Siege, Mounted, Range]
- Ground: [Range, Siege, Ground, Mounted]

#### Scenario: Primary target available
- **WHEN** an attacker's Range layer selects a target and the defender has surviving Mounted troops
- **THEN** the Range layer targets the highest-tier Mounted layer

#### Scenario: Primary target eliminated, fallback to next priority
- **WHEN** an attacker's Range layer selects a target and the defender has no surviving Mounted troops but has surviving Range troops
- **THEN** the Range layer targets the highest-tier Range layer (priority 2)

#### Scenario: Tier-based selection within priority
- **WHEN** an attacker's Range layer targets enemy Mounted and the defender has T14 Mounted (3000) and T12 Mounted (5000)
- **THEN** the Range layer targets T14 Mounted (highest tier first)

### Requirement: Damage formula
The engine SHALL calculate damage using the formula: `damage = troopCount × ATK × modifier × ATK / (ATK + DEF)` where ATK is the effective per-troop attack of the attacker (base × buff), DEF is the effective per-troop defense of the target (base × buff), and modifier is the type matchup multiplier.

#### Scenario: Standard damage calculation
- **WHEN** 10,000 Mounted T14 (ATK=6670) attack Ground T14 (DEF=10330) with modifier 1.2
- **THEN** damage = 10000 × 6670 × 1.2 × (6670 / (6670 + 10330)) = 31,396,235

#### Scenario: Damage with buffs applied
- **WHEN** 10,000 Mounted T14 (base ATK=6670, +100% ATK buff) attack Ground T14 (base DEF=10330, +50% DEF buff)
- **THEN** effective ATK = 13340, effective DEF = 15495, damage = 10000 × 13340 × 1.2 × (13340 / (13340 + 15495))

### Requirement: Kill calculation
The engine SHALL calculate kills as `kills = floor(damage / target_HP_per_troop)` where target_HP_per_troop is the effective HP (base × buff). Kills SHALL be capped at the target layer's current troop count.

#### Scenario: Kills from damage
- **WHEN** effective damage is 31,396,235 against Ground T14 (HP=20440)
- **THEN** kills = floor(31396235 / 20440) = 1536

#### Scenario: Kills capped at troop count
- **WHEN** effective damage would produce 5000 kills but the target layer has only 2000 troops
- **THEN** kills = 2000 (capped)

### Requirement: Damage multipliers
The engine SHALL apply the following type matchup multipliers: Range→Mounted 1.2, Mounted→Ground 1.2, Ground→Range 1.2, Siege→Siege 1.5. All other matchups SHALL use multiplier 1.0.

#### Scenario: Counter bonus applies
- **WHEN** a Mounted layer attacks a Ground layer
- **THEN** damage multiplier is 1.2

#### Scenario: No counter bonus
- **WHEN** a Mounted layer attacks a Ranged layer
- **THEN** damage multiplier is 1.0

#### Scenario: Siege vs Siege bonus
- **WHEN** a Siege layer attacks a Siege layer
- **THEN** damage multiplier is 1.5

### Requirement: Buff application
The engine SHALL apply buff percentages to base stats using the formula: `effectiveStat = baseStat × (1 + buffPercent / 100)`. Buffs are per troop type and apply equally to all tiers of that type. Negative buff values (debuffs) SHALL be supported.

#### Scenario: Positive buff
- **WHEN** Mounted has a +150% ATK buff and base ATK for Mounted T14 is 6670
- **THEN** effective ATK = 6670 × (1 + 150/100) = 16675

#### Scenario: Negative debuff
- **WHEN** Ground has a -20% DEF buff and base DEF for Ground T14 is 10330
- **THEN** effective DEF = 10330 × (1 + (-20)/100) = 8264

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
- **WHEN** Siege phase kills all of the defender's Range T14 troops
- **THEN** defender's Range T14 does not attack in the Ranged phase
