# battlefield-axis Specification

## Purpose
X-axis scale bar along the bottom of the battlefield map showing engine-coordinate tick marks.

## Requirements

### Requirement: X-axis scale bar
The battlefield SHALL display a horizontal axis along the bottom of the map showing engine-position tick marks at every 250 units from 0 to 1500. Each tick SHALL be a short vertical line with a numeric label below it. The axis SHALL use the same coordinate mapping as unit markers (`mapToScreen()`).

#### Scenario: Axis rendered on battlefield display
- **WHEN** the battlefield map is rendered with a battle result
- **THEN** tick marks appear at positions 0, 250, 500, 750, 1000, 1250, and 1500 along the bottom edge, each with its numeric value displayed below

#### Scenario: Axis updates on window resize
- **WHEN** the browser window is resized
- **THEN** the axis tick positions update to match the new container width using the same mapping as unit markers

#### Scenario: Axis does not interfere with interactions
- **WHEN** the axis is displayed
- **THEN** axis ticks and labels have `pointer-events: none` and do not block hover or click interactions on unit markers

### Requirement: Axis styling
The axis ticks and labels SHALL be styled subtly so they serve as a reference without dominating the visual. Ticks SHALL be thin (1px) vertical lines. Labels SHALL use a small font size (10px), muted color, and monospace or system font.

#### Scenario: Axis visual appearance
- **WHEN** the battlefield is rendered
- **THEN** ticks are 1px wide, 8px tall, in a muted gray color, and labels are 10px, muted gray, centered below each tick
