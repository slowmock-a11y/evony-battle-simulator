### Requirement: robots.txt exists at site root
The site SHALL serve a `robots.txt` file at the root path that allows all crawlers and references the sitemap URL.

#### Scenario: Crawler reads robots.txt
- **WHEN** a search engine crawler requests `/robots.txt`
- **THEN** the response body SHALL contain `User-agent: *`, `Allow: /`, and a `Sitemap:` directive pointing to the absolute sitemap URL

### Requirement: sitemap.xml exists at site root
The site SHALL serve a `sitemap.xml` file that lists the canonical URL of the app with a `lastmod` date.

#### Scenario: Search engine fetches sitemap
- **WHEN** a search engine fetches `/sitemap.xml`
- **THEN** the response SHALL be valid XML conforming to the Sitemap Protocol 0.9 and contain exactly one `<url>` entry with the canonical `<loc>` and a `<lastmod>` in YYYY-MM-DD format

### Requirement: Web app manifest linked from index.html
The site SHALL include a `manifest.json` file and `index.html` SHALL reference it via `<link rel="manifest">`.

#### Scenario: Browser parses manifest
- **WHEN** a browser loads `index.html`
- **THEN** it SHALL find `<link rel="manifest" href="manifest.json">` in `<head>`
- **AND** `manifest.json` SHALL be valid JSON containing at minimum: `name`, `short_name`, `start_url`, `display`, `background_color`, `theme_color`

### Requirement: JSON-LD WebApplication structured data in index.html
The `index.html` SHALL include a `<script type="application/ld+json">` block in `<head>` with a `WebApplication` schema describing the simulator.

#### Scenario: Google parses structured data
- **WHEN** Google's Rich Results crawler processes `index.html`
- **THEN** it SHALL find a valid JSON-LD block with `@context`, `@type: "WebApplication"`, `name`, `description`, `url`, `applicationCategory`, and `operatingSystem` fields
