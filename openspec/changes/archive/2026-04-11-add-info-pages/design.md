## Context

The Evony Battle Simulator is a pure client-side app (vanilla JS, no build tools, no dependencies). It currently has a single view: the army setup/battle simulator. There is no navigation system — the app loads directly into the simulator. The battle mechanics reference lives in `openspec/specs/battle-mechanics-facts.md` but is not exposed to users.

## Goals / Non-Goals

**Goals:**
- Add two static informational views: About and Battle Mechanics.
- Add header-level navigation to switch between Simulator, About, and Battle Mechanics views.
- Present the battle mechanics content in a well-styled, readable format within the app.
- Keep the implementation consistent with the existing architecture (vanilla JS, IIFE modules, no dependencies).

**Non-Goals:**
- No routing library or URL hash routing — simple show/hide view switching is sufficient.
- No server-side rendering or markdown parsing — content is hardcoded as HTML.
- No changes to the battle engine, playback, or any simulation logic.

## Decisions

### 1. View switching via CSS class toggling

**Choice:** Toggle a `data-view` attribute on `<body>` and use CSS to show/hide the corresponding `<section>`. Each view is a `<section>` with an `id` (`view-simulator`, `view-about`, `view-mechanics`).

**Rationale:** Matches the existing pattern (`battle-view-active` class on body for the battle view toggle). No framework needed, no DOM creation at runtime. All content is in `index.html`.

**Alternative considered:** Hash-based routing — rejected because it adds complexity with no benefit for three static pages.

### 2. Content hardcoded in index.html

**Choice:** Write the About and Battle Mechanics content directly as HTML in `index.html`.

**Rationale:** The app has no build tools, no templating, no markdown parser. Hardcoded HTML is the simplest approach and matches the existing pattern. The battle mechanics content is stable reference material, not dynamic.

**Alternative considered:** Fetching a markdown file and rendering client-side — rejected because it adds a dependency (markdown parser) and a fetch call, both contrary to the project's zero-dependency constraint.

### 3. Navigation as header tabs

**Choice:** Add tab-style buttons inside the existing `<header>` element. The active tab gets a highlighted style.

**Rationale:** The header already exists and has space. Tabs are a natural pattern for switching between peer views. Keeps the UI compact.

### 4. New js/info-pages.js module

**Choice:** Create a small IIFE module `InfoPages` that handles tab click events and view switching.

**Rationale:** Keeps view-switching logic separate from `app.js` (which handles simulation concerns). Follows the existing module pattern.

## Risks / Trade-offs

- **Large index.html** — The battle mechanics tables add substantial HTML. This is acceptable because the content is static reference material and there is no build step to split it. → Mitigation: Use collapsible sections or a clean layout so it doesn't feel overwhelming.
- **Content drift** — If battle-mechanics-facts.md is updated, the HTML version won't auto-update. → Mitigation: Keep the mechanics page focused on the key rules actually implemented in the simulator, not an exhaustive mirror of the spec file.
