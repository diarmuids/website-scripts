param(
  [int]$Port = $(if ($env:PORT) { [int]$env:PORT } else { 8787 })
)

$repo = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$server = Join-Path $repo "tools\dev-server\server.js"
$node = (Get-Command node -ErrorAction Stop).Source

# Normally the VS Code task in .vscode/tasks.json runs the server while this
# folder is open. This fallback is tied to the session that starts it, so the
# server stops when that session ends.
$process = Start-Process -FilePath $node `
  -ArgumentList @("`"$server`"", $Port) `
  -WorkingDirectory $repo `
  -WindowStyle Hidden `
  -PassThru

"Started Website Scripts dev server on port $Port with PID $($process.Id)"
