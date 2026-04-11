## Context

The battlefield map (`js/battlefield.js`) renders troop positions on a 0–5200 unit linear battlefield using absolutely-positioned DOM markers. Each marker shows troop type, count, and name. SVG overlays are already used for attack arrows. Troop range and speed stats are available per type/tier in `TroopData.STATS` (e.g., Siege range 1400–2178, Ranged range 500, Mounted speed 600, Ground speed 350).

Currently there is no visual feedback about how far each unit can fire or how far it will move next round. Players must mentally compute these distances.

## Goals / Non-Goals

**Goals:**
- Show range extent indicators for Ranged and Siege units on the battlefield map, so players can see firing reach at a glance.
- Show speed/movement projection indicators for all troop types, marking the position each unit will reach next round.
- Keep the map clean — indicators appear on hover over a unit marker, not always visible.
- Update indicators dynamically as positions change each phase.

**Non-Goals:**
- No changes to the battle engine or simulation logic.
- No persistent range overlays (always-on would clutter the map).
- No interaction or click behavior on the indicators themselves.
- No changes to the detail panel, attack arrows, or summary bar.

## Decisions

### 1. Render indicators as DOM elements (not SVG)

Range and speed indicators will be absolutely-positioned `div` elements inside the battlefield container, similar to how unit markers are positioned. This keeps the rendering approach consistent with existing code.

**Alternative considered**: SVG overlays — would be cleaner for arbitrary shapes but the existing SVG layer is dedicated to attack arrows and uses a single line/label pair. Adding more SVG elements would complicate the shared overlay. DOM divs with percentage-based positioning match the existing pattern.

### 2. Show indicators on hover

Indicators appear when the user hovers over a unit marker and disappear when the mouse leaves. This avoids clutter when 8 markers are on screen simultaneously.

**Alternative considered**: A toggle button to show/hide all indicators — adds UI complexity for minimal benefit. Hover is intuitive and contextual.

### 3. Range indicator as a horizontal bar/line

For Ranged and Siege units, draw a horizontal line or bar extending from the unit's position toward the enemy side, spanning the unit's maximum range. Use the troop type's color at reduced opacity. The bar sits at the same Y position as the unit marker.

The range extent is calculated as: `mapToScreen(pos + range)` for attackers, `mapToScreen(pos - range)` for defenders, clamped to the battlefield bounds.

### 4. Speed indicator as a forward tick/ghost marker

For all troop types, draw a small chevron or translucent ghost circle at the position the unit will reach next round: `currentPos + speed` for attackers, `currentPos - speed` for defenders (clamped to collision boundaries). Use the troop type's color at reduced opacity with a dashed outline.

### 5. Use highest-tier stats for range display

Since range can vary across tiers (especially Siege: T1-T4 = 1400, T13-T14 = 2178), use `getMaxRange()` from the engine — the maximum range among alive layers of that type. This matches how the engine resolves targeting. Speed is constant per type so no tier-specific logic is needed.

## Risks / Trade-offs

- **[Visual clutter on small screens]** → Hover-only display mitigates this. Indicators are thin lines/small markers, not filled regions.
- **[Speed projection accuracy]** → The projected position is an approximation; actual movement depends on collision detection with enemy units. The indicator shows the *maximum* advance, not guaranteed position. This is acceptable as a tactical aid.
- **[Range varies by tier for Siege]** → Using max-range across alive tiers is consistent with engine behavior and gives the most useful information.
