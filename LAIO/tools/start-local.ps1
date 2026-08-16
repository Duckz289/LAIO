$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot "backend"
$frontendPath = Join-Path $repoRoot "frontend"
$backendPort = 8001

function Write-Step {
    param([string]$Message)
    Write-Host "[LAIO] $Message" -ForegroundColor Cyan
}

function Ensure-FileExists {
    param(
        [string]$Path,
        [string]$TemplatePath,
        [string]$Label
    )

    if (-not (Test-Path -LiteralPath $Path) -and (Test-Path -LiteralPath $TemplatePath)) {
        Copy-Item -LiteralPath $TemplatePath -Destination $Path
        Write-Step "Da tao $Label tu file mau."
    }
}

function Assert-ConfiguredValue {
    param(
        [string]$Path,
        [string]$Key
    )

    $line = Get-Content -LiteralPath $Path | Where-Object {
        $_ -match "^$([regex]::Escape($Key))="
    } | Select-Object -First 1
    $value = if ($line) { ($line -split "=", 2)[1].Trim() } else { "" }
    if (-not $value -or $value -match "your-project|your-anon-key|your-vbee") {
        throw "Gia tri $Key trong $Path chua duoc cau hinh."
    }
}

function Get-ListeningProcess {
    param([int]$Port)

    return Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
        Select-Object -First 1
}

function Get-LaioHealth {
    try {
        return Invoke-RestMethod -Uri "http://127.0.0.1:$backendPort/health" -TimeoutSec 2
    }
    catch {
        return $null
    }
}

function Resolve-PythonExe {
    $candidates = @(
        (Join-Path $backendPath "venv\Scripts\python.exe"),
        (Join-Path $backendPath ".venv\Scripts\python.exe")
    )

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return $candidate
        }
    }

    return $null
}

Ensure-FileExists -Path (Join-Path $backendPath ".env") -TemplatePath (Join-Path $backendPath ".env.example") -Label "backend/.env"
Ensure-FileExists -Path (Join-Path $frontendPath ".env.local") -TemplatePath (Join-Path $frontendPath ".env.example") -Label "frontend/.env.local"

$backendEnv = Join-Path $backendPath ".env"
$frontendEnv = Join-Path $frontendPath ".env.local"
foreach ($key in @("DATABASE_URL", "SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY")) {
    Assert-ConfiguredValue -Path $backendEnv -Key $key
}
foreach ($key in @("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "BACKEND_INTERNAL_URL")) {
    Assert-ConfiguredValue -Path $frontendEnv -Key $key
}

$pythonExe = Resolve-PythonExe
if (-not $pythonExe) {
    throw "Khong tim thay backend\\venv\\Scripts\\python.exe hoac backend\\.venv\\Scripts\\python.exe"
}

if (-not (Test-Path -LiteralPath (Join-Path $frontendPath "node_modules"))) {
    throw "Khong tim thay frontend\\node_modules. Hay chay 'npm ci' trong frontend truoc."
}

Write-Step "Dang kiem tra ket noi database..."
Push-Location $backendPath
try {
    & $pythonExe -c "from app.core.database import engine; connection = engine.connect(); connection.exec_driver_sql('SELECT 1'); connection.close()"
    if ($LASTEXITCODE -ne 0) {
        throw "Khong ket noi duoc database bang backend/.env."
    }
}
finally {
    Pop-Location
}

$existingBackend = Get-ListeningProcess -Port $backendPort
$backendAlreadyRunning = $false
if ($existingBackend) {
    $health = Get-LaioHealth
    if (-not $health -or $health.app -ne "LAIO API") {
        throw "Port $backendPort dang bi process $($existingBackend.OwningProcess) chiem va khong phai LAIO API. Hay tat process do hoac doi dong bo BACKEND_INTERNAL_URL/port."
    }
    $backendAlreadyRunning = $true
    Write-Step "LAIO backend da chay tai port $backendPort."
}

if (-not $backendAlreadyRunning) {
    Write-Step "Dang mo backend tai cua so rieng..."
    Start-Process powershell.exe -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$backendPath'; & '$pythonExe' -m uvicorn app.main:app --reload --port $backendPort"
    ) -WindowStyle Normal
}

$existingFrontend = Get-ListeningProcess -Port 3000
if ($existingFrontend) {
    Write-Step "Port 3000 da co frontend dang chay; khong mo them process."
}
else {
    Write-Step "Dang mo frontend tai cua so rieng..."
    Start-Process powershell.exe -ArgumentList @(
        "-NoExit",
        "-Command",
        "Set-Location '$frontendPath'; npm run dev"
    ) -WindowStyle Normal
}

Write-Step "Da bat local server."
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend:  http://127.0.0.1:$backendPort" -ForegroundColor Green
