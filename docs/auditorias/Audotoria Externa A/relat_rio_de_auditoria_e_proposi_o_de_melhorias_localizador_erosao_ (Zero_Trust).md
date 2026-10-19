# Relatório de Auditoria Técnica e Arquitetura Científica: `localizador-erosao-v2`

**Data:** 19 de outubro de 2026  
**Papel desta Instância:** Auditoria de Arquitetura e Governança Científica (Nível 1)  
**Destinatário:** Equipe de Pesquisa e Instância Operacional de Codificação (Nível 2)  
**Escopo:** Estrutura de diretórios, governança de versionamento (`.gitignore`), operacionalidade geoespacial e **blindagem estrita contra contaminação por dados sintéticos** (Zero-Trust Data Pipeline).

---

## 1. Diagnóstico Inicial e Análise de Riscos Críticos

Projetos científicos que combinam geoprocessamento (GIS), sensoriamento remoto, aprendizado de máquina e bancos de dados locais enfrentam dois grupos de riscos severos: **falhas de engenharia de software** (versionamento indevido) e **falhas de validade científica** (contaminação amostral).

### 1.1. Riscos de Engenharia e Versionamento
1. **Vazamento de Artefatos Pesados no Git:** Bancos de dados locais (`.sqlite`, `.db`, `.gpkg`) e matrizes raster (`.tif`, `.tiff`) ultrapassam facilmente o limite do GitHub, corrompendo o histórico da árvore Git.
2. **Arquivos Temporários de Bancos de Dados:** O SQLite gera arquivos `-wal` (*Write-Ahead Logging*) e `-shm` (*Shared Memory*). Se versionados, causam conflitos de *merge* e corrupção de banco.
3. **Acoplamento de Caminhos (*Hardcoded Paths*):** Referências absolutas quebram a reprodutibilidade entre diferentes máquinas.
4. **Exposição de Credenciais:** Chaves do Google Earth Engine (GEE) ou credenciais cloud em arquivos `.env` ou `.json`.

### 1.2. Risco Fatal de Refutação Científica: Contaminação por Dados Sintéticos
Em uma banca examinadora ou revisão por pares (*peer-review*), a presença acidental de dados sintéticos (*mocks*, *seeds* de teste, *fallbacks* de código ou alucinações de agentes de IA) misturados aos dados empíricos invalida imediatamente todas as métricas do modelo ($R^2$, RMSE, F1-Score) sob acusação de *data leakage* ou fabricação de dados.
* **Vetores de Contaminação Identificados:**
  * Rotinas de *fallback* que geram dados simulados quando uma API ou leitura de arquivo falha.
  * Uso do mesmo arquivo `.sqlite` tanto para testes de interface/software quanto para o treinamento do modelo científico.
  * Scripts gerados por IA contendo chamadas como `np.random` ou `Faker` infiltradas nos módulos de produção.

---

## 2. Arquitetura de Diretórios com Quarentena e Segregação Física

Para garantir que dados sintéticos (caso usados em testes unitários de código) jamais cruzem a fronteira do pipeline científico, a estrutura do `localizador-erosao-v2` deve obedecer à seguinte segregação física:

