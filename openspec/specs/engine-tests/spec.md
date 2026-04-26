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

### Requirement: Archer Tower test suite covers phase order, no-movement, buff isolation, counter-attack, phantom-fire, and provisional matrix
The test suite SHALL include a new file `js/tests/test-archer-tower.js` registered in `js/tests/test-runner.js` and loaded in `tests.html`. The suite SHALL exercise the AT capability's normative behaviours.

#### Scenario: AT fires in the ARCHER_TOWER tail phase
- **WHEN** a battle is run with a defender AT layer and any attacker composition
- **THEN** the event log SHALL contain at least one attack event with `phase === 'ARCHER_TOWER'` and `side === 'DEF'`, occurring after every Siege-phase event of the same round

#### Scenario: AT does not move
- **WHEN** a multi-round battle runs with a defender AT
- **THEN** every position snapshot in the event log SHALL show the AT's defender position unchanged (equal to the initial value)

#### Scenario: AT.atk is not scaled by defender ATK% buff
- **WHEN** the defender has `buffs.RANGED.atk = 100` (or any buff entry) and AT.atk is 5000
- **THEN** AT's effective ATK in the damage formula SHALL be 5000 (verified by computing the damage from a known target and asserting it matches the no-buff prediction)

#### Scenario: AT counter-attacks when attacker is in range
- **WHEN** an attacker fires on AT from a distance ≤ AT.range and AT.count > 0 after the strike
- **THEN** a counter event SHALL be emitted from AT in that exchange

#### Scenario: AT does not counter-attack when attacker is out of range
- **WHEN** an attacker fires on AT from a distance > AT.range
- **THEN** no counter event SHALL be emitted from AT for that exchange

#### Scenario: Phantom-fire toggle off — AT killed mid-round does not fire
- **WHEN** AT is configured with `phantomFire: false` and is killed during the SIEGE phase of round N
- **THEN** the event log SHALL contain no AT attack event for round N

#### Scenario: Phantom-fire toggle on — AT killed mid-round fires once
- **WHEN** AT is configured with `phantomFire: true`, was alive at the start of round N, and is killed during the SIEGE phase of round N
- **THEN** the event log SHALL contain exactly one AT attack event in round N (in the ARCHER_TOWER phase) and zero AT attack events in subsequent rounds

#### Scenario: Defender alone with AT keeps battle alive
- **WHEN** the defender has zero troops and a live AT, and the attacker has any composition
- **THEN** the battle SHALL continue past round 1 (not immediately end as ATTACKER win) until AT is destroyed

#### Scenario: AT-as-attacker provisional multiplier
- **WHEN** AT fires on a Mounted target and `getMultiplier('ARCHER_TOWER', 'MOUNTED')` is read
- **THEN** the value SHALL equal 1.2 (PROVISIONAL — equal to RANGED → MOUNTED)

#### Scenario: AT-as-target provisional multiplier
- **WHEN** a Siege fires on AT and `getMultiplier('SIEGE', 'ARCHER_TOWER')` is read
- **THEN** the value SHALL equal 0.4 (PROVISIONAL — equal to SIEGE → RANGED)

#### Scenario: AT priority chain provisional default
- **WHEN** the test reads `TroopData.TARGET_PRIORITY['ARCHER_TOWER']`
- **THEN** the value SHALL equal `['MOUNTED', 'RANGED', 'GROUND', 'SIEGE']` (PROVISIONAL — equal to RANGED's chain)

### Requirement: Existing test suite passes unmodified
The pre-change test suite SHALL continue to pass without modification. No existing test SHALL need to be edited to accommodate the AT capability; the additive engine changes SHALL preserve every prior assertion's pass condition.

#### Scenario: Existing tests pass
- **WHEN** `node scripts/run-tests.js` is run after the AT capability is implemented
- **THEN** every previously-passing test SHALL still pass (the new test file adds tests; it does not modify or skip existing ones)

#### Scenario: Browser test runner regressions
- **WHEN** `tests.html` is opened in a browser after the AT capability is implemented
- **THEN** every test row that was green before the change SHALL still be green

