## Why

The battle engine currently has no concept of space — all troops attack every round regardless of distance. On a 5200-unit linear battlefield, Siege (range 2178) shouldn't hit anything on round 1, and Ranged (speed 100) should take many rounds to reach combat. The current visualization fakes movement with a cosmetic formula tied to phase index, but nothing in the engine enforces range, movement, or the hold-in-place rule.

Adding spatial movement to the engine makes simulations physically accurate: troops advance at their speed, hold position when enemies are in range, and can only attack targets they can actually reach. The visualization then displays real engine-computed positions instead of cosmetic approximations.

## What Changes

- **BattleEngine** gains position tracking per troop type per side (8 positions on a 5200-unit field)
- Each round, each troop type evaluates movement before attacking: hold if any enemy in range, otherwise advance by speed
- Attacks are range-gated — a troop can only hit enemies within its range from its current position
- Melee units (Mounted, Ground) stop at 50 units from the nearest enemy (no pass-through)
- Engine emits movement events alongside attack events, with position data on all events
- **Battlefield visualization** reads positions from engine events instead of computing them cosmetically
- The cosmetic `calcPosition()` formula is replaced by a mapping from engine coordinates (0-5200) to screen percentages

## Capabilities

### New Capabilities
- `spatial-movement`: Position tracking and movement evaluation in the engine — advance-or-hold logic, range gating, collision stopping

### Modified Capabilities
- `battle-engine`: Simulate now tracks positions, evaluates movement per phase, range-gates attacks, and emits richer events with position data
- `battlefield-visual`: Reads positions from event data instead of computing them; maps 5200-unit coordinates to screen space

### Unchanged Capabilities
- `army-config-ui`: No changes
- `playback-controls`: No API changes — Step/Round/Full/Reset still work the same
- `troop-data`: No changes (speed/range stats already exist)

## Impact

- `js/battle-engine.js` — Major: add position state, movement evaluation, range gating, position data in events
- `js/battlefield.js` — Moderate: replace `calcPosition()` with coordinate mapping from event data, update `setPhase()`/`repositionMarkers()` to use engine positions
- `js/app.js` — Minor: pass position data through from events to battlefield, handle movement events
- `openspec/specs/battle-engine/` — Update spec to cover spatial mechanics
