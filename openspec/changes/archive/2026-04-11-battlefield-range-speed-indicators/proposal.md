## Why

The battlefield map shows troop positions but gives no visual sense of *reach* or *momentum*. Players cannot tell at a glance whether a siege unit can hit a target at its current position, or how far mounted troops will advance next round. Adding range and speed indicators turns the map from a passive position display into an active tactical readout.

## What Changes

- Add **range arcs** for Ranged and Siege troop markers showing how far they can fire from their current position, drawn as horizontal extent lines or shaded zones on the map.
- Add **speed/movement projection indicators** for all troop types showing the map location each unit will reach in the next round, drawn as a forward tick or ghost marker ahead of the current position.
- Both indicators update dynamically as the battle progresses through phases.
- Indicators are shown contextually (e.g., on hover or via a toggle) to avoid visual clutter.

## Capabilities

### New Capabilities
- `range-speed-indicators`: Visual overlays on the battlefield map showing firing range extents and next-round movement projections for troop markers.

### Modified Capabilities

_(none)_

## Impact

- **`js/battlefield.js`**: Primary rendering changes to draw range arcs and speed projections relative to unit marker positions.
- **`css/style.css`**: New styles for range indicators and speed projection markers.
- **`js/troop-data.js`**: Read-only dependency; range and speed values already exist per troop type/tier.
- **`js/battle-engine.js`**: No changes expected; positions and troop data are already emitted in events.
