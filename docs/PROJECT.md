# Project scope

## Main journey

Resident report → management assignment → progress update → repair evidence → resident verification. A resident can reopen an issue with a reason; the original date and prior repair evidence remain available.

## Architecture

- `public/index.html`: application shell and navigation.
- `public/style.css`: responsive interface and component styles.
- `public/app.js`: views, report state, rules, browser events and persistence.
- `localStorage`: browser-only prototype records, including small image data URLs.
- `scripts/serve.cjs`: local development server bound to the loopback interface.
- `scripts/build.cjs`: static output and standalone HTML generation.
- `tests/smoke.cjs`: isolated regression checks with mock browser storage.

There are no external runtime dependencies. The browser renders an illustrative SVG map. Route summaries match open records to fixed sample corridors, not to a real navigation network.

## Rules

Blocked access, poor lighting and damaged walkways suggest high priority; other passable issues suggest medium priority. Management can override the suggestion. A follow-up flag appears after 24 hours without a management update for high-priority cases, or 48 hours for medium/low cases. These are proposed demo thresholds, not an agreed service commitment.

Repair submission requires an image and notes. Closure requires a resident confirmation. Reopening requires an explanation. The prototype has no authenticated identities, so verification represents a demonstrated workflow rather than independent proof.

## Pilot measures

Measure time to first acknowledgement, time from original report to resident verification, reopened cases and resident task completion. Keep seeded records separate from pilot observations. Compare similar case types and disclose small sample sizes.

## Next implementation priorities

1. Resident and management usability testing.
2. Shared database, scoped accounts and image storage.
3. Real geography, accessibility data and evaluated routing.
4. Notification scheduling, moderation and operational integration.
5. Pilot evaluation and a validated operating-cost model.

These items are future work, not implemented capabilities.

