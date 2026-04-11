## 1. Move Battle View button to setup actions row

- [x] 1.1 Add `.setup-actions` div in `index.html` between `.army-panels` and `.controls-bar`, move `#btn-battle-view` into it
- [x] 1.2 Add `.setup-actions` CSS styling (centered row with padding)
- [x] 1.3 Add `.battle-view-active .setup-actions { display: none }` rule to hide the row in battle view mode
- [x] 1.4 Verify `#btn-battle-view` click handler in `app.js` still works after the DOM move

## 2. Remove tier group collapse behavior

- [x] 2.1 In `army-config.js`, remove `collapsed` property from `TIER_GROUPS` entries
- [x] 2.2 Replace clickable `tier-group-header` div with a non-interactive `tier-group-label` element (no arrow icon, no click handler)
- [x] 2.3 Remove `.collapsed` class logic from `tier-group-body` rendering — always render expanded
- [x] 2.4 Add margin/padding between tier groups for visual separation

## 3. CSS cleanup

- [x] 3.1 Remove `.tier-group-header` interactive styles (cursor, hover, background change)
- [x] 3.2 Remove `.tier-group-header .arrow` and `.arrow.collapsed` rotation rules
- [x] 3.3 Remove `.tier-group-body.collapsed { display: none }` rule
- [x] 3.4 Add `.tier-group-label` styles (non-interactive label with top margin)

## 4. Controls bar cleanup

- [x] 4.1 If controls bar is now empty on setup, hide it entirely on setup and show only in battle-view-active mode
