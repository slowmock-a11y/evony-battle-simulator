## MODIFIED Requirements

### Requirement: Targeting priority chains
Each troop type SHALL select targets using a fixed priority chain. At the start of each side's attack within a phase, the engine SHALL determine a **locked target type** by walking the priority chain and selecting the first enemy type that has surviving troops in range. All tier layers of the attacking type within that phase SHALL target only layers of the locked type. Within the locked type, the engine SHALL target the highest-tier layer first, then the layer with the largest troop count.

If all layers of the locked type are eliminated mid-phase by higher-tier attacks, remaining lower-tier layers SHALL skip their attack for that round (no fallback to next priority type within the same round).

Priority chains (unchanged):
- Siege: [Siege, Range, Ground, Mounted]
- Range: [Mounted, Range, Ground, Siege]
- Mounted: [Ground, Siege, Mounted, Range]
- Ground: [Range, Siege, Ground, Mounted]

#### Scenario: All tiers attack same target type
- **WHEN** the attacker has T14 Ranged and T12 Ranged, and the defender has surviving Mounted and Range troops
- **THEN** both T14 Ranged and T12 Ranged target Mounted layers (priority 1), even if T14 Ranged eliminates all Mounted T14 before T12 Ranged attacks

#### Scenario: Locked type fully eliminated mid-phase
- **WHEN** the attacker has T14 Ranged and T12 Ranged, the defender has only 100 Mounted T10, and T14 Ranged kills all 100 Mounted
- **THEN** T12 Ranged skips its attack for this round (does not cascade to Range)

#### Scenario: Next round re-evaluates target type
- **WHEN** in round 1 all Mounted were eliminated during the Ranged phase
- **THEN** in round 2 the Ranged phase locks onto Range (the next priority with surviving troops)

#### Scenario: Primary target not in range, fallback before locking
- **WHEN** the attacker's Ranged troops evaluate their target type and Mounted troops exist but are out of range (distance > 500), while Range troops are in range
- **THEN** the locked target type is Range (first priority type that is both alive and in range)

#### Scenario: Tier selection within locked type
- **WHEN** the locked target type is Mounted and the defender has T14 Mounted (3000) and T12 Mounted (5000)
- **THEN** each attacking tier targets T14 Mounted first (highest tier), and if T14 is eliminated, subsequent tiers target T12 Mounted
