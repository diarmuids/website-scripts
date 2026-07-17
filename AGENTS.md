# AGENTS.md

This repository stores website JavaScript files that are served publicly from
GitHub/jsDelivr and should be published quickly after local saves.

## Auto-publish workflow

- Start the local auto-push worker before editing:

```powershell
.\start-auto-push.ps1
```

- The actual worker scripts live in `tools/auto-push/`.
- The worker checks for saved changes every second.
- For changed `.js` files, it runs `node --check` before committing.
- If checks pass, it stages all current changes, commits them, pushes `HEAD` to
  `origin`, and purges jsDelivr for changed JavaScript files.
- Worker activity and errors are written to `tools/auto-push/auto-push.log`.
- Do not commit `auto-push.log`.

## Public script URL

Use this stable URL in Webflow or other live sites:

```html
<script src="https://cdn.jsdelivr.net/gh/diarmuids/website-scripts@main/farmhealthfirst.js"></script>
```

Do not use `raw.githubusercontent.com` for live script tags. It serves with a
plain-text content type and can cache unexpectedly.

The URL should not need a manual `?v=` parameter because the worker purges
jsDelivr after JavaScript pushes.

## Editing rules

- Keep site scripts at the repository root unless a later organization pass adds
  site-specific folders.
- Keep automation and helper scripts under `tools/`.
- Preserve user changes; never discard local edits to make a commit cleaner.
- If a syntax check fails, leave the change uncommitted and report the failure.
