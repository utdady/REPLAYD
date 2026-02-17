# REPLAYD - Start dev server (finds Node if not in PATH)
$nodePaths = @(
  "C:\Program Files\nodejs\npm.cmd",
  "C:\Program Files (x86)\nodejs\npm.cmd",
  "$env:LOCALAPPDATA\Programs\node\npm.cmd"
)
$npm = $null
foreach ($p in $nodePaths) {
  if (Test-Path $p) { $npm = $p; break }
}
if (-not $npm) {
  Write-Host "Node.js not found. Install from https://nodejs.org and try again." -ForegroundColor Red
  exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "Installing dependencies (if needed)..." -ForegroundColor Cyan
& $npm install 2>&1 | Out-Null

Write-Host "Starting Next.js dev server at http://localhost:3000" -ForegroundColor Green
& $npm run dev
