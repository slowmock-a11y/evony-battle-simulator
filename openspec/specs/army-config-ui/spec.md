# army-config-ui Specification

## Purpose
Setup UI for configuring attacker and defender troop counts, buffs, presets, and mirror operations.

## Requirements

### Requirement: Two-panel army configuration
The UI SHALL display two input panels, one for the Attacker and one for the Defender. Each panel SHALL contain identical controls for troop counts and buffs. On viewports wider than 768px, the panels SHALL be displayed side by side. On viewports at or below 768px, the panels SHALL stack vertically with the Attacker panel above the Defender panel.

#### Scenario: Page load on desktop
- **WHEN** the user opens the simulator page on a viewport wider than 768px
- **THEN** two army panels are displayed side by side, labeled "Attacker" and "Defender"

#### Scenario: Page load on tablet or mobile
- **WHEN** the user opens the simulator page on a viewport at or below 768px
- **THEN** the Attacker panel is displayed above the Defender panel in a single-column stack, each at full width

#### Scenario: Viewport resize from desktop to tablet
- **WHEN** the user resizes the browser window from above 768px to at or below 768px
- **THEN** the panels transition from side-by-side to stacked layout without page reload

### Requirement: Troop count grid
Each army panel SHALL display a grid of numeric inputs with rows for each tier (T1–T14) and columns for each troop type (Ground, Ranged, Mounted, Siege). Default value for all inputs SHALL be 1000. Minimum value SHALL be 0 with no maximum.

#### Scenario: Default state
- **WHEN** the page loads
- **THEN** all 56 troop count inputs per panel show 1000

#### Scenario: User enters zero
- **WHEN** the user sets Ground T14 to 0
- **THEN** Ground T14 is excluded from the army (no Ground T14 layer in simulation)

### Requirement: Tier groups
The troop count grid SHALL group tiers into three visual sections: High (T14–T10), Mid (T9–T5), and Low (T4–T1). Within each group, tiers SHALL be ordered highest first (T14 at top). All groups SHALL be always visible (no collapse behavior). Groups SHALL be separated by padding/margin.

#### Scenario: Default state — all tiers visible
- **WHEN** the page loads
- **THEN** all tiers T14–T1 are visible in the troop grid, grouped as High (T14–T10), Mid (T9–T5), and Low (T4–T1)

#### Scenario: Group visual separation
- **WHEN** the user views the troop grid
- **THEN** each group has vertical spacing between groups

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

### Requirement: Mirror button
The UI SHALL provide a mirror button between the two panels that copies the entire army configuration (all troop counts and all buffs) from one side to the other.

#### Scenario: Mirror attacker to defender
- **WHEN** the user clicks the mirror button
- **THEN** all defender troop counts and buff values match the attacker's values

### Requirement: Preset templates
The UI SHALL provide a preset dropdown with predefined army configurations: "Empty March" (all zeros), "T14 Only" (1000 per type at T14 only), "T12-T14 Mix" (common high-tier mix), "Full Layers" (T1 meat shield + T14). Selecting a preset SHALL populate that panel's troop counts.

#### Scenario: Select T14 Only preset
- **WHEN** the user selects "T14 Only" from the preset dropdown
- **THEN** T14 for all four types is set to 1000, all other tiers are set to 0

### Requirement: Bulk-set buttons
Each army panel SHALL provide bulk-set functionality via the global default troop count input. The previous separate "Set all: 0", "Set all: 1000", and custom "Apply" buttons are replaced by the global default input from the simplified-troop-input capability.

#### Scenario: Bulk set via global default
- **WHEN** the user changes the global default count to 0
- **THEN** all 56 troop count inputs in that panel become 0

### Requirement: Input element padding
All number input elements (troop counts, buff percentages, global default) SHALL have inner padding of at least 0.3rem vertical and 0.5rem horizontal for readability and comfortable click targets.

#### Scenario: Input padding visible
- **WHEN** the user views any number input on the setup page
- **THEN** the input text has visible inner padding and does not touch the input border edges

### Requirement: Column and row header actions
Clicking a column header (troop type name) SHALL allow setting all tiers of that type to a value. Clicking a tier label SHALL allow setting all types of that tier to a value.

#### Scenario: Click column header
- **WHEN** the user clicks the "Mounted" column header and enters 5000
- **THEN** all 14 Mounted tier inputs are set to 5000
