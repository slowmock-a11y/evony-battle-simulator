## ADDED Requirements

### Requirement: Viewport meta tag
The HTML document SHALL include a viewport meta tag that sets `width=device-width, initial-scale=1` to enable proper mobile rendering.

#### Scenario: Mobile browser renders at device width
- **WHEN** the page is loaded on a mobile device
- **THEN** the viewport width matches the device screen width (no desktop-scale zoom)

### Requirement: Tablet breakpoint at 768px
The layout SHALL apply responsive rules at a `max-width: 768px` breakpoint that stack side-by-side layouts vertically and adjust spacing for tablet-sized viewports.

#### Scenario: Two-column layout stacks on tablet
- **WHEN** the viewport width is 768px or narrower
- **THEN** all two-column flex layouts (army panels, bottom panels) display as single-column stacks

#### Scenario: Desktop layout preserved above breakpoint
- **WHEN** the viewport width is wider than 768px
- **THEN** the layout renders identically to the current desktop design

### Requirement: Mobile breakpoint at 480px
The layout SHALL apply additional responsive rules at a `max-width: 480px` breakpoint that further reduce font sizes, padding, and input dimensions for phone-sized viewports.

#### Scenario: Reduced sizing on phone
- **WHEN** the viewport width is 480px or narrower
- **THEN** font sizes, padding, and input widths are reduced to fit comfortably without horizontal scrolling

### Requirement: Fluid battlefield container
The battlefield area SHALL scale fluidly to the viewport width instead of using a fixed height. The container SHALL maintain a consistent aspect ratio across screen sizes.

#### Scenario: Battlefield fills available width
- **WHEN** the viewport is resized to any width
- **THEN** the battlefield container occupies the full available width and maintains its aspect ratio

#### Scenario: Battlefield on mobile
- **WHEN** the viewport width is 480px
- **THEN** the battlefield is visible without horizontal scrolling and markers remain positioned correctly

### Requirement: Touch-friendly control sizing
All interactive elements (buttons, inputs, sliders) SHALL have a minimum touch target size of 44px on viewports at or below 768px.

#### Scenario: Button tap targets on tablet
- **WHEN** the viewport width is 768px or narrower
- **THEN** all buttons have at least 44px height and adequate horizontal padding

### Requirement: No horizontal overflow
The page SHALL NOT produce a horizontal scrollbar at any viewport width between 320px and 2560px.

#### Scenario: No horizontal scroll on phone
- **WHEN** the viewport width is 375px (iPhone SE)
- **THEN** no horizontal scrollbar appears and all content is accessible by vertical scrolling only
