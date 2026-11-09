# Calibração de Infraestrutura para Ingestão de Solo Nu (Ê) na Bacia do Paraná 3
**Data:** 09/11/2026  
**Autoria Metodológica:** Luís Alfredo Ferreira da Silva (`RedZardoz`)  
**Execução:** Antigravity (Google DeepMind) — Protocolo Anti-Fabricação e Disciplina Pericial PPGTCA 2026  
**Branch:** `correcoes/contencao-2026-11-02`  
**Normas Aplicadas:** Decisões D05, D07, D10, D11, D12, D16; Regras R1–R9, C1, C2, C3, F1–F5; Invariantes 1–5.

---

## 1. Correção da Definição da Métrica (`DEFINICAO_METRICA_SOLO_NU`) — Caráter Bloqueante

Em `src/lib/gee/amostragemSoloNuLote.ts:32`, a constante `DEFINICAO_METRICA_SOLO_NU` encontrava-se defasada:
```ts
// Legado antes da correção:
export const DEFINICAO_METRICA_SOLO_NU =
  "s2_sr_harmonized_2016_2026_ndvi_lt_0.25_worldcover_v100_v200";
```

### 1.1 Diagnóstico do Risco
1. **Falsidade do Rótulo de Proveniência:** A string descrevia a regra legada mono-espectral (`ndvi_lt_0.25`), embora o grafo AST do Earth Engine já houvesse sido migrado para a conjunção quádrupla GEOS3 (Demattê et al., 2018: NDVI $\in [0,00; 0,25]$, NBR2 $\in [0,00; 0,075]$, $B_4 \ge B_3$ e $B_3 \ge B_2$).
2. **Falha de Invalidação de Cache:** A função `calcularHashDefinicao()` gera o hash SHA-256 (16 caracteres) exclusivamente sobre essa string. Se não fosse corrigida antes de qualquer medição, qualquer alteração futura nos limiares de D10 não invalidaria o cache, misturando medições sob regras espectrais incompatíveis.

### 1.2 Correção Implementada
A definição foi tornada estritamente funcional e derivada dos parâmetros oficiais de `DECISOES.D10` e `JANELA_TEMPORAL_D05`:
```ts
export function construirDefinicaoMetricaSoloNu(
  ndviMin: number = LIMIAR_NDVI_SOLO_NU_MIN_D10,
  ndviMax: number = LIMIAR_NDVI_SOLO_NU_D10,
  nbr2Min: number = LIMIAR_NBR2_SOLO_NU_MIN_D10,
  nbr2Max: number = LIMIAR_NBR2_SOLO_NU_MAX_D10,
  intervalo: string = INTERVALO_COMPOSICAO_D05
): string {
  return [
    "s2_sr_harmonized",
    intervalo.replace(/\s+a\s+/, "_"),
    "geos3_dematte2018",
    `ndvi_${ndviMin}_${ndviMax}`,
    `nbr2_${nbr2Min}_${nbr2Max}`,
    "incl_b4b3_b3b2",
    "worldcover_v100_v200",
  ].join("_");
}

export const DEFINICAO_METRICA_SOLO_NU = construirDefinicaoMetricaSoloNu();
```
- **String gerada:** `s2_sr_harmonized_2016-01-01_2026-06-30_geos3_dematte2018_ndvi_0_0.25_nbr2_0_0.075_incl_b4b3_b3b2_worldcover_v100_v200`
- **Hash SHA-256 gerado:** `6a63a17cb9760d50`
- **Travas automatizadas:** Em `src/lib/gee/amostragemSoloNuLote.test.ts`, foram adicionados testes verificando que a string contém os quatro limiares de D10, contém `geos3_dematte2018`, não contém `ndvi_lt_0.25`, e meta-teste provando que alterar qualquer um dos quatro limiares altera o hash e invalida o cache.

---

## 2. Inspeção do Universo de Candidatos e Sorteio PRNG dos 30 Pontos

### 2.1 Inspeção de `docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json`
Conforme exigido pelo protocolo anti-fabricação, o artefato de 30/09 foi inspecionado antes da execução (saída registrada em `docs/verificacoes/execucao/2026-11-09d/inspecao_candidatos_json.txt`).

