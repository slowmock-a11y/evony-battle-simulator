## ADDED Requirements

### Requirement: Battlefield layout with troop blocks
The battlefield visual SHALL display two armies facing each other with troop blocks arranged vertically by range: Siege at top (back line), Ranged below, Mounted below, Ground at bottom (front line). Each troop block SHALL show the troop type name, active tier layers with current counts, and a total.

#### Scenario: Initial battlefield display
- **WHEN** the user clicks a simulate button and results are available
- **THEN** the battlefield shows attacker troop blocks on the left and defender troop blocks on the right, with only types that have troops > 0

#### Scenario: Troop block content
- **WHEN** the attacker has Mounted T14 (5000) and Mounted T13 (3000)
- **THEN** the Mounted block shows "T14: 5,000" and "T13: 3,000" with "Total: 8,000"

### Requirement: Color coding per troop type
Each troop type SHALL have a distinct color: Ground (brown/earth), Ranged (green), Mounted (blue), Siege (red/orange). These colors SHALL be used for block backgrounds, arrows, and log entries.

#### Scenario: Troop block colors
- **WHEN** the battlefield displays troop blocks
- **THEN** Mounted blocks use blue tones and Ground blocks use brown/earth tones

### Requirement: Active phase highlighting
During step playback, the currently acting troop block SHALL be visually highlighted with a distinct border or glow. An arrow SHALL connect the attacking block to the target block, displaying the damage dealt and kills inflicted.

#### Scenario: Step shows attack arrow
- **WHEN** the current step is ATT Range T14 attacking DEF Mounted T14
- **THEN** the attacker's Ranged block is highlighted, an arrow points to the defender's Mounted block, and damage/kills numbers are shown on or near the arrow

### Requirement: Remaining troop fill bars
Each tier within a troop block SHALL display a fill bar showing the ratio of current troops to starting troops. The bar SHALL deplete as troops are killed.

#### Scenario: Troops partially eliminated
- **WHEN** Mounted T14 started at 5000 and currently has 3000
- **THEN** the fill bar shows 60% filled

### Requirement: Summary bar
A summary bar SHALL always be visible showing per-type totals for both sides: starting count, current count, and percentage lost. A health bar SHALL show each army's total remaining troops as a percentage.

#### Scenario: Summary after round 2
- **WHEN** the attacker started with 25000 total troops and has 14912 remaining
- **THEN** the summary shows "TOTAL: 25,000 → 14,912 (-40%)" with a health bar at 60%

### Requirement: Battle end state
When the battle ends, the battlefield SHALL display the winner, total rounds, surviving troop counts, and total losses for both sides. Eliminated troop blocks SHALL appear faded/dashed. Reset and Replay buttons SHALL be shown.

#### Scenario: Attacker wins
- **WHEN** the battle ends with the defender at zero troops
- **THEN** the display shows "ATTACKER WINS", the defender's blocks are faded, surviving attacker troops are shown, and Reset/Replay buttons appear

### Requirement: Hover tooltips on troop blocks
Hovering over a troop block SHALL display a tooltip showing effective stats (base + buff) for that troop type: effective ATK, DEF, HP, and the targeting priority chain.

#### Scenario: Hover with buffs applied
- **WHEN** the user hovers over Mounted T14 with +150% ATK buff
- **THEN** tooltip shows "ATK: 6,670 (+150% → 16,675), DEF: 4,400, HP: 12,050, Targets: Ground > Siege > Mounted > Range"

### Requirement: Phase progress indicator
A phase indicator SHALL show the four phases (Siege, Ranged, Mounted, Ground) as dots or segments, with the active phase highlighted. This SHALL update during step and round playback.

#### Scenario: Ranged phase active
- **WHEN** the simulation is in the Ranged phase
- **THEN** the Siege dot shows as completed, the Ranged dot shows as active, Mounted and Ground dots show as pending
