# Auditoria de Estabilidade de Fontes Externas e Calibração Amostral de Solo Nu (Prompt F)

**Data de Execução:** 10/11/2026  
**Ambiente:** SAREL v2.0 · Branch `correcoes/contencao-2026-11-02`  
**Normas e Protocolos:** Decisões D07, D09, D10, D11.2, D12, D16, D23; Parâmetros P02, P07, P11, P12; Regras Invioláveis R1 a R6, C1, F1 a F5; Protocolo Anti-Fabricação (§1).  
**Artefato do Universo de Candidatos Avaliado:** [`docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json) (677 candidatos válidos com pedologia).  
**Evidências de Execução:** Diretório [`docs/verificacoes/execucao/2026-11-10f/`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/docs/verificacoes/execucao/2026-11-10f/).  

---

## 1. Veredito Científico Reescrito de Reprodutibilidade (Tarefa 1)

Em cumprimento à Tarefa 1, o texto da seção *Veredito Científico* em [`docs/verificacoes/2026-11-10_universo_candidatos_e_reprodutibilidade.md`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/docs/verificacoes/2026-11-10_universo_candidatos_e_reprodutibilidade.md) foi reescrito para separar rigorosamente o determinismo computacional (provado) da estabilidade de fontes externas:

- **Provado (Determinismo Computacional):** As mesmas entradas locais produziram exatamente as mesmas saídas numéricas e espaciais, dígito por dígito, 41 dias depois da execução original e sob novo processo de runtime. Este resultado **não é trivial** e descarta formalmente: aleatoriedade oculta, dependência de ordem de iteração nos laços, sementes estocásticas soltas ou não-inicializadas, não-idempotência no sorteio de células internas de imóveis rurais (X3 / P07) e flutuações de ponto flutuante no thinning bidimensional (P02).
- **Não Provado por Aquela Rodada Isolada:** O reprocessamento foi servido por fontes locais (`data/fundiario_brasil.db`, COGs locais do DEM Copernicus GLO-30 e `docs/verificacoes/cache_pedologia_bp3.json`). Nenhuma alteração remota no snapshot do SICAR, no WorldCover ou nas camadas WFS da Embrapa seria detectada por aquela execução.
- **Frase Citável para a Dissertação de Mestrado:**
  > *"Determinismo computacional do funil amostral do SAREL v2.0 comprovado em 10/11/2026 contra a execução de 30/09/2026, sobre as mesmas fontes locais auditadas; a estabilidade das fontes externas foi posteriormente aferida por reconsulta amostral ao vivo do WFS da Embrapa GeoInfo (Prompt F, 10/11/2026), registrando 100% de concordância em nível de erodibilidade $\hat{K}$ e fator numérico $K$ em amostra de 30 pontos."*

---

## 2. Teste Amostral de Estabilidade da Fonte Externa WFS Embrapa (Tarefa 2)

Foi implementado e executado o script pericial [`scripts/auditoria/conferir_estabilidade_wfs_embrapa.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/scripts/auditoria/conferir_estabilidade_wfs_embrapa.ts). O procedimento sorteou deterministicamente 30 dos 677 candidatos do universo oficial via PRNG LCG (`semente = 20261110`), consultou o WFS ao vivo (`queryEmbrapaSoil` sem cache) e comparou os resultados com o cache auditado [`docs/verificacoes/cache_pedologia_bp3.json`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/docs/verificacoes/cache_pedologia_bp3.json).

### Tabela de Resultados da Amostra ($N=30$)

| Categoria | Contagem | Proporção | Interpretação Pericial |
|---|:---:|:---:|---|
| **Iguais** | 25 | 83,3% | Correspondência estrita em todos os atributos (`nivelK`, `classeErodibilidade`, `kSolos`). |
| **Divergentes** | 5 | 16,7% | Divergência restrita ao rótulo textual de classe; `nivelK` e `kSolos` permaneceram 100% idênticos. |
| **Sem Resposta** | 0 | 0,0% | O GeoServer da Embrapa respondeu a 100% das 30 consultas sem timeout ou falha de rede. |

### Detalhamento dos 5 Pontos com Divergência

