# setup-persistence Specification

## Purpose
File-based export and import of every setup-page input as a single JSON document. The simulator setup state is otherwise transient — closing the tab loses everything. This capability provides the only durable storage path: users save a setup to disk, share or hand-edit the file, and re-import it later. The filesystem holds the user library; there is no in-app preset store.

## Requirements

### Requirement: Setup page exposes file-based load and save controls

The simulator setup page SHALL expose a horizontal "Setup" control row positioned immediately above the buff sections, spanning the full page width with controls right-aligned. The row SHALL contain, inline: a "Setup name:" label and text input, a "Notes:" label and text input, a load button, and a save button. The row's labels and visual treatment SHALL match the existing inline-label pattern used by the playback controls bar (`.speed-control`) — small font, gray label color, label and input on the same baseline.

The button labels SHALL reflect the underlying mechanism:
- When the File System Access API is available, the buttons SHALL read **"Load"** and **"Save"** (terminology that matches the native save-back semantic).
- When the FSA is unavailable, the buttons SHALL read **"Upload"** and **"Download"** (terminology that matches the browser file-picker / Downloads-folder semantic).

#### Scenario: Setup row is visible above the buff section
- **WHEN** the simulator page loads
- **THEN** the Setup row SHALL be rendered above the buff sections of both ATT and DEF panels, span the full page width, and align its controls to the right edge

#### Scenario: Inline labels match the existing controls-bar pattern
- **WHEN** the simulator page loads
- **THEN** the "Setup name:" and "Notes:" labels SHALL appear inline (not stacked above) their inputs, with a colon suffix and the same small gray font used by the "Speed:" and "Max Rounds:" labels in the controls bar

#### Scenario: Buttons read Load/Save in FSA mode
- **WHEN** the page loads in a Chromium-based browser that exposes `window.showSaveFilePicker` and `window.showOpenFilePicker`
- **THEN** the buttons SHALL read "Load" and "Save"

#### Scenario: Buttons read Upload/Download in fallback mode
- **WHEN** the page loads in a browser that does not expose the File System Access API
- **THEN** the buttons SHALL read "Upload" and "Download" and a once-shown inline note SHALL surface on first save interaction explaining that downloads land in the browser's Downloads folder

### Requirement: Setup is exported as pretty-printed JSON with a defined schema

Clicking Save SHALL produce a JSON document with this top-level shape:

```
{
  "schema": <integer>,
  "exportedAt": <ISO 8601 timestamp string, UTC>,
  "name": <string from the Setup name input>,
  "notes": <string from the Notes input>,
  "att": { "troops": {...}, "buffs": {...}, "default": <integer> },
  "def": { "troops": {...}, "buffs": {...}, "default": <integer>,
           "archerTower": {...}? },
  "global": { "maxRounds": <integer> }
}
```

The document SHALL be serialised with 2-space indentation and a trailing newline. The `schema` field SHALL hold the integer current schema version (initially `1`). The `archerTower` block SHALL appear under `def` only when the archer-tower controls are present in the DOM and at least one of `atk`, `hp`, `range` is greater than zero.

#### Scenario: Saved file structure
- **WHEN** the user clicks Save
- **THEN** the produced file SHALL contain the top-level keys `schema`, `exportedAt`, `name`, `notes`, `att`, `def`, `global` in some order, with `schema` equal to the current integer version and `exportedAt` a valid ISO 8601 UTC timestamp

#### Scenario: Default-only setup roundtrips losslessly
- **WHEN** the user opens the page, types a name, clicks Save, and then on a fresh reload clicks Load and selects the same file
- **THEN** every input on the setup page SHALL match the values that were present at the moment of the original Save

### Requirement: Troop counts and buff stats use sparse encoding

The encoder SHALL omit any troop count of 0 from the `troops` map and any buff stat of 0 from the `buffs` map. The decoder SHALL treat any missing troop count as 0 and any missing buff stat as 0. Hand-deleting a key from a saved file SHALL therefore be equivalent to setting that value to 0.

#### Scenario: Zeros are not written
- **WHEN** the user has 0 troops in every cell except `att.RANGED.t12 = 100000`
- **THEN** the saved file's `att.troops` SHALL contain only `{ "RANGED": { "12": 100000 } }` and no other keys

#### Scenario: Missing key decodes as zero
- **WHEN** a saved file's `att.troops.GROUND` is `{ "13": 50000 }`
- **THEN** the loaded form SHALL show 50000 in the GROUND/T13 input and 0 in every other GROUND tier

