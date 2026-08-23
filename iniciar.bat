@echo off
title Iniciar Plantilla Base DEM
echo [*] Iniciando la aplicacion (Bypass de directiva PowerShell activo)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_app.ps1"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Hubo un error al ejecutar el script de inicio.
    pause
)
