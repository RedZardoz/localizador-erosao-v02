@echo off
chcp 65001 > nul
title Instalador do SAREL - Windows

echo ===============================================================================
echo    INSTALADOR - SAREL - Sistema de Amostragem e Rotulagem para Erosão Laminar
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
