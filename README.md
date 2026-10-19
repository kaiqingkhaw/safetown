# SafeTown

**Report. Repair. Verify.**

[![Project checks](https://github.com/kaiqingkhaw/safetown/actions/workflows/checks.yml/badge.svg)](https://github.com/kaiqingkhaw/safetown/actions/workflows/checks.yml)

A community safety prototype for tracking walking hazards from a resident report to a resident-verified repair. Developed for the University Hackathon 2026 People track.

![SafeTown interface](docs/preview.png)

## Start here

For a quick preview, open `public/index.html` in Chrome or Edge.

For development, use Node.js 22 or newer:

```sh
npm start
```

Open **http://127.0.0.1:5173**. No package installation, account, API key or environment file is required. Keep using the same browser address to preserve demo records.

```sh
npm test       # Syntax and focused regression checks
npm run build  # Creates dist/ and the portable dist/SafeTown.html
```

## What works

- Photo reports with location, access context and editable priority suggestions.
- Suggestions for similar open reports at the same location.
- Community confirmations, management assignment and public progress updates.
- Follow-up flags, a timestamped activity history and repair evidence.
- Resident verification and reopening with reasons, retaining previous repair evidence.
- Search, status filters, local persistence and JSON export.
- Fixed sample-location map pins and report-aware illustrative route comparisons.
- Pilot activity measures that exclude seeded sample records.

## Demo walkthrough

1. Report an issue at **Park Entrance**. Add a description and access context.
2. Find it in **Community reports** and add a confirmation.
3. Open **Management desk**, assign the appropriate team and publish an update.
4. Upload a repair photo and notes, then submit for resident verification.
5. Return to **Community reports**, check the repair and confirm it, or reopen it with a reason.
6. Review **Pilot & measures** and the illustrative **Walking routes** concept.

Reset sample data after rehearsals if needed. Export records before resetting anything you want to keep.

## Project structure

```text
public/       Editable website: index.html, style.css, app.js
scripts/      Local preview server and portable build
tests/        Focused regression tests
docs/         Project scope, verification notes and preview
.github/      Automated checks and pull-request template
```

**Edit `public/`, not generated files in `dist/`.** See [CONTRIBUTING.md](CONTRIBUTING.md) for the team workflow.

## Prototype boundaries

This is a single-browser demonstration. Records are stored in localStorage, not a shared database. Role switching is not authentication; confirmations are not independent identities. Uploaded images remain in the browser. Starting records, township and map are illustrative.

Priority suggestions use category and access rules. Routes are not validated navigation or a safety guarantee. Follow-up flags do not send external notifications. There are no live external classification, mapping or messaging integrations. Report history is not a tamper-resistant audit log.

The app is not an emergency service. Do not upload sensitive photos or personal information to a public demo.

## Collaboration and access

The repository owner can invite teammates through GitHub repository **Settings â†’ Collaborators**. Use a separate branch for each change and a pull request for review. Making the repository public does not give visitors permission to push.

No open-source licence has been selected. 

