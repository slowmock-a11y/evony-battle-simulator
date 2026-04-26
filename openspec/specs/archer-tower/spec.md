# archer-tower Specification

## Purpose
Defender-only static fixture (the wall's Archer Tower) configured by three absolute inputs (ATK, HP, Range) plus an "Attack after death" toggle. Fires in a dedicated tail phase after Siege, counter-strikes when in range, counts toward defender alive check, and ignores defender %-buffs.

## Requirements

### Requirement: Archer Tower is a defender-only static fixture
The simulator SHALL support a defender-only combat entity called Archer Tower. The Archer Tower SHALL be configurable only on the defender side; the attacker side SHALL NOT have any Archer Tower configuration UI, no attacker AT engine layer SHALL be constructable, and no attacker AT marker SHALL appear in the battlefield view.

#### Scenario: Attacker side has no AT inputs
- **WHEN** the user views the attacker army panel
- **THEN** there SHALL be no Archer Tower row in the attacker Buff section, no attacker AT inputs in the DOM, and no `data-archer-stat` inputs on the attacker panel

#### Scenario: Attacker AT layer cannot be constructed
- **WHEN** any caller invokes `BattleEngine.createArmy(troopCounts, buffs, archerTower)` for the attacker side
- **THEN** the returned army SHALL have no layer with `type === 'ARCHER_TOWER'` regardless of the `archerTower` argument

#### Scenario: Battlefield AT row stays empty on attacker side
- **WHEN** the battlefield is rendered for any battle
- **THEN** the attacker half of the AT row SHALL contain no marker, regardless of attacker army composition

### Requirement: Archer Tower is configured by three absolute inputs plus one toggle
The defender Buff section SHALL include four AT inputs: a numeric ATK, a numeric HP, a numeric Range, and an "Attack after death" boolean toggle. The numeric inputs SHALL be absolute (not percent) values; the rendered field SHALL NOT display a `%` suffix. Default values SHALL be 0 for ATK / HP / Range and `false` for the toggle.

#### Scenario: Default state on page load
- **WHEN** the page loads
- **THEN** the defender Buff section SHALL show one Archer Tower row with ATK=0, HP=0, Range=0 and the "Attack after death" checkbox unchecked

#### Scenario: Inputs are absolute, not percent
- **WHEN** the user views the AT row
- **THEN** none of the three numeric inputs SHALL display a `%` suffix, distinguishing them from the buff rows above

#### Scenario: Toggle controls phantom-fire behavior
- **WHEN** the user checks the "Attack after death" checkbox
- **THEN** the engine SHALL receive `phantomFire: true` for the AT layer on the next battle simulation

### Requirement: AT inputs at zero produce no AT layer
When all three numeric AT inputs (ATK, HP, Range) are 0, the engine SHALL NOT construct an AT layer for the defender. Battles with zero AT inputs SHALL behave identically to battles run by a pre-change version of the simulator.

#### Scenario: Zero inputs skip AT layer
- **WHEN** the user runs a battle with defender AT inputs all at 0
- **THEN** `BattleEngine.createArmy` SHALL NOT push an AT layer onto the defender army

#### Scenario: Existing battles unchanged
- **WHEN** any battle runs without configured AT inputs
- **THEN** the produced event log SHALL be identical to a pre-change baseline run for the same inputs

### Requirement: AT fires in a dedicated tail phase
The simulator SHALL add an `ARCHER_TOWER` phase to the per-round phase loop, ordered after `SIEGE` (i.e. as the fifth and final phase). In this phase, only the defender's AT layer (if any) SHALL fire; the attacker SHALL never fire in this phase.

#### Scenario: Phase order extended
- **WHEN** a battle round is executed
- **THEN** the phase iteration SHALL be GROUND → MOUNTED → RANGED → SIEGE → ARCHER_TOWER (fastest first by speed; AT speed=0 fits the tail)

#### Scenario: AT fires after SIEGE
- **WHEN** the SIEGE phase of a round completes and the defender has a configured live AT
- **THEN** the AT layer SHALL fire its scheduled shot in the new ARCHER_TOWER phase, after all SIEGE attacks for that round are recorded

#### Scenario: Empty AT phase is a no-op
- **WHEN** the defender has no AT layer (no AT configured or AT already destroyed without phantom-fire eligibility)
- **THEN** the ARCHER_TOWER phase SHALL emit no attack events and SHALL NOT advance state

### Requirement: AT is stationary at the defender edge
The AT layer SHALL be initialised at battlefield position 1500 (defender edge) and SHALL NOT move during any phase. Movement evaluation SHALL be skipped entirely for the AT type.

#### Scenario: Initial position
- **WHEN** the engine initialises positions for a battle that includes a defender AT
- **THEN** the AT layer's position SHALL be 1500

#### Scenario: AT does not move
- **WHEN** any phase movement evaluation runs and the active type is `ARCHER_TOWER`
- **THEN** the function SHALL return without producing any move descriptors and the AT position SHALL remain 1500

#### Scenario: Stationary across rounds
- **WHEN** a multi-round battle progresses
- **THEN** the AT layer's position SHALL be 1500 in every round's position snapshot

### Requirement: AT counters incoming fire when in range
When an attacker fires at the AT layer and the attacker is within AT's range (`distance <= AT.range`), the AT layer SHALL counter-strike using the existing range-gated counter-strike rule (`calculateCounterKills`). When the attacker is outside AT's range, no counter-strike SHALL occur.

#### Scenario: Counter when in range
- **WHEN** an attacker layer fires at AT from a position within AT's range
- **THEN** AT SHALL emit a counter event using the standard counter-strike formula

#### Scenario: No counter when out of range
- **WHEN** an attacker layer fires at AT from a position outside AT's range
- **THEN** no counter event SHALL be emitted from AT for that exchange

### Requirement: AT counts toward defender alive check
The existing `armyAlive` predicate SHALL include the AT layer in its alive check; defender SHALL be considered alive while AT.count > 0 even if all defender troop layers have been wiped.

#### Scenario: Defender alive with only AT
- **WHEN** all defender troop layers reach zero count but the AT layer still has count > 0
- **THEN** `armyAlive(defenderArmy)` SHALL return true and the battle SHALL continue

#### Scenario: Defender dead when AT also dies
- **WHEN** the AT layer reaches count <= 0 and all defender troop layers are also at zero
- **THEN** `armyAlive(defenderArmy)` SHALL return false and the battle SHALL end with the attacker as winner

### Requirement: Phantom-fire toggle controls one extra shot on the round AT dies
With the "Attack after death" toggle on, AT SHALL fire its scheduled tail-phase shot exactly once on the round that AT.count reaches 0 (assuming AT was alive at the start of that round). With the toggle off, AT SHALL stop firing the moment AT.count <= 0. The phantom-fire path SHALL NOT grant additional volleys on subsequent rounds.

#### Scenario: Toggle off — AT killed mid-round does not fire
- **WHEN** the phantom-fire toggle is off and AT.count drops to 0 during the SIEGE phase of round N
- **THEN** the ARCHER_TOWER phase of round N SHALL NOT emit an AT attack event

#### Scenario: Toggle on — AT killed mid-round fires once
- **WHEN** the phantom-fire toggle is on, AT was alive at the start of round N, and AT.count drops to 0 during the SIEGE phase of round N
- **THEN** the ARCHER_TOWER phase of round N SHALL emit one AT attack event using AT's stats from before death

#### Scenario: Toggle on — no further phantom-fire after the dying round
- **WHEN** AT fired a phantom-fire volley in round N and the battle continues into round N+1
- **THEN** the ARCHER_TOWER phase of round N+1 SHALL NOT emit any AT attack event

#### Scenario: Toggle on — AT already dead at round start does not fire
- **WHEN** the phantom-fire toggle is on but AT was already at count <= 0 at the start of round N
- **THEN** the ARCHER_TOWER phase of round N SHALL NOT emit any AT attack event

### Requirement: AT stats are absolute and ignore defender buffs
AT.atk, AT.hp, and AT.range SHALL be the user's typed values exactly. Defender %-buff inputs (ATK%, DEF%, HP%, Range%, Range flat) SHALL NOT scale AT's stats. The damage formulas applied to AT SHALL evaluate AT's per-troop ATK/DEF/HP as the raw layer values without buff multiplication.

#### Scenario: Defender ATK% does not scale AT
- **WHEN** the defender has a +100% ATK buff on every troop type and AT.atk is set to 5000
- **THEN** AT's effective ATK in the damage formula SHALL be 5000, not 10000

#### Scenario: Defender Range% does not scale AT range
- **WHEN** the defender has a +50% Range buff on RANGED and AT.range is set to 800
- **THEN** AT's targeting range SHALL be 800, not 1200

### Requirement: Battlefield view shows AT at a dedicated bottom row
The battlefield map SHALL render the AT layer (when configured and alive) as a single defender-side marker at the bottom row (Y = 100), at the defender edge (X = 1500). The marker SHALL display an HP fraction (count rendered as a 0.0–1.0 bar) rather than an integer count. The attacker half of the AT row SHALL never contain a marker.

#### Scenario: AT marker placement
- **WHEN** the defender has a configured live AT and the battlefield renders
- **THEN** a single AT marker SHALL appear at X = 1500 on the AT row (Y = 100)

#### Scenario: HP-fraction rendering
- **WHEN** AT.count is 0.42 (42% HP remaining)
- **THEN** the AT marker SHALL display a fractional HP bar at 42%, not the literal text "0.42" as a count

#### Scenario: AT marker absent on attacker side
- **WHEN** the battlefield renders any battle
- **THEN** the attacker half of the AT row SHALL contain no marker, no firefight zone, and no range tip on that row

### Requirement: Phase indicator strip includes ARCHER_TOWER dot
The phase-indicator strip SHALL include a fifth dot labelled "Archer Tower" with `data-phase="ARCHER_TOWER"` so the new phase highlights correctly during playback.

#### Scenario: Fifth dot present and labelled
- **WHEN** the page loads
- **THEN** the phase-indicator strip SHALL contain five dots in order: Siege, Ranged, Mounted, Ground, Archer Tower

#### Scenario: AT dot activates during AT phase
- **WHEN** the simulation reaches the ARCHER_TOWER phase of any round
- **THEN** the Archer Tower dot SHALL be marked `active` and the four prior dots SHALL be marked `done`

### Requirement: Battle Mechanics fact sheet documents AT and unverified facts
The Battle Mechanics view (`view-mechanics`) SHALL include an "Archer Tower" subsection. The subsection SHALL clearly distinguish confirmed simulator behaviour from unverified-in-game facts. Each unverified fact SHALL be styled as an "open question" call-out (matching the existing `view-battlefield-investigation` orange-styled note pattern) and SHALL link to the dedicated investigation page.

The unverified-fact call-outs SHALL include at minimum: whether buffs apply to AT, phantom-fire timing, AT targeting chain, AT-as-attacker multiplier coefficients, AT-as-target multiplier coefficients, AT.def=0 hypothesis, and the wall-level → AT-stat dependency.

#### Scenario: Subsection exists
- **WHEN** the user views the Battle Mechanics page
- **THEN** an "Archer Tower" subsection SHALL be present between the existing Phase Order and Targeting Priority sections

#### Scenario: Confirmed vs unclear separation
- **WHEN** the user reads the Archer Tower subsection
- **THEN** the page SHALL clearly mark which behaviours are deliberate simulator design choices ("confirmed") and which are provisional defaults ("unclear / unverified")

#### Scenario: Each unclear fact links to investigation
- **WHEN** the user clicks any "unclear fact" call-out in the Archer Tower subsection
- **THEN** the navigation SHALL switch to the `view-archer-tower-investigation` page

### Requirement: Archer Tower investigation page documents hypotheses and protocols
The app SHALL provide a dedicated investigation page (`view-archer-tower-investigation`) accessible from the Battle Mechanics fact sheet's AT subsection. The page SHALL mirror the structure of `view-battlefield-investigation`: status banner, why-it-matters, two-or-more hypotheses (H1 = simulator default, H2 = differs), differential test protocol, predicted outcomes, controlling-for-noise guidance, reporting template, follow-up decision tree, and share-your-findings.

The page SHALL document at minimum these open questions:
- Whether defender ATK% / DEF% / HP% / Range% buffs scale AT.atk / .hp / .range
- Phantom-fire timing (no volley vs one volley vs N volleys)
- AT targeting chain (vs RANGED's Mounted-first chain)
- All 16 multiplier matrix cells (5 in AT row + 4 in AT column on existing rows, both LOW and HIGH bands collapse since RANGED's row is band-stable)
- AT.def = 0 hypothesis (vs hidden DEF)
- Wall-level → AT-stat dependency (out of scope but documented as a known gap)

#### Scenario: Investigation page reachable
- **WHEN** the user clicks the AT investigation link from any AT-related context
- **THEN** the `view-archer-tower-investigation` page SHALL be displayed and the prior view SHALL be hidden

#### Scenario: All open questions documented
- **WHEN** the user views the investigation page
- **THEN** every fact tagged `// PROVISIONAL` in `js/troop-data.js` and every "unclear" call-out from the fact sheet SHALL have a corresponding entry on the investigation page with at least an H1/H2 description

#### Scenario: Test protocol present where applicable
- **WHEN** the user views the investigation page entry for a fact that admits a differential test
- **THEN** the entry SHALL include a Run A vs Run B protocol, a predicted-outcomes table, and noise-reduction guidance
