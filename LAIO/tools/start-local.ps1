$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot "backend"
$frontendPath = Join-Path $repoRoot "frontend"

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

$pythonExe = Resolve-PythonExe
if (-not $pythonExe) {
    throw "Khong tim thay backend\\venv\\Scripts\\python.exe hoac backend\\.venv\\Scripts\\python.exe"
}

if (-not (Test-Path -LiteralPath (Join-Path $frontendPath "node_modules"))) {
    throw "Khong tim thay frontend\\node_modules. Hay chay 'npm ci' trong frontend truoc."
}

Write-Step "Dang mo backend tai cua so rieng..."
Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$backendPath'; & '$pythonExe' -m uvicorn app.main:app --reload"
) -WindowStyle Normal

Write-Step "Dang mo frontend tai cua so rieng..."
Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$frontendPath'; npm run dev"
) -WindowStyle Normal

Write-Step "Da bat local server."
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend:  http://127.0.0.1:8000" -ForegroundColor Green
