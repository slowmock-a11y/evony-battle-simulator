## Context

The battle engine (`js/battle-engine.js`) is a pure damage calculator — armies in, event log out. It has no concept of position, range gating, or movement. All troops attack every round regardless of distance. The battlefield visualization (`js/battlefield.js`) fakes spatial movement with a cosmetic formula (`calcPosition()`) that maps phase index to screen percentage, giving the illusion of advancement without any underlying spatial model.

Per confirmed battle mechanics: the battlefield is 5200 units long, troops advance at their speed stat per round, and hold position when any enemy is in range. Each troop type moves independently and occupies its own position. This change makes the engine spatially aware so the visualization displays real positions.

## Goals / Non-Goals

**Goals:**
- Engine tracks 8 positions (4 types x 2 sides) on a 5200-unit linear field
- Movement evaluation per phase: hold if enemy in range, else advance by speed
- Attacks are range-gated — troops can only hit targets within their range
- Melee collision: units stop at 50 units apart, never pass through
- Events carry position data; visualization reads positions from events
- Visualization maps 5200-unit coordinates to screen space (replaces cosmetic formula)
- Battle log shows movement events (advance / hold)

**Non-Goals:**
- Vertical (Y-axis) movement — units stay in their horizontal lanes
- Per-tier positions (all tiers of a type share one position)
- Pathfinding or obstacle avoidance (linear field, forward only)
- Animated per-frame interpolation (CSS transitions handle visual smoothness)

## Decisions

### 1. Position state as a plain object in the engine

**Choice:** Add a `positions` object to the simulation: `{ ATT: { SIEGE: 0, RANGED: 0, MOUNTED: 0, GROUND: 0 }, DEF: { SIEGE: 5200, RANGED: 5200, MOUNTED: 5200, GROUND: 5200 } }`. Updated in-place each phase. A snapshot is attached to every emitted event.

**Why:** Positions are per-type, not per-layer (confirmed: 8 positions total). A flat object is simple, cheap to snapshot, and easy to serialize. No need for a class or spatial data structure — it's a 1D field with 8 points.

### 2. Movement evaluation happens per phase, for the active type only

**Choice:** During the Siege phase, only Siege moves (both sides). During the Ranged phase, only Ranged moves. Other types are stationary until their phase.

```
Each round, each phase (SIEGE → RANGED → MOUNTED → GROUND):
  1. Move: evaluate hold-or-advance for this type, both sides
  2. Attack: attacker's layers of this type fire (if target in range)
  3. Counter: defender's surviving layers counter-fire (if target in range)
```

**Why:** Matches the confirmed mechanics — each troop type has "its own movement phase" that occurs at the start of its attack phase. Movement and attack are interleaved per type, not batched.

### 3. Hold-or-advance uses max range of alive layers

**Choice:** A type holds if any enemy position is within the **maximum range** of that type's alive layers. For Ground/Ranged/Mounted this is a constant (50/500/50). For Siege it varies by tier (1400–2178), so use the max range of surviving siege layers.

**Why:** All layers of a type share one position. If the highest-range layer can fire, the formation holds. Lower-range layers that can't reach will simply find no target during their attack — they don't force the whole formation to advance.

### 4. Range-gated target selection

**Choice:** `selectTarget()` gains a range filter. Before walking the priority chain, compute the distance between the attacking position and each candidate position. Only consider targets where `distance <= attacker's range`. For siege layers, use the layer's own tier-specific range.

```
distance = abs(attacker_pos - target_pos)
if distance > layer_range: skip this target
```

**Why:** This is the core spatial mechanic. Without range gating, troops fire across the entire field on round 1 (current behavior). With it, troops must close distance before engaging. Siege layers of different tiers may have different reachable targets.

### 5. Collision resolution: cap at nearest enemy position

**Choice:** After advancing, cap the new position so it doesn't pass any living enemy unit. Attacker positions are capped at `min(alive_defender_positions) - 50`. Defender positions are capped at `max(alive_attacker_positions) + 50`. Process both sides' tentative positions, then resolve collisions.

For same-type collision (both advancing toward each other): compute tentative positions, check for crossing, resolve to midpoint with 50-unit gap.

