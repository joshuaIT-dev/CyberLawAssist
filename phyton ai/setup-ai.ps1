param([switch]$FastApi)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$aiPython = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $aiPython)) {
    if (Get-Command uv -ErrorAction SilentlyContinue) {
        & uv venv --python '>=3.10' .venv
    } elseif (Get-Command py -ErrorAction SilentlyContinue) {
        & py -3 -m venv .venv
    } else {
        & python -m venv .venv
    }
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $aiPython)) {
        throw 'Install Python 3.10 or newer, or uv, then run setup-ai.ps1 again.'
    }
}
if ($FastApi) {
    if (Get-Command uv -ErrorAction SilentlyContinue) {
        & uv pip install --python $aiPython -r requirements.txt
    } else {
        & $aiPython -m ensurepip --upgrade
        if ($LASTEXITCODE -ne 0) { throw 'Could not initialize pip.' }
        & $aiPython -m pip install -r requirements.txt
    }
    if ($LASTEXITCODE -ne 0) { throw 'FastAPI installation failed. The built-in offline server remains available.' }
}
Write-Host 'Ready. Run: powershell -ExecutionPolicy Bypass -File .\start-ai.ps1'
