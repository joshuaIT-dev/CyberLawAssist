$ErrorActionPreference = 'Stop'
$claRoot = $PSScriptRoot
$claXampp = Split-Path (Split-Path $claRoot -Parent) -Parent
$claPrivate = Join-Path $claXampp 'cyberlawassist-private'
if (-not (Test-Path -LiteralPath $claPrivate)) { New-Item -ItemType Directory -Path $claPrivate > $null }
function Test-LocalPort([int]$Port) {
    $client = [System.Net.Sockets.TcpClient]::new()
    try { $task = $client.ConnectAsync('127.0.0.1', $Port); return ($task.Wait(700) -and $client.Connected) }
    catch { return $false }
    finally { $client.Dispose() }
}
function Wait-LocalPort([int]$Port) {
    for ($i=0; $i -lt 40; $i++) {
        if (Test-LocalPort $Port) { return }
        Start-Sleep -Milliseconds 250
    }
    throw "Port $Port did not become ready. Check the XAMPP logs."
}
if (-not (Test-LocalPort 3306)) {
    $mysql = Join-Path $claXampp 'mysql\bin\mysqld.exe'
    $config = Join-Path $claXampp 'mysql\bin\my.ini'
    Start-Process -FilePath $mysql -ArgumentList @(('--defaults-file="'+$config+'"'),'--standalone','--bind-address=127.0.0.1') -WorkingDirectory (Split-Path $mysql) -WindowStyle Hidden
    Wait-LocalPort 3306
}
if (-not (Test-Path -LiteralPath (Join-Path $claPrivate 'config.php'))) {
    & (Join-Path $claXampp 'php\php.exe') (Join-Path $claRoot 'database\setup.php')
    if ($LASTEXITCODE -ne 0) { throw 'Database setup failed. Existing data has been retained.' }
}
if (-not (Test-LocalPort 80)) {
    $apache = Join-Path $claXampp 'apache\bin\httpd.exe'
    $config = Join-Path $claXampp 'apache\conf\httpd.conf'
    Start-Process -FilePath $apache -ArgumentList @('-f',('"'+$config+'"')) -WorkingDirectory (Split-Path $apache) -WindowStyle Hidden
    Wait-LocalPort 80
}
if (-not (Test-LocalPort 8001)) {
    $aiScript = Join-Path $claRoot 'phyton ai\start-ai.ps1'
    Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$aiScript+'"')) -WorkingDirectory (Split-Path $aiScript) -WindowStyle Hidden -RedirectStandardOutput (Join-Path $claPrivate 'ai.log') -RedirectStandardError (Join-Path $claPrivate 'ai-error.log')
    Wait-LocalPort 8001
}
$claFolder = [uri]::EscapeDataString((Split-Path $claRoot -Leaf))
$claAddress = "http://localhost/$claFolder/"
$claStatus = Invoke-RestMethod ($claAddress+'assets/php/auth.php?action=me') -TimeoutSec 10
Write-Host "Project ready: $claAddress"
Write-Host ('Register a User account: '+$claAddress+'pages/signup.html')
Write-Host 'Keep Apache, MySQL, and the offline AI running while using the system.'
