## 1. Remove preset system and panel-controls markup

- [x] 1.1 Remove `<div class="panel-controls">` and its preset `<select>` from both army panels in `index.html`
- [x] 1.2 Remove `PRESETS` object and `buildPresets()` function from `js/army-config.js`
- [x] 1.3 Remove the `buildPresets()` call from `init()` in `js/army-config.js`
- [x] 1.4 Remove `.panel-controls` CSS rule from `css/style.css`

## 2. Build unified troop controls row

- [x] 2.1 In `buildTroopGrid()`, replace the `.default-count-row` with a `.grid-controls` row containing: default count label + input, "Set Default" button, "Clear All" button
- [x] 2.2 Wire "Set Default" button to read the default count input value and call `setAllCountsUniform()` for that panel
- [x] 2.3 Wire "Clear All" button to call `setAllCountsUniform(panelId, 0)` and reset the default count input to 0
- [x] 2.4 Add `.grid-controls` CSS: `display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem`
- [x] 2.5 Remove `.default-count-row` and `.default-count-label` CSS rules (replaced by `.grid-controls`)

## 3. Improve buff section spacing

- [x] 3.1 Increase `.buff-row` margin-bottom from `0.4rem` to `0.6rem`
- [x] 3.2 Increase `.buff-row` gap from `0.4rem` to `0.75rem`
- [x] 3.3 Add `padding-bottom: 0.75rem` and `border-bottom: 1px solid #334` to `.buff-section`
- [x] 3.4 Increase `.buff-section` margin-bottom from `0.75rem` to `1rem`

## 4. Verify functionality

- [x] 4.1 Verify "Set Default" applies default count to all 56 cells in the correct panel
- [x] 4.2 Verify "Clear All" zeros all 56 cells and resets default count input
- [x] 4.3 Verify mirror button still copies both troop counts and buff values
- [x] 4.4 Verify column/row header click-to-set still works
