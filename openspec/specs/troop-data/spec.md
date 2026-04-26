# troop-data Specification

## Purpose
Base stats for all four troop types across tiers T1-T16, type metadata (display name, color, target-priority chain), and the tier-dependent damage-multiplier matrix.

## Requirements

### Requirement: Complete troop base stats
The system SHALL provide base stats (Attack, Defense, HP, Speed, Range) for all four troop types (Ground, Ranged, Mounted, Siege) across tiers T1 through T16. Speed and range values SHALL use actual game-database values, not displayed UI values. Stats SHALL match the values from the reference data in `openspec/specs/battle-mechanics-facts.md`.

Corrected speed/range values:
- Ground: Speed=350, Range=50 (all tiers)
- Ranged: Speed=100, Range=500 (all tiers)
- Mounted: Speed=**300**, Range=50 (all tiers; displayed speed is 600, 2× inflated)
- Siege: Range varies by tier:
  - T1-T4: **900**
  - T5-T8: **1000**
  - T9-T10: **1100**
  - T11-T12: **1200**
  - T13-T16: **1400**
- Siege: Speed is tier-dependent:
  - T1–T15: **75**
  - T16: **76**

T16 additionally breaks the historical pattern "Siege ATK = Siege HP": T16 Siege has ATK=4440 and HP=4400 (40-unit gap). This is intentional and recorded as-is.

#### Scenario: Ground T14 stats
- **WHEN** the system looks up Ground T14 base stats
- **THEN** Attack=3570, Defense=10330, HP=20440, Speed=350, Range=50

#### Scenario: Mounted T1 stats
- **WHEN** the system looks up Mounted T1 base stats
- **THEN** Attack=220, Defense=150, HP=400, Speed=**300**, Range=50

#### Scenario: Siege T14 stats with corrected range
- **WHEN** the system looks up Siege T14 base stats
- **THEN** Attack=3280, Defense=1560, HP=3280, Speed=75, Range=**1400**

#### Scenario: Siege T4 stats with corrected range
- **WHEN** the system looks up Siege T4 base stats
- **THEN** Attack=260, Defense=120, HP=260, Speed=75, Range=**900**

#### Scenario: Siege T8 stats with corrected range
- **WHEN** the system looks up Siege T8 base stats
- **THEN** Attack=850, Defense=410, HP=850, Speed=75, Range=**1000**

#### Scenario: Ground T16 stats
- **WHEN** the system looks up Ground T16 base stats
- **THEN** Attack=4920, Defense=13670, HP=28240, Speed=350, Range=50

#### Scenario: Ranged T16 stats
- **WHEN** the system looks up Ranged T16 base stats
- **THEN** Attack=5460, Defense=4390, HP=10730, Speed=100, Range=500

#### Scenario: Mounted T16 stats
- **WHEN** the system looks up Mounted T16 base stats
- **THEN** Attack=8780, Defense=5780, HP=15850, Speed=**300**, Range=50

#### Scenario: Siege T16 stats with tier-specific speed
- **WHEN** the system looks up Siege T16 base stats
- **THEN** Attack=4440, Defense=2080, HP=4400, Speed=**76**, Range=**1400**
- **AND** Attack (4440) is NOT equal to HP (4400), which intentionally breaks the T1–T15 pattern

#### Scenario: Siege T15 speed remains 75
- **WHEN** the system looks up Siege T15 base stats
- **THEN** Speed=75 (the tier-dependent speed break is at T16, not T15)

### Requirement: Troop type metadata
Each troop type SHALL have associated metadata: display name, color code for UI rendering, and the fixed targeting priority chain. Metadata SHALL be defined for all five types — Ground, Ranged, Mounted, Siege, and Archer Tower. Archer Tower's metadata SHALL include a distinct color (different from Ranged) and a `colorClass` suffix (e.g. `color-archer-tower`) so battlefield, log, and detail views render AT separably from Ranged.

#### Scenario: Mounted type metadata
- **WHEN** the system looks up Mounted metadata
- **THEN** it returns name="Mounted", color="#4a7fb5", targetPriority=[Ground, Siege, Mounted, Range]

