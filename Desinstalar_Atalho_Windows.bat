@echo off
chcp 65001 > nul
title Desinstalador de Atalhos - SAREL

echo ===============================================================================
echo     DESINSTALADOR DE ATALHOS - SAREL
echo ===============================================================================
echo.

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\uninstall_shortcut.ps1"

echo.
pause
