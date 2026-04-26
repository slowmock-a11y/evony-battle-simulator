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
The Battle Mechanics view SHALL present the core simulation rules as a readable fact sheet. The view SHALL include an "Archer Tower" subsection that describes the new defender-only entity and clearly distinguishes confirmed simulator behaviour from unverified-in-game facts. Every unverified fact SHALL be styled as an "open question" call-out (matching the existing `view-battlefield-investigation` orange-styled note pattern) and SHALL link to the dedicated Archer Tower investigation page.

#### Scenario: Mechanics page displays all core sections
- **WHEN** the Battle Mechanics view is visible
- **THEN** it SHALL display the following sections: Troop Types overview, Phase Order, Battlefield & Movement, Targeting Priority, Damage Formula, Damage Multipliers, and **Archer Tower**

#### Scenario: Troop type stats displayed
- **WHEN** the Battle Mechanics view is visible
- **THEN** it SHALL display a summary of the four troop types (Ground, Ranged, Mounted, Siege) with their roles, key traits, speed, and range values

#### Scenario: Targeting priority displayed
- **WHEN** the Battle Mechanics view is visible
- **THEN** it SHALL display the targeting priority matrix showing each troop type's attack priority chain. The matrix SHALL include a row for ARCHER_TOWER tagged "PROVISIONAL" with a link to the investigation page.

#### Scenario: Damage formula displayed
- **WHEN** the Battle Mechanics view is visible
- **THEN** it SHALL display the damage formula (`troopCount × ATK × modifier × ATK / (ATK + DEF)`) and the kill calculation, with an explanation of each variable

#### Scenario: Damage multipliers displayed
- **WHEN** the Battle Mechanics view is visible
- **THEN** it SHALL display the 5×5 damage multiplier matrix showing all attacker→target coefficients across the five types Ground, Ranged, Mounted, Siege, and Archer Tower. Cells involving ARCHER_TOWER SHALL be visually flagged as PROVISIONAL.

#### Scenario: Archer Tower subsection present
- **WHEN** the Battle Mechanics view is visible
- **THEN** the Archer Tower subsection SHALL list confirmed simulator behaviours (defender-only, three absolute inputs, stationary at edge, fires last in round, counter-strikes when in range, counts toward armyAlive) AND list unverified facts as orange-styled call-outs (whether buffs apply to AT, phantom-fire timing, targeting chain, multiplier matrix cells, AT.def=0 hypothesis, wall-level → AT-stat dependency)

#### Scenario: Each unclear-fact call-out links to investigation page
- **WHEN** the user clicks an "unclear fact" call-out in the Archer Tower subsection
- **THEN** the navigation SHALL switch to the `view-archer-tower-investigation` page

### Requirement: Views do not interfere with simulator state
Switching views SHALL NOT reset, modify, or interfere with the simulator's state (army configuration, battle progress, playback position).

#### Scenario: Battle state preserved across view switches
- **WHEN** the user runs a partial battle, switches to About, then returns to Simulator
- **THEN** the battle state (round, troop counts, log entries, battlefield positions) SHALL be exactly as it was before switching

### Requirement: Archer Tower investigation page
The app SHALL include a dedicated investigation page at `view-archer-tower-investigation`, reachable from the Battle Mechanics fact sheet's Archer Tower subsection and from any "unclear fact" link related to AT. The page SHALL mirror the structure of `view-battlefield-investigation`: a status banner showing the open-question status, a "why this matters" section, two-or-more hypotheses per fact (H1 = simulator default, H2 = differs), differential test protocols where feasible, predicted-outcomes tables, controlling-for-noise guidance, reporting templates, follow-up decision trees, and share-your-findings.

The page SHALL document at least these open questions:
1. Whether defender ATK% / DEF% / HP% / Range% buffs scale AT.atk / .hp / .range
2. Phantom-fire timing (no volley vs one volley vs N volleys)
3. AT targeting chain (vs RANGED's Mounted-first chain)
4. All 16 multiplier matrix cells (5 in AT row + 4 in AT column on existing rows; AT cells are band-stable since RANGED's row is band-stable)
5. AT.def = 0 hypothesis (vs hidden DEF)
6. Wall-level → AT-stat dependency (out of scope for this change but documented as a known gap, with `data/Master Generals Spreadsheet_wall.csv` referenced as a candidate primary source)

The page SHALL NOT depend on simulator state and SHALL preserve simulator state when toggled.

#### Scenario: Investigation page reachable from fact sheet
- **WHEN** the user clicks any AT-related "unclear fact" link from the Battle Mechanics view
- **THEN** the `view-archer-tower-investigation` page SHALL be displayed

#### Scenario: Investigation page documents every PROVISIONAL value
- **WHEN** the user views the investigation page
- **THEN** every value tagged `// PROVISIONAL` in `js/troop-data.js` (16 multiplier cells + 1 chain) SHALL have a corresponding entry on the page

#### Scenario: Differential test protocols included
- **WHEN** the user views the investigation page entry for a fact that admits a differential test
- **THEN** that entry SHALL include a Run A vs Run B protocol, a predicted-outcomes table, and noise-reduction guidance — mirroring the battlefield-length investigation page's structure

#### Scenario: Investigation page does not affect simulator state
- **WHEN** the user navigates to the investigation page from the simulator and returns
- **THEN** the simulator's army config, buff inputs, battle state, AT inputs, and battle log SHALL be unchanged

