param(
  [int]$Port = $(if ($env:PORT) { [int]$env:PORT } else { 8787 })
)

$repo = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path))
$server = Join-Path $repo "tools\dev-server\server.js"
$node = (Get-Command node -ErrorAction Stop).Source

# Launch through WMI rather than Start-Process so the server keeps running after
# the terminal or agent session that started it closes.
$result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
  CommandLine      = "`"$node`" `"$server`" $Port"
  CurrentDirectory = $repo
}

if ($result.ReturnValue -ne 0) {
  throw "Could not start the dev server (Win32_Process.Create returned $($result.ReturnValue))"
}

"Started Website Scripts dev server on port $Port with PID $($result.ProcessId)"
