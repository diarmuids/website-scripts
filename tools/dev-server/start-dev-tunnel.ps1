param(
  [string]$ConfigPath = "$env:USERPROFILE\.cloudflared\website-scripts-dev.yml",
  [int]$Port = 8787
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$server = Join-Path $repo "tools\dev-server\server.js"

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  Write-Host "cloudflared is not installed."
  Write-Host "Install it with:"
  Write-Host "  winget install --id Cloudflare.cloudflared"
  exit 1
}

if (-not (Test-Path $ConfigPath)) {
  Write-Host "Tunnel config not found: $ConfigPath"
  Write-Host "Run setup first:"
  Write-Host "  .\tools\dev-server\setup-cloudflare-tunnel.ps1"
  exit 1
}

$existingServer = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

if (-not $existingServer) {
  $serverProcess = Start-Process powershell.exe `
    -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `$env:PORT='$Port'; node `"$server`"" `
    -WorkingDirectory $repo `
    -WindowStyle Hidden `
    -PassThru

  Write-Host "Started local dev server on http://localhost:$Port with PID $($serverProcess.Id)"
}
else {
  Write-Host "Local dev server port already in use: http://localhost:$Port"
}

Write-Host "Starting Cloudflare Tunnel from: $ConfigPath"
Write-Host "Use this in Webflow:"
Write-Host "  <script src=""https://dev.wsitefiles.com/sites/farmhealthfirst.js""></script>"
Write-Host ""

cloudflared tunnel --config $ConfigPath run
