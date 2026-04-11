## MODIFIED Requirements

### Requirement: Collapsible tier groups
The troop count grid SHALL group tiers into three visual sections: High (T14–T10), Mid (T9–T5), and Low (T4–T1). Within each group, tiers SHALL be ordered highest first (T14 at top). All groups SHALL be always visible (no collapse behavior). Groups SHALL be separated by padding/margin and a lightweight non-interactive label.

#### Scenario: Default state — all tiers visible
- **WHEN** the page loads
- **THEN** all tiers T14–T1 are visible in the troop grid, grouped as High (T14–T10), Mid (T9–T5), and Low (T4–T1)

#### Scenario: Group visual separation
- **WHEN** the user views the troop grid
- **THEN** each group has a label ("High Tiers (T14–T10)", "Mid Tiers (T9–T5)", "Low Tiers (T4–T1)") and vertical spacing between groups

#### Scenario: No interactive collapse
- **WHEN** the user clicks a tier group label
- **THEN** nothing happens (labels are non-interactive, no cursor pointer, no toggle)

## REMOVED Requirements

### Requirement: Bulk-set buttons
**Reason**: Replaced by the "Default count" input in a previous change (commit da5a53a). The spec still references the old bulk-set buttons but the code already uses a default count input field instead.
**Migration**: No migration needed — code already reflects the new behavior.
