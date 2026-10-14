@echo off
chcp 65001 > nul
title Gerador de ZIP do Banco para Google Drive - SAREL

cd /d "%~dp0"
python scripts\gerar_zip_banco_gdrive.py

echo.
pause
