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

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Python nao encontrado no sistema!
    echo Por favor, instale o Python 3.10 ou superior em: https://www.python.org/
    echo Certifique-se de marcar a opcao "Add Python to PATH" durante a instalacao.
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"

if not exist "data\fundiario_brasil.db" (
    echo [AVISO] Banco fundiario local (data\fundiario_brasil.db) nao localizado.
    echo As consultas cadastrais aos imoveis estarao desabilitadas ate a ingestao dos dados.
    echo Para ingerir os dados, execute: python scripts/ingest_data.py --uf PR
    echo.
)

echo [2/3] Verificando e iniciando servidor local (127.0.0.1:3000)...
echo.

:: Verifica se o servidor ja esta em execucao na porta 3000
netstat -ano | findstr 127.0.0.1:3000 | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [INFO] O servidor ja esta em execucao em http://127.0.0.1:3000.
    echo Abrindo navegador...
    start http://127.0.0.1:3000
    echo.
    echo [3/3] Aplicacao pronta! Para manter o sistema ativo, nao feche a janela principal do servidor.
    pause
    exit /b 0
)

:: Abre o navegador padrao apos 3 segundos
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://127.0.0.1:3000"

:: Inicia o servidor Next.js exclusivamente em 127.0.0.1
npm run start
if %errorlevel% neq 0 (
    echo.
    echo [AVISO] O servidor de producao requer build previo. Iniciando modo de desenvolvimento...
    npm run dev
)

pause
