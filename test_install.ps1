# =========================================================================
# SCRIPT DE DIAGNOSTICO Y DIAGNOSIS DE INSTALACION — BOILERPLATE DEM
# =========================================================================
# Ejecutar en PowerShell: .\test_install.ps1
# =========================================================================

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "     DIAGNOSTICO DE INSTALACION DE PLANTILLA BASE DEM    " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = $PSScriptRoot
$backendDir = Join-Path $baseDir "backend"
$frontendDir = Join-Path $baseDir "frontend"
$venvDir = Join-Path $baseDir ".venv"
$databaseSql = Join-Path $baseDir "database.sql"

$allPassed = $true

function Report-Check([string]$name, [bool]$passed, [string]$detail = "", [string]$fixHint = "") {
    if ($passed) {
        Write-Host "  [OK] " -NoNewline -ForegroundColor Green
        Write-Host "$name : $detail" -ForegroundColor Gray
    } else {
        Write-Host "  [FAIL] " -NoNewline -ForegroundColor Red
        Write-Host "$name : $detail" -ForegroundColor Red
        if ($fixHint) {
            Write-Host "         -> Sugerencia: $fixHint" -ForegroundColor Yellow
        }
        $script:allPassed = $false
    }
}

# ─── 1. VERIFICAR DEPENDENCIAS DE SISTEMA ────────────────────────────────

Write-Host "[*] Comprobando software base de sistema..." -ForegroundColor Magenta

# Comprobar Python
$pythonVersion = ""
try {
    $pythonVersion = python --version 2>&1
    Report-Check "Python instalado" $true $pythonVersion
} catch {
    try {
        $pythonVersion = py --version 2>&1
        Report-Check "Python instalado" $true "$pythonVersion (via py launcher)"
    } catch {
        Report-Check "Python instalado" $false "No se detecto Python en el PATH." "Instale Python 3.10+ y asegurese de marcar 'Add Python to PATH' en el instalador."
    }
}

# Comprobar Node.js y NPM
try {
    $nodeVer = node --version 2>&1
    $npmVer = npm --version 2>&1
    Report-Check "Node.js instalado" $true "Node $nodeVer | NPM $npmVer"
} catch {
    Report-Check "Node.js instalado" $false "No se detecto Node/NPM en el PATH." "Instale Node.js 18+ LTS desde https://nodejs.org"
}

# ─── 2. VERIFICAR CONEXION CON POSTGRESQL ──────────────────────────────

Write-Host ""
Write-Host "[*] Comprobando servidor PostgreSQL..." -ForegroundColor Magenta

$pgPort = 5432
$socket = New-Object System.Net.Sockets.TcpClient
$connect = $socket.BeginConnect("localhost", $pgPort, $null, $null)
Start-Sleep -Milliseconds 500

if ($connect.IsCompleted) {
    try {
        $socket.EndConnect($connect)
        Report-Check "Servidor PostgreSQL (Puerto $pgPort)" $true "Conexion TCP exitosa en localhost:$pgPort"
    } catch {
        Report-Check "Servidor PostgreSQL (Puerto $pgPort)" $false "Conexion rechazada en localhost:$pgPort" "Asegurese de que el servicio de PostgreSQL este iniciado localmente."
    }
} else {
    Report-Check "Servidor PostgreSQL (Puerto $pgPort)" $false "Tiempo de espera agotado al conectar a localhost:$pgPort" "Verifique si PostgreSQL esta ejecutandose en el puerto 5432."
}
$socket.Close()

# ─── 3. VERIFICAR ARCHIVOS Y DIRECTORIOS DEL PROYECTO ───────────────────

Write-Host ""
Write-Host "[*] Comprobando integridad del repositorio y carpetas..." -ForegroundColor Magenta

