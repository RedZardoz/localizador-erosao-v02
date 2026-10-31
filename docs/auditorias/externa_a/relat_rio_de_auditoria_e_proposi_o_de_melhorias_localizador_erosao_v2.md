# Relatório de Auditoria Técnica e Proposição de Melhorias: `localizador-erosao-v2`

**Data:** 19 de outubro de 2026  
**Escopo:** Estrutura de diretórios, governança de versionamento (`.gitignore`) e operacionalidade do pipeline de detecção/predição de erosão laminar.

---

## 1. Diagnóstico Inicial e Análise de Riscos

Projetos que combinam geoprocessamento (GIS), sensoriamento remoto e bancos de dados locais frequentemente enfrentam gargalos críticos de versionamento e reprodutibilidade. Na avaliação do escopo do `localizador-erosao-v2`, os principais pontos de atenção identificados são:

1. **Vazamento de Artefatos Pesados no Git:** Bancos de dados locais (`.sqlite`, `.db`, `.gpkg`) e matrizes raster (`.tif`, `.tiff`) podem facilmente ultrapassar o limite de 100 MB por arquivo do GitHub, corrompendo o histórico da árvore Git.
2. **Arquivos Temporários de Bancos de Dados:** O SQLite gera arquivos de *Write-Ahead Logging* (`-wal`) e *Shared Memory* (`-shm`) durante transações ativas. Se versionados, causam conflitos severos de *merge* e corrupção de banco.
3. **Acoplamento de Caminhos (*Hardcoded Paths*):** Scripts de análise de solo e topografia frequentemente referenciam caminhos absolutos locais, quebrando a operacionalidade quando o repositório é clonado em outra máquina ou container.
4. **Credenciais de APIs de Sensoriamento Remoto:** Chaves do Google Earth Engine (GEE), Sentinel Hub ou credenciais AWS/GCP correm risco de exposição caso arquivos `.env` ou `.json` de *service accounts* não estejam estritamente bloqueados.

---

## 2. Auditoria e Proposta de `.gitignore` Definitivo

Abaixo está a especificação recomendada para o arquivo `.gitignore` na raiz do `localizador-erosao-v2`. Ele foi desenhado especificamente para blindar projetos em Python voltados a Geoprocessamento e Ciência de Dados.

```gitignore
# ==========================================
# 1. BANCOS DE DADOS E ARMAZENAMENTO LOCAL
# ==========================================
*.sqlite
*.sqlite3
*.db
*.db-journal
*.db-wal
*.db-shm
*.gpkg
*.spatialite

# ==========================================
# 2. DADOS GEOESPACIAIS E RASTERS PESADOS
# ==========================================
# Rasters e Imagens de Satélite
*.tif
*.tiff
*.geotiff
*.img
*.ecw
*.jp2
*.nc
*.hdf

# Vetores e Shapefiles (versionar apenas amostras leves se necessário)
*.shp
*.shx
*.dbf
*.prj
*.cpg
*.qix
*.kml
*.kmz
*.geojson

# Projetos de Desktop GIS
*.qgs
*.qgz
*.aprx

# ==========================================
# 3. DIRETÓRIOS DE DADOS E MODELOS
# ==========================================
data/raw/*
data/interim/*
data/processed/*
models/*.pkl
models/*.joblib
models/*.h5
models/*.pt
models/*.onnx
output/*
logs/*

# Exceções para manter a estrutura de pastas no Git
!data/raw/.gitkeep
!data/interim/.gitkeep
!data/processed/.gitkeep
!models/.gitkeep
!output/.gitkeep
!logs/.gitkeep

# ==========================================
# 4. AMBIENTE PYTHON E CACHE
# ==========================================
__pycache__/
*.py[cod]
*$py.class
.Python
venv/
.venv/
env/
ENV/
.ipynb_checkpoints/
.pytest_cache/
.mypy_cache/
.ruff_cache/
build/
dist/
*.egg-info/

# ==========================================
# 5. VARIÁVEIS DE AMBIENTE E CREDENCIAIS
# ==========================================
.env
.env.*
!.env.example
*credentials*.json
*secret*.json
gee-private-key.json

# ==========================================
# 6. SISTEMA OPERACIONAL E IDEs
# ==========================================
.DS_Store
Thumbs.db
.vscode/
.idea/
*.swp
```

> **Nota de Auditoria:** Caso algum arquivo `.sqlite` ou `.tif` já tenha sido rastreado em commits anteriores, a simples adição ao `.gitignore` não o removerá do repositório. Será necessário executar:
> `git rm --cached caminho/do/arquivo.sqlite` seguido de um novo commit.

---

## 3. Proposição de Arquitetura de Diretórios

Para garantir que o `localizador-erosao-v2` seja modular, escalável e fácil de manter (separando ingestão de dados, cálculo de fatores topográficos/USLE e inferência), propõe-se a seguinte estrutura de diretórios:

