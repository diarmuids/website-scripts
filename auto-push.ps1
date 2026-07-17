param(
  [int]$DebounceSeconds = 1,
  [string]$CommitMessage = "Auto-publish website scripts"
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
$log = Join-Path $repo "auto-push.log"

function Write-Log {
  param([string]$Message)
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  "$timestamp $Message" | Add-Content -Path $log
}

function Get-ChangedJsFiles {
  git -C $repo status --porcelain |
    ForEach-Object { $_.Substring(3) } |
    Where-Object { $_ -like "*.js" -and (Test-Path (Join-Path $repo $_)) }
}

function Invoke-AutoPush {
  try {
    $status = git -C $repo status --porcelain
    if (-not $status) {
      return
    }

    foreach ($file in Get-ChangedJsFiles) {
      $path = Join-Path $repo $file
      node --check $path | Out-Null
    }

    git -C $repo add -A | Out-Null
    $pending = git -C $repo diff --cached --name-only
    if (-not $pending) {
      return
    }

    git -C $repo commit -m $CommitMessage | Out-Null
    git -C $repo push origin HEAD | Out-Null
    Write-Log "Committed and pushed: $($pending -join ', ')"
  }
  catch {
    Write-Log "Auto-push failed: $($_.Exception.Message)"
  }
}

Write-Log "Polling watcher started for $repo"

while ($true) {
  Invoke-AutoPush
  Start-Sleep -Seconds $DebounceSeconds
}
