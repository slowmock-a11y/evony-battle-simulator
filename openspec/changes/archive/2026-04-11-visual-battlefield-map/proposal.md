## Why

The current battlefield visualization is a stats-heavy two-column layout of boxes with tier-by-tier fill bars — it reads like a spreadsheet, not a battle. Players can't intuit spatial relationships (who is close to whom, who fires from range, who charges in). Replacing it with a spatial map where units are positioned by range and advance by speed makes the simulation feel like watching a real battle unfold.

## What Changes

- Replace the two-column `bf-side` flexbox layout with an absolutely-positioned battlefield map
- Troop types rendered as circular unit markers (colored icon with type letter + count) placed at spatial positions reflecting their range and speed
- Units advance toward the center line as the battle progresses — faster troops (Mounted, speed 600) move further than slower ones (Siege, speed 75)
- Attack visualization via animated SVG arrows drawn between source and target units
- Click any unit marker to see a detail panel with tier-by-tier troop counts and targeting info
- "Battle View" toggle button hides the army configuration panels for a clean battlefield focus
- Green terrain-style background with center dividing line replaces the flat dark box

## Capabilities

### New Capabilities
- `battlefield-map`: Spatial positioning of unit markers on a map, dynamic repositioning based on speed and battle phase progression
- `battle-view-toggle`: UI mode that hides army configuration panels to focus on the battlefield

### Modified Capabilities
- `battlefield-visual`: Rendering changes from stat boxes to positioned unit markers; attack highlight changes from text div to SVG arrow; detail view changes from hover tooltip to click panel
- `playback-controls`: No requirement changes — existing Step/Round/Full/Reset API unchanged

## Impact

- `js/battlefield.js` — Full rewrite of rendering, highlighting, and detail panel logic
- `css/style.css` — Replace battlefield CSS section (`.bf-side`, `.troop-block`, `.attack-arrow`) with map layout (`.unit-marker`, `.bf-svg-overlay`, `.detail-panel`)
- `js/app.js` — Add battle view toggle (enterBattleView/exitBattleView)
- `index.html` — Add "Battle View" button to playback controls
- Public API of `Battlefield` module unchanged — `app.js` calls same methods with same signatures
