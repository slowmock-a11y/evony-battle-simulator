## ADDED Requirements

### Requirement: Three playback modes
The UI SHALL provide three simulation buttons: Step (advances one attack action), Round (advances all phases in the current round), and Full Battle (runs all rounds to completion). A Reset button SHALL restore the battlefield to the pre-simulation state.

#### Scenario: Step mode
- **WHEN** the user clicks Step
- **THEN** the next single attack event is applied to the battlefield and displayed

#### Scenario: Round mode
- **WHEN** the user clicks Round
- **THEN** all remaining events in the current round are applied, and the battlefield shows the state at the end of that round

#### Scenario: Full battle mode
- **WHEN** the user clicks Full Battle
- **THEN** all events are applied and the final battle result is displayed

#### Scenario: Reset
- **WHEN** the user clicks Reset
- **THEN** the battlefield clears, troop counts return to the configured values, and the event log clears

### Requirement: Playback speed control
The UI SHALL provide a speed slider controlling the animation delay between auto-played steps. Range SHALL be from fast (50ms) to slow (1000ms). This SHALL affect the speed of animated playback during Round and Full Battle modes.

#### Scenario: Slow playback
- **WHEN** the user sets speed to slow and clicks Full Battle
- **THEN** events are applied one at a time with 1000ms delay between each, animating the battle

#### Scenario: Fast playback
- **WHEN** the user sets speed to fast and clicks Full Battle
- **THEN** events are applied with 50ms delay, appearing nearly instant

### Requirement: Battle log
The UI SHALL display a scrollable text log of all battle events that have been played so far. Each log entry SHALL show round, phase, attacker, target, damage, and kills. New entries SHALL auto-scroll into view.

#### Scenario: Log entry format
- **WHEN** an event is played where ATT Range T14 (2000) attacks DEF Mounted T14 (5000) for 23472 damage and 1948 kills
- **THEN** the log shows "R1.Ranged ATT Range T14 (2000) → DEF Mounted T14: 23,472 dmg, 1,948 killed"

### Requirement: Log filtering
The battle log SHALL support filtering by troop type and by round number. Filters SHALL also allow showing only attacker or only defender events.

#### Scenario: Filter by troop type
- **WHEN** the user selects "Ranged" filter
- **THEN** only events from the Ranged phase are shown

#### Scenario: Filter by side
- **WHEN** the user unchecks "Defender"
- **THEN** only attacker attack events are shown

### Requirement: Result comparison
After running a simulation, tweaking inputs, and running again, the UI SHALL display a comparison between the current and previous result showing: surviving troops per side (delta), rounds to completion (delta), and winner.

#### Scenario: Compare two runs
- **WHEN** the user runs a simulation (attacker survives 14912), tweaks inputs, and runs again (attacker survives 16200)
- **THEN** a comparison panel shows "ATT surviving: 14,912 → 16,200 (+1,288)"

#### Scenario: First run has no comparison
- **WHEN** the user runs the simulation for the first time
- **THEN** no comparison panel is shown