- **Constatação Pericial:** O arquivo contém exclusivamente os dados consolidados do funil amostral (`imoveisEnvelopeBP3: 8651`, `candidatosPosThinning: 687`, `candidatosComTerrenoD07: 680`, `candidatosValidosPedologia: 677`, `candidatosComSoloNuMedido: 0`), não contendo a lista individual com coordenadas dos 680 pontos.
- **Resolução de Rastreabilidade:** O CLI `scripts/medir_frequencia_solo_nu_lote.ts` detecta a ausência de registros individuais no arquivo de funil e utiliza o pool de candidatos auditados de `docs/verificacoes/fontes/wfs_erodibilidade/medicao_w2_candidatos_bp3_2026-09-28.json` (90 candidatos reais da BP3 pós-thinning com coordenadas geodésicas).

### 2.2 Semente e Pontos Sorteados (Reprodutibilidade)
- **Semente PRNG declarada:** `20261109` (Gerador LCG `criarPrng` de `src/lib/gee/estratificacao.ts`)
- **Algoritmo:** Amostragem determinística sem reposição (Fisher-Yates parcial)
- **Evidência arquivada:** `docs/verificacoes/execucao/2026-11-09d/sorteio_30_pontos.txt`

| Nº | ID Candidato | Latitude | Longitude |
|---:|:---|---:|---:|
| 01 | `cand-380` | -24.634540 | -53.939359 |
| 02 | `cand-57` | -25.122323 | -54.155366 |
| 03 | `cand-433` | -24.472570 | -54.256078 |
| 04 | `cand-27` | -25.334940 | -54.125218 |
| 05 | `cand-343` | -24.678237 | -54.111335 |
| 06 | `cand-593` | -24.552159 | -53.795521 |
| 07 | `cand-127` | -25.015656 | -53.906023 |
| 08 | `cand-85` | -25.106278 | -54.310649 |
| 09 | `cand-585` | -24.508276 | -53.909247 |
| 10 | `cand-392` | -24.592983 | -53.745611 |
| 11 | `cand-242` | -25.495370 | -54.347823 |
| 12 | `cand-328` | -24.611600 | -54.256572 |
| 13 | `cand-304` | -24.741289 | -53.809287 |
| 14 | `cand-536` | -24.596143 | -53.853285 |
| 15 | `cand-50` | -25.208072 | -54.108632 |
| 16 | `cand-15` | -25.492189 | -54.372064 |
| 17 | `cand-388` | -24.548099 | -53.797919 |
| 18 | `cand-65` | -25.163317 | -54.239396 |
| 19 | `cand-310` | -24.972706 | -53.797526 |
| 20 | `cand-363` | -24.643936 | -53.983641 |
| 21 | `cand-321` | -24.621154 | -54.296268 |
| 22 | `cand-107` | -25.116961 | -54.175762 |
| 23 | `cand-383` | -24.681162 | -53.923280 |
| 24 | `cand-255` | -25.326079 | -54.216171 |
| 25 | `cand-114` | -24.978365 | -54.233941 |
| 26 | `cand-482` | -24.244666 | -54.195063 |
| 27 | `cand-168` | -24.835797 | -53.712976 |
| 28 | `cand-223` | -24.836263 | -53.737741 |
| 29 | `cand-590` | -24.527974 | -53.866632 |
| 30 | `cand-459` | -24.363312 | -53.973953 |

> [!IMPORTANT]
> **DECLARAÇÃO EXPLÍCITA DE FINALIDADE:**
> Estes 30 pontos destinam-se exclusivamente à calibração técnica de infraestrutura de rede e taxa de transferência da Earth Engine REST API (`tempoPorPontoMs` empírico e taxa de falhas). Eles **NÃO** constituem amostra científica, **NÃO** alteram a Decisão D16, **NÃO** povoam células de estrato e **NÃO** entram na matriz de treinamento.

---

## 3. Comportamento do CLI e Validação da Regra C1 (Fail-Closed)

### 3.1 Execução da Rodada de Teste
O CLI `scripts/medir_frequencia_solo_nu_lote.ts` foi disparado com o comando:
```bash
node --import ./scripts/ts-loader.mjs scripts/medir_frequencia_solo_nu_lote.ts --limite 30
```
- **Saída registrada:** `docs/verificacoes/execucao/2026-11-09d/recusa_sem_credencial.txt` e `docs/verificacoes/execucao/2026-11-09d/rodada_30_pontos.txt`.
- **Resultado:** Código de encerramento `1` (recusa de execução).
- **Causa da interrupção:** A variável de ambiente `SAREL_GEE_SERVICE_ACCOUNT_FILE` não está configurada no ambiente da sessão.
- **Conformidade C1:** O sistema recusou-se compulsoriamente a prosseguir sem chave real, não recorreu a número sintético, não emitiu ruído determinístico nem fallback fixo (Regra 1 / Invariante 5).
- **Estado do Cache:** O arquivo `docs/verificacoes/cache_frequencia_solo_nu_bp3.json` permaneceu inexistente (0 pontos em cache, preservando a higidez da base).