#### Scenario: Archer Tower type metadata
- **WHEN** the system looks up Archer Tower metadata
- **THEN** it returns name="Archer Tower", a distinct color (not equal to Ranged's), and targetPriority=[Mounted, Range, Ground, Siege] (PROVISIONAL — equal to Ranged's chain by default)

### Requirement: Complete damage multiplier matrix
The `DAMAGE_MULTIPLIERS` object SHALL contain entries for all 25 attacker × defender type combinations across the five types Ground, Ranged, Mounted, Siege, and Archer Tower. The `getMultiplier(attackerType, defenderType, attackerTier)` function SHALL return the exact coefficient from the matrix without any aliasing logic.

The 16 cells involving the four original troop types SHALL be unchanged. Values below 1.0 represent penalties; values above 1.0 represent bonuses. The 9 new cells per band involving ARCHER_TOWER (5 in the ARCHER_TOWER row, 4 in the ARCHER_TOWER column on existing rows) SHALL each start at the matching RANGED cell as a **provisional default** and SHALL be tagged `// PROVISIONAL` in source. Each cell SHALL be a separate, independently editable named constant.

Tier-dependent matrices:

**T1-T10:**
- Ground->Ground: 1.0, Ground->Ranged: 1.2, Ground->Mounted: 0.7, Ground->Siege: 1.1, Ground->ArcherTower: 1.2 (PROVISIONAL = Ground->Ranged)
- Ranged->Ground: 0.8, Ranged->Ranged: 1.0, Ranged->Mounted: 1.2, Ranged->Siege: 1.1, Ranged->ArcherTower: 1.0 (PROVISIONAL = Ranged->Ranged)
- Mounted->Ground: 1.2, Mounted->Ranged: 0.8, Mounted->Mounted: 1.0, Mounted->Siege: 0.9, Mounted->ArcherTower: 0.8 (PROVISIONAL = Mounted->Ranged)
- Siege->Ground: 0.35, Siege->Ranged: 0.4, Siege->Mounted: 0.3, Siege->Siege: 0.5, Siege->ArcherTower: 0.4 (PROVISIONAL = Siege->Ranged)
- ArcherTower->Ground: 0.8, ArcherTower->Ranged: 1.0, ArcherTower->Mounted: 1.2, ArcherTower->Siege: 1.1, ArcherTower->ArcherTower: 1.0 (all PROVISIONAL — row mirrors Ranged's row exactly)

**T11-T16:**
- Ground->Ground: 1.0, Ground->Ranged: 1.2, Ground->Mounted: 0.7, Ground->Siege: 1.1, Ground->ArcherTower: 1.2 (PROVISIONAL)
- Ranged->Ground: 0.8, Ranged->Ranged: 1.0, Ranged->Mounted: 1.2, Ranged->Siege: 1.1, Ranged->ArcherTower: 1.0 (PROVISIONAL)
- Mounted->Ground: 1.2, Mounted->Ranged: 0.8, Mounted->Mounted: 1.0, Mounted->Siege: **1.1**, Mounted->ArcherTower: 0.8 (PROVISIONAL)
- Siege->Ground: 0.35, Siege->Ranged: 0.4, Siege->Mounted: 0.3, Siege->Siege: **0.6**, Siege->ArcherTower: 0.4 (PROVISIONAL)
- ArcherTower->Ground: 0.8, ArcherTower->Ranged: 1.0, ArcherTower->Mounted: 1.2, ArcherTower->Siege: 1.1, ArcherTower->ArcherTower: 1.0 (all PROVISIONAL)

(T16 uses the same coefficients as T11–T15 — the `attackerTier >= 11` branch in `getMultiplier()` already covers T16 without modification. Archer Tower has no tier; calls with attackerType=ARCHER_TOWER use either band — RANGED's row is band-stable, so AT's row mirroring it is also band-stable.)

#### Scenario: Counter bonus lookup
- **WHEN** `getMultiplier('RANGED', 'MOUNTED')` is called
- **THEN** it returns 1.2

#### Scenario: Penalty lookup
- **WHEN** `getMultiplier('GROUND', 'MOUNTED')` is called
- **THEN** it returns 0.7

#### Scenario: Siege weakness lookup
- **WHEN** `getMultiplier('SIEGE', 'GROUND')` is called
- **THEN** it returns 0.35

#### Scenario: Mounted vs Siege T1-T10
- **WHEN** `getMultiplier('MOUNTED', 'SIEGE')` is called for a T10 attacker
- **THEN** it returns 0.9

#### Scenario: Mounted vs Siege T11+
- **WHEN** `getMultiplier('MOUNTED', 'SIEGE')` is called for a T11 attacker
- **THEN** it returns 1.1

#### Scenario: Siege vs Siege T11+
- **WHEN** `getMultiplier('SIEGE', 'SIEGE')` is called for a T11 attacker
- **THEN** it returns 0.6

#### Scenario: Mounted vs Siege at T16
- **WHEN** `getMultiplier('MOUNTED', 'SIEGE')` is called for a T16 attacker
- **THEN** it returns 1.1 (same as T11+ band)

#### Scenario: Siege vs Siege at T16
- **WHEN** `getMultiplier('SIEGE', 'SIEGE')` is called for a T16 attacker
- **THEN** it returns 0.6 (same as T11+ band)

#### Scenario: AT-as-target uses provisional Ranged-equivalent column
- **WHEN** `getMultiplier('MOUNTED', 'ARCHER_TOWER')` is called for any tier
- **THEN** it returns 0.8 (PROVISIONAL — equal to MOUNTED → RANGED)

#### Scenario: AT-as-attacker uses provisional Ranged-equivalent row
- **WHEN** `getMultiplier('ARCHER_TOWER', 'MOUNTED')` is called
- **THEN** it returns 1.2 (PROVISIONAL — AT row mirrors RANGED row, RANGED → MOUNTED = 1.2)

#### Scenario: AT vs AT lookup
- **WHEN** `getMultiplier('ARCHER_TOWER', 'ARCHER_TOWER')` is called
- **THEN** it returns 1.0 (PROVISIONAL — equal to RANGED → RANGED)

### Requirement: PHASE_ORDER includes ARCHER_TOWER tail
`TroopData.PHASE_ORDER` SHALL be exactly `['GROUND', 'MOUNTED', 'RANGED', 'SIEGE', 'ARCHER_TOWER']`. The `ARCHER_TOWER` entry SHALL be the fifth and final element. Engine code that iterates PHASE_ORDER SHALL therefore process AT after SIEGE in every round.

#### Scenario: PHASE_ORDER content and length
- **WHEN** any caller reads `TroopData.PHASE_ORDER`
- **THEN** the returned array SHALL have exactly five entries in the order GROUND, MOUNTED, RANGED, SIEGE, ARCHER_TOWER

#### Scenario: PHASE_ORDER tail is ARCHER_TOWER
- **WHEN** any caller reads the last entry of `TroopData.PHASE_ORDER`
- **THEN** it SHALL equal `'ARCHER_TOWER'`

### Requirement: TARGET_PRIORITY includes ARCHER_TOWER row
`TroopData.TARGET_PRIORITY` SHALL include an `ARCHER_TOWER` entry. The default chain SHALL be `['MOUNTED', 'RANGED', 'GROUND', 'SIEGE']` and SHALL be tagged `// PROVISIONAL` in source — copied from RANGED's chain as a provisional default until evidence resolves the unverified-fact entry on the investigation page.

#### Scenario: AT priority chain default
- **WHEN** the engine reads `TroopData.TARGET_PRIORITY['ARCHER_TOWER']`
- **THEN** it SHALL equal `['MOUNTED', 'RANGED', 'GROUND', 'SIEGE']`

#### Scenario: Provisional tag in source
- **WHEN** a developer reads `js/troop-data.js`
- **THEN** the `TARGET_PRIORITY.ARCHER_TOWER` line SHALL carry a `// PROVISIONAL` comment referencing the investigation page
