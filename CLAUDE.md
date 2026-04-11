# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Evony PvP battle simulator. Pure client-side — no backend, no build tools, no dependencies. Open `index.html` in a browser.

## Architecture

Vanilla JS with IIFE modules loaded via `<script>` tags. Each module exposes a single global. The engine (`BattleEngine`) is a pure function with no DOM access — armies in, event log out. Playback walks the pre-computed event array at user-controlled speed. Battle mechanics reference: `openspec/specs/battle-mechanics-facts.md`.
