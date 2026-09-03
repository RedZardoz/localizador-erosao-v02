@echo off
chcp 65001 > nul
title Localizador de Erosao ^& Propriedade - Mestrado PPGTCA 2026

echo ===============================================================================
echo     LOCALIZADOR DE EROSAO ^& PROPRIEDADE (BRASIL) - MESTRADO PPGTCA 2026
echo ===============================================================================
echo.
echo [1/3] Verificando ambiente e dependencias...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado no sistema!
    echo Por favor, instale o Node.js v18 ou superior em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"

echo [2/3] Iniciando servidor local do Localizador de Erosao...
echo O sistema estara disponivel em: http://localhost:3000
echo.

:: Abre o navegador padrao apos 3 segundos
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: Inicia o servidor Next.js
npm run start
if %errorlevel% neq 0 (
    echo.
    echo [AVISO] O servidor de producao requer build previo. Iniciando modo de desenvolvimento...
    npm run dev
)

pause
