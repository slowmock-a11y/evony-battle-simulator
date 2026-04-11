## MODIFIED Requirements

### Requirement: Battlefield layout with troop blocks
The battlefield visual SHALL display two armies facing each other with unit markers positioned spatially on a map. Markers SHALL be arranged vertically by range (Siege at top, Ground at bottom) and advance horizontally toward the center based on troop speed and current battle phase. Each unit marker SHALL show the troop type letter, current total count, and type name. Tier-by-tier detail SHALL be accessible via click interaction rather than displayed inline. The map container SHALL include space at the bottom for an x-axis scale bar showing engine positions.

#### Scenario: Initial battlefield display
- **WHEN** the user clicks a simulate button and results are available
- **THEN** the battlefield shows attacker unit markers on the left and defender unit markers on the right, positioned at their starting edges, with an x-axis scale bar along the bottom

#### Scenario: Unit marker content
- **WHEN** the attacker has Mounted T14 (5000) and Mounted T13 (3000)
- **THEN** the Mounted marker shows letter "M" in a blue circle, "8,000" below, and "Mounted" below that
