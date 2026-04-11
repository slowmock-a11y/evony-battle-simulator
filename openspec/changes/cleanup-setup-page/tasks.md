## 1. Remove playback controls from Setup page

- [x] 1.1 Hide Step, Round, Full Battle, and Reset buttons on Setup page via CSS (display:none by default, shown in battle-view-active)
- [x] 1.2 Hide speed slider on Setup page via CSS (shown in battle-view-active)
- [x] 1.3 Keep all event listeners and handler functions intact for Battle View use
- [x] 1.4 Keep the Battle View toggle button (`btn-battle-view`) always visible

## 2. Add global default troop count input

- [x] 2.1 Add a "Default count" number input element above the troop grid in `buildTroopGrid()` in `js/army-config.js`
- [x] 2.2 Wire change event on default input to set all 56 troop cells in that panel to the entered value
- [x] 2.3 Remove the existing separate bulk-set buttons ("Set all: 0", "Set all: 1000", custom Apply) since global default replaces them

## 3. Improve buff section clarity

- [x] 3.1 Add a visible section header label (e.g., "Buffs") above the buff rows in each panel
- [x] 3.2 Increase spacing between buff rows in CSS (`.buff-row` margin)

## 4. Add input padding

- [x] 4.1 Add CSS padding (`0.3rem 0.5rem`) to all `input[type="number"]` elements on the setup page
- [x] 4.2 Verify padding does not break the troop grid column alignment — adjust grid column widths if needed

## 5. Clean up unused styles

- [x] 5.1 Remove or verify `.playback-buttons` and `.speed-control` CSS rules are still needed (if only used by removed elements, delete them)
- [x] 5.2 Remove `.btn-primary` and `.btn-danger` classes if no longer referenced after button removal
