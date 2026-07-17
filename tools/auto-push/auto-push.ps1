param(
  [int]$DebounceSeconds = 1,
  [string]$CommitMessage = "Auto-publish website scripts"
)

$ErrorActionPreference = "Stop"
$toolDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent (Split-Path -Parent $toolDir)
$log = Join-Path $toolDir "auto-push.log"

function Write-Log {
  param([string]$Message)
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  "$timestamp $Message" | Add-Content -Path $log
}

function Get-ChangedCdnFiles {
  git -C $repo status --porcelain |
    ForEach-Object { $_.Substring(3) } |
    Where-Object {
      ($_ -like "*.js" -or $_ -like "*.css") -and
      (Test-Path (Join-Path $repo $_))
    }
}

function Clear-JsDelivrCache {
  param([string[]]$Files)

  foreach ($file in $Files) {
    $cdnPath = $file -replace '\\', '/'
    $purgeUrl = "https://purge.jsdelivr.net/gh/diarmuids/website-scripts@main/$cdnPath"

    for ($attempt = 1; $attempt -le 3; $attempt++) {
      if ($attempt -gt 1) {
        Start-Sleep -Seconds (2 * $attempt)
      }

      try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $purgeUrl
        Write-Log "Purged jsDelivr cache: $cdnPath (attempt $attempt, status $($response.StatusCode))"
      }
      catch {
        Write-Log "jsDelivr purge failed for $cdnPath (attempt $attempt): $($_.Exception.Message)"
      }
    }
  }
}

function Invoke-AutoPush {
  try {
    $status = git -C $repo status --porcelain
    if (-not $status) {
      return
    }

    $changedCdnFiles = @(Get-ChangedCdnFiles)

    foreach ($file in $changedCdnFiles) {
      if ($file -like "*.js") {
        $path = Join-Path $repo $file
        node --check $path | Out-Null
      }
    }

    git -C $repo add -A | Out-Null
    $pending = git -C $repo diff --cached --name-only
    if (-not $pending) {
      return
    }

    git -C $repo commit -m $CommitMessage | Out-Null
    git -C $repo push origin HEAD | Out-Null
    Clear-JsDelivrCache -Files $changedCdnFiles
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
