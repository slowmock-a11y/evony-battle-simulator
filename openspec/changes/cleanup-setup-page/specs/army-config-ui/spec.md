## MODIFIED Requirements

### Requirement: Buff inputs per troop type
Each army panel SHALL display buff inputs: one row per troop type (Ground, Ranged, Mounted, Siege) with three percentage fields each (Attack%, Defense%, HP%). Default value SHALL be 0. Negative values SHALL be allowed. Buff rows SHALL have clear visual separation with adequate spacing between rows. The buff section SHALL have a visible section header label.

#### Scenario: Default buff state
- **WHEN** the page loads
- **THEN** all 12 buff inputs per panel show 0

#### Scenario: Negative debuff
- **WHEN** the user enters -30 in the Ground Defense% field
- **THEN** the value is accepted and applied as a 30% defense reduction

#### Scenario: Visual clarity
- **WHEN** the user views the buff section
- **THEN** each troop type row is visually distinct with readable spacing between rows and a section header above

### Requirement: Bulk-set buttons
Each army panel SHALL provide bulk-set functionality via the global default troop count input. The previous separate "Set all: 0", "Set all: 1000", and custom "Apply" buttons are replaced by the global default input from the simplified-troop-input capability.

#### Scenario: Bulk set via global default
- **WHEN** the user changes the global default count to 0
- **THEN** all 56 troop count inputs in that panel become 0

## ADDED Requirements

### Requirement: Input element padding
All number input elements (troop counts, buff percentages, global default) SHALL have inner padding of at least 0.3rem vertical and 0.5rem horizontal for readability and comfortable click targets.

#### Scenario: Input padding visible
- **WHEN** the user views any number input on the setup page
- **THEN** the input text has visible inner padding and does not touch the input border edges
