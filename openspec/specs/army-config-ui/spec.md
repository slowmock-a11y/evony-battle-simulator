## ADDED Requirements

### Requirement: Two-panel army configuration
The UI SHALL display two side-by-side input panels, one for the Attacker and one for the Defender. Each panel SHALL contain identical controls for troop counts and buffs.

#### Scenario: Page load
- **WHEN** the user opens the simulator page
- **THEN** two army panels are displayed side by side, labeled "Attacker" and "Defender"

### Requirement: Troop count grid
Each army panel SHALL display a grid of numeric inputs with rows for each tier (T1–T14) and columns for each troop type (Ground, Ranged, Mounted, Siege). Default value for all inputs SHALL be 1000. Minimum value SHALL be 0 with no maximum.

#### Scenario: Default state
- **WHEN** the page loads
- **THEN** all 56 troop count inputs per panel show 1000

#### Scenario: User enters zero
- **WHEN** the user sets Ground T14 to 0
- **THEN** Ground T14 is excluded from the army (no Ground T14 layer in simulation)

### Requirement: Collapsible tier groups
The troop count grid SHALL group tiers into three collapsible sections: High (T14–T10), Mid (T9–T5), and Low (T4–T1). Within each group, tiers SHALL be ordered highest first (T14 at top). The High group SHALL be expanded by default; Mid and Low SHALL be collapsed.

#### Scenario: Default collapsed state
- **WHEN** the page loads
- **THEN** High tiers (T14–T10) are visible, Mid and Low tiers are collapsed

#### Scenario: Expand collapsed group
- **WHEN** the user clicks the "Mid Tiers (T5–T9)" header
- **THEN** the T9–T5 input rows become visible

### Requirement: Bulk-set buttons
Each army panel SHALL provide bulk-set buttons: "Set all: 0" (zeros all troop counts), "Set all: 1000" (resets to default), and a custom bulk-set with a numeric input and "Apply" button. Bulk actions SHALL affect all tiers including collapsed ones.

#### Scenario: Set all to zero
- **WHEN** the user clicks "Set all: 0" on the Attacker panel
- **THEN** all 56 attacker troop count inputs become 0 (including collapsed tiers)

#### Scenario: Custom bulk set
- **WHEN** the user types 5000 in the custom bulk input and clicks "Apply"
- **THEN** all 56 troop count inputs in that panel become 5000

### Requirement: Buff inputs per troop type
Each army panel SHALL display buff inputs: one row per troop type (Ground, Ranged, Mounted, Siege) with three percentage fields each (Attack%, Defense%, HP%). Default value SHALL be 0. Negative values SHALL be allowed.

#### Scenario: Default buff state
- **WHEN** the page loads
- **THEN** all 12 buff inputs per panel show 0

#### Scenario: Negative debuff
- **WHEN** the user enters -30 in the Ground Defense% field
- **THEN** the value is accepted and applied as a 30% defense reduction

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

### Requirement: Column and row header actions
Clicking a column header (troop type name) SHALL allow setting all tiers of that type to a value. Clicking a tier label SHALL allow setting all types of that tier to a value.

#### Scenario: Click column header
- **WHEN** the user clicks the "Mounted" column header and enters 5000
- **THEN** all 14 Mounted tier inputs are set to 5000
