# Team workflow

Work from this repository so everyone shares one source of truth. Do not edit the standalone downloaded HTML and expect those changes to appear in GitHub.

## First time

1. Accept the owner's collaborator invitation.
2. Clone `https://github.com/kaiqingkhaw/safetown.git` with GitHub Desktop or Git.
3. Open the folder in your editor. Run `npm start`, then visit http://127.0.0.1:5173.

## With GitHub Desktop

1. Fetch origin and pull the latest `main`.
2. Create a new branch with a short task name, such as `feature/report-filters`.
3. Edit the relevant files under `public/`.
4. Run `npm test` and `npm run build`. Check the affected flow in your browser.
5. Review the changed files, write a clear summary, and commit.
6. Publish/push your branch and create a pull request.
7. Ask a teammate to review it. Merge after checks pass, then everyone pulls the latest `main`.

## With Git commands

Start with no uncommitted changes:

```sh
git switch main
git pull --ff-only origin main
git switch -c feature/report-filters
# Edit the source files.
npm test
npm run build
git add public/app.js
git commit -m "Improve report filtering"
git push -u origin feature/report-filters
```

Open GitHub and create the pull request. Stage the files you actually changed; the example only stages app.js.

## Keep changes easy to review

- One small feature or fix per pull request.
- Coordinate before two people edit the same part of app.js.
- Include screenshots for interface changes and describe your test steps.
- Keep sample data labelled and feature claims accurate.
- Do not commit passwords, tokens, personal photos, exported browser records or generated `dist/` files.
- Do not force-push shared branches. If changes conflict, resolve them with the author rather than replacing their work.

Suggested review settings, if available for this account: one approving review and passing Project checks before merging into main. These are recommendations; this file does not enable branch protection.

## Hosting later

This static app can be deployed from the `public/` folder or built `dist/` folder. Repository access and website access are different. Choose hosting and audience deliberately; a private repository does not provide a publicly accessible demo.

Official references: [upload existing code](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github), [invite collaborators](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository).

