param(
  [int]$DebounceSeconds = 1,
  [string]$CommitMessage = "Auto-publish website scripts"
)

$ErrorActionPreference = "Stop"
$toolDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent (Split-Path -Parent $toolDir)
$log = Join-Path $toolDir "auto-push.log"
$mutexName = "Global\WebsiteScriptsAutoPush-$($repo.ToLowerInvariant().GetHashCode())"
$mutex = New-Object System.Threading.Mutex($false, $mutexName)
$hasMutex = $false

try {
  $hasMutex = $mutex.WaitOne(0)
}
catch {
  $hasMutex = $false
}

if (-not $hasMutex) {
  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  "$timestamp Auto-push watcher already running for $repo; exiting duplicate process." | Add-Content -Path $log
  exit 0
}

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

function Set-LastUpdatedHeaders {
  param([string[]]$Files)

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)

  foreach ($file in $Files) {
    $cdnPath = $file -replace '\\', '/'
    if ($cdnPath -notlike "sites/*.js" -and $cdnPath -notlike "sites/*.css") {
      continue
    }

    $path = Join-Path $repo $file
    $content = [System.IO.File]::ReadAllText($path)
    $header = if ($file -like "*.css") {
      "/* Last updated: $timestamp */"
    }
    else {
      "// Last updated: $timestamp"
    }

    $updated = if ($content -match '^(?:// Last updated:|/\* Last updated:).*?(?:\*/)?\r?\n(?:\r?\n)?') {
      [System.Text.RegularExpressions.Regex]::Replace(
        $content,
        '^(?:// Last updated:|/\* Last updated:).*?(?:\*/)?\r?\n(?:\r?\n)?',
        "$header`r`n`r`n",
        1
      )
    }
    else {
      "$header`r`n`r`n$content"
    }

    [System.IO.File]::WriteAllText($path, $updated, $utf8NoBom)
  }
}

function Clear-JsDelivrCache {
  param([string[]]$Files)

  foreach ($file in $Files) {
    $cdnPath = $file -replace '\\', '/'
    $purgeUrl = "https://purge.jsdelivr.net/gh/diarmuids/website-scripts@main/$cdnPath"

    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $purgeUrl
      $purge = $response.Content | ConvertFrom-Json
      $path = "/gh/diarmuids/website-scripts@main/$cdnPath"
      $pathStatus = $purge.paths.$path

      if ($pathStatus -and $pathStatus.throttled) {
        Write-Log "jsDelivr purge throttled for $cdnPath; reset in $($pathStatus.throttlingReset) seconds."
      }
      else {
        Write-Log "Purged jsDelivr cache: $cdnPath (status $($response.StatusCode))"
      }
    }
    catch {
      Write-Log "jsDelivr purge failed for $cdnPath`: $($_.Exception.Message)"
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
    Set-LastUpdatedHeaders -Files $changedCdnFiles

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
