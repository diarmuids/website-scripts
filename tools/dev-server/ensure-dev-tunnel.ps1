param(
  [string]$ConfigPath = "$env:USERPROFILE\.cloudflared\website-scripts-dev.yml",
  [int]$Port = 8787
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$serverStarter = Join-Path $repo "tools\dev-server\start-dev-server.ps1"
$cloudflared = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source

if (-not $cloudflared) {
  $cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
}

if (-not (Test-Path $cloudflared)) {
  throw "cloudflared is not installed: $cloudflared"
}

if (-not (Test-Path $ConfigPath)) {
  throw "Tunnel config not found: $ConfigPath"
}

if (-not (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)) {
  & $serverStarter -Port $Port
}

$tunnel = Get-CimInstance Win32_Process -Filter "name = 'cloudflared.exe'" |
  Where-Object { $_.CommandLine -like "*$ConfigPath*" }

if (-not $tunnel) {
  $process = Start-Process -FilePath $cloudflared `
    -ArgumentList @("tunnel", "--config", $ConfigPath, "run") `
    -WorkingDirectory $repo `
    -WindowStyle Hidden `
    -PassThru

  "Started dev tunnel with PID $($process.Id): https://dev.wsitefiles.com/sites"
}
else {
  "Dev tunnel already running with PID $($tunnel.ProcessId -join ', '): https://dev.wsitefiles.com/sites"
}
