$desktopPath = [System.Environment]::GetFolderPath('Desktop')
$startMenuPath = [System.Environment]::GetFolderPath('StartMenu') + '\Programs'

$names = @("Localizador de Erosao & Propriedade.lnk", "Localizador de Erosao Laminar.lnk", "Localizador de Erosao Parana 3D.lnk")

foreach ($name in $names) {
    $d = Join-Path $desktopPath $name
    $s = Join-Path $startMenuPath $name
    if (Test-Path $d) {
        Remove-Item $d -Force
        Write-Host "Atalho da Area de Trabalho removido: $name" -ForegroundColor Yellow
    }
    if (Test-Path $s) {
        Remove-Item $s -Force
        Write-Host "Atalho do Menu Iniciar removido: $name" -ForegroundColor Yellow
    }
}

Write-Host "[SUCESSO] Atalhos removidos com sucesso." -ForegroundColor Green
