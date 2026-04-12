## ADDED Requirements

### Requirement: Complete troop base stats
The system SHALL provide base stats (Attack, Defense, HP, Speed, Range) for all four troop types (Ground, Ranged, Mounted, Siege) across tiers T1 through T14. Stats SHALL match the values from the reference data in `openspec/specs/battle-mechanics-facts.md`.

#### Scenario: Ground T14 stats
- **WHEN** the system looks up Ground T14 base stats
- **THEN** Attack=3570, Defense=10330, HP=20440, Speed=350, Range=50

#### Scenario: Mounted T1 stats
- **WHEN** the system looks up Mounted T1 base stats
- **THEN** Attack=220, Defense=150, HP=400, Speed=600, Range=50

#### Scenario: Siege T14 stats with variable range
- **WHEN** the system looks up Siege T14 base stats
- **THEN** Attack=3280, Defense=1560, HP=3280, Speed=75, Range=2178

### Requirement: Troop data API endpoint
The backend SHALL expose a `GET /api/troops` endpoint that returns all troop base stats as JSON. The response SHALL be structured by type and tier.

#### Scenario: Fetch troop data
- **WHEN** the frontend sends GET /api/troops
- **THEN** the response contains all 56 troop entries (4 types × 14 tiers) with Attack, Defense, HP, Speed, and Range per entry

### Requirement: Troop type metadata
Each troop type SHALL have associated metadata: display name, color code for UI rendering, and the fixed targeting priority chain.

#### Scenario: Mounted type metadata
- **WHEN** the system looks up Mounted metadata
- **THEN** it returns name="Mounted", color="#4a7fb5", targetPriority=[Ground, Siege, Mounted, Range]

### Requirement: Complete damage multiplier matrix
The `DAMAGE_MULTIPLIERS` object SHALL contain entries for all 16 attacker×defender type combinations (Ground, Ranged, Mounted, Siege). The `getMultiplier(attackerType, defenderType)` function SHALL return the exact coefficient from the matrix. Values below 1.0 represent penalties; values above 1.0 represent bonuses.

The matrix values SHALL be:
- Ground→Ground: 1.0, Ground→Ranged: 1.0, Ground→Mounted: 0.7, Ground→Siege: 1.1
- Ranged→Ground: 0.67, Ranged→Ranged: 1.0, Ranged→Mounted: 1.2, Ranged→Siege: 1.1
- Mounted→Ground: 1.0, Mounted→Ranged: 1.0, Mounted→Mounted: 1.0, Mounted→Siege: 1.0
- Siege→Ground: 0.35, Siege→Ranged: 0.4, Siege→Mounted: 0.3, Siege→Siege: 0.5

#### Scenario: Counter bonus lookup
- **WHEN** `getMultiplier('RANGED', 'MOUNTED')` is called
- **THEN** it returns 1.2

#### Scenario: Penalty lookup
- **WHEN** `getMultiplier('GROUND', 'MOUNTED')` is called
- **THEN** it returns 0.7

#### Scenario: Siege weakness lookup
- **WHEN** `getMultiplier('SIEGE', 'GROUND')` is called
- **THEN** it returns 0.35

#### Scenario: Neutral lookup
- **WHEN** `getMultiplier('MOUNTED', 'RANGED')` is called
- **THEN** it returns 1.0
