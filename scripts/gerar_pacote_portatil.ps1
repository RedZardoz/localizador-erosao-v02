$ErrorActionPreference = "Stop"
$rootDir = (Get-Item -Path "$PSScriptRoot\..").FullName
$distDir = Join-Path $rootDir "dist\SAREL_Instalador_Portatil"

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "   GERADOR DE PACOTE PORTATIL AUTONOMO - SAREL v2.0 (Sem necessidade de GitHub)" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Recompila o Instalador_SAREL.exe com o payload completo embutido
Write-Host "[1/5] Compilando executavel unico Instalador_SAREL.exe (com sistema embutido)..." -ForegroundColor Yellow
python "$rootDir\scripts\build_single_exe.py" | Out-Null
Write-Host "      -> Instalador_SAREL.exe (2.0 MB) atualizado com sucesso." -ForegroundColor Green

# 2. Prepara pasta de destino
Write-Host "[2/5] Preparando estrutura em dist\SAREL_Instalador_Portatil..." -ForegroundColor Yellow
if (Test-Path $distDir) {
    Remove-Item -Path $distDir -Recurse -Force
}
New-Item -ItemType Directory -Path $distDir -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $distDir "data") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $distDir "runtime\node") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $distDir "runtime\python") -Force | Out-Null

# 3. Copia arquivos da aplicacao (sem os bancos pesados de 1.6 GB que virao pelo Google Drive)
Write-Host "[3/5] Copiando aplicacao, scripts e instalador..." -ForegroundColor Yellow
$itensParaCopiar = @(
    "Instalador_SAREL.exe",
    "config_instalador.json",
    "Iniciar_Localizador_Erosao.bat",
    "Instalar_Atalho_Windows.bat",
    "Desinstalar_Atalho_Windows.bat",
    "package.json",
    "package-lock.json",
    "next.config.mjs",
    "postcss.config.mjs",
    "tailwind.config.ts",
    "tsconfig.json",
    "assets",
    "public",
    "src",
    "scripts",
    ".next",
    "node_modules"
)

foreach ($item in $itensParaCopiar) {
    $origem = Join-Path $rootDir $item
    if (Test-Path $origem) {
        $destino = Join-Path $distDir $item
        Copy-Item -Path $origem -Destination $destino -Recurse -Force
    }
}

# 4. Embute o Node.js portatil (node.exe + npm) da maquina atual
Write-Host "[4/5] Embutindo runtime Node.js portatil (runtime\node)..." -ForegroundColor Yellow
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
    $nodeFolder = Split-Path -Parent $nodeCmd.Source
    Copy-Item -Path (Join-Path $nodeFolder "node.exe") -Destination (Join-Path $distDir "runtime\node\node.exe") -Force
    if (Test-Path (Join-Path $nodeFolder "npm.cmd")) {
        Copy-Item -Path (Join-Path $nodeFolder "npm*") -Destination (Join-Path $distDir "runtime\node\") -Force
    }
    if (Test-Path (Join-Path $nodeFolder "node_modules\npm")) {
        New-Item -ItemType Directory -Path (Join-Path $distDir "runtime\node\node_modules") -Force | Out-Null
        Copy-Item -Path (Join-Path $nodeFolder "node_modules\npm") -Destination (Join-Path $distDir "runtime\node\node_modules\npm") -Recurse -Force
    }
    Write-Host "      -> Node.js portatil embutido com sucesso." -ForegroundColor Green
}

# 5. Embute o Python portatil (python.exe + bibliotecas) da maquina atual
Write-Host "[5/5] Embutindo runtime Python portatil (runtime\python)..." -ForegroundColor Yellow
$pyCmd = Get-Command python -ErrorAction SilentlyContinue
if ($pyCmd) {
    $pyFolder = Split-Path -Parent $pyCmd.Source
    robocopy "$pyFolder" (Join-Path $distDir "runtime\python") /E /XD "__pycache__" "test" "tests" "idlelib" "tkinter" "turtledemo" "Doc" /NFL /NDL /NJH /NJS | Out-Null
    Write-Host "      -> Python portatil embutido com sucesso." -ForegroundColor Green
}

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Green
Write-Host " [SUCESSO] Pacote Portatil gerado em: $distDir" -ForegroundColor Green
Write-Host " Basta compactar essa pasta em .ZIP (ou enviar via pendrive/Drive)." -ForegroundColor Green
Write-Host " O usuario final so precisa clicar em 'Instalador_SAREL.exe'!" -ForegroundColor Green
Write-Host "===============================================================================" -ForegroundColor Green
