Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

try { docker stop prelegal 2>$null } catch {}
try { docker rm prelegal 2>$null } catch {}
