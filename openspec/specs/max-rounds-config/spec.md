## ADDED Requirements

### Requirement: Configurable max rounds in engine
The `simulate()` function SHALL accept an optional `options` parameter with a `maxRounds` property. When provided, the simulation SHALL stop after that many rounds. When omitted, it SHALL default to 100.

#### Scenario: Custom max rounds
- **WHEN** `simulate(attacker, defender, { maxRounds: 20 })` is called
- **THEN** the simulation runs at most 20 rounds before ending

#### Scenario: Default max rounds
- **WHEN** `simulate(attacker, defender)` is called without options
- **THEN** the simulation runs at most 100 rounds (existing behavior)

### Requirement: Max rounds UI control
The battlefield view SHALL display a labeled number input for Max Rounds in the controls area. The input SHALL have a minimum value of 1 and a maximum value of 1000. The default value SHALL be 100.

#### Scenario: User sets max rounds
- **WHEN** the user sets the Max Rounds input to 30 and starts a battle
- **THEN** the simulation uses maxRounds=30

#### Scenario: Default display
- **WHEN** the battlefield view loads
- **THEN** the Max Rounds input displays 100
