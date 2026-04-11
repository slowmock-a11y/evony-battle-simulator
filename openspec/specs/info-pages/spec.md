# info-pages Specification

## Purpose
TBD - created by archiving change add-info-pages. Update Purpose after archive.
## Requirements
### Requirement: Navigation between views
The app SHALL display navigation tabs in the header allowing the user to switch between three views: Simulator, About, and Battle Mechanics.

#### Scenario: Default view on load
- **WHEN** the user opens the app
- **THEN** the Simulator view SHALL be displayed and the Simulator tab SHALL be marked as active

#### Scenario: Switch to About view
- **WHEN** the user clicks the "About" tab
- **THEN** the About view SHALL be displayed, the simulator and mechanics views SHALL be hidden, and the About tab SHALL be marked as active

#### Scenario: Switch to Battle Mechanics view
- **WHEN** the user clicks the "Battle Mechanics" tab
- **THEN** the Battle Mechanics view SHALL be displayed, the simulator and mechanics views SHALL be hidden, and the Battle Mechanics tab SHALL be marked as active

#### Scenario: Return to Simulator view
- **WHEN** the user clicks the "Simulator" tab from any other view
- **THEN** the Simulator view SHALL be displayed with its full state preserved (army config, battle progress, etc.)

### Requirement: About view content
The About view SHALL describe the application including its purpose, scope, how to use it, and current limitations.

#### Scenario: About page displays app description
- **WHEN** the About view is visible
- **THEN** it SHALL display: a title, a description of what the Evony Battle Simulator does (march-vs-march PvP simulation), the key features (army configuration, buff inputs, step/round/full playback, battlefield visualization), and a list of mechanics not yet modeled (generals, skills, equipment, research, etc.)

### Requirement: Battle Mechanics view content
The Battle Mechanics view SHALL present the core simulation rules as a readable fact sheet.

#### Scenario: Mechanics page displays all core sections
- **WHEN** the Battle Mechanics view is visible
- **THEN** it SHALL display the following sections: Troop Types overview, Phase Order, Battlefield & Movement, Targeting Priority, Damage Formula, and Damage Multipliers

#### Scenario: Troop type stats displayed
- **WHEN** the Battle Mechanics view is visible
- **THEN** it SHALL display a summary of the four troop types (Ground, Ranged, Mounted, Siege) with their roles, key traits, speed, and range values

#### Scenario: Targeting priority displayed
- **WHEN** the Battle Mechanics view is visible
- **THEN** it SHALL display the full targeting priority matrix showing each troop type's attack priority chain

#### Scenario: Damage formula displayed
- **WHEN** the Battle Mechanics view is visible
- **THEN** it SHALL display the damage formula (`troopCount × ATK × modifier × ATK / (ATK + DEF)`) and the kill calculation, with an explanation of each variable

#### Scenario: Damage multipliers displayed
- **WHEN** the Battle Mechanics view is visible
- **THEN** it SHALL display the counter-triangle multipliers (Range→Mounted 1.2×, Mounted→Ground 1.2×, Ground→Range 1.2×, Siege→Siege 1.5×)

### Requirement: Views do not interfere with simulator state
Switching views SHALL NOT reset, modify, or interfere with the simulator's state (army configuration, battle progress, playback position).

#### Scenario: Battle state preserved across view switches
- **WHEN** the user runs a partial battle, switches to About, then returns to Simulator
- **THEN** the battle state (round, troop counts, log entries, battlefield positions) SHALL be exactly as it was before switching

