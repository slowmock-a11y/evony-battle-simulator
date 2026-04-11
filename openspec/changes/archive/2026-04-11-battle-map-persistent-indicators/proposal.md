## Why

The battle map currently hides range and speed indicators behind hover interactions, requiring the user to mouse over each unit to see its reach and movement. This makes it hard to get a quick overview of the battlefield situation. Additionally, the map lacks an x-axis scale, so engine positions (0–5200) have no visible reference — users can't gauge distances at a glance.

## What Changes

- **Add an x-axis scale** to the battle map showing engine-position tick marks (e.g., 0, 500, 1000, … 5200) along the bottom of the battlefield container.
- **Show range indicators permanently** for all alive ranged/siege units, using a more transparent color than the current hover style so they don't overwhelm the map.
- **Show speed projection indicators permanently** for all alive units, also at reduced opacity.
- **Remove hover-to-show behavior** for indicators — they are always rendered and update with each phase change.
- **Keep hover/click interactions** for tooltips and the detail panel unchanged.

## Capabilities

### New Capabilities
- `battlefield-axis`: X-axis scale bar rendered along the bottom of the battlefield, showing engine-position tick marks at regular intervals.

### Modified Capabilities
- `range-speed-indicators`: Indicators change from hover-triggered to always-visible, rendered for every alive unit at reduced opacity. Hover behavior for showing indicators is removed.
- `battlefield-visual`: The map container gains a bottom axis area; vertical layout may need a small height adjustment.

## Impact

- **js/battlefield.js**: Indicator rendering logic moves from hover callbacks into `render()`. New axis rendering function added. `showIndicators`/`clearIndicators` hover hooks simplified.
- **css/style.css**: New styles for axis ticks/labels, adjusted opacity values for persistent indicators.
- No new dependencies or breaking changes.