#### Scenario: Hand-deleting a line clears that input
- **WHEN** the user manually removes a `"12": 1000` entry from a saved file and loads it
- **THEN** the corresponding input SHALL show 0 with no warning, because missing-key=0 is a defined behaviour

### Requirement: Filename is derived from the Setup name with sanitization

The download filename and the FSA save-picker suggested filename SHALL be `setup-{sanitized-name}.json`. Sanitization SHALL replace each of `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|` with `-`, collapse runs of whitespace into a single `-`, trim leading and trailing `-`, and fall back to the literal `setup` when the result is empty.

#### Scenario: Spaces collapse to dashes
- **WHEN** the Setup name is `"Anti-Cav v3"`
- **THEN** the suggested filename SHALL be `setup-Anti-Cav-v3.json`

#### Scenario: Disallowed characters become dashes
- **WHEN** the Setup name is `"foo/bar:baz"`
- **THEN** the suggested filename SHALL be `setup-foo-bar-baz.json`

#### Scenario: Empty or all-disallowed name falls back
- **WHEN** the Setup name is empty or contains only disallowed characters
- **THEN** the suggested filename SHALL be `setup.json`

### Requirement: Save uses File System Access API where available, downloads otherwise

When `window.showSaveFilePicker` and `window.showOpenFilePicker` both exist, the implementation SHALL use them. The handle returned by a successful Load SHALL be cached for the duration of the page session and reused by subsequent Save clicks to write back to the same file without prompting. When the FSA is not available, Save SHALL produce a download by creating a `Blob` and clicking a transient anchor with the `download` attribute set to the suggested filename.

The cached file handle SHALL NOT persist across page reloads. After reload, the next Save SHALL prompt for a destination via `showSaveFilePicker` (FSA mode) or default to the Downloads folder (fallback mode).

#### Scenario: Repeated save in FSA mode writes back to the same file
- **GIVEN** the user has loaded `setup-Anti-Cav-v3.json` via the Load button on a Chromium browser
- **WHEN** the user edits inputs and clicks Save
- **THEN** the implementation SHALL write through the cached `FileSystemFileHandle` and overwrite the original file without showing a save dialog

#### Scenario: Save with no prior Load prompts for destination
- **GIVEN** a fresh page load with no prior Load action
- **WHEN** the user clicks Save in FSA mode
- **THEN** the browser SHALL show a save dialog with the suggested filename, and the picked handle SHALL be cached for subsequent saves

#### Scenario: Fallback mode always downloads
- **WHEN** the user clicks Download (fallback mode) at any point
- **THEN** the browser SHALL download a fresh copy of the file into the Downloads folder, regardless of any prior Load

### Requirement: Load replaces the current setup with no confirmation

Clicking Load SHALL trigger a file picker (FSA `showOpenFilePicker` or the hidden `<input type="file">` fallback). Selecting a valid file SHALL parse it, apply every valid field to the form, and replace the current setup. There SHALL NOT be a confirmation dialog before replacement, regardless of whether the current form contains modified values.

#### Scenario: Replace happens without prompt
- **GIVEN** the user has modified inputs on the form
- **WHEN** the user clicks Load and picks a valid setup file
- **THEN** the form SHALL be repopulated from the file without any confirmation dialog and the prior modifications SHALL be lost

### Requirement: Best-effort import applies valid fields and reports the rest

When the imported file is parseable JSON with a recognisable shape but contains some malformed or unknown fields, the implementation SHALL apply every field that passes validation and SHALL surface a sticky warning banner above the Setup row listing each skipped field. Each warning entry SHALL identify the field path and the reason it was skipped (e.g. "att.troops.RANGED.12: not a non-negative integer", "att.foo: unknown key", "global.maxRounds: out of range 1..1000").

When the file is not parseable JSON, or when the top-level structure is fundamentally wrong (e.g. not an object, or missing both `att` and `def`), the implementation SHALL display the same banner with a single error message and SHALL NOT modify any input.

The warning banner SHALL persist until the user clicks the ✕ dismiss control or until a subsequent Load operation replaces it. The banner SHALL NOT auto-fade.

#### Scenario: Malformed field is skipped, banner names it
- **WHEN** the user loads a file where `att.buffs.GROUND.atk` is `"abc"`
- **THEN** the GROUND/atk input on the ATT side SHALL remain unchanged at its default 0 (or its prior value, since the rest of the import proceeds), the rest of the file's valid fields SHALL be imported, and the banner SHALL list one entry naming `att.buffs.GROUND.atk` and the reason "not a number"

