## ADDED Requirements

### Requirement: Battle view toggle button
A "Battle View" button SHALL be present in the mirror column between army panels. Clicking it SHALL hide the army configuration panels and enter battle view mode. The button SHALL move to the playback controls bar when in battle view. On viewports at or below 768px, the button SHALL be full-width and have a minimum height of 44px for touch accessibility.

#### Scenario: Button visible on setup page
- **WHEN** the page loads
- **THEN** the "Battle View" button is visible in the mirror column between the army panels

#### Scenario: Enter battle view
- **WHEN** the user clicks "Battle View" with a valid simulation ready
- **THEN** the army configuration panels are hidden, the button moves to the controls bar, and its text changes to "Setup"

#### Scenario: Simulation required
- **WHEN** the user clicks "Battle View" with no simulation run yet
- **THEN** the simulation runs first, then battle view is entered

#### Scenario: Controls bar responsive layout
- **WHEN** the viewport width is at or below 768px and the user is in battle view mode
- **THEN** the controls bar wraps its child elements to fit within the viewport width without horizontal overflow, with buttons and sliders at touch-friendly sizes

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
