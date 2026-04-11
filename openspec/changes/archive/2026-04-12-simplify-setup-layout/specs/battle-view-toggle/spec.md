## MODIFIED Requirements

### Requirement: Battle view toggle button
A "Battle View" button SHALL be present in a setup actions row below the army panels (not inside the playback controls bar). Clicking it SHALL hide the army configuration panels and enter battle view mode. The setup actions row SHALL also be hidden when in battle view mode.

#### Scenario: Button visible on setup page
- **WHEN** the page loads
- **THEN** the "Battle View" button is visible below the army panels, outside the playback controls bar

#### Scenario: Enter battle view
- **WHEN** the user clicks "Battle View" with a valid simulation ready
- **THEN** the army configuration panels and the setup actions row are hidden, and the button in the controls bar changes to show "Setup"

#### Scenario: Simulation required
- **WHEN** the user clicks "Battle View" with no simulation run yet
- **THEN** the simulation runs first, then battle view is entered

#### Scenario: Setup actions hidden in battle view
- **WHEN** the user is in battle view mode
- **THEN** the setup actions row (containing the Battle View button) is not visible