```text
localizador-erosao-v2/
├── .github/
│   └── workflows/
│       └── ci.yml               # Testes automatizados e linting (Ruff/Flake8)
├── config/
│   └── settings.yaml            # Parâmetros de resolução, CRS (ex: EPSG:31983) e limiares
├── data/                        # Ignorado no Git (exceto arquivos .gitkeep)
│   ├── raw/                     # MDE (Modelo Digital de Elevação), imagens brutas, shapefiles
│   ├── interim/                 # Rasters recortados, cálculo de declividade/fluxo acumulado
│   └── processed/               # Feições extraídas, tabelas prontas e banco SQLite local
├── docs/                        # Documentação metodológica e dicionário de dados
├── models/                      # Pesos de modelos treinados (.joblib, .pt) - Ignorado no Git
├── notebooks/                   # Jupyter Notebooks apenas para exploração e prototipagem
├── scripts/
│   ├── init_db.py               # Script DDL para criar as tabelas do SQLite do zero
│   └── download_samples.py      # Script para baixar dados de teste de um bucket externo
├── src/                         # Código-fonte principal (pacote instalável)
│   ├── __init__.py
│   ├── database/
│   │   ├── connection.py        # Gerenciamento de sessão SQLite / SpatiaLite
│   │   └── schemas.py           # Definição de tabelas e validação (Pydantic/SQLAlchemy)
│   ├── ingestion/
│   │   └── loader.py            # Leitura de GeoTIFFs, validação de projeção cartográfica
│   ├── processing/
│   │   ├── terrain.py           # Cálculo de Fator LS, NDVI, índice de umidade topográfica
│   │   └── erosion_detector.py  # Lógica central de detecção/classificação de erosão laminar
│   └── utils/
│       └── logger.py            # Configuração de logs de execução
├── tests/                       # Testes unitários com dados sintéticos leves
│   ├── test_terrain.py
│   └── test_database.py
├── .env.example                 # Template de variáveis de ambiente sem dados sensíveis
├── .gitignore                   # Arquivo de bloqueio auditado
├── pyproject.toml               # Gerenciamento de dependências e metadados do projeto
└── README.md                    # Guia rápido de instalação e execução
```

---

## 4. Avaliação de Operacionalidade e Plano de Melhorias

Para elevar a maturidade operacional do projeto e permitir que qualquer desenvolvedor ou agente automatizado execute o pipeline sem atritos, recomendamos quatro ações estruturais:

### 4.1. Inicialização Automatizada do Banco de Dados (`init_db.py`)
Como o arquivo `.sqlite` não sobe para o GitHub, um novo clone do repositório não terá o banco de dados. 
* **Melhoria:** Criar o script `scripts/init_db.py` contendo as instruções SQL (`CREATE TABLE IF NOT EXISTS...`) ou migrações via *Alembic*. Ao rodar o projeto pela primeira vez, o sistema verifica se o arquivo `.sqlite` existe em `data/processed/`; caso não exista, instancia o banco vazio automaticamente com todo o schema configurado.

### 4.2. Padronização de Sistema de Referência de Coordenadas (CRS)
Erros silenciosos em modelagem de erosão laminar frequentemente ocorrem quando rasters em coordenadas geográficas (graus, ex: `EPSG:4326`) são misturados com cálculos métricos de área e declividade (ex: UTM `EPSG:31982` ou `EPSG:31983`).
* **Melhoria:** Implementar um validador no módulo `src/ingestion/loader.py` utilizando a biblioteca `rasterio` ou `geopandas` que force a reprojeção automática para o CRS métrico definido no `config/settings.yaml` antes de qualquer cálculo de declividade ou perda de solo.

### 4.3. Desacoplamento de Caminhos com `pathlib`
Evitar concatenação de strings para diretórios (ex: `"data/raw/" + nome_arquivo`), que gera incompatibilidades entre ambientes Windows (`\`) e Linux (`/`).
* **Melhoria:** Utilizar `pathlib.Path` de forma centralizada para resolver a raiz do projeto dinamicamente:
  ```python
  from pathlib import Path
  BASE_DIR = Path(__file__).resolve().parent.parent
  DB_PATH = BASE_DIR / "data" / "processed" / "erosao.sqlite"
  ```

### 4.4. Testes Unitários com Matrizes Sintéticas
Testar algoritmos geoespaciais não deve depender de arquivos GeoTIFF reais de 500 MB.
* **Melhoria:** No diretório `tests/`, utilizar `numpy` para gerar pequenas matrizes em memória (ex: um array $10 \times 10$ simulando elevação e bandas espectrais) para validar se o cálculo de declividade, NDVI e gravação no SQLite (usando `sqlite:///:memory:`) estão funcionando perfeitamente em segundos.

---

## 5. Checklist de Execução Imediata

- [ ] Substituir o `.gitignore` atual pela versão auditada acima.
- [ ] Executar `git status` e `git ls-files` para verificar se algum arquivo `.sqlite`, `.tif` ou `.env` já está sendo rastreado indevidamente no repositório remoto.
- [ ] Criar o arquivo `.env.example` documentando as variáveis necessárias (ex: `DB_NAME`, `DEFAULT_EPSG`).
- [ ] Extrair o schema atual do banco SQLite (`sqlite3 banco.db .schema > scripts/schema.sql`) e versionar apenas o arquivo `.sql` leve.