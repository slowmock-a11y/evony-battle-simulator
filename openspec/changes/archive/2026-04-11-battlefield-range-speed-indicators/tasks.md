## 1. Range Indicator

- [x] 1.1 Add helper function to compute max range for a troop type from alive layers (reuse engine's getMaxRange logic or read TroopData.STATS directly)
- [x] 1.2 Create `showRangeIndicator(type, side)` function in battlefield.js that renders a horizontal bar from the unit's current X position extending by its max range toward the enemy side, clamped to battlefield bounds (0–5200). Use the troop type's color at ~20% opacity. Only show for types with range > 50 (Ranged, Siege).
- [x] 1.3 Add CSS styles for the range indicator element (`.bf-range-indicator`): absolute positioning, semi-transparent background, thin height (~4px), same Y level as the unit marker.

## 2. Speed Projection Indicator

- [x] 2.1 Create `showSpeedProjection(type, side)` function in battlefield.js that renders a small translucent circle at the projected next-round position (`currentPos + speed` for ATT, `currentPos - speed` for DEF), clamped to battlefield bounds. Use the troop type's color at reduced opacity with a dashed border. Skip if unit is eliminated.
- [x] 2.2 Add CSS styles for the speed projection element (`.bf-speed-projection`): small circle (~20px), dashed border, translucent fill, absolute positioning at the unit's Y level.

## 3. Hover Wiring

- [x] 3.1 Add `mouseenter` event listener on each unit marker in `placeUnit()` that calls `showRangeIndicator` and `showSpeedProjection` for the hovered type/side.
- [x] 3.2 Add `mouseleave` event listener on each unit marker that removes all active indicator elements.
- [x] 3.3 Ensure indicators are cleaned up on `render()` calls (phase transitions) and re-shown if the user is still hovering.

## 4. Testing & Polish

- [x] 4.1 Verify range indicator displays correctly for attacker and defender Siege and Ranged units at various phases.
- [x] 4.2 Verify speed projection displays correctly for all four troop types at various phases.
- [x] 4.3 Verify indicators disappear on mouse leave and do not persist across phase transitions.
- [x] 4.4 Verify no range indicator appears for Ground and Mounted (range 50).
