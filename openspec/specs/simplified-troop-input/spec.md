# simplified-troop-input Specification

## Purpose
Per-panel "Default count" input that sets every troop count cell to a common value, with per-cell override support.

## Requirements

### Requirement: Global default troop count
Each army panel SHALL display a "Default count" number input above the troop grid. The default value SHALL be 1000. Changing this input SHALL set all troop count cells in that panel to the entered value.

#### Scenario: Page load default
- **WHEN** the page loads
- **THEN** the default count input shows 1000 and all 56 troop cells show 1000

#### Scenario: Change global default
- **WHEN** the user changes the default count to 5000
- **THEN** all 56 troop count cells in that panel update to 5000

### Requirement: Per-cell override
Individual troop count cells SHALL remain directly editable. Manually editing a cell SHALL override the global default for that specific cell only. Subsequent changes to the global default SHALL overwrite all cells including previously overridden ones.

#### Scenario: Override single cell
- **WHEN** the user sets default to 2000, then manually changes Ground T14 to 8000
- **THEN** Ground T14 shows 8000 while all other cells show 2000

#### Scenario: Global default reapplies over overrides
- **WHEN** the user has overridden Ground T14 to 8000, then changes the global default to 3000
- **THEN** all cells including Ground T14 update to 3000
