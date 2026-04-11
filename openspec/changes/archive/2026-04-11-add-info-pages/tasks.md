## 1. Navigation & View Switching

- [x] 1.1 Add navigation tabs (Simulator, About, Battle Mechanics) to the header in index.html
- [x] 1.2 Add view container sections (`view-simulator`, `view-about`, `view-mechanics`) in index.html, wrapping existing main content inside `view-simulator`
- [x] 1.3 Create js/info-pages.js IIFE module with view-switching logic (toggle `data-view` attribute on body, update active tab)
- [x] 1.4 Add CSS for navigation tabs (active state, hover, layout) and view visibility rules

## 2. About View

- [x] 2.1 Add About view HTML content: app title, description, key features list, and "not yet modeled" limitations list

## 3. Battle Mechanics View

- [x] 3.1 Add Battle Mechanics view HTML: Troop Types section with role/trait summary table
- [x] 3.2 Add Phase Order section with phase table and within-phase explanation
- [x] 3.3 Add Battlefield & Movement section describing the linear 5200-unit field and movement rules
- [x] 3.4 Add Targeting Priority section with the full priority matrix table and priority chains
- [x] 3.5 Add Damage Formula section with formula, variable explanations, and kill calculation
- [x] 3.6 Add Damage Multipliers section with counter-triangle table and diagram

## 4. Styling & Polish

- [x] 4.1 Add CSS for info page typography, tables, section spacing, and content containers
- [x] 4.2 Wire up the script tag for js/info-pages.js in index.html and verify all three views switch correctly
