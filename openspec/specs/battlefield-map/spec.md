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
Unit markers SHALL be arranged vertically by row: Siege at the top (back line, longest range), Ranged below, Mounted below, Ground below, and Archer Tower at the bottom (Y = 100; defender-only fixture). The first four rows SHALL retain their existing Y values (20 / 40 / 60 / 80). The fifth row SHALL exist only on the defender side; the attacker half SHALL never contain a marker on this row.

#### Scenario: Vertical arrangement
- **WHEN** both sides have all four troop types and the defender has an alive AT
- **THEN** Siege markers are near the top of the battlefield, Ground markers are below them, the Archer Tower marker is at the bottom on the defender side, and Ranged/Mounted markers are positioned between Siege and Ground

#### Scenario: AT row empty when AT not configured
- **WHEN** the defender has not configured an Archer Tower (all three AT inputs at 0)
- **THEN** the AT row contains no marker on either side

#### Scenario: AT row attacker side always empty
- **WHEN** any battle is in progress
- **THEN** the attacker half of the AT row contains no unit marker, no firefight zone, and no range tip on that row

### Requirement: X-axis positioning follows frontmost alive layer in group
Unit markers SHALL advance horizontally toward the center line as the battle progresses, using engine-tracked per-tier positions. Because markers group tiers that share a (type, base-range) band into a single visual element, a grouped marker's displayed X SHALL reflect the engine position of the **frontmost currently alive** layer in its group. When the starting rep tier dies mid-battle, the marker SHALL continue to advance with the remaining alive tiers in its group. When every tier in the group is dead, the marker SHALL remain at its last valid position and SHALL be rendered as eliminated (faded via the `.eliminated` class).

The underlying engine SHALL continue to track positions per tier and only update positions for layers with `count > 0`. This requirement governs the presentation layer only.

#### Scenario: Pre-battle positioning
- **WHEN** the battle has not yet started (no phase active)
- **THEN** all attacker markers are near the left edge and all defender markers are near the right edge

#### Scenario: Mounted advances faster than Siege
- **WHEN** the battle is in the Mounted phase (phase index 2)
- **THEN** the Mounted marker is significantly closer to the center line than the Siege marker

#### Scenario: Phase progression causes movement
- **WHEN** the phase advances from Siege to Ranged
- **THEN** all unit markers move closer to the center, with faster troops having moved proportionally more

#### Scenario: Rep tier dies, surviving tiers continue advancing
- **WHEN** the highest-tier Ground layer on the attacker side is wiped in round 4, while lower-tier Ground layers in the same group remain alive and continue moving forward each round
- **THEN** the attacker's Ground marker continues to advance each round toward the center, tracking the surviving lower-tier Ground layers, and does not freeze at round 4's position

#### Scenario: Attack arrow origin matches alive attacker
- **WHEN** a lower-tier Ground layer attacks an enemy Siege layer at engine distance 50 in a round where the Ground group's starting rep tier has been dead for several rounds
- **THEN** the attack arrow originates from the Ground marker's current on-screen position (the alive attacking tier's engine position), producing a short arrow spanning the ~50-unit engine distance, not a long arrow reaching from the rep tier's death location

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

### Requirement: Archer Tower marker is rendered defender-side at the back edge
When the defender has a configured AT layer with `count > 0`, a single AT marker SHALL be rendered at `X = mapToScreen(BATTLEFIELD_LENGTH)` (defender edge) and `Y = 100`. The marker SHALL display a tower glyph or distinct icon, the AT type's distinct colour (different from Ranged), and an HP-fraction bar based on `count` (0.0 = empty, 1.0 = full). The integer count SHALL NOT be displayed because AT count semantics are HP-fraction.

#### Scenario: AT marker position
- **WHEN** the defender has a live AT layer
- **THEN** exactly one AT marker SHALL appear at the defender edge of the AT row

#### Scenario: AT marker uses a distinct colour
- **WHEN** the user views any battle that includes a defender AT
- **THEN** the AT marker's colour SHALL be visibly different from the Ranged marker's colour

#### Scenario: HP fraction rendering
- **WHEN** AT.count is 0.42
- **THEN** the AT marker SHALL show a fractional HP bar at 42%, not the literal text "0.42"

#### Scenario: AT marker hidden when AT.count = 0 (and no phantom-fire pending)
- **WHEN** AT.count <= 0 and the phantom-fire window for the round has closed
- **THEN** the AT marker SHALL be rendered as eliminated (faded `.eliminated` class) at its fixed position

### Requirement: Battlefield container height accommodates the AT row
The battlefield container's CSS height SHALL be increased so the new Y=100 row is fully visible without clipping or overlap with the summary bar below. The phase-indicator strip SHALL gain a fifth dot for the ARCHER_TOWER phase.

#### Scenario: AT row visible without clipping
- **WHEN** the page loads at any supported viewport width
- **THEN** the Archer Tower row SHALL be fully visible inside the battlefield container, not overflowing into the summary bar

#### Scenario: Phase indicator has five dots
- **WHEN** the page loads
- **THEN** the phase-indicator strip SHALL contain five dots in order: Siege, Ranged, Mounted, Ground, Archer Tower

#### Scenario: Phase indicator highlights ARCHER_TOWER during AT phase
- **WHEN** the simulator reaches the ARCHER_TOWER phase of any round
- **THEN** the Archer Tower dot SHALL be marked active and the prior four dots SHALL be marked done

### Requirement: AT marker position never updates from movement
The marker reposition routine (`repositionMarkers`) SHALL not change the AT marker's X coordinate during phase changes. AT is rendered at a fixed engine position, and the existing per-layer-position read SHALL pull `currentPositions.DEF['ARCHER_TOWER_1']` (constant at 1500) to compute the screen X.

#### Scenario: AT marker X stable across phase changes
- **WHEN** the phase advances through all five phases in any round
- **THEN** the AT marker's screen X SHALL be the same value before and after each phase change
