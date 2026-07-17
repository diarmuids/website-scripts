$toolDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent (Split-Path -Parent $toolDir)
$startScript = Join-Path $toolDir "start-auto-push.ps1"
$targetScript = Join-Path $toolDir "auto-push.ps1"

$running = Get-CimInstance Win32_Process -Filter "name = 'powershell.exe'" |
  Where-Object { $_.CommandLine -like "*$targetScript*" }

if ($running) {
  "Auto-push watcher already running: $($running.ProcessId -join ', ')"
  exit 0
}

Push-Location $repo
try {
  & $startScript
}
finally {
  Pop-Location
}
