## Context

Each army panel currently has three distinct sections stacked vertically: panel controls (preset dropdown), buff section (4 rows of ATK/DEF/HP inputs), and troop grid (default count + tier groups). The buff rows use a 0.4rem gap and 0.4rem margin-bottom, making them feel crowded. The preset dropdown sits alone in `.panel-controls` while the default count input sits inside `.troop-grid`, creating a visual disconnect. There is no clear visual boundary between the buff section and the troop grid.

## Goals / Non-Goals

**Goals:**
- Increase breathing room in the buff section so ATK/DEF/HP groups are easy to scan
- Create clear visual separation between buff section and troop grid
- Replace the preset dropdown with two simple action buttons ("Set Default", "Clear All") next to the default count input
- Place all troop-count controls (default input + buttons) in a single row above the tier groups

**Non-Goals:**
- Redesigning the overall two-panel layout or header
- Adding new functionality (collapsible sections, tabs, etc.)
- Changing the troop grid structure (rows, columns, tier groups)
- Responsive / mobile layout changes

## Decisions

### 1. Remove preset system, add "Set Default" and "Clear All" buttons
The preset dropdown (Empty March, T14 Only, T12-T14 Mix, Full Layers) is more complex than needed. Users mostly just want to set a uniform count or clear everything. Replace with two buttons:
- **Set Default**: reads the default count input value and applies it to all 56 cells
- **Clear All**: sets all 56 cells to 0 and resets the default count input to 0

This removes the `PRESETS` object, `buildPresets()`, and the `<select>` from HTML.

### 2. Unified `.grid-controls` row
Generate a single row in `buildTroopGrid()` containing: default count label + input, "Set Default" button, "Clear All" button. Style as `display: flex` with centered alignment. This replaces both the old `.panel-controls` div (from HTML) and the old `.default-count-row`.

### 3. Buff spacing via CSS gap increase
Increase `.buff-row` gap from `0.4rem` to `0.75rem` for horizontal spacing. Increase margin-bottom from `0.4rem` to `0.6rem` for vertical breathing room.

### 4. Section divider via border-bottom on buff section
Add `border-bottom` and `padding-bottom` to `.buff-section` to create a clear separator. Increase margin-bottom from `0.75rem` to `1rem`.

## Risks / Trade-offs

- [Removing presets loses quick army templates] → Acceptable — the presets were rarely useful as-is. If users want them back, they can be re-added later as a separate feature.
- [Horizontal overflow on narrow panels] → Buff row inputs are already compact at 55px width; increased gaps may push content wider. Mitigation: test at minimum panel width.
