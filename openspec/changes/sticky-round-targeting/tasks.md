## 1. Core Engine Change

- [x] 1.1 Add `resolveLockedTargetType()` function to `battle-engine.js` that walks the priority chain for a given troop type and returns the first enemy type that has surviving troops in range
- [x] 1.2 Modify `executePhase()` to call `resolveLockedTargetType()` once per side before iterating tier layers, storing the result as `lockedTargetType`
- [x] 1.3 Modify `selectTarget()` to accept an optional `lockedType` parameter — when provided, skip all priority chain entries except the locked type
- [x] 1.4 In `executePhase()`, skip a tier layer's attack if `lockedTargetType` is set but no surviving layers of that type remain (instead of falling back)

## 2. Verification

- [x] 2.1 Test: Run a battle where high-tier Ranged overkills all Mounted — verify lower-tier Ranged does NOT cascade to Range in the same round
- [x] 2.2 Test: Verify that in the following round, Ranged correctly re-evaluates and targets Range (or next alive priority)
- [x] 2.3 Test: Verify range gating still works — if Mounted is out of range, the locked type falls through to the next in-range priority
- [x] 2.4 Review event log to confirm all attack events within a phase/side target the same enemy type
