## Why

The Setup page is cluttered with battle playback controls (Step, Round, Full Battle, Reset buttons and speed slider) that belong in the Battle View, not the configuration screen. The troop count grid requires tedious per-cell entry even though most tiers share the same count. Buff inputs and troop inputs lack visual padding, making them hard to read and interact with.

## What Changes

- **Remove playback controls from Setup page**: Remove Step, Round, Full Battle, Reset buttons and the speed slider from the setup/controls bar. These controls are only relevant during battle playback.
- **Simplify troop count input**: Replace the per-cell troop grid with a single global default count field. Individual tier/type cells can still be overridden, but the default eliminates repetitive entry.
- **Improve buff section clarity**: Better visual separation and labeling for the buff input area so ATK/DEF/HP per troop type is easier to scan.
- **Add padding to input elements**: All number input boxes get proper padding for better readability and click targets.

## Capabilities

### New Capabilities
- `simplified-troop-input`: Global default troop count with per-cell override capability, replacing the current all-cells-manual grid.

### Modified Capabilities
- `army-config-ui`: Buff section gets improved clarity and layout; input elements get padding.
- `playback-controls`: Step/Round/Full Battle/Reset buttons and speed slider removed from the Setup page controls bar.

## Impact

- `index.html`: Remove button and speed slider markup from controls bar.
- `js/app.js`: Remove event listeners for removed buttons and speed slider on setup page.
- `js/army-config.js`: Rework `buildTroopGrid()` to support global default; improve `buildBuffInputs()` layout.
- `css/style.css`: Add input padding; update layout styles for buff section; remove unused playback button styles if no longer referenced elsewhere.
