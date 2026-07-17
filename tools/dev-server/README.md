# Website Scripts Live Dev Server

Use this for one-second Webflow testing. It serves files directly from this
local repo and exposes them through a permanent Cloudflare Tunnel hostname.

## One-time setup

Install Cloudflare Tunnel:

```powershell
winget install --id Cloudflare.cloudflared
```

Create the named tunnel and DNS route:

```powershell
.\tools\dev-server\setup-cloudflare-tunnel.ps1
```

Default hostname:

```text
scripts-dev.wsitemail.com
```

## Start live testing

```powershell
.\tools\dev-server\start-dev-tunnel.ps1
```

Use this in Webflow while testing:

```html
<script src="https://scripts-dev.wsitemail.com/sites/farmhealthfirst.js"></script>
```

Flow:

```text
save local file -> reload Webflow -> latest local script loads
```

The local server sends `Cache-Control: no-store`, so the browser should request
the file again on every reload.

## Normal publishing

The auto-push worker still commits and pushes saved changes to GitHub. That
keeps Cloudflare Pages, GitHub, and production URLs up to date separately from
the instant local testing tunnel.
