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
Each troop type SHALL have associated metadata: display name, color code for UI rendering, and the fixed targeting priority chain.

#### Scenario: Mounted type metadata
- **WHEN** the system looks up Mounted metadata
- **THEN** it returns name="Mounted", color="#4a7fb5", targetPriority=[Ground, Siege, Mounted, Range]

### Requirement: Complete damage multiplier matrix
The `DAMAGE_MULTIPLIERS` object SHALL contain entries for all 16 attacker x defender type combinations (Ground, Ranged, Mounted, Siege). The `getMultiplier(attackerType, defenderType)` function SHALL return the exact coefficient from the matrix. Values below 1.0 represent penalties; values above 1.0 represent bonuses.

Tier-dependent matrices:

**T1-T10:**
- Ground->Ground: 1.0, Ground->Ranged: 1.2, Ground->Mounted: 0.7, Ground->Siege: 1.1
- Ranged->Ground: 0.8, Ranged->Ranged: 1.0, Ranged->Mounted: 1.2, Ranged->Siege: 1.1
- Mounted->Ground: 1.2, Mounted->Ranged: 0.8, Mounted->Mounted: 1.0, Mounted->Siege: 0.9
- Siege->Ground: 0.35, Siege->Ranged: 0.4, Siege->Mounted: 0.3, Siege->Siege: 0.5

**T11-T16:**
- Ground->Ground: 1.0, Ground->Ranged: 1.2, Ground->Mounted: 0.7, Ground->Siege: 1.1
- Ranged->Ground: 0.8, Ranged->Ranged: 1.0, Ranged->Mounted: 1.2, Ranged->Siege: 1.1
- Mounted->Ground: 1.2, Mounted->Ranged: 0.8, Mounted->Mounted: 1.0, Mounted->Siege: **1.1**
- Siege->Ground: 0.35, Siege->Ranged: 0.4, Siege->Mounted: 0.3, Siege->Siege: **0.6**

(T16 uses the same coefficients as T11–T15 — the `attackerTier >= 11` branch in `getMultiplier()` already covers T16 without modification.)

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
