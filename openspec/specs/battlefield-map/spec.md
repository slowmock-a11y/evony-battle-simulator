# battlefield-map Specification

## Purpose
Spatial 2D map rendering of troop markers arranged by range (vertical) and by speed/phase-derived position (horizontal).

## Requirements

### Requirement: Unit markers as map-positioned elements
Each troop type for each side SHALL be rendered as a circular unit marker placed at a spatial position on the battlefield map. The marker SHALL display the type letter (G/R/M/S) inside a colored circle, the current troop count below, and the type name below the count.

#### Scenario: Initial unit placement
- **WHEN** the battle simulation starts with attacker having Ground, Ranged, Mounted, and Siege troops
- **THEN** four unit markers appear on the left side of the battlefield, each showing the type letter, count, and name

#### Scenario: Only present types shown
- **WHEN** the attacker has zero Siege troops
- **THEN** no Siege unit marker appears for the attacker

### Requirement: Y-axis positioning by range
Unit markers SHALL be arranged vertically by range: Siege at the top (back line, longest range), Ranged below, Mounted below, Ground at the bottom (front line, shortest range). This mirrors the phase/firing order.

#### Scenario: Vertical arrangement
- **WHEN** both sides have all four troop types
- **THEN** Siege markers are near the top of the battlefield, Ground markers near the bottom, with Ranged and Mounted in between

### Requirement: X-axis positioning by speed and phase
Unit markers SHALL advance horizontally toward the center line as the battle progresses through phases. The X position SHALL be calculated from: `timeFactor × speedFactor`, where `timeFactor` derives from the current phase index and `speedFactor` is proportional to the troop type's speed stat. Faster troops (Ground, speed 350) SHALL advance further toward the center than slower troops (Siege, speed 75).

#### Scenario: Pre-battle positioning
- **WHEN** the battle has not yet started (no phase active)
- **THEN** all attacker markers are near the left edge and all defender markers are near the right edge

#### Scenario: Mounted advances faster than Siege
- **WHEN** the battle is in the Mounted phase (phase index 2)
- **THEN** the Mounted marker is significantly closer to the center line than the Siege marker

#### Scenario: Phase progression causes movement
- **WHEN** the phase advances from Siege to Ranged
- **THEN** all unit markers move closer to the center, with faster troops having moved proportionally more

### Requirement: Smooth position transitions
Unit markers SHALL animate smoothly between positions when the phase changes, using CSS transitions on the `left` property.

#### Scenario: Phase change animation
- **WHEN** the phase changes from Siege to Ranged
- **THEN** unit markers slide to their new positions over approximately 0.4 seconds

### Requirement: Eliminated unit appearance
When a troop type reaches zero troops, its marker SHALL appear faded (low opacity) and non-interactive.

#### Scenario: Troop type eliminated
- **WHEN** all Ranged troops on the defender side are killed
- **THEN** the defender's Ranged marker becomes faded and cannot be clicked

### Requirement: Click-to-detail panel
Clicking a unit marker SHALL display a detail panel near the marker showing: tier-by-tier breakdown with current and starting counts, losses per tier, total count, and targeting priority chain. Clicking elsewhere SHALL dismiss the panel.

#### Scenario: View tier breakdown
- **WHEN** the user clicks the attacker's Mounted marker which has T14 (3000/5000) and T13 (1200/3000)
- **THEN** a panel appears showing "T14: 3,000 / 5,000 (-2,000)" and "T13: 1,200 / 3,000 (-1,800)" with "Total: 4,200 / 8,000" and "Targets: Ground > Siege > Mounted > Range"

#### Scenario: Dismiss detail panel
- **WHEN** the detail panel is visible and the user clicks an empty area of the battlefield
- **THEN** the detail panel is hidden

### Requirement: SVG attack arrows
When a step event fires, an animated SVG arrow SHALL be drawn from the attacking unit marker to the target unit marker. A label at the midpoint SHALL display damage dealt and kills inflicted.

#### Scenario: Attack arrow display
- **WHEN** ATT Ranged T14 attacks DEF Mounted T14 for 48,000 damage and 1,948 kills
- **THEN** an arrow animates from the attacker's Ranged marker to the defender's Mounted marker, with "48,000 dmg, 1,948 killed" shown at the midpoint

#### Scenario: Target damage flash
- **WHEN** a unit is hit by an attack
- **THEN** the target unit marker briefly flashes with a red glow animation

### Requirement: Battlefield terrain background
The battlefield container SHALL have a terrain-style background (dark green gradient) with a vertical center line dividing the two sides.

#### Scenario: Visual appearance
- **WHEN** the battlefield is displayed
- **THEN** the background shows a green gradient and a faint vertical line at the horizontal center