```text
localizador-erosao-v2/
├── .github/
│   └── workflows/
│       └── ci_scientific_audit.yml  # CI com bloqueio de funções geradoras de dados sintéticos
├── config/
│   ├── settings.yaml                # Parâmetros de resolução, CRS (ex: EPSG:31982) e limiares
│   └── data_manifest.json           # REGISTRO IMUTÁVEL DE HASHES SHA-256 DOS DADOS REAIS
├── data/                            # EXCLUSIVO PARA DADOS REAIS AUDITADOS (Ignorado no Git)
│   ├── 01_raw_immutable/            # Rasters brutos (GEE, MapBiomas, ALOS) - Permissão Somente Leitura
│   ├── 02_interim/                  # Rasters recortados, cálculo de declividade/fluxo acumulado
│   ├── 03_processed/                # Feições extraídas auditadas
│   └── 04_scientific_db/            # Banco SQLite de Pesquisa (ex: erosao_real_prod.sqlite)
├── docs/                            # Documentação metodológica e laudos de linhagem de dados
├── models/                          # Pesos de modelos treinados (.joblib, .pt) - Ignorado no Git
├── notebooks/                       # Jupyter Notebooks apenas para exploração visual (Sem escrita no DB)
├── scripts/
│   ├── init_db.py                   # Script DDL com travas CHECK anti-sintéticos
│   ├── generate_manifest.py         # Gerador de hashes SHA-256 para novos dados reais
│   └── audit_db_purity.py           # Script de varredura e expurgo de registros sem linhagem
├── src/                             # Código-fonte principal
│   ├── __init__.py
│   ├── core_science/                # ZONA DE EXCLUSÃO DE SINTÉTICOS (Proibido np.random / mocks)
│   │   ├── provenance_guard.py      # Gatekeeper criptográfico (Validador SHA-256 pré-execução)
│   │   ├── database.py              # Conexão estrita com o banco científico
│   │   ├── terrain.py               # Cálculo de Fator LS, NDVI, índice de umidade topográfica
│   │   └── erosion_model.py         # Treinamento e inferência (XGBoost / Deep Learning)
│   ├── app/                         # Interface e camada de visualização
│   └── utils/
│       └── logger.py                # Logs de auditoria de execução
├── tests/                           # ÚNICO LOCAL ONDE MATRIZES DE TESTE SÃO PERMITIDAS
│   ├── conftest.py                  # Força uso exclusivo de SQLite em memória (sqlite:///:memory:)
│   ├── test_terrain.py
│   └── test_provenance_guard.py
├── .env.example                     # Template de variáveis de ambiente
├── .gitignore                       # Arquivo de bloqueio auditado
├── .pre-commit-config.yaml          # Hook que impede commits com palavras/funções de mock em src/
├── pyproject.toml                   # Dependências e metadados do projeto
└── README.md                        # Guia de execução e declaração de governança científica
```

---

## 3. Especificação da Blindagem Científica (Zero-Trust Data Pipeline)

As regras abaixo são **restrições arquiteturais e criptográficas** que devem ser codificadas pela instância operacional do Gemini.

### 3.1. Manifesto de Proveniência Criptográfica (`config/data_manifest.json`)
Nenhum arquivo bruto ou tabela entra no pipeline sem que sua assinatura SHA-256 e metadados de coleta estejam registrados e versionados no Git.

```json
{
  "version": "1.0.0",
  "strict_scientific_mode": true,
  "approved_datasets": {
    "sentinel2_mosaico_2025.tif": {
      "sha256": "INSERIR_HASH_SHA256_AQUI",
      "source": "Google Earth Engine - COPERNICUS/S2_SR_HARMONIZED",
      "scene_id": "20250815T132231_20250815T132229_T22JFQ",
      "extraction_date": "2026-08-15T14:32:00Z",
      "crs": "EPSG:31982"
    },
    "pontos_campo_rtk.csv": {
      "sha256": "INSERIR_HASH_SHA256_AQUI",
      "source": "Levantamento In Loco - GNSS RTK",
      "extraction_date": "2026-07-20T10:00:00Z",
      "crs": "EPSG:31982"
    }
  }
}
```

### 3.2. Trava Física no Banco de Dados SQLite (DDL Schema Constraints)
O script `scripts/init_db.py` deve criar as tabelas impondo restrições `CHECK` no nível do motor SQLite. O banco deve recusar fisicamente qualquer inserção que não possua origem catalogada ou que tente marcar um dado como sintético.

