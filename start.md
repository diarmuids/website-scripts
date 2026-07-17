# Agent startup instructions

This repository is for website script files that should be published to GitHub
immediately after saved changes are present.

When an agent starts in this folder:

1. Check the current Git state with `git status --short --branch`.
2. If any files are changed, added, deleted, or renamed, review the diff briefly.
3. For JavaScript changes, run `node --check` on changed `.js` files when Node is available.
4. Stage all current changes with `git add -A`.
5. Commit them with a short message that describes the changed site or script.
6. Push the active branch to `origin`.
7. Confirm the working tree is clean after the push.

Default commit message when no better one is obvious:

```powershell
Update website scripts
```

Useful command sequence:

```powershell
git status --short --branch
node --check .\farmhealthfirst.js
git add -A
git commit -m "Update website scripts"
git push
git status --short --branch
```

Do not discard existing user changes. If a syntax check fails, report the failure
instead of committing broken JavaScript.
