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
- Style only the states the Designer's States menu offers (see
  `WEBFLOW_STANDARDS.md` section 13). Per-item differences go on `is-` combo
  classes such as `is-even`, `is-odd`, `is-first`, `is-last`.
- Avoid non-native CSS wherever possible. What is allowed:
  - **Always allowed:** `calc()`, `clamp()`, `min()`, `max()` and any other
    function Webflow accepts typed into a native value field.
  - **Allowed on a class:** properties with no native control, added through
    the Style panel's Custom Properties section. Never use it for a property
    that has a native control.
  - **Ask the user first:** `::before` / `::after`.
  - **Allowed as a last resort:** everything else, such as `:has()`, `:not()`,
    `:focus-within`, `nth-child` outside a Collection List, `@supports`,
    `scroll-*` properties that Custom Properties can't take, keyframes and
    container queries. It goes only in the site's `local_styles` Code Embed,
    never in head code or anywhere else. Comment every rule: what it does,
    which class or element it targets, and why native Webflow can't do it.
- Whenever anything non-native is added, whether in Custom Properties or
  `local_styles`, the reply must contain this heading so the user can't miss it:

  `## ⚠️ PLEASE NOTE: NON-NATIVE STYLES ADDED`

  Under it, list each rule, the class or element, and where it was added.
- Whenever a full site audit is requested, follow
  [`WEBFLOW_AUDIT.md`](./WEBFLOW_AUDIT.md) in full and report in its format.

## Google Docs

When creating a Google Doc from this repository (for example a document to
share with a client):

- Use the **Inter** font throughout.
- Line spacing: **1.15 for headings**; **1.5 for paragraphs, lists and all
  other body text**.
- Use **Pageless** format where the tool allows it. The Drive connector
  can't set Pageless, so if it can't be set, tell the user to switch it on via
  File → Page setup → Pageless.
- When uploading HTML, set Inter and the line spacing above as inline styles
  on every heading, paragraph and list item. Put an empty line between list points and
  sections, and don't use ☐ tick boxes.

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
- Site loaders try the dev file first for everyone, visitors included, and fall
  back to the published file when the dev server isn't running. While work is
  happening, every save is served straight away; once the window closes, the
  site returns to the published GitHub version. Keep this behaviour when editing
  any site loader.
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