```sql
CREATE TABLE IF NOT EXISTS amostras_erosao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    declividade_graus REAL NOT NULL,
    fator_ls REAL NOT NULL,
    ndvi REAL NOT NULL,
    classe_erosao INTEGER NOT NULL,
    
    -- COLUNAS OBRIGATÓRIAS DE AUDITORIA E LINHAGEM CIENTÍFICA
    fonte_dados TEXT NOT NULL CHECK (
        fonte_dados IN ('GEE_SENTINEL2', 'MAPBIOMAS', 'ALOS_PALSAR', 'CAMPO_RTK', 'EMBRAPA_SOLOS')
    ),
    id_cena_ou_laudo TEXT NOT NULL CHECK (length(trim(id_cena_ou_laudo)) > 5),
    hash_arquivo_origem TEXT NOT NULL CHECK (length(hash_arquivo_origem) = 64),
    data_ingestao TEXT NOT NULL,
    is_synthetic INTEGER NOT NULL DEFAULT 0 CHECK (is_synthetic = 0)
);
```

### 3.3. Gatekeeper Criptográfico em Python (`src/core_science/provenance_guard.py`)
Módulo obrigatório que deve ser executado antes de qualquer rotina de extração de atributos ou treinamento de modelo. Se houver divergência de 1 byte nos arquivos ou ausência de colunas de auditoria, o sistema lança a exceção `ScientificIntegrityError` e aborta o processamento imediatamente.

```python
import hashlib
import json
from pathlib import Path
import pandas as pd

class ScientificIntegrityError(Exception):
    """Exceção crítica: Violação de integridade ou suspeita de contaminação de dados."""
    pass

def verify_file_provenance(file_path: Path, manifest_path: Path = Path("config/data_manifest.json")) -> str:
    """Valida o hash SHA-256 de um arquivo contra o manifesto científico antes da leitura."""
    if not manifest_path.exists():
        raise ScientificIntegrityError("Manifesto de dados não encontrado. Execução bloqueada.")
        
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    
    filename = file_path.name
    approved = manifest.get("approved_datasets", {})
    if filename not in approved:
        raise ScientificIntegrityError(
            f"BLOQUEIO CIENTÍFICO: Arquivo '{filename}' não consta no manifesto de proveniência."
        )
    
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(8192), b""):
            sha256_hash.update(byte_block)
    calculated_hash = sha256_hash.hexdigest()
    
    expected_hash = approved[filename]["sha256"]
    if calculated_hash != expected_hash:
        raise ScientificIntegrityError(
            f"VIOLAÇÃO DE HASH em '{filename}'. Esperado: {expected_hash} | Calculado: {calculated_hash}."
        )
    return calculated_hash

def validate_dataframe_purity(df: pd.DataFrame) -> bool:
    """Garante que um DataFrame carregado para modelagem contenha apenas registros reais auditados."""
    required_cols = {"fonte_dados", "id_cena_ou_laudo", "hash_arquivo_origem", "is_synthetic"}
    if not required_cols.issubset(df.columns):
        raise ScientificIntegrityError(f"DataFrame rejeitado. Faltam colunas de auditoria: {required_cols}")
    
    if (df["is_synthetic"] != 0).any():
        raise ScientificIntegrityError("CONTAMINAÇÃO DETECTADA: Flag is_synthetic diferente de zero.")
        
    forbidden_tokens = ["mock", "synthetic", "fake", "test", "dummy", "simulado", "sintetico", "fallback"]
    pattern = "|".join(forbidden_tokens)
    for col in ["fonte_dados", "id_cena_ou_laudo"]:
        if df[col].astype(str).str.lower().str.contains(pattern, na=True).any():
            raise ScientificIntegrityError(f"CONTAMINAÇÃO DETECTADA na coluna '{col}': Token proibido encontrado.")
            
    return True
```

### 3.4. Regra de Banimento Estático (Pre-Commit / Linter)
* **Proibição de Fallbacks Silenciosos:** Nenhum bloco `try...except` dentro de `src/` pode gerar números aleatórios ou matrizes zeradas caso a leitura de um GeoTIFF ou consulta SQLite falhe. Erros de leitura devem interromper a execução explicitamente (`raise`).
* **Isolamento de Testes:** Em `tests/`, o arquivo `conftest.py` deve garantir que qualquer teste de banco de dados utilize exclusivamente `sqlite3.connect(":memory:")`, impedindo a criação de arquivos `.sqlite` de teste no disco.

---

## 4. Auditoria e Proposta de `.gitignore` Definitivo

