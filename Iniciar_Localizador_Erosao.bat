@echo off
chcp 65001 > nul

:: Modo auxiliar: aguarda o servidor responder e abre o navegador no momento certo.
:: Executado como processo separado pelo bloco [2/3] mais abaixo.
if /i "%~1"=="--aguardar-navegador" goto :aguardar_navegador

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

:: Os parenteses literais dentro de blocos if precisam de ^ ; sem o escape o ")"
:: fecha o bloco antes da hora e o script aborta com erro de sintaxe no [1/3].
if not exist "data\fundiario_brasil.db" (
    echo [AVISO] Banco fundiario local ^(data\fundiario_brasil.db^) nao localizado.
    echo As consultas cadastrais aos imoveis estarao desabilitadas ate a ingestao dos dados.
    echo Para ingerir os dados, execute: python scripts/ingest_data.py --uf PR
    echo.
)

echo [2/3] Verificando e iniciando servidor local (127.0.0.1:3000)...
echo.

:: Verifica se o servidor ja esta em execucao na porta 3000
netstat -ano | findstr /c:"127.0.0.1:3000" | findstr /c:"LISTENING" >nul
if %errorlevel% equ 0 (
    echo [INFO] O servidor ja esta em execucao em http://127.0.0.1:3000.
    echo Abrindo navegador...
    start "" http://127.0.0.1:3000
    echo.
    echo [3/3] Aplicacao pronta! Para manter o sistema ativo, nao feche esta janela.
    pause
    exit /b 0
)

:: Verifica a atualidade do build de producao antes de iniciar o servidor
call npm run check:build
if errorlevel 1 (
    echo.
    echo [AVISO] O build de producao esta defasado ou ausente.
    echo Executando build de producao antes de iniciar o servidor...
    echo.
    call npm run build
    if errorlevel 1 (
        echo.
        echo [ERRO] Falha na compilacao do build de producao.
        echo Tentando iniciar em modo de desenvolvimento...
        echo.
        start "Aguardando servidor" /min cmd /c call "%~f0" --aguardar-navegador
        call npm run dev
        echo.
        echo [3/3] O servidor foi encerrado.
        pause
        exit /b 0
    )
    echo.
)

:: Abre o navegador assim que o servidor responder de fato (sem espera fixa).
start "Aguardando servidor" /min cmd /c call "%~f0" --aguardar-navegador

:: Inicia o servidor Next.js exclusivamente em 127.0.0.1 (host definido em package.json).
:: O "call" e obrigatorio: sem ele o cmd transfere o controle para o npm.cmd e nunca
:: retorna, tornando o fallback e o pause abaixo codigo morto (a janela fecharia sozinha).
call npm run start
if errorlevel 1 (
    echo.
    echo [AVISO] O servidor de producao falhou ^(build ausente ou desatualizado^).
    echo Iniciando modo de desenvolvimento...
    echo.
    call npm run dev
)

echo.
echo [3/3] O servidor foi encerrado.
pause
exit /b 0

:: ---------------------------------------------------------------------------
:: Sub-rotina: aguarda o servidor aceitar conexoes e so entao abre o navegador.
:: Os binarios sao qualificados com %SystemRoot% porque instalacoes do Git para
:: Windows colocam versoes Unix de "timeout"/"curl" no PATH, com sintaxe distinta.
:: ---------------------------------------------------------------------------
:aguardar_navegador
set "CURL=%SystemRoot%\System32\curl.exe"
set "ESPERA_1S=%SystemRoot%\System32\ping.exe -n 2 127.0.0.1"
set /a TENTATIVAS=0

:loop_espera
if exist "%CURL%" (
    "%CURL%" -s -o nul --max-time 2 http://127.0.0.1:3000 >nul 2>nul
) else (
    netstat -ano | findstr /c:"127.0.0.1:3000" | findstr /c:"LISTENING" >nul
)
if not errorlevel 1 goto :navegador_pronto
set /a TENTATIVAS+=1
if %TENTATIVAS% geq 90 goto :navegador_timeout
%ESPERA_1S% >nul 2>nul
goto :loop_espera

:navegador_pronto
start "" http://127.0.0.1:3000
exit /b 0

:navegador_timeout
echo [AVISO] O servidor nao respondeu apos 90 segundos.
echo Verifique a janela principal e abra manualmente: http://127.0.0.1:3000
pause
exit /b 1
