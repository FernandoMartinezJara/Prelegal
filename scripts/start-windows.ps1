Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Set-Location (Join-Path $PSScriptRoot "..")

docker build -t prelegal .

try { docker rm -f prelegal 2>$null | Out-Null } catch {}

if (Test-Path .env) {
  docker run -d --name prelegal --env-file .env -p 8000:8000 prelegal
} else {
  docker run -d --name prelegal -p 8000:8000 prelegal
}

Write-Host "Prelegal is running at http://localhost:8000"
