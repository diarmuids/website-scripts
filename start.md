# Agent startup instructions

This repository is for website script files that should be published to GitHub
immediately after saved changes are present.

When an agent starts in this folder:

1. Start the live watcher with `.\start-auto-push.ps1`.
2. Check the current Git state with `git status --short --branch`.
3. If any files are changed, added, deleted, or renamed, review the diff briefly.
4. For JavaScript changes, run `node --check` on changed `.js` files when Node is available.
5. Stage all current changes with `git add -A`.
6. Commit them with a short message that describes the changed site or script.
7. Push the active branch to `origin`.
8. Confirm the working tree is clean after the push.

Default commit message when no better one is obvious:

```powershell
Update website scripts
```

Useful command sequence:

```powershell
git status --short --branch
.\start-auto-push.ps1
node --check .\farmhealthfirst.js
git add -A
git commit -m "Update website scripts"
git push
git status --short --branch
```

Do not discard existing user changes. If a syntax check fails, leave the change
uncommitted and report the failure instead of committing broken JavaScript.

The live watcher checks for saved changes every second and writes activity and
failures to `tools/auto-push/auto-push.log`.

Use this stable public script URL:

```html
<script src="https://cdn.jsdelivr.net/gh/diarmuids/website-scripts@main/farmhealthfirst.js"></script>
```

The watcher purges jsDelivr after changed JavaScript files are pushed, so the URL
does not need a manual version parameter.
