## Why

The simulator launches straight into the army configuration UI with no context for new users. There is no explanation of what the app does, how to use it, or the underlying battle mechanics it models. Adding an About page and a Battle Mechanics fact sheet gives users onboarding context and a quick-reference for the rules governing simulations.

## What Changes

- Add a navigable **About** view describing the app: what it is, what it simulates, its scope and limitations.
- Add a **Battle Mechanics** view presenting the core rules (phase order, targeting priority, damage formula, movement model, troop stats) in a readable, styled format directly in the app.
- Add navigation UI (tabs or buttons in the header) to switch between the simulator, About, and Battle Mechanics views.

## Capabilities

### New Capabilities
- `info-pages`: Two informational views (About and Battle Mechanics) with navigation to switch between them and the main simulator view.

### Modified Capabilities
_None — this is purely additive UI. No existing specs or behaviors change._

## Impact

- **index.html**: New navigation elements in the header; new `<section>` containers for the two views.
- **css/style.css**: Styles for navigation tabs, info page layouts, and typography for the fact sheet tables/content.
- **js/app.js** (or new `js/info-pages.js`): View-switching logic to show/hide pages.
- No changes to the battle engine, troop data, or playback modules.
