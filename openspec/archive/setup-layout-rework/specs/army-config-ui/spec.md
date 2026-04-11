## MODIFIED Requirements

### Requirement: Buff inputs per troop type
Each army panel SHALL display buff inputs: one row per troop type (Ground, Ranged, Mounted, Siege) with three percentage fields each (Attack%, Defense%, HP%). Default value SHALL be 0. Negative values SHALL be allowed. The buff section SHALL have increased spacing between rows and between stat groups within each row for readability. The buff section SHALL be visually separated from the troop grid below it by a border and spacing.

#### Scenario: Default buff state
- **WHEN** the page loads
- **THEN** all 12 buff inputs per panel show 0

#### Scenario: Negative debuff
- **WHEN** the user enters -30 in the Ground Defense% field
- **THEN** the value is accepted and applied as a 30% defense reduction

#### Scenario: Buff row spacing
- **WHEN** the user views the buff section
- **THEN** each buff row has visible vertical spacing (at least 0.6rem) between rows
- **THEN** each stat group (label + input + %) has visible horizontal spacing (at least 0.75rem gap)

#### Scenario: Buff-to-grid separation
- **WHEN** the user views an army panel
- **THEN** a visible border or divider separates the buff section from the troop grid section
- **THEN** at least 1rem of vertical space exists between the buff section and the troop grid

### Requirement: Troop count controls row
The troop grid section SHALL display a unified controls row above the tier groups containing: a default count number input, a "Set Default" button, and a "Clear All" button. The preset dropdown SHALL be removed.

#### Scenario: Set Default button
- **WHEN** the user enters 500 in the default count input and clicks "Set Default"
- **THEN** all 56 troop count inputs in that panel are set to 500

#### Scenario: Clear All button
- **WHEN** the user clicks "Clear All"
- **THEN** all 56 troop count inputs in that panel are set to 0
- **THEN** the default count input is set to 0

#### Scenario: Controls row layout
- **WHEN** the user views the troop grid section
- **THEN** the default count input, "Set Default" button, and "Clear All" button appear side-by-side in a single row above the tier groups

## REMOVED Requirements

### Requirement: Preset templates
**Reason**: Replaced by simpler "Set Default" and "Clear All" buttons which cover the primary use cases (uniform count and reset to zero).
**Migration**: Use "Set Default" to apply a uniform count, or "Clear All" to zero out. Per-tier/type overrides via column/row header clicks remain available.
