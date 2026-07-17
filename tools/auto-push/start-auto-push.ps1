$toolDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent (Split-Path -Parent $toolDir)
$script = Join-Path $toolDir "auto-push.ps1"
$log = Join-Path $toolDir "auto-push.log"
$quotedScript = '"' + $script + '"'

$process = Start-Process powershell.exe `
  -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File $quotedScript" `
  -WorkingDirectory $repo `
  -WindowStyle Hidden `
  -PassThru

"Started auto-push watcher with PID $($process.Id). Log: $log"
