## Context

The Setup page currently serves dual duty: army configuration and battle playback control. The playback buttons (Step, Round, Full Battle, Reset) and speed slider sit in a `controls-bar` section alongside the army panels. This clutters the setup flow — users configure armies, then must scan past configuration controls to find battle controls. The troop count grid requires entering values in up to 56 cells per panel even though most tiers share the same count. Buff inputs are compact but lack visual padding, making them hard to read.

The codebase is vanilla JS with IIFE modules. `index.html` has static button markup; `js/app.js` wires event listeners; `js/army-config.js` dynamically builds buff and troop grids.

## Goals / Non-Goals

**Goals:**
- Remove playback buttons (Step, Round, Full Battle, Reset) and speed slider from the Setup page HTML and JS
- Add a global default troop count input per panel that pre-fills all cells, with per-cell override capability
- Improve visual clarity of buff inputs section
- Add proper padding to all number input elements

**Non-Goals:**
- Relocating playback controls to Battle View (separate change)
- Changing battle engine or simulation logic
- Changing the buff data model or calculation
- Redesigning the entire page layout or adding responsive breakpoints

## Decisions

### 1. Remove playback controls from HTML, not just hide them
**Choice**: Delete the button elements and speed slider from `index.html` and remove their event listeners from `app.js`.
**Alternative**: Hide with CSS `display:none`. Rejected because dead markup and listeners add confusion; these controls will be re-introduced in Battle View in a future change.

### 2. Global default with per-cell override pattern
**Choice**: Add a single "Default count" number input at the top of each panel's troop grid. On change, it sets all troop count cells to that value. Individual cells remain editable — any manual edit overrides the default for that cell only. A "Reset to default" action re-applies the global value.
**Alternative**: Default per troop type (4 defaults). Rejected — user said most tiers across all types share the same count; a single global default is simpler.

### 3. Visual clarity via spacing and grouping, not redesign
**Choice**: Add CSS padding to input elements (`padding: 0.3rem 0.5rem`), increase spacing between buff rows, and add a subtle section header/divider between Buffs and Troops sections.
**Alternative**: Full redesign with card-based layout. Rejected — too much scope for this change; incremental improvement is sufficient.

## Risks / Trade-offs

- **[Risk] Removing playback buttons leaves no way to run battles from Setup page** → Mitigation: The Battle View button remains; a future change will house playback controls there. Users switch to Battle View to run simulations.
- **[Risk] Global default overwriting manual per-cell edits** → Mitigation: Changing the global default only overwrites cells that haven't been manually edited, or provide a clear "Apply to all" action that warns it will overwrite.
- **[Trade-off] Keeping the existing bulk-set buttons alongside the new global default** → The global default replaces the need for "Set all: X" buttons. The existing bulk-set feature (`Set all: 0`, `Set all: 1000`, custom Apply) can be simplified to just the global default input.
