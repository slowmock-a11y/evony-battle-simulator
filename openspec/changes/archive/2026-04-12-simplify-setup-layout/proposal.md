## Why

The setup page has two layout friction points: the "Battle View" button is isolated in the controls bar (which is otherwise hidden until battle mode), and the troop tier groups use collapsible accordions that add visual clutter and extra clicks to reach Mid/Low tiers. Flattening the tiers and relocating the button makes the setup flow faster and less cluttered.

## What Changes

- Move the "Battle View" button out of `.controls-bar` and into the setup page alongside the mirror button or as a standalone action row visible on setup.
- Remove collapsible accordion behavior from troop tier groups — all tiers are always visible.
- Replace the collapsible headers with lightweight visual separators (padding/spacing) between High, Mid, and Low tier groups.
- Remove the tier-group-header click handler and arrow icon logic.

## Capabilities

### New Capabilities

_(none — this is a refinement of existing UI)_

### Modified Capabilities

- `army-config-ui`: Tier groups lose collapsible behavior; always-visible layout with padding separators.
- `battle-view-toggle`: "Battle View" button moves from the controls bar to a setup-visible location.

## Impact

- **Files**: `index.html`, `css/style.css`, `js/army-config.js`
- **JS logic removed**: Tier-group collapse toggle event listeners, `.collapsed` class management in `buildTroopGrid`.
- **CSS removed/changed**: `.tier-group-header` hover/cursor styles, `.tier-group-body.collapsed` rule, `.arrow` rotation.
- **No API or dependency changes** — purely presentational.
