## Why

The setup page's buff section feels cramped — buff inputs are tightly packed with insufficient spacing between rows and stat fields. The preset dropdown is overly complex for what users actually need, and the default count input sits separately from the troop grid controls. There is no clear visual boundary between the buff section and the troop grid.

## What Changes

- **Buff section spacing overhaul**: Increase vertical spacing between buff rows and horizontal spacing between ATK/DEF/HP stat groups. Add a subtle visual separator between the buff section and the troop grid below it.
- **Replace presets with simple actions**: Remove the preset dropdown entirely. Add two buttons next to the default count input: "Set Default" (applies the default count value to all cells) and "Clear All" (sets all cells to 0).
- **Unified troop controls row**: Place the default count input and the two action buttons in a single controls row above the tier groups.
- **Section visual separation**: Add clear visual dividers (spacing, borders, or background contrast) between buffs and troop grid.

## Capabilities

### New Capabilities
_(none — this is a layout-only change to existing UI)_

### Modified Capabilities
- `army-config-ui`: Buff section gets increased spacing and visual separation from troop grid. Preset dropdown replaced by default count input + "Set Default" / "Clear All" buttons in a unified controls row.

## Impact

- `css/style.css`: Updated spacing, gap, and margin rules for `.buff-section`, `.buff-row`. New `.grid-controls` row style. Remove `.panel-controls` styles.
- `js/army-config.js`: Remove `PRESETS` object and `buildPresets()`. Rework `buildTroopGrid()` to generate controls row with default count input + two action buttons.
- `index.html`: Remove `<div class="panel-controls">` and preset `<select>` from both panels.
