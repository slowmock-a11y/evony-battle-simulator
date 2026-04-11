## Context

The battlefield map (`js/battlefield.js`) renders a spatial view of two armies across a 0–5200 engine-unit horizontal space. Unit markers are positioned by type (Siege top, Ground bottom) and advance each round. Range and speed indicators currently appear only on hover via `showRangeIndicator()` and `showSpeedProjection()`, triggered by `mouseenter` on markers and removed by `mouseleave`. There is no x-axis reference — users cannot gauge positions or distances without hovering.

## Goals / Non-Goals

**Goals:**
- Render an x-axis scale at the bottom of the battlefield showing engine-position tick marks so users can gauge distances
- Display range and speed indicators for all alive units at all times, not just on hover
- Keep visual noise low by using reduced opacity for persistent indicators
- Maintain existing hover tooltip and click-to-detail behaviors unchanged

**Non-Goals:**
- Adding a y-axis or changing the vertical troop-type layout
- Adding new indicator types (e.g., damage range, buff visualization)
- Changing the engine coordinate system or scaling behavior

## Decisions

### 1. Axis rendering approach: DOM divs with absolute positioning

Render axis ticks and labels as lightweight `<div>` elements inside the battlefield container, positioned with the same `mapToScreen()` mapping used for unit markers. This keeps the axis in sync with markers without a separate coordinate system.

**Alternative considered:** SVG axis drawn on the existing SVG overlay. Rejected because the SVG overlay is used for attack arrows and has `pointer-events: none` — mixing in static labels complicates z-ordering and the axis is simpler as plain DOM.

### 2. Tick interval: every 500 engine units

Ticks at 0, 500, 1000, … 5000, 5200 (11 regular + 1 endpoint). This gives enough resolution to judge ranges without cluttering the axis. Labels show the number value at each tick.

**Alternative considered:** Every 1000 units (6 ticks). Too sparse — many unit ranges are 500–1500, so 1000-unit ticks don't give enough precision.

### 3. Persistent indicators rendered in `render()`

Move indicator creation from hover callbacks into the main `render()` function. On each call to `render()`, clear all existing indicators and re-draw them for every alive unit. This means indicators update automatically on phase changes without special-case hover tracking.

**Alternative considered:** Keep hover functions but call them for all units in `render()`. Rejected because the existing functions use the `hoveredUnit` state variable and single-unit logic — rewriting them to iterate all units is equivalent to a new implementation.

### 4. Opacity levels for persistent indicators

- Range bars: 0.12 opacity (down from 0.22 on hover) — ranges overlap frequently and higher opacity makes the map unreadable
- Speed projections: 0.20 opacity (down from 0.30 on hover) — these don't overlap as much and need to be distinguishable from background

These values are tunable CSS properties.

### 5. Hover enhancement: brighter indicators for hovered unit

When the user hovers a marker, its indicators increase to the current opacity levels (0.22 for range, 0.30 for speed) to stand out from the persistent background. This preserves discoverability while keeping the always-visible layer subdued.

## Risks / Trade-offs

- **Visual clutter with many overlapping ranges** → Mitigation: Low base opacity (0.12) and the existing color-coding per type help differentiate. If still too noisy, could add a toggle — but that's a non-goal for now.
- **Performance with many indicator DOM elements** → Mitigation: At most 8 range bars + 8 speed projections + ~12 axis ticks = ~28 elements. Negligible.
- **Axis labels crowding on narrow viewports** → Mitigation: Labels use small font size (10px). If container is very narrow, ticks still work as visual markers even if labels overlap slightly.
