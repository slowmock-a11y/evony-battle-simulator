## ADDED Requirements

### Requirement: Range indicator on hover
When the user hovers over a Ranged or Siege unit marker, the battlefield SHALL display a horizontal range indicator showing the firing extent from that unit's current position. The indicator SHALL extend from the unit's X position toward the enemy side by the unit's maximum range (across alive tiers), rendered as a semi-transparent bar in the troop type's color at the same Y level as the marker.

#### Scenario: Hover over attacker Siege marker
- **WHEN** the user hovers over the attacker's Siege unit marker at engine position 300 with max range 2178
- **THEN** a horizontal bar appears from engine position 300 to 2478 (300 + 2178) at the Siege Y level, in the Siege color (#e07040) at reduced opacity

#### Scenario: Hover over defender Ranged marker
- **WHEN** the user hovers over the defender's Ranged unit marker at engine position 4800 with range 500
- **THEN** a horizontal bar appears from engine position 4800 to 4300 (4800 - 500) at the Ranged Y level, in the Ranged color (#4caf6e) at reduced opacity

#### Scenario: Range clamped to battlefield bounds
- **WHEN** the range extent would exceed the battlefield (0 or 5200)
- **THEN** the indicator is clamped to the battlefield boundary

#### Scenario: No range indicator for melee types
- **WHEN** the user hovers over a Ground or Mounted unit marker (range 50)
- **THEN** no range indicator is displayed since the range is too short to be visually meaningful

### Requirement: Speed projection indicator on hover
When the user hovers over any unit marker, the battlefield SHALL display a speed projection marker showing the approximate position the unit will reach in the next round. The projection marker SHALL be a small translucent circle or chevron in the troop type's color with a dashed outline, placed at `currentPos + speed` for attackers or `currentPos - speed` for defenders (clamped to battlefield bounds).

#### Scenario: Hover over attacker Mounted marker
- **WHEN** the user hovers over the attacker's Mounted marker at engine position 1800 with speed 600
- **THEN** a translucent projection marker appears at engine position 2400 (1800 + 600) at the Mounted Y level

#### Scenario: Hover over defender Ground marker
- **WHEN** the user hovers over the defender's Ground marker at engine position 3500 with speed 350
- **THEN** a translucent projection marker appears at engine position 3150 (3500 - 350) at the Ground Y level

#### Scenario: Speed projection clamped to battlefield
- **WHEN** the projected position would exceed the battlefield boundary
- **THEN** the projection marker is clamped to the boundary (0 for defenders, 5200 for attackers)

#### Scenario: No projection for eliminated units
- **WHEN** the user hovers over an eliminated unit marker (zero troops)
- **THEN** no speed projection indicator is displayed

### Requirement: Indicators dismissed on mouse leave
When the user's mouse leaves a unit marker, all associated range and speed indicators SHALL be removed immediately.

#### Scenario: Mouse leaves unit marker
- **WHEN** the user moves the mouse away from a hovered unit marker
- **THEN** the range indicator and speed projection marker disappear immediately

### Requirement: Indicators update with phase progression
The range and speed indicators SHALL reflect the current phase's positions. If the user is hovering during a phase transition, the indicators SHALL update to match the new position.

#### Scenario: Phase change while hovering
- **WHEN** the user is hovering over a unit marker and the phase advances
- **THEN** the range indicator and speed projection update to reflect the new position
