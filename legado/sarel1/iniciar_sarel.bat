@echo off
cd /d "%~dp0"
title SAREL - Sistema de Amostragem e Rotulagem
echo ======================================================================
echo   SAREL - Sistema de Amostragem e Rotulagem para Erosao Laminar
echo   Mestrado PPGTCA 2026
echo ======================================================================
echo.
echo [1/2] Abrindo o navegador em http://localhost:3000...
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"
echo.
echo [2/2] Iniciando servidor Next.js em modo de desenvolvimento...
echo.
call npm run dev
echo.
echo Servidor finalizado.
pause