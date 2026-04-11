## 1. Project Setup

- [x] 1.1 Create index.html with dark theme, two-panel layout structure, and script/css includes
- [x] 1.2 Create css/style.css with dark theme, layout grid, troop type colors, collapsible groups

## 2. Troop Data

- [x] 2.1 Create js/troop-data.js with all base stats for T1–T14 × 4 types, type metadata (name, color, targeting priority chain), and damage multiplier table

## 3. Battle Engine

- [x] 3.1 Create js/battle-engine.js — model objects (Layer, Army, BattleEvent, BattleResult)
- [x] 3.2 Implement damage calculation (damage formula with buff application and type multipliers)
- [x] 3.3 Implement target selection (full priority chain walk, tier-based selection within priority)
- [x] 3.4 Implement main battle loop (round → 4 phases → attacker then defender → tier ordering → event generation)
- [x] 3.5 Implement battle termination and result summary

## 4. Army Configuration UI

- [x] 4.1 Create js/army-config.js — build troop count grid with collapsible tier groups (High T14–T10 expanded, Mid T9–T5 and Low T4–T1 collapsed)
- [x] 4.2 Implement bulk-set buttons (Set all: 0, Set all: 1000, custom value + Apply)
- [x] 4.3 Build buff input rows per troop type (Attack%, Defense%, HP%) with default 0
- [x] 4.4 Implement mirror button (copy all values from one panel to the other)
- [x] 4.5 Implement preset dropdown (Empty March, T14 Only, T12–T14 Mix, Full Layers)
- [x] 4.6 Implement column/row header click to bulk-set a type or tier

## 5. Battlefield Visual

- [x] 5.1 Create js/battlefield.js — build battlefield layout with troop blocks (left attacker, right defender, arranged by range)
- [x] 5.2 Implement troop block rendering (type label, tier layers with counts, totals, color coding, fill bars)
- [x] 5.3 Implement active phase highlighting (border/glow on acting block, arrow to target with damage/kills)
- [x] 5.4 Implement phase progress indicator (4 dots: Siege, Ranged, Mounted, Ground)
- [x] 5.5 Implement summary bar (per-type start→current counts, % lost, health bars)
- [x] 5.6 Implement hover tooltips on troop blocks (effective stats with buffs, targeting chain)
- [x] 5.7 Implement battle end state display (winner, survivors, faded eliminated blocks, Reset/Replay)

## 6. Playback Controls

- [x] 6.1 Create js/playback.js — Step button (advance one event, update battlefield)
- [x] 6.2 Implement Round button (advance all events in current round)
- [x] 6.3 Implement Full Battle button (apply all events with speed-controlled animation)
- [x] 6.4 Implement speed slider (50ms–1000ms delay)
- [x] 6.5 Implement Reset button (clear battlefield, restore configured values)

## 7. Battle Log

- [x] 7.1 Create js/battle-log.js — scrollable log panel with auto-scroll and color-coded entries
- [x] 7.2 Implement log filters (by troop type, by round, by side)

## 8. Result Comparison

- [x] 8.1 Store previous result and display comparison panel after second run (surviving delta, rounds delta, winner)

## 9. Integration & Testing

- [x] 9.1 Create js/app.js — wire army config → engine → battlefield + log + playback
- [x] 9.2 Test with known scenarios to verify damage calculations match expected values
- [ ] 9.3 Verify full flow in browser (configure → step → round → full → reset → tweak → compare)
