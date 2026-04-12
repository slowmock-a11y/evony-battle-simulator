# Contributing

Thanks for your interest in improving the Evony Battle Simulator! Whether you're correcting a battle mechanic, fixing a bug, or suggesting a feature -- all contributions are welcome.

## Getting Started

1. Fork and clone the repo
2. Open `index.html` in any modern browser -- that's it, no build step
3. Make your changes and test in the browser

## Project Structure

```
js/
  troop-data.js    – Base stats and type definitions
  battle-engine.js – Pure simulation logic (no DOM)
  army-config.js   – Setup UI for troop counts and buffs
  battlefield.js   – Spatial battlefield rendering
  playback.js      – Steps through battle events
  battle-log.js    – Filterable event log
  app.js           – Wires modules together
css/
  style.css        – All styles
index.html         – Entry point
```

The engine (`BattleEngine`) is intentionally separated from the UI -- it takes two armies and returns an event log. Keep this boundary clean: no DOM access in the engine, no simulation logic in the UI modules.

## Battle Mechanics

The simulator's accuracy depends on community knowledge. If you notice a mechanic that's wrong or missing, please open an issue or PR. Reference sources when possible -- the current rules are documented in `openspec/specs/battle-mechanics-facts.md`.

## Submitting Changes

1. Create a branch from `main`
2. Keep changes focused -- one fix or feature per PR
3. Test your changes in the browser (try different army compositions, run full battles, check the log)
4. Open a pull request with a short description of what changed and why

## Reporting Bugs

Use the [bug report template](https://github.com/slowmock-a11y/evony-battle-simulator/issues/new?template=bug-report.yml) -- include steps to reproduce and your browser version if relevant.

## Code Style

- Vanilla JS only, no dependencies
- Each module is an IIFE that exposes a single global
- No build tools -- everything loads via `<script>` tags
