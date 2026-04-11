## ADDED Requirements

### Requirement: Battle view toggle button
A "Battle View" button SHALL be present in the playback controls bar. Clicking it SHALL hide the army configuration panels and enter battle view mode.

#### Scenario: Enter battle view
- **WHEN** the user clicks "Battle View" with a valid simulation ready
- **THEN** the army configuration panels (attacker and defender) are hidden and the button text changes to "Setup"

#### Scenario: Simulation required
- **WHEN** the user clicks "Battle View" with no simulation run yet
- **THEN** the simulation runs first, then battle view is entered

### Requirement: Return to setup
When in battle view mode, clicking the toggle button (now labeled "Setup") SHALL restore the army configuration panels.

#### Scenario: Exit battle view
- **WHEN** the user clicks "Setup" while in battle view mode
- **THEN** the army configuration panels reappear and the button text changes back to "Battle View"

### Requirement: Reset exits battle view
Clicking the Reset button while in battle view mode SHALL exit battle view and restore the army configuration panels.

#### Scenario: Reset in battle view
- **WHEN** the user clicks Reset while in battle view mode
- **THEN** the battlefield is cleared, army panels reappear, and the toggle button shows "Battle View"
