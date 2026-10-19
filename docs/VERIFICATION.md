# SafeTown v2 verification

Checked on 18 October 2026. All browser interactions used synthetic test records, which were reset after testing.

## Browser checks completed

- Default report form surfaced an existing lighting report at the same sample location.
- Changing location and category updated duplicate suggestions.
- A blocked-path obstruction produced high-priority triage and saved the access context.
- New report appeared with a four-stage progress indicator and original submission time.
- Management assignment and public update were visible in the resident history.
- A valid image and repair notes moved the report to Awaiting verification.
- Submitting verification without the required checkbox left the verification form open.
- Checking the confirmation and submitting recorded resident verification.
- The pilot dashboard excluded all four seed records and counted the one locally created test report and its verification.
- Reopening recorded the supplied reason, retained the original submission time and retained the previous repair image.
- A second repair submission retained the first image and notes under Previous repair submissions.
- Data persisted across a reload.
- The route concept listed the reopened Park Entrance report and flagged its access concern under the step-free preference.
- At a 390px viewport, the overview and routes did not create page-wide horizontal overflow. Desktop and mobile screenshots were saved.
- Reset restored the initial four sample records.

## Code checks

`node --check public/app.js`

`npm test`

The focused assertions cover rule-based triage, duplicate matching, follow-up timing after an update or reopening, exclusion of pending resident verification from management overdue flags, seed identification, storage rollback, successful persistence and HTML escaping.

## Limits

This is not an exhaustive accessibility, security, browser-compatibility or load audit. There is no live multi-user backend, verified map, external notification service or real-world impact study. The test image is a screenshot used as a file-upload fixture, not actual repair evidence. Local browser records are editable and are not independently verified audit records.

## 19 October reliability update

Automated regression checks now also cover unknown and inherited-property route names, malformed saved JSON, invalid report structures, duplicate IDs, invalid image URLs and preventing writes over unreadable saved records. The static and portable builds pass.

The resident guide replaces the pitch-rehearsal page. Dialog headings are linked through aria-labelledby. This update has not had a fresh visual browser check: the local preview connection timed out. The earlier browser results above refer to the 18 October version.
