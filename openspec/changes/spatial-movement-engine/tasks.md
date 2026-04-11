## Phase 1: Engine — Position Tracking and Movement

- [x] 1.1 Add `BATTLEFIELD_LENGTH = 5200` constant and `RANGES` lookup (per-type constant, per-tier for siege) to `battle-engine.js`
- [x] 1.2 Add `initPositions()` function returning `{ ATT: { SIEGE: 0, RANGED: 0, MOUNTED: 0, GROUND: 0 }, DEF: { SIEGE: 5200, ... } }`
- [x] 1.3 Add `getMaxRange(army, type)` helper — returns max range of alive layers of that type (constant for Ground/Ranged/Mounted, tier-dependent for Siege)
- [x] 1.4 Add `getAliveTypes(army)` helper — returns list of types with count > 0
- [x] 1.5 Add `evaluateMovement(type, positions, attackerArmy, defenderArmy)` — for both sides, check if any enemy position is within max range; if not, advance by speed; cap at nearest living enemy position minus 50; handle same-type collision (both advancing toward each other); return updated positions and move descriptors (from, to, held)

## Phase 2: Engine — Range-Gated Targeting

- [x] 2.1 Add `positions` parameter to `selectTarget(attackerLayer, enemyArmy, sourcePos, positions, side)` — filter candidates by range: `abs(sourcePos - candidatePos) <= layerRange`
- [x] 2.2 Update `executePhase()` to pass positions and side to `selectTarget()`
- [x] 2.3 Handle case where a layer has no target in range (skip attack, no event emitted)

## Phase 3: Engine — Integrate Movement into Simulation Loop

- [x] 3.1 Update `simulate()` to initialize positions via `initPositions()` and pass them through the round loop
- [x] 3.2 In the round loop, before each phase's attacks, call `evaluateMovement()` for the active type and emit a movement event with position snapshot
- [x] 3.3 Update `executePhase()` calls to pass current positions
- [x] 3.4 Add `eventType: 'attack'` to all existing attack events and include `positions` snapshot
- [x] 3.5 Include `positions` in the simulation result (`simulate()` return value) as final positions

## Phase 4: Visualization — Position Mapping from Engine

- [x] 4.1 Replace `calcPosition()` formula with `mapToScreen(engineX)` that converts 0–5200 to screen percentage (e.g., `5 + (x / 5200) * 90`); keep Y_POSITIONS unchanged
- [x] 4.2 Add `currentPositions` module variable; `calcPosition(type, side)` reads from `currentPositions` via `mapToScreen()`
- [x] 4.3 Update `setPhase(phase, positions)` to accept optional `positions` param, store in `currentPositions`, then call `repositionMarkers()`
- [x] 4.4 Update initial `render()` call path: set `currentPositions` to starting positions (0 / 5200) before first marker placement

## Phase 5: App.js — Wire Movement Events Through

- [x] 5.1 Update `onEvent()` to check `evt.eventType`: skip `applyEvent()` and `highlightAttack()` for move events; always call `setPhase()` with positions and `updateSummary()`
- [x] 5.2 Pass initial positions to `Battlefield.render()` / `Battlefield.setPhase()` during `runSimulation()` setup (before any events play)

## Phase 6: Battle Log — Movement Event Formatting

- [x] 6.1 Update `BattleLog.addEntry()` to handle `eventType: 'move'` — format as compact lines (e.g., "R3 | ATT Mounted → 1800" or "R4 | DEF Siege holds at 4900")
- [x] 6.2 Ensure attack events still render in their existing format (backward-compatible check on `eventType`)

## Phase 7: Testing and Verification

- [x] 7.1 Test: configure both sides with all 4 types, step through — verify troops advance, hold when in range, and melee units stop at 50-unit gap
- [x] 7.2 Test: configure attacker with only Siege, defender with only Mounted — verify Siege holds once Mounted enters range, Mounted closes to melee
- [x] 7.3 Test: verify Play Round groups movement + attack events correctly; Play Full animates the full sequence
- [x] 7.4 Test: verify eliminated types stop moving, don't block remaining troops
- [x] 7.5 Test: verify battle log shows both movement and attack entries
