## MODIFIED Requirements

### Requirement: Battlefield layout with troop blocks
The battlefield visual SHALL display two armies facing each other with unit markers positioned spatially on a map. Markers SHALL be arranged vertically by range (Siege at top, Ground at bottom) and advance horizontally toward the center based on troop speed and current battle phase. Each unit marker SHALL show the troop type letter, current total count, and type name. Tier-by-tier detail SHALL be accessible via click interaction rather than displayed inline.

#### Scenario: Initial battlefield display
- **WHEN** the user clicks a simulate button and results are available
- **THEN** the battlefield shows attacker unit markers on the left and defender unit markers on the right, positioned at their starting edges

#### Scenario: Unit marker content
- **WHEN** the attacker has Mounted T14 (5000) and Mounted T13 (3000)
- **THEN** the Mounted marker shows letter "M" in a blue circle, "8,000" below, and "Mounted" below that

### Requirement: Active phase highlighting
During step playback, the currently acting unit marker SHALL be visually highlighted with a glow effect. An animated SVG arrow SHALL connect the attacking marker to the target marker, displaying the damage dealt and kills inflicted at the midpoint.

#### Scenario: Step shows attack arrow
- **WHEN** the current step is ATT Range T14 attacking DEF Mounted T14
- **THEN** the attacker's Ranged marker glows, an SVG arrow animates from it to the defender's Mounted marker, and damage/kills text is shown at the arrow midpoint

### Requirement: Remaining troop fill bars
REMOVED — tier-level fill bars are replaced by the click-to-detail panel showing per-tier counts with losses.

**Reason**: Inline fill bars per tier cluttered the spatial map layout. Per-tier detail is now accessible via click.
**Migration**: Click any unit marker to see tier-by-tier breakdown with current/starting counts and losses.

### Requirement: Hover tooltips on troop blocks
Hovering over a unit marker SHALL display a tooltip showing the troop type, side, targeting priority chain, and active buff percentages.

#### Scenario: Hover with buffs applied
- **WHEN** the user hovers over the attacker's Mounted marker with +150% ATK buff
- **THEN** tooltip shows "Mounted (ATT), Targets: Ground > Siege > Mounted > Range, Buffs: ATK +150%"
