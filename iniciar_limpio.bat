@echo off
title Iniciar Plantilla Base DEM (Instalacion Limpia)
echo [*] Iniciando instalacion limpia de la aplicacion (Bypass activo)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_app.ps1" -ForceInstall
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Hubo un error al ejecutar la instalacion limpia.
    pause
)
