@echo off
title Diagnostico de Plantilla Base DEM
echo [*] Iniciando diagnostico del entorno de desarrollo (Bypass activo)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0test_install.ps1"
echo.
echo Presione cualquier tecla para salir...
pause > nul
