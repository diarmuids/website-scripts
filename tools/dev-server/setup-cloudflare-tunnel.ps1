param(
  [string]$TunnelName = "website-scripts-dev",
  [string]$Hostname = "scripts-dev.wsitemail.com",
  [int]$Port = 8787
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  Write-Host "cloudflared is not installed."
  Write-Host "Install it with:"
  Write-Host "  winget install --id Cloudflare.cloudflared"
  exit 1
}

Write-Host "Opening Cloudflare login. Pick the Cloudflare account that manages $Hostname."
cloudflared tunnel login

Write-Host "Creating tunnel: $TunnelName"
cloudflared tunnel create $TunnelName

$tunnels = cloudflared tunnel list --output json | ConvertFrom-Json
$tunnel = $tunnels | Where-Object { $_.name -eq $TunnelName } | Select-Object -First 1

if (-not $tunnel) {
  throw "Could not find created tunnel named $TunnelName."
}

Write-Host "Routing $Hostname to tunnel: $TunnelName"
cloudflared tunnel route dns $TunnelName $Hostname

$cloudflaredDir = Join-Path $env:USERPROFILE ".cloudflared"
$configPath = Join-Path $cloudflaredDir "website-scripts-dev.yml"
$credentialsPath = Join-Path $cloudflaredDir "$($tunnel.id).json"

@"
tunnel: $($tunnel.id)
credentials-file: $credentialsPath

ingress:
  - hostname: $Hostname
    service: http://localhost:$Port
  - service: http_status:404
"@ | Set-Content -Path $configPath -Encoding utf8

Write-Host ""
Write-Host "Config written to: $configPath"
Write-Host "Next, start the local dev tunnel with:"
Write-Host "  .\tools\dev-server\start-dev-tunnel.ps1"
