# range-speed-indicators Specification

## Purpose
Persistent range tip markers and firefight-zone shading for Ranged and Siege units, plus a hover-reveal full-length range bar, overlaid on the battlefield map.

## Requirements

### Requirement: Range tip marker (persistent)
For each combination of (type ∈ {Ranged, Siege, Archer Tower}, side ∈ valid sides for that type) and for each unique buffed range among that side's alive units of that type, a **tip marker** SHALL be rendered at the reach boundary. Archer Tower is defender-only — only DEF tip markers SHALL be rendered for AT, and the attacker side of the AT row SHALL never produce a tip.

The marker SHALL be a short vertical tick (~14px) in the troop type's colour, positioned at `unit.x + range` for the attacker side or `unit.x − range` for the defender side, on the type's Y row.

A label in the troop type's colour SHALL be drawn flush with the tick (sharing the tick's vertical center, placed horizontally against the tick on the map-interior side). The label is in 10px monospace and contains: the type letter + range (`R500`, `S1400`, `A800`), a direction arrow indicating attack direction (`→` for ATT, `←` for DEF), and — for Siege only — the contributing tiers (e.g., `T13-16`).

- Ranged label reads like `R500 →|` for ATT and `|← R500` for DEF.
- Siege label reads like `T13-16 S1400 →|` for ATT and `|← S1400 T13-16` for DEF.
- Archer Tower label reads like `|← A<range>` for DEF only — no tier text, no ATT variant.

Tier info is omitted for Ranged because all Ranged tiers share a single range. AT has no tier, so tier text is also omitted.

Tiers that share the same buffed range collapse into a single tip. Tiers with distinct buffed ranges each produce their own tip. AT has no tiers and a single user-configured range; it produces at most one tip per battle.

When multiple tips exist on the same row for a given side, the tips SHALL be distributed vertically across a band centered on the type's Y row to prevent label collisions.

ATT tips SHALL be offset slightly upward and DEF tips slightly downward from the type's base Y. AT tips SHALL use the DEF offset (downward). The zone shade remains on the type's base Y row.

#### Scenario: Tip marker shown for each side with alive Ranged
- **WHEN** both attacker and defender have alive Ranged (any tiers, all range 500)
- **THEN** two tip marks appear on the Ranged row: ATT at `ATT.pos + 500` labelled `R500 →`, DEF at `DEF.pos − 500` labelled `← R500`

#### Scenario: Tip marker for a single-tier Siege
- **WHEN** the attacker has alive T13 Siege units (range 1400)
- **THEN** a tip mark appears on the Siege row at `ATT.pos + 1400`, labelled `T13 S1400 →`

#### Scenario: No tip marker for Ground or Mounted
- **WHEN** Ground or Mounted units are alive on a side
- **THEN** no tip marker is rendered for them (their base range is below the visualization threshold)

#### Scenario: Archer Tower DEF tip only
- **WHEN** the defender has a live AT with range 800
- **THEN** one tip mark appears on the AT row at `DEF.pos − 800` labelled `← A800`, and no tip appears on the attacker half of the AT row

#### Scenario: Tip clamped to battlefield bounds
- **WHEN** `unit.x ± max_buffed_range` exceeds `[0, BATTLEFIELD_LENGTH]`
- **THEN** the tip is clamped to the nearest battlefield edge

#### Scenario: Mixed tiers with distinct buffed ranges
- **WHEN** an attacker has all 16 Siege tiers alive, spanning five distinct buffed ranges
- **THEN** five ATT tips are drawn on the Siege row, labelled appropriately

#### Scenario: Tiers sharing a buffed range collapse
- **WHEN** a defender has T13, T14, T15, T16 Siege alive (all at buffed range 1400)
- **THEN** a single DEF tip is drawn at `DEF.pos − 1400` for that shared range, labelled `← S1400 T13-16`

### Requirement: Firefight-zone shade (persistent)
For each row T ∈ {Ranged, Siege} where both sides have at least one alive unit of type T and the two sides' reach intervals overlap, a firefight-zone shade SHALL be rendered as a rectangle on that row covering the overlap interval. The shade SHALL use a warm universal colour (`#e94560`) at approximately 0.10 opacity.

The Archer Tower row SHALL never have a firefight-zone shade — AT exists only on the defender side, so no two-sided overlap is ever possible.

If either side has no alive unit of type T, or if the reaches do not overlap, no shade SHALL be rendered for that row.

The overlap interval is computed as:

```
tipATT = ATT.pos + max_buffed_range(ATT, T)
tipDEF = DEF.pos − max_buffed_range(DEF, T)
zoneStart = max(ATT.pos, tipDEF)
zoneEnd   = min(DEF.pos, tipATT)
render zone iff (both sides present) AND (zoneEnd > zoneStart)
```

#### Scenario: Zone appears when Ranged reaches cross
- **WHEN** ATT-Ranged is at position 400 (range 500, tip 900) and DEF-Ranged is at position 700 (range 500, tip 200)
- **THEN** a firefight-zone shade is drawn on the Ranged row from `x = 400` to `x = 700`

#### Scenario: No zone when reaches do not cross
- **WHEN** ATT-Ranged tip is 600 and DEF-Ranged tip is 800 (tips haven't met)
- **THEN** no firefight-zone shade is drawn on the Ranged row

#### Scenario: No zone when one side has no Ranged
- **WHEN** the attacker has alive Ranged but the defender has no alive Ranged
- **THEN** no firefight-zone shade is drawn on the Ranged row

#### Scenario: AT row never has a firefight zone
- **WHEN** any battle has a configured live AT and any attacker composition
- **THEN** no firefight-zone shade is rendered on the AT row, regardless of reach values

#### Scenario: Independent zones per row
- **WHEN** the Ranged row has a zone and the Siege row does not (or vice versa)
- **THEN** each row's shading is computed independently

### Requirement: Hover-reveal range bar
When the user hovers a Ranged or Siege unit marker, a full-length range bar SHALL be rendered for that unit. The bar SHALL extend from the unit's current X position toward the enemy side by `max_buffed_range`, in the troop type's color, at approximately 0.22 opacity. The bar SHALL disappear on mouse leave. Tips and firefight-zone shades SHALL remain visible during the hover.

#### Scenario: Hover reveals the full reach as a bar
- **WHEN** the user hovers a Siege unit marker
- **THEN** a horizontal bar appears from the unit's position to `unit.x ± max_buffed_range`, at 0.22 opacity, in the Siege type color

#### Scenario: Leaving hover removes the bar but leaves tips and zones intact
- **WHEN** the user moves the pointer off the unit marker
- **THEN** the hover bar is removed; tip markers and any firefight-zone shade remain rendered

#### Scenario: No hover bar for Ground or Mounted
- **WHEN** the user hovers a Ground or Mounted unit marker
- **THEN** no range bar is shown (range 50 is below the visualization threshold)

### Requirement: Indicators update with phase progression
The persistent range tip markers and firefight-zone shades SHALL reflect the current phase's positions. When the phase advances, all indicators SHALL recompute and re-render against the new positions. A hover-reveal range bar, if active, SHALL also update to the hovered unit's new position.

#### Scenario: Phase change updates tips and zones
- **WHEN** the phase advances from round 1 to round 2
- **THEN** all tip marks reposition to the new `unit.x ± max_buffed_range`, and the firefight-zone overlap is recomputed per row for every alive unit group

#### Scenario: Phase change during hover
- **WHEN** the user is hovering a unit marker and the phase advances
- **THEN** the hover-reveal bar repositions to match that unit's new position
