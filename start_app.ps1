param (
    [string]$BackendIP = "localhost",
    [string]$BackendPort = "8000",
    [string]$FrontendHost = "localhost",
    [string]$FrontendPort = "4200",
    [switch]$ForceInstall = $false
)

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "       INICIALIZACION DE PLANTILLA BASE DEM (ODI)        " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = $PSScriptRoot
$backendDir = Join-Path $baseDir "backend"
$frontendDir = Join-Path $baseDir "frontend"
$venvDir = Join-Path $baseDir ".venv"
$frontendEnvPath = Join-Path $frontendDir ".env"
$backendEnvPath = Join-Path $backendDir ".env"

# ─── 1. VERIFICAR REQUISITOS DEL SISTEMA ─────────────────────────────────

# Verificar Python (Priorizando el lanzador 'py' en Windows)
$pythonCmd = "python"
$pythonOk = $false

try {
    $testPy = (& py --version 2>$null) | Out-String
    if ($testPy -match "Python") {
        $pythonCmd = "py"
        $pythonOk = $true
    }
} catch {}

if (-not $pythonOk) {
    try {
        $testPython = (& python --version 2>$null) | Out-String
        if ($testPython -match "Python") {
            $pythonCmd = "python"
            $pythonOk = $true
        }
    } catch {}
}

if (-not $pythonOk) {
    Write-Host "[ERROR] Python no esta instalado o no esta en el PATH del sistema." -ForegroundColor Red
    Write-Host "Por favor, instale Python 3.10+ para poder continuar." -ForegroundColor Yellow
    Exit
}

# Verificar Node / NPM
try {
    $null = npm --version 2>&1
} catch {
    Write-Host "[ERROR] Node.js / NPM no esta instalado o no esta en el PATH." -ForegroundColor Red
    Write-Host "Por favor, instale Node.js 18+ para poder continuar." -ForegroundColor Yellow
    Exit
}

# ─── 2. CONFIGURAR ARCHIVOS DE ENTORNO (.env) ───────────────────────────

# Generar .env del Backend si no existe
if (-not (Test-Path $backendEnvPath)) {
    Write-Host "[*] Creando archivo backend/.env desde plantilla de ejemplo..." -ForegroundColor Yellow
    Copy-Item (Join-Path $backendDir ".env.example") $backendEnvPath
}

# Comprobar si la contraseña sigue siendo la por defecto y preguntar de forma interactiva
$envContent = Get-Content $backendEnvPath
$hasDefaultPass = $false
foreach ($line in $envContent) {
    if ($line -match "^DB_PASS\s*=\s*tu_contraseña_aqui") {
        $hasDefaultPass = $true
        break
    }
}

if ($hasDefaultPass) {
    Write-Host ""
    Write-Host "=========================================================" -ForegroundColor Cyan
    Write-Host "          ASISTENTE DE CONFIGURACION DE PostgreSQL       " -ForegroundColor Cyan
    Write-Host "=========================================================" -ForegroundColor Cyan
    Write-Host "Es necesario configurar la contrasena de PostgreSQL para la base de datos." -ForegroundColor Yellow
    $userPass = Read-Host "Introduzca su contrasena de PostgreSQL (o presione Enter si no tiene)"
    
    # Reemplazar la linea en el archivo .env
    $newContent = @()
    foreach ($line in $envContent) {
        if ($line -match "^DB_PASS\s*=\s*tu_contraseña_aqui") {
            $newContent += "DB_PASS=$userPass"
        } else {
            $newContent += $line
        }
    }
    $newContent | Out-File -FilePath $backendEnvPath -Encoding utf8
    Write-Host "[OK] Contrasena guardada exitosamente en backend/.env." -ForegroundColor Green
    Write-Host "=========================================================" -ForegroundColor Cyan
    Write-Host ""
}

# Generar .env del Frontend si no existe
if (-not (Test-Path $frontendEnvPath)) {
    Write-Host "[*] Creando archivo frontend/.env desde plantilla de ejemplo..." -ForegroundColor Yellow
    Copy-Item (Join-Path $frontendDir ".env.example") $frontendEnvPath
}

# === 3. CONFIGURAR ENTORNO VIRTUAL PYTHON Y DEPENDENCIAS (BACKEND) ===

if (-not (Test-Path $venvDir) -or $ForceInstall) {
    Write-Host "=> Creando entorno virtual de Python (.venv)..." -ForegroundColor Yellow
    if (Test-Path $venvDir) { Remove-Item -Recurse -Force $venvDir }
    & $pythonCmd -m venv $venvDir
}

