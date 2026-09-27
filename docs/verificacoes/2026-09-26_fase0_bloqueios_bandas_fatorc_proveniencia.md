# Verificação Formal — FASE 0: Correções de Bloqueio (Bandas B11/B12, Domínio do Fator C, Proveniência `adquiridoEm`, Guarda D11/P02 e Isolamento `PROJ_LIB`) e Reteste Hidrológico Q1

- **Data de execução:** 2026-09-26 / 2026-09-27
- **Branch:** `sarel/v2`
- **Governa:** `docs/design.md` (Regras Invioláveis 1 a 9; Invariantes 1 a 7) e `docs/planejamento/PROMPT_OPERACIONALIZACAO_INTEGRAL_SAREL_2026-09-26.md`

---

## 1. Reteste Comparativo Hidrológico (Q1) — `pysheds` vs. `whitebox` em Windows 11 / Python 3.14.4

Após instalar `scikit-image==0.26.0`, `pysheds==0.5` e `whitebox==2.3.6` no ambiente Python 3.14.4 (`MSC v.1944 64 bit AMD64`), ambos os motores foram executados sobre o mesmo MDE sintético de controle em `EPSG:31982` ($200 \times 200$ células de $30\text{ m}$, rampa inclinada com canal central e depressão fechada de $5\text{ m}$ na célula $(100,100)$).

### 1.1. Diagnóstico técnico exato do `pysheds 0.5` sob Python 3.14.4 e NumPy 2.4.6
1. **Correção do diagnóstico anterior:** `numba==0.67.0` (`llvmlite==0.49.0`) está instalado e operacional no Python 3.14.4. Em `pysheds 0.5`, `pysheds.grid.py` define `if _HAS_NUMBA: from pysheds.sgrid import sGrid as Grid`, ou seja, `sGrid` é a própria classe acelerada por Numba da versão `0.5`.
2. **Causa da falha anterior (1):** `scikit-image` estava ausente porque o teste isolado fora executado com `--no-deps`. Instalado `scikit-image==0.26.0`, `grid.fill_pits`, `grid.fill_depressions`, `grid.resolve_flats` e `grid.flowdir` executam via JIT do Numba sem erro.
3. **Causa da falha em `grid.accumulation` sob NumPy 2.4.6 (2):** Na linha `904` de `pysheds/sgrid.py`, o método `_d8_accumulation` invoca `np.in1d(fdir.ravel(), dirmap)`, função removida no `numpy >= 2.0` (`AttributeError: module 'numpy' has no attribute 'in1d'`). Com o *shim* de compatibilidade de uma linha (`if not hasattr(np, "in1d"): np.in1d = np.isin`), `pysheds 0.5` executa todo o pipeline D8 em memória.

### 1.2. Quadro Comparativo Medido ($200 \times 200$ células, $30\text{ m}$, `EPSG:31982`)

| Critério | `pysheds==0.5` (`numba==0.67.0`, `scikit-image==0.26.0`) | `whitebox==2.3.6` (`WhiteboxTools v2.4.0` Rust `win_amd64`) |
| :--- | :--- | :--- |
| **Tempo de execução (1ª chamada / Cold)** | `0.2700 s` (inclui compilação JIT Numba) | `0.0544 s` (I/O de arquivo GeoTIFF temporário) |
| **Tempo de execução (2ª chamada / Warm)** | `0.0922 s` (em memória sobre `ndarray`) | `0.0518 s` |
| **$A_s$ mínimo ($\text{m}^2/\text{m}$)** | `30.00 m²/m` ($1\text{ célula} \times 30\text{ m}$) | `30.00 m²/m` ($1\text{ célula} \times 30\text{ m}$) |
| **$A_s$ máximo ($\text{m}^2/\text{m}$)** | `1,200,000.00 m²/m` ($40.000\text{ células} \times 30\text{ m}$) | `1,200,000.00 m²/m` ($40.000\text{ células} \times 30\text{ m}$) |
| **Fixação de versão em `requirements.txt`** | **Total:** rodas oficiais PyPI (`pysheds==0.5`, `scikit-image==0.26.0`, `numba==0.67.0`), zero download externo em tempo de execução. | **Parcial:** o pacote PyPI `whitebox==2.3.6` é apenas um wrapper que baixa `WhiteboxTools_win_amd64.zip` na 1ª execução. |
| **Rastreabilidade do binário (`whitebox`)** | N/A (código Python/Numba inspecionável) | **Versão:** `WhiteboxTools v2.4.0 (c) Dr. John Lindsay 2017-2023`<br>**URL de origem:** `https://www.whiteboxgeo.com/WBT_Windows/WhiteboxTools_win_amd64.zip`<br>**Binário local:** `C:\Users\lalfr\AppData\Roaming\Python\Python314\site-packages\whitebox\whitebox_tools.exe`<br>**SHA-256:** `1212c668f89048e3189b9ad73f2670e60f8cd4b7a976272fc27f502c5157c925` |

**Conclusão para F1:** Ambos os pacotes encontram-se instalados no ambiente Python 3.14.4 do repositório e produzem **exatamente o mesmo intervalo físico de $A_s$** (`30.00` a `1,200,000.00 m²/m`). Pelo critério de reprodutibilidade por terceiro sem download de binário em tempo de execução, `pysheds==0.5` (com `if not hasattr(np, "in1d"): np.in1d = np.isin`) opera em memória como motor primário fixado no `requirements.txt`, mantendo-se `whitebox==2.3.6` (`WhiteboxTools v2.4.0`, SHA-256 `1212c668f89048e3189b9ad73f2670e60f8cd4b7a976272fc27f502c5157c925`) instalado e documentado para verificação cruzada.

