## Why

Currently, each tier layer of a troop type independently selects its target within a round. When a higher-tier layer (e.g., T14 Ranged) kills all of a target type (e.g., Mounted), lower-tier layers (e.g., T12 Ranged) cascade to the next priority target (e.g., Range) within the same round. This means a single troop type can split its fire across multiple enemy types in one round, which doesn't match expected Evony battle behavior where all layers of a type commit to the same target type for the entire round.

## What Changes

- All tiers of a troop type determine their target type **once** at the start of their phase, based on the highest-priority enemy type with surviving troops
- All tier layers within that phase attack that same target type for the entire round, even if a higher tier eliminates all troops of that type mid-phase
- Overkill damage against an eliminated target type is wasted (no spillover to next priority within the same round)

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `battle-engine`: Target selection changes from per-tier-layer to per-phase. All tiers of a troop type lock onto the same enemy type for the round instead of independently re-evaluating the priority chain.

## Impact

- `js/battle-engine.js`: `executePhase()` must determine the target type once before iterating tier layers, and `selectTarget()` must be constrained to that locked type
- Event log output changes: within a single phase, all attack events from one side will always target the same enemy type
- Battle outcomes will shift — armies that previously cascaded fire across multiple types in one round will now concentrate on a single type, potentially wasting overkill damage
