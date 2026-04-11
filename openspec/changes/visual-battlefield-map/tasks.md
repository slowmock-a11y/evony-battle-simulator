## 1. Battlefield CSS Overhaul

- [x] 1.1 Replace `.battlefield` styles with terrain background (green gradient, 420px height, relative positioning)
- [x] 1.2 Add `.bf-center-line` style (absolute vertical divider at 50%)
- [x] 1.3 Add `.unit-marker` styles (absolute positioning, flex column, CSS transitions for left/top/opacity)
- [x] 1.4 Add `.unit-icon` styles (52px circle, radial gradient per type: icon-ground/ranged/mounted/siege)
- [x] 1.5 Add `.unit-count` and `.unit-label` styles
- [x] 1.6 Add `.unit-marker.eliminated`, `.unit-marker.highlighted`, `.unit-marker.damaged` states
- [x] 1.7 Add `.bf-svg-overlay`, `.attack-line`, `.attack-label`, `.attack-label-bg` SVG styles
- [x] 1.8 Add `.detail-panel` and its child styles (title, tier rows, total, targets)
- [x] 1.9 Add `@keyframes damage-flash-icon` animation
- [x] 1.10 Remove old `.bf-side`, `.troop-block .block-layer`, `.fill-bar`, `.attack-arrow` CSS rules

## 2. Battlefield.js — Init and Rendering

- [x] 2.1 Add module variables: `currentPhaseIndex`, `SPEEDS`, `Y_POSITIONS`, `TYPE_LETTERS`
- [x] 2.2 Add `calcPosition(type, side)` function implementing speed-based X positioning formula
- [x] 2.3 Rewrite `init()` to create center line, SVG overlay (defs + arrowhead marker + line + label bg + label), and detail panel element
- [x] 2.4 Rewrite `render()` to remove old markers and call `placeUnit()` per type per side
- [x] 2.5 Implement `placeUnit()` — create unit marker div with icon circle, count, label; position via `calcPosition()`; add click and hover handlers

## 3. Battlefield.js — Detail Panel

- [x] 3.1 Implement `showDetailPanel()` — build HTML with tier-by-tier counts, losses, total, and targeting chain; position near clicked marker
- [x] 3.2 Add document click listener in `init()` to dismiss detail panel when clicking outside

## 4. Battlefield.js — Attack Arrows and Highlights

- [x] 4.1 Rewrite `highlightAttack()` — compute SVG line coordinates from marker icon bounding rects, animate stroke-dashoffset, position label with background rect
- [x] 4.2 Update `clearHighlights()` — hide SVG line/label/bg, remove highlighted/damaged classes

## 5. Battlefield.js — Phase-Based Movement

- [x] 5.1 Update `setPhase()` to track `currentPhaseIndex` and call `repositionMarkers()`
- [x] 5.2 Implement `repositionMarkers()` — recalculate and update `left` style on all existing markers
- [x] 5.3 Update `resetPhase()` and `reset()` to set `currentPhaseIndex = -1`

## 6. Battle View Toggle

- [x] 6.1 Add "Battle View" button to `index.html` playback controls
- [x] 6.2 Implement `toggleBattleView()`, `enterBattleView()`, `exitBattleView()` in `app.js`
- [x] 6.3 Add `.battle-view-active .army-panels { display: none }` CSS rule
- [x] 6.4 Update `onReset()` in `app.js` to exit battle view

## 7. Cleanup and Verification

- [x] 7.1 Update `showEndState()` to position winner banner absolutely centered on the map
- [x] 7.2 Update `reset()` to remove unit markers and winner banner without destroying SVG overlay
- [x] 7.3 Verify `updateSummary()`, `hideSummary()` still work (they target `#summary-bar`, no changes needed)
- [x] 7.4 Test end-to-end: configure armies → step/round/full → verify markers move, arrows draw, detail panel works, reset clears