$venvPython = Join-Path $venvDir "Scripts\python.exe"
Write-Host "=> Instalando dependencias de Python (requirements.txt)..." -ForegroundColor Yellow
& $venvPython -m pip install --upgrade pip -q
& $venvPython -m pip install -r (Join-Path $backendDir "requirements.txt") -q
Write-Host "[OK] Entorno de Python configurado." -ForegroundColor Green

# === 4. MIGRACIONES Y SIEMBRA DE BASE DE DATOS ===

Write-Host "=> Aplicando migraciones de base de datos PostgreSQL..." -ForegroundColor Yellow
Set-Location $backendDir

# Intentar crear la base de datos
& $venvPython scripts/create_db.py

# Si da error de contrasena (codigo de salida 2), preguntar nuevamente
if ($LASTEXITCODE -eq 2) {
    Write-Host ""
    Write-Host "=========================================================" -ForegroundColor Red
    Write-Host "     [ERROR] CONTRASEÑA DE POSTGRESQL INCORRECTA         " -ForegroundColor Red
    Write-Host "=========================================================" -ForegroundColor Red
    Write-Host "La conexion fallo. Por favor ingrese la contrasena correcta de su servidor." -ForegroundColor Yellow
    $userPass = Read-Host "Contrasena de PostgreSQL"
    
    # Actualizar la contraseña en el archivo .env
    $envContent = Get-Content $backendEnvPath
    $newContent = @()
    foreach ($line in $envContent) {
        if ($line -match "^DB_PASS\s*=\s*") {
            $newContent += "DB_PASS=$userPass"
        } else {
            $newContent += $line
        }
    }
    $newContent | Out-File -FilePath $backendEnvPath -Encoding utf8
    Write-Host "[OK] Contrasena actualizada en backend/.env. Reintentando conexion..." -ForegroundColor Green
    Write-Host "=========================================================" -ForegroundColor Red
    Write-Host ""
    
    # Volver a intentar la creacion
    & $venvPython scripts/create_db.py
}

& $venvPython scripts/run_migrations.py
& $venvPython setup_production.py
Set-Location $baseDir
Write-Host "[OK] Base de datos configurada e inicializada." -ForegroundColor Green

# === 5. INSTALAR DEPENDENCIAS DE ANGULAR (FRONTEND) ===

$nodeModulesDir = Join-Path $frontendDir "node_modules"
if (-not (Test-Path $nodeModulesDir) -or $ForceInstall) {
    Write-Host "=> Instalando dependencias de Angular (node_modules)..." -ForegroundColor Yellow
    Set-Location $frontendDir
    npm install
    Set-Location $baseDir
    Write-Host "[OK] Dependencias de Frontend instaladas." -ForegroundColor Green
} else {
    Write-Host "[OK] Carpeta node_modules existente. Saltando instalacion de paquetes." -ForegroundColor Green
}

# === 6. ENLAZAR APIS DINAMICAMENTE EN ANGULAR ===

Write-Host "=> Configurando URLs de conexion dinamicas en Angular..." -ForegroundColor Yellow
Set-Location $frontendDir
$angularDevUrl = "http://$BackendIP`:$BackendPort/api"
node scripts/set-env.js --mode development --dev-url $angularDevUrl
Set-Location $baseDir

# === 7. LEVANTAR SERVIDORES EN CONSOLAS INDEPENDIENTES ===

# Comando de ejecucion del servidor Backend (Usa ruta relativa al venv y no requiere cd)
$cmdBackend = "Write-Host 'Iniciando Backend Django...' -ForegroundColor Cyan; & '..\.venv\Scripts\python.exe' manage.py runserver $BackendIP`:$BackendPort"

# Comando de ejecucion del servidor Frontend (Usa no-path y no requiere cd)
$cmdFrontend = "Write-Host 'Iniciando Frontend Angular...' -ForegroundColor Cyan; npm run start -- --host $FrontendHost --port $FrontendPort"

Write-Host "=> Iniciando Servidor Backend ($BackendIP`:$BackendPort)..." -ForegroundColor Magenta
Start-Process powershell -WorkingDirectory $backendDir -ArgumentList "-NoExit -Command `"$cmdBackend`""

Write-Host "=> Iniciando Servidor Frontend ($FrontendHost`:$FrontendPort)..." -ForegroundColor Magenta
Start-Process powershell -WorkingDirectory $frontendDir -ArgumentList "-NoExit -Command `"$cmdFrontend`""

Write-Host ""
Write-Host "TODO LISTO! Las terminales se abrieron en ventanas separadas." -ForegroundColor Green
Write-Host "Tip: Si desea forzar una reinstalacion limpia total, ejecute: .\start_app.ps1 -ForceInstall" -ForegroundColor Yellow
