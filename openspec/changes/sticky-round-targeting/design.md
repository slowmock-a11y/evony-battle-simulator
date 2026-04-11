## Context

The battle engine processes each round in four phases (Siege, Ranged, Mounted, Ground). Within each phase, tier layers attack sequentially from highest to lowest tier. Currently, each tier layer independently calls `selectTarget()` to pick its target based on the priority chain. Because kills are applied immediately after each tier's attack, a lower-tier layer may find its predecessor's target eliminated and cascade to the next priority type.

The result: a single troop type can split fire across multiple enemy types within one round. The desired behavior is that all tiers of a type commit to the same enemy type for the entire phase.

## Goals / Non-Goals

**Goals:**
- All tier layers of a troop type attack the same enemy type within a single phase
- Target type is determined once at the start of each side's attack within a phase
- Overkill against an eliminated target type is wasted (no mid-phase spillover)

**Non-Goals:**
- Damage spillover / carry-over mechanics (explicitly not adding)
- Changing the priority chains themselves
- Changing phase order or attacker-first semantics
- Cross-round target locking (each new round re-evaluates fresh)

## Decisions

### Decision 1: Determine target type at phase start, not per-layer

**Approach:** In `executePhase()`, before iterating tier layers, call `selectTarget()` once with a representative layer to determine the locked target **type**. Then constrain all subsequent `selectTarget()` calls within that phase to only consider layers of that locked type.

**Alternative considered:** Store the target type on the first tier's attack and pass it down. Rejected because it couples the loop iteration to state from a previous iteration — determining the type upfront is cleaner.

**Alternative considered:** Pre-filter the enemy army to only contain the target type. Rejected because it would require copying army state and could mask bugs.

### Decision 2: Lock target type, not target layer

The lock is on the enemy **type** (e.g., MOUNTED), not a specific tier layer. Within the locked type, each attacking tier still independently selects the highest-tier, largest-count layer. This means if T14 Ranged kills all enemy Mounted T14, T12 Ranged still attacks Mounted — but targets the next Mounted tier layer (e.g., T12 Mounted).

If all layers of the locked type are eliminated mid-phase, remaining attacking tiers fire at nothing (their attack is skipped for that round).

### Decision 3: Minimal code change in executePhase()

Add a `lockedTargetType` variable at the top of `executePhase()`. Resolve it by walking the priority chain against alive enemy types (with range check). Pass it into `selectTarget()` as an optional filter. This keeps the change isolated to ~10 lines.

## Risks / Trade-offs

- **Wasted overkill damage** → Intentional. This matches the user's desired behavior. Battles may last slightly longer when high-tier layers overkill a small target group.
- **Edge case: locked type fully eliminated mid-phase** → Lower tiers skip their attack for that round. Next round re-evaluates and picks the new highest-priority target. This is the correct behavior per the design intent.
- **Range gating on target type** → The locked type must be in range at phase start. If it's in range at the start, all tiers use the same position, so range is consistent.
