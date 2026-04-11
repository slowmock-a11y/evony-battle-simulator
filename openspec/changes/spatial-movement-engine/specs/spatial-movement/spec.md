## ADDED Requirements

### Requirement: Linear battlefield with defined length
The battle engine SHALL simulate combat on a linear (1D) battlefield of 5200 units. The attacker's troops SHALL start at position 0 and the defender's troops SHALL start at position 5200.

#### Scenario: Initial positions
- **WHEN** a battle simulation starts
- **THEN** all attacker troop types are at position 0 and all defender troop types are at position 5200

### Requirement: Independent position per troop type
Each troop type (Siege, Ranged, Mounted, Ground) on each side SHALL have its own independent position on the battlefield. All tiers of the same type share one position. The engine SHALL track 8 positions total (4 types x 2 sides).

#### Scenario: Types at different positions
- **WHEN** round 4 begins and Mounted (speed 600) has moved 3 rounds while Ground (speed 350) has moved 1 round
- **THEN** attacker Mounted is at position 1800 and attacker Ground is at position 350 (if neither has held)

### Requirement: Movement evaluation per phase
At the start of each troop type's phase, the engine SHALL evaluate movement for that type on both sides. Only the active phase's troop type moves; other types remain at their current positions.

#### Scenario: Only active type moves
- **WHEN** the Mounted phase begins in round 3
- **THEN** only Mounted positions (both sides) are evaluated for movement; Siege, Ranged, and Ground positions remain unchanged from their last movement

### Requirement: Hold-in-place rule
A troop type SHALL hold its current position (not advance) if any enemy unit of any type is within its maximum firing range from its current position. The range check uses the maximum range among all surviving layers of that type.

#### Scenario: Siege holds when enemy in range
- **WHEN** attacker Siege (T14, range 2178) is at position 300 and defender Mounted is at position 2400
- **THEN** distance is 2100, which is within range 2178, so attacker Siege holds at position 300

#### Scenario: Siege advances when no enemy in range
- **WHEN** attacker Siege (T14, range 2178) is at position 100 and the nearest defender unit is at position 4000
- **THEN** distance is 3900, which exceeds range 2178, so attacker Siege advances by speed (75) to position 175

#### Scenario: Hold checks all enemy types, not just priority target
- **WHEN** attacker Ranged (range 500) is at position 2000 and no defender Mounted exists, but defender Ground is at position 2400
- **THEN** distance is 400, which is within range 500, so attacker Ranged holds (even though Ground is priority 3 for Ranged)

### Requirement: Speed-based advancement
When a troop type advances (does not hold), it SHALL move forward by exactly its speed stat per round: Mounted 600, Ground 350, Ranged 100, Siege 75. Direction is always toward the enemy side (attacker toward 5200, defender toward 0).

#### Scenario: Mounted advances
- **WHEN** attacker Mounted at position 600 has no enemy in range
- **THEN** attacker Mounted advances to position 1200 (600 + 600)

#### Scenario: Defender advances toward 0
- **WHEN** defender Ranged at position 5100 has no enemy in range
- **THEN** defender Ranged advances to position 5000 (5100 - 100)

### Requirement: Melee collision — no pass-through
Troops SHALL never pass through enemy troops. After advancing, if a troop's new position would place it past any living enemy unit, it SHALL stop at the enemy's position minus the melee range (50 units). Attacker positions are capped at `min(alive_defender_positions) - 50`. Defender positions are capped at `max(alive_attacker_positions) + 50`.

#### Scenario: Mounted collision at midfield
- **WHEN** attacker Mounted at 2400 advances 600 to tentative 3000, and defender Mounted at 2800 advances 600 to tentative 2200
- **THEN** they would cross, so both stop 50 apart: attacker at 2575, defender at 2625

#### Scenario: Fast troop meets stationary enemy
- **WHEN** attacker Mounted at 2000 advances 600 to tentative 2600, and defender Ground is stationary at 2600
- **THEN** attacker Mounted stops at 2550 (defender position minus 50)

### Requirement: Forward-only movement
Troops SHALL only move forward (toward the enemy side). Troops SHALL never reverse direction. On a linear battlefield where both sides advance toward each other, no troop can ever end up behind any enemy troop.

#### Scenario: No reversal needed
- **WHEN** attacker Mounted kills defender Mounted and resumes advancing
- **THEN** all remaining defender troops are at positions further ahead (higher numbers), so attacker Mounted continues forward

### Requirement: Range-gated target selection
The engine SHALL only allow a layer to attack targets within its firing range from its current position. `selectTarget()` SHALL skip enemy layers whose type position is farther than the attacking layer's range.

#### Scenario: Siege T1 cannot reach distant target
- **WHEN** attacker Siege T1 (range 1400) is at position 300 and defender Mounted is at position 2500
- **THEN** distance is 2200 > 1400, so Siege T1 cannot target Mounted (even though Siege T14 at the same position with range 2178 can)

#### Scenario: No target in range
- **WHEN** attacker Ground (range 50) is at position 1000 and the nearest defender is at position 3000
- **THEN** distance is 2000 > 50, so attacker Ground does not attack this phase

### Requirement: Movement events in the event log
The engine SHALL emit a movement event at the start of each phase (before attacks). The movement event SHALL contain: round number, phase (troop type), a list of moves per side (from position, to position, whether held), and a snapshot of all 8 positions.

#### Scenario: Movement event content
- **WHEN** round 3 Mounted phase begins, attacker Mounted advances from 1200 to 1800, defender Mounted holds at 3400
- **THEN** a movement event is emitted: `{ eventType: 'move', round: 3, phase: 'MOUNTED', moves: [{ side: 'ATT', from: 1200, to: 1800, held: false }, { side: 'DEF', from: 3400, to: 3400, held: true }], positions: {...} }`

### Requirement: Position data on attack events
Each attack event SHALL include a `positions` field containing the snapshot of all 8 troop positions at the time of the attack.

#### Scenario: Attack event with positions
- **WHEN** attacker Mounted T14 attacks defender Ground T14 at round 5
- **THEN** the attack event includes `positions: { ATT: { SIEGE: 375, RANGED: 500, MOUNTED: 2575, GROUND: 1750 }, DEF: { SIEGE: 4825, RANGED: 4700, MOUNTED: 2625, GROUND: 3450 } }`

### Requirement: Dead types do not move or block
A troop type with zero surviving troops SHALL not move and SHALL not be considered for collision checks or range checks. Its last position becomes irrelevant.

#### Scenario: Eliminated type ignored for collision
- **WHEN** defender Mounted is eliminated and attacker Ground is advancing
- **THEN** attacker Ground does not stop at defender Mounted's last position; it continues advancing toward the next living defender type