---

## 2. Verificação dos Itens da FASE 0 (`F0.1` a `F0.5`)

### 2.1. `F0.1` — Identidade das Bandas `B11` (SWIR-1) e `B12` (SWIR-2)
- [`src/lib/gee/copernicusGeeClient.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/src/lib/gee/copernicusGeeClient.ts): `bandSelectors` agora solicita `["B2", "B4", "B8", "B11", "B12"]`.
- `processarRespostaGeeSentinel2` extrai `b11` (`B11_p15`, `B11_p50`, `B11_p85`) e `b12` (`B12_p15`, `B12_p50`, `B12_p85`) separadamente, mantendo `b11` (SWIR-1, ~1610 nm) em `calcularBsi` e gravando `b12` (SWIR-2, ~2190 nm) em `espectral.b12` nas rotas `select-candidates` e `inspect-point`.
- Provado pelo teste unitário em [`src/lib/seguranca/padroesProibidos.test.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/src/lib/seguranca/padroesProibidos.test.ts) (`medicao!.b11 === 0.275 !== medicao!.b12 === 0.192`).

### 2.2. `F0.2` — Domínio Físico Estrito do Fator C ($C \in [0, 1]$)
- [`src/lib/rusle/fatorC.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/src/lib/rusle/fatorC.ts): `calcularFatorC` verifica `if (!Number.isFinite(c) || c < 0 || c > 1)` e lança `ErroForaDoDominio` nomeando os insumos `NDVI` e `BSI`, sem qualquer uso de `Math.min` ou `Math.max` (`grep -nE 'Math\.(min|max)' src/lib/rusle/fatorC.ts` $\to$ `0` linhas).
- Provado em [`src/lib/rusle/rusle.test.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/src/lib/rusle/rusle.test.ts) para $C = 2{,}0$ ($\text{NDVI}=-1, \text{BSI}=1 \implies \text{indisponivel}$, `causa: "fora-do-dominio"`) e para 3 pontos do caminho híbrido ativo com `BSI` presente.

### 2.3. `F0.3` — Proveniência `adquiridoEm` Verdadeira e Fontes Oficiais Conferidas
- [`src/lib/gee/metadadosColecoes.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/src/lib/gee/metadadosColecoes.ts) centraliza as datas de publicação das coleções estáticas com URLs oficiais dos catálogos Earth Engine, ESA PRISM, Embrapa GeoInfo (`geonode:parana_solos_20201105`), Zenodo DOI (`10.5281/zenodo.7254221`), IBGE e IAT-PR, além da função `extrairDataAquisicaoSentinel2`.
- As 31 ocorrências de `adquiridoEm: "AAAA-MM-DD"` no código de produção (`src/app` e `src/lib`) foram reduzidas a **0 ocorrências**.
- **Nota de Falso Positivo de Instrumento (Postura 13):** O comando bruto `grep -n 'adquiridoEm: "' src/app src/lib -r` encontra **0 linhas** em arquivos de produção (`.ts`) e **57 linhas** exclusivamente em *fixtures* de testes unitários (`src/lib/**/*.test.ts`). Conforme a Postura 13, as *fixtures* legítimas de teste não foram editadas; o varredor automatizado (`padroesProibidos.test.ts`) fiscaliza continuamente que nenhum arquivo de código ativo em `src/lib`, `src/app/api`, `src/store`, `src/config` ou `src/components` contenha `adquiridoEm` com literal de data.

### 2.4. `F0.4` — Guarda de Suficiência Amostral D11 e Raio de Thinning Auditável (P02)
- `construirExpressaoGeeS2WorldCover` combina `Reducer.percentile([15, 50, 85])` e `Reducer.count()` no Earth Engine, obtendo `B4_count` (`nObservacoesValidas`). Quando `nObservacoesValidas < 6` (Decisão D11), `insuficienteD11` é `true` e as variáveis espectrais/temporais são emitidas como `estado: "indisponivel"`, `causa: "insuficiente"`, citando D11.
- Em `src/app/api/gee/select-candidates/route.ts`, o literal `800` e o comentário `// permitido:` da linha 292 foram removidos; o piso de relaxamento lê `REGISTRO_DECISOES.P02 ?? PARAMETROS.P02` via `exigirDecisao`, registra cada iteração em `historicoRelaxamentoThinning` e grava `raioThinningEfetivoMetros` em `criterioSelecao`.

### 2.5. `F0.5` — Isolamento de `PROJ_LIB` em `scripts/reduzir_terreno_copernicus.py`
- No início de [`scripts/reduzir_terreno_copernicus.py`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/scripts/reduzir_terreno_copernicus.py#L46-L80), `PROJ_LIB` e `PROJ_DATA` são sobrescritos **antes** de `import rasterio` (via `importlib.util.find_spec("rasterio")`) para o diretório `proj_data` do `rasterio`, neutralizando a colisão com `C:\Program Files\PostgreSQL\18\share\contrib\postgis-3.6\proj\proj.db` (`DATABASE.LAYOUT.VERSION.MINOR = 2`). Comprovado pela execução integral de `python scripts/verificacao/test_reduzir_terreno.py` (`exit code 0`, 100% de conformidade).