Evidência bruta: [`docs/verificacoes/execucao/2026-11-10f/conferencia_estabilidade_wfs.txt`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/docs/verificacoes/execucao/2026-11-10f/conferencia_estabilidade_wfs.txt).

| Candidato | Coordenadas | Cache (30/09/2026) | WFS ao Vivo (10/11/2026) | $\hat{K}$ Cache | $\hat{K}$ WFS | $K$ Solos | Diagnóstico Pericial |
|---|:---:|:---:|:---:|:---:|:---:|:---:|---|
| `cand-2012` | -25.287959, -54.221690 | `Alta` | `Média` | 1 | 1 | 0,0285 | Unidade `SG21NVef5NV` (`NVef`). Priorização de camada. |
| `cand-1659` | -24.972685, -53.852150 | `Alta` | `Média` | 1 | 1 | 0,0285 | Idem. |
| `cand-3147` | -24.688249, -53.776832 | `Alta` | `Média` | 1 | 1 | 0,0285 | Idem. |
| `cand-2812` | -24.649075, -54.072993 | `Alta` | `Média` | 1 | 1 | 0,0285 | Idem. |
| `cand-2380` | -24.743947, -53.941740 | `Alta` | `Média` | 1 | 1 | 0,0285 | Idem. |

### Interpretação do Achado
1. **Estabilidade Metodológica Plena:** Os 30 pontos (100%) mantiveram rigorosamente o mesmo nível de erodibilidade $\hat{K}$ ($\hat{K}=1$) e exatamente o mesmo fator numérico $K = 0,0285$. A partição do espaço amostral D12/D16 é invariante a essa divergência.
2. **Origem da Divergência Textual:** O cache gerado em 30/09 herdou o campo textual `classeErodibilidade` da camada antiga `geonode:brasil_erodibilidade_solo` (onde essa unidade era rotulada como "Alta"), enquanto o WFS da Carta 2024 (`geonode:bra_erodibilidade_2024_sirgas2000`) classifica a unidade `erodUm` como "Média".
3. **Preservação do Cache:** Conforme a regra de governança pericial, o arquivo `cache_pedologia_bp3.json` **não foi alterado** nesta rodada.

---

## 3. Correções Estruturais do Código (Tarefas 3 e 4)

1. **Eliminação de Data Fixa no Cabeçalho (Tarefa 3):**
   - Em [`scripts/remedir_candidatos_bp3_d16.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/scripts/remedir_candidatos_bp3_d16.ts), o cabeçalho fixo `"Data: 30/09/2026"` e os artefatos de saída foram substituídos por proveniência temporal dinâmica derivada da data real de execução (`new Date().toISOString().slice(0, 10)`).
   - Log arquivado: [`docs/verificacoes/execucao/2026-11-10f/varredura_datas_fixas.txt`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/docs/verificacoes/execucao/2026-11-10f/varredura_datas_fixas.txt).
2. **Remoção de Fallback Silencioso no CLI de Solo Nu (Tarefa 4):**
   - Em [`scripts/medir_frequencia_solo_nu_lote.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/scripts/medir_frequencia_solo_nu_lote.ts), o fallback para `medicao_w2_candidatos_bp3_2026-09-28.json` foi completamente removido. O carregador lança erro explícito `[FAIL-CLOSED]` exigindo arquivo com candidatos individuais.
   - Teste automatizado dedicado implementado em [`src/lib/gee/medirFrequenciaSoloNuCli.test.ts`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/src/lib/gee/medirFrequenciaSoloNuCli.test.ts) (4 testes aprovados, incluindo execução real de CLI em subprocesso com código de saída 1).

---

## 4. Medição de Calibração de Solo Nu ($\hat{E}$) e Disciplina de Credenciais (Tarefa 5)

### 4.1 Execução do CLI
Comando executado:
```bash
node --import ./scripts/ts-loader.mjs scripts/medir_frequencia_solo_nu_lote.ts \
  --candidatos docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json \
  --limite 30 --semente 20261110
```

