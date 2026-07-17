# AGENTS.md

This repository stores website JavaScript files that are served publicly from
GitHub/jsDelivr and should be published quickly after local saves.

## Auto-publish workflow

- Start the local auto-push worker before editing:

```powershell
.\start-auto-push.ps1
```

- Keep it running with the watchdog:

```powershell
.\tools\auto-push\ensure-auto-push.ps1
```

- Install the login startup keepalive without admin rights:

```powershell
.\tools\auto-push\install-startup-shortcut.ps1
```

- The keepalive runs `ensure-auto-push.ps1` once a minute and restarts the
  watcher if it has exited.

- The actual worker scripts live in `tools/auto-push/`.
- The worker checks for saved changes every second.
- For changed `.js` files, it runs `node --check` before committing.
- If checks pass, it stages all current changes, commits them, pushes `HEAD` to
  `origin`, and purges jsDelivr for changed `.js` and `.css` files.
- Worker activity and errors are written to `tools/auto-push/auto-push.log`.
- Do not commit `auto-push.log`.

## Public script URL

Use stable `sites/` URLs in Webflow or other live sites:

```html
<script src="https://cdn.jsdelivr.net/gh/diarmuids/website-scripts@main/sites/farmhealthfirst.js"></script>
```

CSS files should use the same pattern:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/diarmuids/website-scripts@main/sites/example.css">
```

Do not use `raw.githubusercontent.com` for live script tags. It serves with a
plain-text content type and can cache unexpectedly.

The URL should not need a manual `?v=` parameter because the worker purges
jsDelivr after JavaScript and CSS pushes.

## Editing rules

- Keep site scripts and stylesheets under `sites/`.
- Keep automation and helper scripts under `tools/`.
- For every edited site `.js` or `.css` file, keep a top-of-file comment with
  the exact local last-updated date and time in `YYYY-MM-DD HH:mm:ss` format,
  followed by one blank line before the file content. Do not include a timezone
  suffix.
- Preserve user changes; never discard local edits to make a commit cleaner.
- If a syntax check fails, leave the change uncommitted and report the failure.