**Why:** Simple and correct for a 1D field. Troops can never pass each other (confirmed). The 50-unit gap matches melee range — once at 50, melee troops have their target in range and hold.

### 6. Event structure: add eventType and positions

**Choice:** Add two fields to all events:
- `eventType`: `'move'` or `'attack'`
- `positions`: snapshot of all 8 positions at event time

Movement events (emitted once per phase, before attacks):
```javascript
{ eventType: 'move', round: 5, phase: 'MOUNTED',
  moves: [
    { side: 'ATT', type: 'MOUNTED', from: 2400, to: 2575, held: false },
    { side: 'DEF', type: 'MOUNTED', from: 2800, to: 2625, held: false }
  ],
  positions: { ATT: {...}, DEF: {...} } }
```

Attack events (same as before, plus positions):
```javascript
{ eventType: 'attack', round: 5, phase: 'MOUNTED', side: 'ATTACKER',
  sourceType: 'MOUNTED', sourceTier: 14, sourceCount: 5000,
  targetType: 'GROUND', targetTier: 14, targetCountBefore: 8000,
  damage: 31396235, kills: 1536, remaining: 6464, modifier: 1.2,
  positions: { ATT: {...}, DEF: {...} } }
```

**Why:** Movement events let the visualization animate troop advances before attacks. Positions on every event mean the visualization always has current coordinates — no need to maintain its own state. The `eventType` field lets consumers (app.js, BattleLog) handle each type appropriately.

### 7. Visualization reads positions from events, not computed

**Choice:** Replace the cosmetic `calcPosition()` formula with a coordinate mapper:
```javascript
function mapToScreen(engineX) {
    return 5 + (engineX / 5200) * 90;  // 5% to 95% of container width
}
```
Store `currentPositions` in the Battlefield module. Updated via `setPhase(phase, positions)`. Both `render()` and `repositionMarkers()` read from `currentPositions`.

**Why:** The engine is now the single source of truth for positions. The visualization is a pure renderer — it maps coordinates and draws. No more phase-index-to-speed-factor math.

### 8. App.js event handling for two event types

**Choice:**
```javascript
function onEvent(evt, index, total) {
    if (evt.eventType === 'attack') {
        applyEvent(evt);
        Battlefield.render(displayAtt, displayDef, attBuffs, defBuffs);
        Battlefield.highlightAttack(evt);
    }
    Battlefield.setPhase(evt.phase, evt.positions);
    Battlefield.updateSummary(displayAtt, displayDef);
    BattleLog.addEntry(evt, index, total);
}
```
Movement events update positions and log; attack events also apply damage, re-render markers, and draw arrows.

**Why:** Minimal change to the existing flow. Movement events skip the damage/render path but still update positions and the log. The render only happens on attack events (when counts change), keeping DOM churn low.

### 9. Battle log formatting for movement events

**Choice:** Movement events appear as compact lines in the log:
- `"R3 | ATT Mounted → 1800"` (advanced)
- `"R4 | DEF Siege holds at 4900"` (held)

Attack events retain their current format.

**Why:** Movement events are frequent (one per phase per round) but low-information. Compact format keeps the log scannable without hiding spatial data.

## Risks / Trade-offs

**[Increased event count]** Each round now emits up to 4 movement events in addition to attack events. For a 20-round battle with 4 types per side, that's ~80 extra movement events. → Mitigation: These are tiny objects. Playback speed already handles event volume via the speed slider.

**[Rounds with only movement, no attacks]** Early rounds where all troops are advancing but none in range produce movement-only events. Stepping through these one at a time may feel slow. → Mitigation: "Play Round" already groups by round number and will step through movement events quickly. Could add "skip to first contact" later if needed.

**[Siege tier range differences]** A position shared by T14 siege (range 2178) and T1 siege (range 1400) may hold when only T14 can fire. T1 stays idle at the same position. → Acceptable: this reflects reality — a formation holds when its longest-range unit can fire. The T1 contributes once enemies close further.

**[Backward-incompatible event structure]** Adding `eventType` breaks any consumer expecting all events to be attacks. → Mitigation: only consumers are app.js, BattleLog, Playback — all in this repo, all updated in this change.
