# engine-tests Specification

## Purpose
TBD - created by archiving change 2026-04-19-engine-spec-tests. Update Purpose after archive.
## Requirements
### Requirement: Test suite runs in a plain browser without build tooling
The project SHALL provide a test suite runnable by opening `tests.html` in any modern browser. The suite SHALL NOT require Node, npm, a bundler, a headless browser runner, or any external dependency. The runner and test files SHALL be vanilla JavaScript loaded via `<script>` tags.

#### Scenario: Open tests.html
- **WHEN** a user opens `tests.html` in a browser
- **THEN** every test in `js/tests/` runs and each test renders a green pass row or a red fail row with the error message

#### Scenario: Pass/fail summary
- **WHEN** the test suite finishes running
- **THEN** a tally header shows total count, pass count, and fail count, and a matching line is written to `console.log`

### Requirement: Tests cover high-value behavioral spec claims
The test suite SHALL contain tests that exercise the following behavioral claims from `openspec/specs/battle-mechanics-facts.md`, each linked to the spec section whose claim it verifies.

#### Scenario: Damage formula matches the worked example
- **WHEN** a layer of 500 T1 Ranged fires on a layer of 1000 T1 Ranged with no buffs
- **THEN** `calculateDamage` returns approximately 147 kills (spec worked example)

#### Scenario: Overkill cliff — exact wipe produces no counter
- **WHEN** an attacking layer deals damage that reduces the target to exactly zero troops
- **THEN** the simulation emits no `counter` event from that target for that exchange

#### Scenario: Overkill cliff — sliver survivor produces a counter
- **WHEN** an attacking layer deals damage that leaves the target above zero but below one troop
- **THEN** the simulation emits a `counter` event with counter-kills scaled by the main strike's kills

#### Scenario: Defender acts first on same-speed tie
- **WHEN** attacker and defender both run identical armies of a single troop type
- **THEN** in the event log, the defender's attack event for that phase appears before the attacker's attack event

#### Scenario: Higher tier acts first within a type
- **WHEN** a single side has both T10 and T1 of the same type attacking the same enemy
- **THEN** in the event log, the T10 attack event appears before the T1 attack event for that phase

#### Scenario: Counter-strike is range-gated
- **WHEN** a Ranged layer fires on a Siege layer from a distance greater than the Siege layer's range
- **THEN** no counter event is emitted from that Siege target

#### Scenario: Minimum-distance movement
- **WHEN** a Mounted layer is within effective range (speed + range) of its priority target but not within actual range
- **THEN** after the phase's movement evaluation, the Mounted layer's new position equals (target distance − actual range), not a full-speed advance

#### Scenario: Hold when enemy is within actual range
- **WHEN** a troop type has any enemy unit within its actual firing range from its current position
- **THEN** the movement evaluation emits a `held: true` move descriptor and the position is unchanged

#### Scenario: Engagement lock persists under lower-priority competition
- **WHEN** a layer is engaged with a target type and a lower-priority target type enters its actual range
- **THEN** the layer continues firing on the locked target type (lock not broken)

#### Scenario: Engagement lock breaks for higher-priority type in effective range
- **WHEN** a layer is engaged with a lower-priority target and a higher-priority target type enters the layer's effective range (speed + range)
- **THEN** the layer re-selects target and the higher-priority type becomes the new lock

#### Scenario: Engagement lock breaks when target type is eliminated
- **WHEN** a layer is locked on a target type and all enemy troops of that type reach zero count
- **THEN** the layer re-evaluates the priority chain on its next turn and selects a new target type

#### Scenario: Battle ends when one side has zero troops
- **WHEN** all defender layers reach zero count during simulation
- **THEN** the simulation returns `winner: 'ATTACKER'` and stops processing further rounds

#### Scenario: Max rounds is respected
- **WHEN** both sides are still alive after `maxRounds` iterations
- **THEN** the simulation returns `winner: 'DRAW'` and `rounds` equals `maxRounds`

### Requirement: Engine exposes formula helpers for direct testing
The `BattleEngine` public API SHALL expose `calculateDamage`, `calculateCounterKills`, and `createLayer` so spec-compliance tests can verify the damage and counter formulas without running a full simulation.

#### Scenario: calculateDamage is directly callable
- **WHEN** a test constructs attacker and target layers via `createLayer` and calls `calculateDamage(attacker, target, attackerBuffs, targetBuffs)`
- **THEN** the call returns `{ damage, kills, modifier }` matching the spec formula

#### Scenario: calculateCounterKills is directly callable
- **WHEN** a test calls `calculateCounterKills(attacker, target, attackerBuffs, targetBuffs, killsDealt)`
- **THEN** the call returns a counter-kills value matching the spec's casualties-counter formula

### Requirement: Tests do not assume the disputed battlefield length
Test fixtures SHALL NOT depend on `BATTLEFIELD_LENGTH = 1500` for their pass/fail conditions, because that value is under active investigation (`openspec/changes/2026-04-17-investigate-battlefield-size`). Movement tests SHALL assert on per-round deltas, hold conditions, and collision geometry — not on absolute round numbers at which engagement begins.

#### Scenario: Movement test independent of field length
- **WHEN** a movement test is written to verify "Mounted advances 300 per round when out of range"
- **THEN** the test asserts `new_position − old_position === 300` for a single round, and does not assert a specific round number at which engagement occurs

