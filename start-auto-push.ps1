$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
$script = Join-Path $repo "auto-push.ps1"
$log = Join-Path $repo "auto-push.log"
$quotedScript = '"' + $script + '"'

$process = Start-Process powershell.exe `
  -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File $quotedScript" `
  -WorkingDirectory $repo `
  -WindowStyle Hidden `
  -PassThru

"Started auto-push watcher with PID $($process.Id). Log: $log"
