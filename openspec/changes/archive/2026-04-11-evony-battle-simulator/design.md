## Context

Greenfield project — no existing codebase. Building a single-page Evony PvP battle simulator as a pure HTML/CSS/JavaScript browser app. No backend, no build tools, no dependencies. The battle mechanics are well-researched and documented in `openspec/specs/battle-mechanics-facts.md`. The project lives under an IntelliJ workspace.

The user is an Evony player building this for personal use and alliance mates. Accuracy to real game mechanics is the primary goal. The UI should be functional and fast to iterate with, not polished.

## Goals / Non-Goals

**Goals:**
- Accurate march-vs-march PvP simulation matching known Evony mechanics
- Fast iteration: configure → simulate → tweak → re-simulate in seconds
- Step/Round/Full playback for understanding what happens and why
- Buff inputs so players can approximate their in-game stats
- Runs in any browser — just open index.html, zero setup
- Easy to share: send the folder to alliance mates, they double-click index.html

**Non-Goals:**
- Generals, skills, specialties, equipment as discrete entities (deferred — buffs approximate these)
- Rally mechanics, city/wall attacks, PvE
- User accounts, persistence, database
- Mobile-optimized UI (desktop-first)
- Pixel-perfect game-accurate visuals
- Any server, build tool, or package manager

## Decisions

### 1. Pure client-side — no backend

**Choice:** Everything runs in the browser. HTML + CSS + vanilla JavaScript. No server, no API, no build step.

**Why:** Maximum simplicity. The simulation runs in milliseconds in JS. No install needed — share the folder, open the file. No CORS, no ports, no dependencies.

**Alternative considered:** Kotlin/Spring Boot backend with REST API. Rejected — the simulation isn't computationally expensive, and a backend adds deployment complexity for what's a personal/alliance tool.

### 2. Vanilla JavaScript with ES modules

**Choice:** Plain JS files using ES module imports (`<script type="module">`). No framework, no bundler.

**Why:** Single page, moderate interactivity. ES modules give clean file separation without needing webpack/vite. The DOM manipulation is straightforward — form inputs, button handlers, updating text/classes on troop blocks.

### 3. Battle engine produces an event log, UI consumes it

**Choice:** The engine runs the full simulation synchronously and returns a list of BattleEvent objects. The UI walks through this list for step/round/full playback.

**Why:** Clean separation. The engine is a pure function: armies in → events out. Step/Round/Full are purely UI concerns — the engine always computes everything. This also enables "compare two results" without re-running the engine.

### 4. Troop data as a JS module

**Choice:** Troop base stats (T1–T14 × 4 types) defined in a single `troop-data.js` module. Imported by both the engine and UI.

**Why:** Single source of truth. No API call needed, instantly available.

### 5. Buff model: percentage modifier per type per stat

**Choice:** Buffs are a flat percentage per troop type per stat (Attack%, Defense%, HP%). Applied as: `effectiveStat = baseStat × (1 + buff/100)`.

**Why:** Simple, general-purpose. Players manually sum their in-game buffs from all sources into one number. This avoids modeling the full general/research/gear system while still allowing accurate simulations.

### 6. Project structure

```
game/
├── index.html              — single page, loads all modules
├── css/
│   └── style.css           — dark theme, layout, troop colors
├── js/
│   ├── troop-data.js       — base stats T1–T14 × 4 types
│   ├── battle-engine.js    — simulation: phases, targeting, damage, events
│   ├── app.js              — main: wires UI to engine, manages state
│   ├── army-config.js      — input panels: troop grid, buffs, presets
│   ├── battlefield.js      — visual rendering: blocks, arrows, bars
│   ├── playback.js         — controls: step/round/full, speed, reset
│   └── battle-log.js       — log panel: entries, filtering
└── openspec/
```

## Risks / Trade-offs

**[Mechanics accuracy]** → The damage formula and targeting are based on community research, not official documentation. Some mechanics may not perfectly match the real game. → Mitigation: The event log makes it easy to spot and debug discrepancies. Formula constants can be tuned without changing architecture.

**[Sequential phase model may not match reality]** → We model Mounted before Ground (speed tiebreak), but this is unconfirmed. Round cap is also unknown. → Mitigation: These are configurable — phase order is a list, round cap is a parameter. Easy to adjust when better information emerges.

**[Large input surface]** → 112 troop count fields + 24 buff fields per side could overwhelm users. → Mitigation: Collapsible tier groups (only T10–T14 expanded), presets, mirror button, bulk-set buttons.

**[No persistence]** → Army configs are lost on page refresh. → Mitigation: Can add localStorage save/load later. Presets partly address this. Not critical for v1.

**[ES modules need a server for local file://]** → Some browsers block ES module imports from file://. → Mitigation: Can use a simple local server (`python -m http.server`) or IntelliJ's built-in server. Alternatively, fall back to classic `<script>` tags if this is a problem.
