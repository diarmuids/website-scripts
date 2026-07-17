param(
  [int]$IntervalSeconds = 60
)

$toolDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ensureScript = Join-Path $toolDir "ensure-auto-push.ps1"

while ($true) {
  & $ensureScript | Out-Null
  Start-Sleep -Seconds $IntervalSeconds
}
