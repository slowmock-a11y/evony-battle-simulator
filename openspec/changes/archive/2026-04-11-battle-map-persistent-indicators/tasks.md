## 1. X-Axis Scale Bar

- [x] 1.1 Add CSS styles for axis container, tick marks, and labels (`.bf-axis`, `.bf-axis-tick`, `.bf-axis-label`)
- [x] 1.2 Implement `renderAxis()` function in `battlefield.js` that creates tick divs at 0, 500, 1000, …, 5000, 5200 using `mapToScreen()` positioning
- [x] 1.3 Call `renderAxis()` from `render()` so the axis appears whenever the battlefield is displayed

## 2. Persistent Indicators

- [x] 2.1 Extract indicator rendering into `renderAllRangeIndicators()` that loops all alive Ranged/Siege units on both sides and creates range bars at 0.12 opacity
- [x] 2.2 Extract indicator rendering into `renderAllSpeedProjections()` that loops all alive units on both sides and creates speed projection circles at 0.20 opacity
- [x] 2.3 Call both functions from `render()` so indicators appear for all units on every render pass
- [x] 2.4 Remove or simplify the old hover-triggered `showIndicators()`/`clearIndicators()` logic

## 3. Hover Highlight

- [x] 3.1 On `mouseenter`, find the hovered unit's indicator elements and increase opacity (range → 0.22, speed → 0.30)
- [x] 3.2 On `mouseleave`, reset the hovered unit's indicator elements back to base opacity (range → 0.12, speed → 0.20)

## 4. Styling and Polish

- [x] 4.1 Adjust persistent indicator CSS: lower default opacity values, ensure `pointer-events: none` on all indicator and axis elements
- [x] 4.2 Verify the battlefield container has enough bottom padding/margin for the axis labels to not overlap unit markers
- [x] 4.3 Test with a full battle: confirm all indicators render, update on phase change, and hover highlight works correctly
