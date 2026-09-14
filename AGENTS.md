# AGENTS.md

This repository stores website JavaScript files that are served publicly from
GitHub/jsDelivr and should be published quickly after local saves.

## Webflow development standards

- Before any Webflow build, redesign, or modification, read and follow
  [`WEBFLOW_STANDARDS.md`](./WEBFLOW_STANDARDS.md).
- Treat that document as the canonical shared Webflow reference for Codex and
  Claude. Update the canonical document rather than duplicating its rules here.
- Whenever working on a Webflow site, create or update that site's own
  `AGENTS.md` to require its local `WEBFLOW_STANDARDS.md`, and provide or refresh
  that local standards copy. Follow the portability workflow in the canonical
  standards, preserving existing site-specific instructions. This makes the
  requirements available to other agents, tools and collaborators independently
  of this service.
- Apply every CSS declaration that Webflow supports natively through Webflow's
  native Style-panel controls. Do not place equivalent styling in Custom
  Properties or custom CSS.

## Auto-publish workflow

- At the start of every work session in this repository, start both the local
  dev tunnel and auto-push worker before reading or editing site files:

```powershell
.\tools\dev-server\ensure-dev-tunnel.ps1
.\start-auto-push.ps1
```

- The dev-tunnel helper is safe to run repeatedly. It starts the local server
  on port `8787` and the named Cloudflare Tunnel only when they are not already
  running.
- The permanent dev base URL is:

```text
https://dev.wsitefiles.com/sites
```

- The dev server runs only while work is happening in this repository. The
  VS Code task in `.vscode/tasks.json` starts it when this folder is opened and
  it stops when the window closes. Never start it at Windows login, from a
  startup shortcut, or from the auto-push keepalive, and never make it outlive
  the session that started it.
- If `https://dev.wsitefiles.com/sites/...` returns 502 during a session, the
  local server has stopped. Re-run `.\tools\dev-server\ensure-dev-tunnel.ps1`.
- External visitors must always get the published GitHub version. Site loaders
  use the dev file only in a browser that has opted in with `?dev=on` (saved in
  `localStorage`; `?dev=off` clears it), and fall back to the live file if the
  dev file fails to load. Keep this behaviour when editing any site loader.
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
- Before publishing, it automatically refreshes the top-of-file local
  `Last updated` timestamp for each changed file under `sites/`.
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
