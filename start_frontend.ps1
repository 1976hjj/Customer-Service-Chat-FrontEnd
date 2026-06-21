param(
    [int]$Port = 5173,
    [string]$HostAddress = "0.0.0.0"
)

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

if ($listener) {
    Write-Host "Frontend already running: http://127.0.0.1:$Port (PID $($listener.OwningProcess))"
    Write-Host "If you need a clean restart, stop this PID first or use the backend stop script."
    exit 0
}

Write-Host "Starting frontend on http://127.0.0.1:$Port ..."
npm.cmd run dev -- --host $HostAddress --port $Port
