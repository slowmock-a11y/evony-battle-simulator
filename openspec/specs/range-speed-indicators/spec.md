# range-speed-indicators Specification

## Purpose
Persistent range indicators for Ranged and Siege units, plus speed-projection markers, overlaid on the battlefield map.

## Requirements

### Requirement: Range indicator (persistent)
Range indicators SHALL be displayed permanently for all alive Ranged and Siege units, not only on hover. Each indicator SHALL be a horizontal bar extending from the unit's current X position toward the enemy side by the unit's maximum range (across alive tiers), rendered in the troop type's color at 0.12 opacity. When the user hovers over a specific unit marker, that unit's range indicator SHALL increase to 0.22 opacity to stand out.

#### Scenario: Persistent range indicators for all ranged/siege units
- **WHEN** the battlefield is rendered with alive Ranged and Siege units on both sides
- **THEN** a horizontal range bar appears for each alive Ranged and Siege unit at their current position, extending toward the enemy by their max range, at 0.12 opacity

#### Scenario: Hover brightens the hovered unit's range indicator
- **WHEN** the user hovers over the attacker's Siege unit marker
- **THEN** that unit's range indicator increases to 0.22 opacity while all other indicators remain at 0.12

#### Scenario: Range clamped to battlefield bounds
- **WHEN** the range extent would exceed the battlefield (0 or 1500)
- **THEN** the indicator is clamped to the battlefield boundary

#### Scenario: No range indicator for melee types
- **WHEN** Ground or Mounted units are alive (range 50)
- **THEN** no range indicator is displayed for them since the range is too short to be visually meaningful

### Requirement: Speed projection indicator (persistent)
Speed projection markers SHALL be displayed permanently for all alive units. Each projection SHALL be a small translucent circle in the troop type's color with a dashed outline at 0.20 opacity, placed at `currentPos + speed` for attackers or `currentPos - speed` for defenders (clamped to battlefield bounds). When the user hovers over a specific unit marker, that unit's speed projection SHALL increase to 0.30 opacity.

#### Scenario: Persistent speed projections for all alive units
- **WHEN** the battlefield is rendered with alive units
- **THEN** a translucent projection marker appears for each alive unit at their projected next-round position, at 0.20 opacity

#### Scenario: Hover brightens the hovered unit's speed projection
- **WHEN** the user hovers over the defender's Ground marker
- **THEN** that unit's speed projection increases to 0.30 opacity while all other projections remain at 0.20

#### Scenario: Speed projection clamped to battlefield
- **WHEN** the projected position would exceed the battlefield boundary
- **THEN** the projection marker is clamped to the boundary (0 for defenders, 1500 for attackers)

#### Scenario: No projection for eliminated units
- **WHEN** a unit has zero troops remaining
- **THEN** no speed projection indicator is displayed for that unit

### Requirement: Indicators update with phase progression
The persistent range and speed indicators SHALL reflect the current phase's positions. When the phase advances, all indicators SHALL update to match the new positions for all alive units.

#### Scenario: Phase change updates all indicators
- **WHEN** the phase advances from round 1 to round 2
- **THEN** all range bars and speed projections reposition to match the updated unit positions
