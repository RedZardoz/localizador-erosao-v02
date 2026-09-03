@echo off
chcp 65001 > nul
title Instalador do Localizador de Erosao ^& Propriedade - Windows

echo ===============================================================================
echo     INSTALADOR - LOCALIZADOR DE EROSAO ^& PROPRIEDADE (MESTRADO PPGTCA 2026)
echo ===============================================================================
echo.

cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\install_shortcut.ps1"

echo.
echo ===============================================================================
echo Voce ja pode iniciar o aplicativo dando duplo clique no icone na Area de Trabalho!
echo ===============================================================================
echo.
pause
