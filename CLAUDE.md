# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Evony PvP battle simulator. Pure client-side — no backend, no build tools, no dependencies. Open `index.html` in a browser.

## Cache-busting

After modifying any local JS or CSS file, update the `?v=` query parameter on its corresponding tag in `index.html`. Use the current git short hash:

```bash
git rev-parse --short HEAD
```

Example result: `<script src="js/app.js?v=abc1234"></script>`

Apply the same hash to all local asset tags in one pass — `<link rel="stylesheet">` and all `<script src="js/...">` tags. Do not touch the external GoatCounter script tag.

## Architecture

Vanilla JS with IIFE modules loaded via `<script>` tags. Each module exposes a single global. The engine (`BattleEngine`) is a pure function with no DOM access — armies in, event log out. Playback walks the pre-computed event array at user-controlled speed. Battle mechanics reference: `openspec/specs/battle-mechanics-facts.md`.

## Tests

Open `tests.html` in a browser to run the engine spec-compliance suite. Node dev harness at `scripts/run-tests.js` for quick CLI verification (`node scripts/run-tests.js`).
