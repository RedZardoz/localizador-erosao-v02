$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Localizador de Erosao & Propriedade.lnk"
$TargetFile = (Get-Item ".\Iniciar_Localizador_Erosao.bat").FullName
$WorkingDirectory = (Get-Item ".").FullName
$IconPath = (Join-Path $WorkingDirectory "assets\icon.ico")

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $TargetFile
$Shortcut.WorkingDirectory = $WorkingDirectory
$Shortcut.Description = "Localizador de Erosao & Propriedade - Mestrado PPGTCA 2026"
if (Test-Path $IconPath) {
    $Shortcut.IconLocation = "$IconPath,0"
} else {
    $Shortcut.IconLocation = "$env:SystemRoot\System32\SHELL32.dll,13"
}
$Shortcut.Save()

Write-Host "Atalho criado com sucesso na Area de Trabalho: $ShortcutPath"
