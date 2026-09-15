# Website Scripts distribution repository

This is the production compatibility repository for JavaScript and CSS served
through GitHub and jsDelivr. The current public `sites/*` URLs must continue to
work.

Client source work lives under:

```text
C:\Users\diarm\Desktop\Webflow\active
C:\Users\diarm\Desktop\Webflow\archive
```

## Required shared instructions

Before any work here, read `.webflow-shared/AGENTS.shared.md`.

Before any Webflow build, redesign, or modification, also read and follow
`.webflow-shared/standards/WEBFLOW_STANDARDS.md`.

For a full site audit, read and follow
`.webflow-shared/standards/WEBFLOW_AUDIT.md`.

## Publishing

Do not edit a mapped file under `sites/` directly. Edit the corresponding
client repository and publish it with:

```powershell
.\.webflow-shared\tools\publish-project.ps1 -ProjectRoot <client-project-path>
```

The publisher validates JavaScript, commits only that project's declared
assets, mirrors them into this repository, pushes `main`, and purges jsDelivr.

Do not run the legacy repository-wide auto-push watcher. It stages every change
and is unsafe when several projects or agents are active.

## Existing public URLs

Keep production URLs in this form until a separately approved CDN migration:

```html
<script src="https://cdn.jsdelivr.net/gh/diarmuids/website-scripts@main/sites/farmhealthfirst.js"></script>
```

CSS uses the same repository and path pattern.

## Editing rules

- Preserve unrelated changes.
- Keep the exact mapped filenames under `sites/`.
- Never commit logs or `.webflow-shared`.
- If validation or publishing fails, leave the change unpublished and report
  the failure.
