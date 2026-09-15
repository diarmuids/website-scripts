# Website Scripts production repository

This folder remains in place to preserve the public GitHub and jsDelivr URLs
used by existing websites. It is the production distribution repository, not
the normal place to work on a client project.

Its location is:

```text
C:\Users\diarm\Desktop\Webflow\distribution\website-scripts
```

Use the Webflow workspace instead:

```text
C:\Users\diarm\Desktop\Webflow
```

Open `Webflow.code-workspace` for the overview, or open a project folder under
`Webflow\active` in its own VS Code window.

Project source files live inside each project's `assets` folder. The shared
publisher copies approved assets into this repository's `sites` folder,
commits them, and pushes them so existing CDN URLs keep working.

For Mungret Medical Centre:

- Work in `Webflow\active\mungret-medical-centre`.
- Edit `assets\mungretmc.js` and `assets\mungretmc.css` there.
- The files `sites\mungretmc.js` and `sites\mungretmc.css` here are their live
  production mirrors.
