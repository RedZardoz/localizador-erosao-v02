$ws = New-Object -ComObject WScript.Shell
$desktopPath = [System.Environment]::GetFolderPath('Desktop')
$startMenuPath = [System.Environment]::GetFolderPath('StartMenu') + '\Programs'
$appDir = (Get-Item -Path $PSScriptRoot\..).FullName
$target = Join-Path $appDir "Iniciar_Localizador_Erosao.bat"
$icon = Join-Path $appDir "assets\icon.ico"

Write-Host "Instalando atalho na Area de Trabalho..." -ForegroundColor Cyan
$sDesktop = $ws.CreateShortcut((Join-Path $desktopPath "Localizador de Erosao & Propriedade.lnk"))
$sDesktop.TargetPath = $target
$sDesktop.WorkingDirectory = $appDir
$sDesktop.Description = "SAREL - Sistema de Amostragem e Rotulagem para Erosão Laminar"
$sDesktop.IconLocation = "$icon,0"
$sDesktop.Save()

Write-Host "Instalando atalho no Menu Iniciar..." -ForegroundColor Cyan
$sStart = $ws.CreateShortcut((Join-Path $startMenuPath "Localizador de Erosao & Propriedade.lnk"))
$sStart.TargetPath = $target
$sStart.WorkingDirectory = $appDir
$sStart.Description = "SAREL - Sistema de Amostragem e Rotulagem para Erosão Laminar"
$sStart.IconLocation = "$icon,0"
$sStart.Save()

Write-Host "[SUCESSO] Atalhos criados com o icone oficial!" -ForegroundColor Green
