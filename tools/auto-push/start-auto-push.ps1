$toolDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent (Split-Path -Parent $toolDir)
$script = Join-Path $toolDir "auto-push.ps1"
$log = Join-Path $toolDir "auto-push.log"
$quotedScript = '"' + $script + '"'

$running = Get-CimInstance Win32_Process -Filter "name = 'powershell.exe' or name = 'pwsh.exe'" |
  Where-Object {
    $_.ProcessId -ne $PID -and
    $_.CommandLine -like "*-File*$script*"
  }

if ($running) {
  "Auto-push watcher already running: $($running.ProcessId -join ', '). Log: $log"
  exit 0
}

$process = Start-Process powershell.exe `
  -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File $quotedScript" `
  -WorkingDirectory $repo `
  -WindowStyle Hidden `
  -PassThru

"Started auto-push watcher with PID $($process.Id). Log: $log"
