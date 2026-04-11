## Context

The simulator has a working battle engine, army configuration UI, playback controls, and battle log. The battlefield visualization (`js/battlefield.js`) currently renders a two-column flexbox layout of stat boxes with tier-by-tier fill bars. This change replaces it with a spatial map representation while keeping the same public API so `app.js` and other modules need minimal changes.

The app is pure client-side vanilla JS (IIFE modules, no build tools, no framework). All rendering is DOM manipulation.

## Goals / Non-Goals

**Goals:**
- Spatial battlefield map where unit positions reflect range and speed
- Dynamic movement — troops advance toward center as phases progress, faster troops move further
- SVG-based attack arrows between source and target for clear visual feedback
- Click-to-detail panel showing per-tier troop counts
- Battle view toggle to hide army config and focus on the battlefield
- Maintain identical `Battlefield` public API — zero changes needed in `app.js` call sites

**Non-Goals:**
- Animated troop sprites or game-quality visuals
- Back/rewind playback (forward-only confirmed)
- Separate HTML page for the battlefield
- Mobile-optimized layout

## Decisions

### 1. Absolute positioning with percentage coordinates

**Choice:** Unit markers are absolutely positioned within the battlefield container using percentage-based `left`/`top` values.

**Why:** Percentage positioning scales with container size, no layout recalculation needed on resize. Simpler than CSS Grid for freeform spatial placement where units need to be at arbitrary map coordinates.

**Alternative considered:** CSS Grid (4 rows × 3 cols) — tried first, but grid cells don't convey spatial distance or allow smooth position animation based on speed.

### 2. Speed-based dynamic X positioning

**Choice:** Each unit's X position is calculated from: `timeFactor × speedFactor`, where `timeFactor` = `(phaseIndex + 1) / 4` and `speedFactor` = `0.25 + 0.75 × (speed / 600)`. CSS transition handles the animation.

**Why:** Maps the abstract battle phases to visible troop movement. The 0.25 minimum ensures even the slowest units (Siege, speed 75) visibly advance. The formula is simple and tunable.

**Alternative considered:** Using event count / total events as time factor — rejected because it would cause jittery repositioning on every single event rather than smooth phase-level movement.

### 3. SVG overlay for attack arrows

**Choice:** A full-size SVG element overlays the battlefield container with `pointer-events: none`. Attack arrows are `<line>` elements with arrowhead markers, animated via `stroke-dashoffset`.

**Why:** SVG gives precise line drawing between arbitrary DOM element positions with native arrowhead support. The overlay approach avoids z-index conflicts with unit markers.

**Alternative considered:** CSS-only positioned div with rotation transforms — too complex for arbitrary diagonal lines and no native arrowhead support.

### 4. Unit markers as DOM elements, not SVG/Canvas

**Choice:** Each unit is a `div.unit-marker` containing a colored circle (`.unit-icon`), count label, and type name.

**Why:** DOM elements support click handlers, hover states, CSS transitions, and tooltips natively. The number of elements is small (8 markers max) so DOM performance is not a concern.

### 5. Click-to-detail panel (not inline expansion)

**Choice:** A single reusable `div.detail-panel` positioned near the clicked marker, showing tier-by-tier breakdown. Dismissed by clicking elsewhere.

**Why:** Keeps the map uncluttered. Only one detail view open at a time. Reusing a single DOM element avoids creating/destroying panels.

### 6. Battle view as CSS toggle, not separate page

**Choice:** A `battle-view-active` class on `<body>` hides `.army-panels` via CSS. A button toggles the class.

**Why:** No localStorage, no navigation, no page duplication. The simulation state stays in memory. User confirmed a separate tab is not needed.

## Risks / Trade-offs

**[Marker overlap at certain screen sizes]** → At narrow widths, unit markers at similar Y positions could overlap. → Mitigation: Y positions are spaced 20% apart (20/40/60/80%), giving sufficient room. The battlefield has a fixed 420px height.

**[SVG arrow coordinates stale after resize]** → `highlightAttack()` computes arrow coordinates from `getBoundingClientRect()`. If the window resizes between render and highlight, coordinates could be off. → Mitigation: Highlight is called immediately after render in the same synchronous event handler (`onEvent` in app.js), so layout is always fresh.

**[Detail panel auto-dismisses during playback]** → `render()` hides the detail panel on every call because DOM is rebuilt. During Full Battle playback, clicking a unit would show the panel for one frame. → Mitigation: Acceptable — detail panel is intended for use during Step mode or after battle completes, not during animation.
