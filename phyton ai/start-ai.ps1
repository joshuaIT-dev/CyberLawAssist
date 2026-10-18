param([switch]$Lan)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$aiPython = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $aiPython)) {
    & (Join-Path $PSScriptRoot 'setup-ai.ps1')
    if ($LASTEXITCODE -ne 0) { throw 'Python setup did not finish.' }
}
$aiBind = if ($Lan) { '0.0.0.0' } else { '127.0.0.1' }
& $aiPython -c "import importlib.util,sys; sys.exit(0 if all(importlib.util.find_spec(m) for m in ('fastapi','uvicorn')) else 1)"
if ($LASTEXITCODE -eq 0) {
    & $aiPython -m uvicorn main:app --host $aiBind --port 8001 --no-access-log
} else {
    Write-Host 'Starting the offline API with built-in Python libraries.'
    & $aiPython -u serve.py --host $aiBind --port 8001
}
