## Why

There's no easy way to test Evony PvP troop compositions before committing in-game. Losing a march means losing troops, speedups, and resources. A browser-based simulator lets players (and alliance mates) experiment with army setups, compare results, and understand the battle mechanics — without any in-game cost.

## What Changes

- **New application**: Single-page browser app with Java/Kotlin backend and JavaScript frontend
- **Battle engine**: Round-based combat simulation implementing Evony's march-vs-march PvP mechanics (phase order, targeting priority, damage formula, type counters)
- **Army configuration UI**: Troop count inputs for 4 types × 14 tiers per side, with buff percentage inputs per troop type (Attack/Defense/HP)
- **Battlefield visualization**: Real-time visual showing troop blocks, attack arrows, damage numbers, and remaining troop counts
- **Playback controls**: Step (one attack action), Round (all phases), or Full Battle execution with animated replay
- **UX helpers**: Collapsible tier groups, bulk-set buttons, presets/templates, mirror button, result comparison between runs

## Capabilities

### New Capabilities

- `battle-engine`: Core combat simulation — phase sequencing (Siege→Ranged→Mounted→Ground), targeting priority chains, damage formula (count × ATK × modifier × ATK/(ATK+DEF)), type counter multipliers, round-by-round event log generation
- `troop-data`: Static troop base stats for all 4 types × 14 tiers (Attack, Defense, HP, Speed, Range) sourced from community research
- `army-config-ui`: Input panels for two armies — troop count grid with collapsible tier groups, buff percentage inputs per type, presets/templates, mirror button, bulk actions
- `battlefield-visual`: Battlefield rendering — troop blocks with color coding, active phase highlighting, attack arrows, damage/kill numbers, fill bars for remaining troops, summary bar with totals and health bars
- `playback-controls`: Simulation control — Step/Round/Full buttons, playback speed slider, reset, result comparison between runs

### Modified Capabilities

(none — greenfield project)

## Impact

- **New backend**: Java/Kotlin REST API serving the battle engine, troop data endpoint
- **New frontend**: Single HTML page with JavaScript (no framework initially), CSS
- **Dependencies**: Java 17+, build tool (Gradle or Maven), embedded web server (Spring Boot or similar)
- **Deployment**: Runs locally or on a simple server — no database, no auth, no external dependencies