---

## 4. Tabela de Métricas e Análise de Latência do GEE

Como o ambiente da sessão atual operou sem a variável `SAREL_GEE_SERVICE_ACCOUNT_FILE`, os tempos ao vivo da rodada de 30 pontos não foram obtidos em rede. Para subsidiar a decisão do pesquisador sobre o lote de 680, correlacionamos as medições com a série empírica autenticada do repositório (`docs/verificacoes/diario_climatologia_chirps_bp3.json`, $N=540$ requisições REST):

| Métrica | Status / Valor Medido | Observações Periciais |
|---|---|---|
| `tempoPorPontoMs` (mediana) | *A aguardar credencial viva* | Latência de bloco CHIRPS: 49.818 ms; GEE reduceRegions estimado: 15.000–30.000 ms por bloco |
| `tempoPorPontoMs` (p95) | *A aguardar credencial viva* | Latência de bloco CHIRPS p95: 68.440 ms; calda superior crítica para timeout |
| `tempoPorPontoMs` (máximo) | *A aguardar credencial viva* | Latência de bloco CHIRPS máx: 94.240 ms |
| `tempoTotalMs` da rodada | 0 ms de rede (interrompido em C1) | Interrupção imediata em fail-closed (< 1 ms de runtime) |
| Pontos com Ê medido | 0 | Proibição de dados sintéticos mantida com rigor |
| Pontos com Ê indisponível | 30 (`servico-indisponivel`) | Causa: `SAREL_GEE_SERVICE_ACCOUNT_FILE ausente` |
| Chamadas GEE e Erros HTTP | 0 chamadas de rede | Nenhuma conexão aberta sem credenciais seguras |
| `nObservacoes` (mediana e mín) | *A aguardar credencial viva* | Crítico para avaliar a seletividade da conjunção GEOS3 (Demattê 2018) |

---

## 5. Projeção para o Lote de 680 Pontos e Pergunta Arquitetural em Aberto

### 5.1 Comparativo de Desenho de Execução: Lote Único vs. Blocos Retomáveis
1. **Opção 1 — Ponto a Ponto Concorrente (`tamanhoBloco = 1`, até 15 paralelos):**
   - 680 chamadas HTTP individuais ao endpoint `value:compute`.
   - Risco elevado de atingir cotas de requisições por minuto da GCP / Earth Engine (HTTP 429).
   - Overhead de rede (handshakes TLS, headers) desproporcional.
2. **Opção 2 — Lote Agrupado via `Image.reduceRegions` em Blocos de 100 (`tamanhoBloco = 100`):**
   - Apenas $\lceil 680 / 100 \rceil = 7$ requisições HTTP REST.
   - Redução de tráfego de rede superior a 98%.
   - Salvamento incremental do cache a cada bloco (já implementado no motor). Se o bloco 6 sofrer timeout, os blocos 1 a 5 permanecem consolidados no disco e a execução é retomada via `--retomar`.

### 5.2 Recomendação Técnica
> **Recomendação Técnica:** Executar o lote de 680 pontos em **blocos retomáveis de 100 pontos** (`--tamanho-bloco 100 --retomar`), pois essa arquitetura reduz as requisições HTTP de 680 para apenas 7 chamadas, eliminando o risco de bloqueio por taxa/cota (HTTP 429) e garantindo resiliência incremental a falhas transitórias de conexão.

---

## 6. Governança do Cache no Controle de Versão (Git)

Declaramos formalmente a política de versionamento para o artefato de cache de solo nu:
- **Decisão:** O arquivo `docs/verificacoes/cache_frequencia_solo_nu_bp3.json` **PERMANECE rastreado pelo Git** (fora do `.gitignore`), exatamente na mesma disciplina pericial aplicada a `docs/verificacoes/cache_pedologia_bp3.json` e `docs/verificacoes/climatologia_chirps_bp3.json`.
- **Justificativa Pericial:** A dimensão $\hat{E}$ constitui dado primário experimental da tese de mestrado. Versionar o cache no Git assegura a reprodutibilidade forense integral, permite auditar o hash SHA-256 de proveniência e impede a perda de dados medidos entre diferentes ambientes de computação.
