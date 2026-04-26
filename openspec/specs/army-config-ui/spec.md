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

### Requirement: Defender Buff section includes an Archer Tower row
The defender army panel's Buff section SHALL include a fifth row labelled "Archer Tower" appended after the Ground / Ranged / Mounted / Siege rows. The attacker army panel's Buff section SHALL NOT include this row. The AT row SHALL contain three numeric inputs (ATK, HP, Range) and one boolean toggle ("Attack after death") with `data-archer-stat` attributes that namespace them away from the existing `data-buff-type` selectors.

The numeric inputs SHALL be absolute (not percent) values. The rendered fields SHALL NOT show a `%` suffix and SHALL be visually distinguishable from the buff rows above (e.g. via a divider or label cue) to communicate the absolute-vs-percent distinction.

#### Scenario: Defender panel shows AT row
- **WHEN** the page loads
- **THEN** the defender Buff section SHALL contain a fifth row with label "Archer Tower" and four controls: ATK input, HP input, Range input, and "Attack after death" checkbox

#### Scenario: Attacker panel does not show AT row
- **WHEN** the page loads
- **THEN** the attacker Buff section SHALL contain only the four troop-type rows (Ground, Ranged, Mounted, Siege) with no Archer Tower row

#### Scenario: AT inputs use absolute namespace
- **WHEN** the user inspects the defender AT inputs
- **THEN** each numeric input SHALL carry a `data-archer-stat` attribute (one of "atk", "hp", "range", "phantomFire") and SHALL NOT carry a `data-buff-type` attribute

#### Scenario: AT inputs default to zero
- **WHEN** the page loads
- **THEN** the three AT numeric inputs SHALL show 0 and the "Attack after death" checkbox SHALL be unchecked

#### Scenario: AT row visually distinct from buff rows
- **WHEN** the user views the defender Buff section
- **THEN** the AT row SHALL be visually separated from the four buff rows above (e.g. divider, distinct label colour, or "(absolute)" cue) so the absolute-input semantics are clear

### Requirement: getArcherTower(panelId) reads AT inputs
The army-config module SHALL expose `getArcherTower(panelId)` which reads the four `data-archer-stat` inputs from the given panel. The function SHALL return `{ atk, hp, range, phantomFire }` when `panelId === 'defender-panel'` AND at least one of `atk`, `hp`, `range` is greater than 0. In all other cases — `panelId === 'attacker-panel'` or all three numeric inputs at 0 — the function SHALL return `null`.

#### Scenario: Defender with non-zero inputs returns object
- **WHEN** the defender's AT inputs are ATK=5000, HP=100000, Range=800, phantomFire=true and `getArcherTower('defender-panel')` is called
- **THEN** the function SHALL return `{ atk: 5000, hp: 100000, range: 800, phantomFire: true }`

#### Scenario: Defender with all-zero inputs returns null
- **WHEN** the defender's AT inputs are all 0 and `getArcherTower('defender-panel')` is called
- **THEN** the function SHALL return `null`

#### Scenario: Attacker panel always returns null
- **WHEN** `getArcherTower('attacker-panel')` is called
- **THEN** the function SHALL return `null` regardless of any AT-like data on that panel

### Requirement: getBuffs is unaffected by AT inputs
The existing `getBuffs(panelId)` function SHALL continue to read only `data-buff-type` inputs and SHALL NOT include any AT-related fields in its return value. AT inputs SHALL therefore not appear in any buff object passed to the engine.

#### Scenario: getBuffs ignores AT inputs
- **WHEN** the user enters AT values on the defender panel and `getBuffs('defender-panel')` is called
- **THEN** the returned buffs object SHALL contain only the four troop-type entries (GROUND, RANGED, MOUNTED, SIEGE) with their atk/def/hp/range/rangeFlat fields, and SHALL NOT contain an `ARCHER_TOWER` key