#### Scenario: Unknown key is reported but does not block the import
- **WHEN** the user loads a file containing `att.foo: 42`
- **THEN** the rest of the file SHALL be imported normally and the banner SHALL list one entry for `att.foo: unknown key`

#### Scenario: Unparseable JSON aborts the import
- **WHEN** the user loads a file whose contents are not valid JSON
- **THEN** the form SHALL NOT change and the banner SHALL display one error entry naming the parse error

#### Scenario: Banner is sticky until dismissed
- **WHEN** the banner is shown after an import with skips
- **THEN** the banner SHALL remain visible until the user clicks ✕ or performs another Load

#### Scenario: Subsequent successful import clears the banner
- **WHEN** an import with skipped fields shows the banner, then the user immediately performs a clean import with no skips
- **THEN** the banner SHALL be hidden after the second import

### Requirement: Schema version mismatch produces specific diff warnings

When the loaded file's `schema` value differs from the app's current `SCHEMA_VERSION`, the implementation SHALL still attempt a best-effort import and SHALL include in the warning banner a header naming both versions and listing whichever is true:

- File's schema is **lower** than current: list the field paths the current schema defines that were absent from the file, prefixed "Added since v{file_schema}: ...".
- File's schema is **higher** than current: list the top-level (or section-level) keys present in the file that the current app does not understand, prefixed "Ignored from v{file_schema}: ...".

#### Scenario: Older file lists fields-added-since
- **GIVEN** the app is at `SCHEMA_VERSION = 2` and `def.archerTower` was added in v2
- **WHEN** the user loads a file with `"schema": 1` that has no `archerTower` field
- **THEN** the warning banner SHALL include "Added since v1: def.archerTower" and the rest of the file SHALL import normally

#### Scenario: Newer file flags ignored sections
- **GIVEN** the app is at `SCHEMA_VERSION = 1`
- **WHEN** the user loads a file with `"schema": 2` containing an unrecognised top-level section like `"covenants": [...]`
- **THEN** the warning banner SHALL include "Ignored from v2: covenants" and the rest of the file SHALL import normally

### Requirement: The export covers every setup-page input except viewing preferences

The exported JSON SHALL include every input rendered on the setup page that contributes to the simulated battle configuration: troop counts (per-side, per-type, per-tier), buff stats (per-side, per-type, with `range` and `rangeFlat` only for `RANGED` and `SIEGE`), per-side default-count, the DEF-side archer-tower block when populated, and the global `maxRounds`.

The exported JSON SHALL NOT include playback or viewing preferences: the playback speed slider, the battle-log type filter, the round filter, or the ATT/DEF log filter checkboxes. These SHALL remain at their current values across a Load operation.

#### Scenario: maxRounds is part of the export
- **WHEN** the user changes `#max-rounds` to 250 and clicks Save
- **THEN** the saved file SHALL contain `"global": { "maxRounds": 250 }`

#### Scenario: Speed slider is not part of the export
- **WHEN** the user changes the speed slider value and clicks Save
- **THEN** the saved file SHALL NOT contain any speed value, and a subsequent Load of any file SHALL leave the speed slider value unchanged

#### Scenario: Log filter checkboxes are not part of the export
- **WHEN** the user toggles the ATT or DEF log filter checkbox or selects a round filter, then clicks Save
- **THEN** the saved file SHALL NOT contain any log filter value, and a subsequent Load SHALL leave those controls unchanged

### Requirement: Archer-tower section is exported only when the controls render

The DEF-side archer-tower controls render conditionally (per `js/army-config.js`). The exporter SHALL include `def.archerTower` only when those controls exist in the DOM and at least one of `atk`, `hp`, `range` is greater than zero. The decoder SHALL ignore an `archerTower` key on a side panel whose archer-tower controls are not rendered, and SHALL list the section in the warning banner as ignored.

#### Scenario: ATT side never carries archer-tower
- **WHEN** the user loads a file that contains `att.archerTower`
- **THEN** the ATT-side controls SHALL be unaffected, and the banner SHALL list `att.archerTower: unknown key` (the schema does not place archer-tower on the ATT side)

#### Scenario: DEF archer-tower is round-trippable
- **WHEN** the DEF panel renders archer-tower controls and the user sets atk=5000000, hp=8000000, range=12, phantomFire=true, then Saves and Loads the file
- **THEN** the four DEF archer-tower inputs SHALL match the original values exactly
