## Context

The setup page has two layout issues:

1. **Battle View button placement** — It sits inside `.controls-bar .playback-buttons` alongside Step/Round/Full/Reset, which are hidden on the setup page (`display: none`). This means the controls bar is visible on setup solely to house the Battle View button, wasting vertical space and separating it from the army panels it acts upon.

2. **Collapsible tier groups** — `army-config.js` renders three tier groups (High/Mid/Low) with clickable accordion headers. Mid and Low default to collapsed, hiding 9 of 14 tiers behind extra clicks. The user wants all tiers always visible with padding between the groups instead.

Current files involved: `index.html` (structure), `css/style.css` (layout/collapse rules), `js/army-config.js` (buildTroopGrid, tier-group rendering).

## Goals / Non-Goals

**Goals:**
- Move the Battle View button to a visible, logical position on the setup page (not inside the playback controls bar)
- Remove all collapsible accordion behavior from tier groups
- Show all tiers (T14–T1) at all times with visual padding between High/Mid/Low groups
- Simplify the JS and CSS by removing collapse-related code

**Non-Goals:**
- Changing the tier groupings themselves (still High T14–T10, Mid T9–T5, Low T4–T1)
- Changing the grid layout, column headers, or input behavior
- Modifying battle view mode behavior (panels still hide, playback controls still appear)
- Changing buff inputs or preset dropdowns

## Decisions

### 1. Battle View button moves to a setup action row

Move `#btn-battle-view` out of `.playback-buttons` and into a new lightweight row below the army panels (or between panels and controls bar). This keeps it visible on setup without polluting the playback controls.

**Alternative considered**: Placing it next to the mirror button in `.mirror-col`. Rejected because the mirror button is squeezed between two panels and adding a second button would crowd that space.

**Approach**: Add a small `.setup-actions` div below `.army-panels` in `index.html`. Move the button element there. In battle-view-active mode, hide `.setup-actions` the same way `.army-panels` is hidden.

### 2. Remove collapse — always-visible tiers with group spacing

Remove the accordion headers entirely. Instead, render a lightweight group label (non-interactive) and add `margin-top` between groups for visual separation.

**Approach in `army-config.js`**:
- Remove `collapsed` property from `TIER_GROUPS`
- Replace the clickable `tier-group-header` div with a simple `tier-group-label` span
- Remove the click handler and `.arrow` icon
- Always render `tier-group-body` without the `.collapsed` class

**CSS changes**:
- Remove `.tier-group-header` interactive styles (cursor, hover, arrow rotation)
- Remove `.tier-group-body.collapsed { display: none }`
- Add `.tier-group-label` as a non-interactive styled label with margin-top for spacing

### 3. Controls bar only shows in battle view

Since the Battle View button is no longer in `.controls-bar`, the entire controls bar can be hidden on the setup page and only shown in battle-view-active mode. This is already nearly the case (all child buttons are `display: none` on setup), but now we hide the container itself.

## Risks / Trade-offs

- **More vertical space on setup** — All tiers always visible means the setup page is taller. This is intentional per the user's request. The grid rows are compact (~20px each) so the 9 extra rows add ~180px.
- **Lost discoverability hint** — Collapsed groups hinted that lower tiers exist. Mitigated by the group labels that still separate the three ranges.
- **No migration needed** — Purely UI, no data or state changes, no breaking changes.