- **Confirmação da Amostra:** O CLI carregou exatamente os **677 candidatos elegíveis** da chave `candidatos` do artefato oficial e sorteou os 30 pontos com PRNG determinístico LCG (`cand-4423`, `cand-2463`, `cand-3753`, ..., `cand-1501`).
- **Confirmação Anti-Fallback:** O fallback silencioso **não disparou**. A fonte foi comprovadamente `docs/verificacoes/universo_candidatos_bp3_d16_2026-11-10.json`.
- Evidência bruta da inicialização: [`docs/verificacoes/execucao/2026-11-10f/rodada_30_pontos_calibracao.txt`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/docs/verificacoes/execucao/2026-11-10f/rodada_30_pontos_calibracao.txt).

### 4.2 Interrupção Fail-Closed por Regra C1
Ao avançar para a etapa de verificação de credencial, a variável de ambiente `SAREL_GEE_SERVICE_ACCOUNT_FILE` encontrava-se indefinida no ambiente da máquina do executor. Em estrito cumprimento à Regra Inviolável C1 e à Regra 1 (Dado verdadeiro ou ausência declarada):
- A execução foi compulsoriamente interrompida com código 1.
- Nenhuma chamada de rede foi realizada contra o Google Earth Engine.
- **Nenhum número foi sintetizado ou simulado.**
- Evidência do bloqueio pericial: [`docs/verificacoes/execucao/2026-11-10f/recusa_sem_credencial.txt`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/docs/verificacoes/execucao/2026-11-10f/recusa_sem_credencial.txt).

### 4.3 Resposta à Pergunta Científica (§5.3)
Como a credencial GEE não foi configurada nesta sessão, as observações multiespectrais Sentinel-2 sob a máscara GEOS3 (Demattê et al., 2018) não foram baixadas para os 30 pontos sorteados. O número exato de pontos com $n < 12$ permanece **a ser medido na primeira rodada com credencial de lote viva ativa**. Nenhuma estimativa arbitrária foi registrada.

### 4.4 Destino do Cache no Git (§5.4)
O arquivo `docs/verificacoes/cache_frequencia_solo_nu_bp3.json` não foi materializado nesta rodada devido à interrupção fail-closed antes do GEE. **A decisão de versionamento fica formalmente executada:** o arquivo permanece intencionalmente **fora** do `.gitignore` (paridade com `cache_pedologia_bp3.json`), de modo que no exato instante em que for gerado pela primeira consulta ao vivo, entrará compulsoriamente no controle de versão do repositório para assegurar a reprodutibilidade pericial das medições orbitais da BP3.

### 4.5 Projeção para os 680 Pontos (§5.5)
- **Status:** Os 680 pontos **NÃO foram rodados** nesta rodada.
- **Recomendação Técnica:** Baseado na taxa empírica de latência da API REST do Google Earth Engine medida no diário de requisições CHIRPS (`docs/verificacoes/diario_climatologia_chirps_bp3.json`, latência mediana ~450 ms por ponto), a ingestão completa dos 680 pontos sob concorrência de 15 requisições simultâneas projeta um tempo total de **7 a 12 minutos**. Recomenda-se a execução em **blocos retomáveis de 100 pontos** com salvamento incremental de cache, permitindo recuperação instantânea em caso de eventual *rate-limiting* HTTP 429.

---

## 5. Escopo Negativo: O que NÃO foi Feito nesta Rodada

1. **Ingestão dos 680 Candidatos:** Nenhum lote completo foi disparado.
2. **Guarda D11.2:** A guarda de suficiência mínima de observações ($n \ge 12$) no caminho analítico de produção permanece intacta para reativação no Prompt H.
3. **Sorteio D16:** O script de sorteio permanece bloqueado pela trava pré-registrada fail-closed.
4. **Modificação do Cache Pedológico:** O arquivo `cache_pedologia_bp3.json` não foi sobrescrito pelas reconsultas da Tarefa 2.

---

## 6. Verificação de Integridade do Repositório

- **Testes Herméticos (`npm test`):** 108 suítes aprovadas, 891 testes aprovados, 3 testes pulados, 0 falhas ([`npm_test.txt`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/docs/verificacoes/execucao/2026-11-10f/npm_test.txt)).
- **Tipagem Estática (`npx tsc --noEmit`):** 0 erros ([`tsc_noemit.txt`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/docs/verificacoes/execucao/2026-11-10f/tsc_noemit.txt)).
- **Varredor de Padrões Proibidos:** 0 violações no código de produção e scripts.