Report-Check "Archivo 'database.sql'" (Test-Path $databaseSql) "Ubicado en la raiz" "Descargue o restaure el archivo database.sql del repositorio."
Report-Check "Carpeta 'backend'" (Test-Path $backendDir) "Ubicado en la raiz" "La estructura del repositorio esta incompleta. Falta la carpeta backend/."
Report-Check "Carpeta 'frontend'" (Test-Path $frontendDir) "Ubicado en la raiz" "La estructura del repositorio esta incompleta. Falta la carpeta frontend/."

# ─── 4. COMPROBAR ENTORNOS Y ARCHIVOS DE CONFIGURACION ─────────────────

Write-Host ""
Write-Host "[*] Comprobando configuraciones de instalacion (.env / .venv)..." -ForegroundColor Magenta

# .env Backend
$backendEnv = Join-Path $backendDir ".env"
Report-Check "Configuracion Backend (backend/.env)" (Test-Path $backendEnv) "Archivo configurado" "El script start_app.ps1 lo creara automaticamente, o puede copiar backend/.env.example como backend/.env."

# .env Frontend
$frontendEnv = Join-Path $frontendDir ".env"
Report-Check "Configuracion Frontend (frontend/.env)" (Test-Path $frontendEnv) "Archivo configurado" "El script start_app.ps1 lo creara automaticamente, o puede copiar frontend/.env.example como frontend/.env."

# Entorno Virtual Python
Report-Check "Entorno Virtual Python (.venv)" (Test-Path $venvDir) "Creado y ubicado en la raiz" "Ejecute .\start_app.ps1 para inicializar el entorno virtual (.venv)."

# Dependencias Node.js
$nodeModulesDir = Join-Path $frontendDir "node_modules"
Report-Check "Modulos de Node (frontend/node_modules)" (Test-Path $nodeModulesDir) "Instalados" "Ejecute .\start_app.ps1 para instalar las dependencias de Angular."

# ─── 5. VERIFICAR LOGICA CON LA BASE DE DATOS (DJANGO DRY RUN) ──────────

if (Test-Path $venvDir) {
    Write-Host ""
    Write-Host "[*] Verificando comunicacion ORM y carga de usuarios semilla..." -ForegroundColor Magenta
    
    $venvPython = Join-Path $venvDir "Scripts\python.exe"
    
    # Comprobar Django Settings y Conectividad a Base de Datos
    Set-Location $backendDir
    $djangoCheck = & $venvPython manage.py check 2>&1
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Report-Check "Chequeo Django (manage.py check)" $true "Sintaxis y base de datos validadas por el ORM"
        
        # Verificar que existen los usuarios semilla creados
        $checkUsersScript = "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inventario_farmacia.settings'); django.setup(); from django.contrib.auth.models import User; print(User.objects.filter(username='12345678').exists())"
        $adminExists = (& $venvPython -c $checkUsersScript 2>$null) | Out-String
        
        if ($adminExists -match "True") {
            Report-Check "Base de datos sembrada" $true "Usuario semilla Administrador (12345678) detectado correctamente"
        } else {
            Report-Check "Base de datos sembrada" $false "El usuario Administrador inicial no existe en la BD." "Ejecute .\start_app.ps1 para inicializar la semilla."
        }
    } else {
        Report-Check "Chequeo Django (manage.py check)" $false "Error de configuracion de Django o conexion a base de datos rechazada" "Verifique que la base de datos configurada exista en Postgres, y que las credenciales en backend/.env sean correctas."
    }
    Set-Location $baseDir
}

# ─── RESUMEN DE DIAGNOSTICO ─────────────────────────────────────────────

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host " DIAGNOSTICO EXITOSO! Todo esta correctamente configurado." -ForegroundColor Green
    Write-Host " Puede ejecutar '.\start_app.ps1' para iniciar la aplicacion." -ForegroundColor Green
} else {
    Write-Host " DIAGNOSTICO INCOMPLETO. Se encontraron algunos fallos." -ForegroundColor Red
    Write-Host " Revise los puntos senalados arriba con [FAIL] para solucionarlos." -ForegroundColor Yellow
}
Write-Host "=========================================================" -ForegroundColor Cyan
