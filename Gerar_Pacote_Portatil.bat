@echo off
chcp 65001 > nul
title Gerador de Pacote Portatil Autonomo - SAREL v2.0

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\gerar_pacote_portatil.ps1"

echo.
pause