Especificação atualizada do `.gitignore` na raiz do `localizador-erosao-v2`, garantindo que os bancos de dados pesados fiquem fora do Git, mas **permitindo** que o `config/data_manifest.json` seja versionado para fins de auditoria pública da pesquisa.

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
*.tif
*.tiff
*.geotiff
*.img
*.ecw
*.jp2
*.nc
*.hdf
*.shp
*.shx
*.dbf
*.prj
*.cpg
*.qix
*.kml
*.kmz
*.geojson
*.qgs
*.qgz
*.aprx

# ==========================================
# 3. DIRETÓRIOS DE DADOS E MODELOS
# ==========================================
data/01_raw_immutable/*
data/02_interim/*
data/03_processed/*
data/04_scientific_db/*
models/*.pkl
models/*.joblib
models/*.h5
models/*.pt
models/*.onnx
output/*
logs/*

# Exceções para manter a estrutura de pastas e o manifesto no Git
!data/01_raw_immutable/.gitkeep
!data/02_interim/.gitkeep
!data/03_processed/.gitkeep
!data/04_scientific_db/.gitkeep
!models/.gitkeep
!output/.gitkeep
!logs/.gitkeep
!config/data_manifest.json

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

---

## 5. Diretrizes de Operacionalização (Ordens de Serviço para a Instância Nível 2)

Ao repassar este documento para a instância operacional do Gemini que fará a codificação e refatoração do repositório, instrua-a a executar estritamente o seguinte roteiro sequencial:

1. **Ordem de Serviço 01 (Varredura e Expurgo de Código):**
   * Vasculhar todo o diretório `src/` e scripts atuais em busca de chamadas a `random`, `np.random`, `Faker`, `make_classification`, dados *hardcoded* de exemplo ou blocos `except:` que retornem valores fictícios. Remover todas essas ocorrências imediatamente.
2. **Ordem de Serviço 02 (Auditoria do Banco SQLite Atual):**
   * Criar e rodar o script `scripts/audit_db_purity.py` para inspecionar o banco `.sqlite` existente. Identificar tabelas ou linhas que não possuam rastreabilidade de cena/coleta real e realizar o expurgo completo, migrando apenas os dados reais comprovados para a nova estrutura em `data/04_scientific_db/` com as travas `CHECK` ativadas.
3. **Ordem de Serviço 03 (Geração do Manifesto e Gatekeeper):**
   * Criar o script `scripts/generate_manifest.py` para calcular o hash SHA-256 de todos os arquivos brutos legítimos em `data/01_raw_immutable/` e popular o `config/data_manifest.json`.
   * Implementar `src/core_science/provenance_guard.py` e injetar a chamada `verify_file_provenance()` e `validate_dataframe_purity()` no início dos scripts de processamento e treinamento.
4. **Ordem de Serviço 04 (Padronização Geoespacial e Caminhos):**
   * Garantir o uso de `pathlib.Path` em todos os módulos e forçar a validação de projeção cartográfica métrica (CRS definido em `config/settings.yaml`) antes dos cálculos de declividade e fator LS.

---

## 6. Nota Metodológica para Inclusão no Artigo / Dissertação

Para documentar essa arquitetura no texto científico e blindar o trabalho preventivamente contra questionamentos de revisores, utilize a seguinte redação na seção de *Material e Métodos*:

> *"Visando assegurar a estrita validade empírica e eliminar riscos de contaminação amostral ou vazamento de dados (data leakage), o pipeline computacional (`localizador-erosao-v2`) foi estruturado sob uma arquitetura de proveniência criptográfica (Zero-Trust Data Pipeline). Todas as matrizes orbitais e levantamentos de campo recebem assinaturas criptográficas SHA-256 no momento da ingestão (`data_manifest.json`) e são submetidas a verificação automatizada de integridade pré-treinamento. Adicionalmente, o banco de dados relacional opera sob restrições formais de esquema (DDL CHECK constraints) que exigem o vínculo de cada feição espacial ao identificador único da cena orbital ou laudo de campo, bloqueando em nível de sistema qualquer inserção de dados sintéticos ou não auditados."*