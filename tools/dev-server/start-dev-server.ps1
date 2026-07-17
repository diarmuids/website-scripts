$repo = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$server = Join-Path $repo "tools\dev-server\server.js"
$port = if ($env:PORT) { $env:PORT } else { "8787" }

Push-Location $repo
try {
  node $server
}
finally {
  Pop-Location
}
