# Relatório de Verificação — Selo Público Redigido do Sorteio D16 (Prompt L)

**Data de Emissão:** 2026-11-11  
**Branch:** `correcoes/contencao-2026-11-02`  
**Referência Metodológica:** Prompt L — Executor SAREL  
**Selo Completo de Origem:** `docs/verificacoes/sorteio/sorteio_d16_2026-11-10.json`  
**Selo Público Redigido Gerado:** `docs/verificacoes/selo_publico_d16_2026-11-10.json`  
**Script Gerador:** `scripts/auditoria/gerar_selo_publico_d16.mjs`  
**Testes de Cegamento e Integridade:** `src/lib/seguranca/seloPublicoD16.test.ts`  

---

## 1. Justificativa Metodológica: Isolamento K2 e Resolução do Vão de Auditoria

O sorteio estratificado de polígonos sob as Decisões D16 e D23 gera dois requisitos concorrentes de governança científica:

1. **Protocolo Cego de Campo (Guarda K2):** Para impedir qualquer viés de confirmação ou direcionamento na coleta em campo e na rotulagem independente, os observadores de campo e intérpretes não podem correlacionar o código opaco de voo (`VANT-BLIND-*`) com coordenadas geográficas, IDs de candidatos, limites de propriedade ou atributos biofísicos. Por essa razão (instituída no commit `f0b2026`), o diretório `docs/verificacoes/sorteio/` é estritamente ignorado pelo Git (`.gitignore:133`), garantindo que a tabela reversa de correspondência opaca jamais chegue ao repositório público.
2. **Auditabilidade Pública e Reproducibilidade:** Como efeito colateral da guarda K2, o selo completo existia apenas localmente no disco da estação de trabalho. Se a banca examinadora ou a comunidade científica auditasse o repositório clonado, encontraria apenas referências documentais indiretas, mas nenhum artefato estruturado contendo a formalização matemática das probabilidades de inclusão ($\pi_i$), pesos de amostragem ($w_i$), limiares e estratos.

O **selo público redigido** (`docs/verificacoes/selo_publico_d16_2026-11-10.json`) resolve este hiato sem qualquer concessão ao sigilo operacional: ele é versionado sob controle do Git, preserva 100% dos metadados globais do sorteio, documenta os 18 estratos de forma agregada e vincula-se criptograficamente ao arquivo completo via hash SHA-256.

---

## 2. Conteúdo do Selo Público: O que Entra, o que Não Entra e Justificativa da Agregação

### 2.1 O que entra no selo público
- **Metadados globais:** `versaoEsquema` (`1.4.0`), `geradoEm` (reproduzindo exatamente o timestamp do selo completo para assegurar idempotência), `semente` (`20261110`), `politicaSemente` (`dinamica-registrada`), `gitCommit` (`3b54177e3a716590c76443da784535be2eff55ba`), `sha256ConjuntoCandidatos`, `hashIntegridade` (`15a5f1f38a3cf512`), `totalCandidatosEntrada` (`677`), `totalPoligonosSorteados` (`67`), `totalTreino` (`34`), `totalHeldOut` (`33`), `areaTotalHectares` (`336.34`), `limiaresS`, `limiaresE`, `contagemCandidatosPorEstrato`, `estratosCenso`, `estratosVazios`, `invariantesVerificados` e `decisoesVigentes`.
- **Tabela agregada por estrato:** 18 registros contendo `estratoId`, `nCandidatos` ($N_h$), `nSorteados` ($n_h$), `pi_i`, `w_i`, `regime` (`amostra`, `censo` ou `vazio`), `nTreino`, `nHeldOut` e `areaHectares`.
- **Vínculo Criptográfico:** `sha256SeloCompleto` (`ee1a8d82dbdbe4ae604817b65012771a983042a4ee764032e30bfe5154ab0f3c`), permitindo conferência imediata sob sigilo ou após o descegamento de campo.
- **Declaração Formal de Natureza:** Aviso textual obrigatório ressaltando o caráter derivado e redigido do documento.

### 2.2 O que NÃO entra, em hipótese alguma
Estão categoricamente expurgados: `idPoligono`, `idCandidatoOrigem`, `codigoOpacoVant`, `centroide`, `geometria`, `declividadePct`, `frequenciaSoloNu`, `nivelK`, `kAmbiguoAssociacao`, `unidadeDeterminanteK2024`, `poligonos`, `tabelaCorrespondenciaOpaca`, `pontoEmFronteiraPedologica`, e qualquer lista linha a linha por polígono.

### 2.3 Por que agregar por estrato em vez de linhas anônimas
Linhas anônimas por polígono preservariam a ordenação relativa do sorteio. Qualquer informação contextual externa parcial permitiria correlações indesejadas e quebra lateral do cegamento. Como $\pi_i$ e $w_i$ são, por definição matemática da amostragem estratificada, constantes dentro de cada estrato $h$, a agregação por estrato conserva **todas as propriedades probatórias e os oito invariantes matemáticos** sem oferecer qualquer vetor de correlação observacional.

---

## 3. Tabela Consolidada dos 18 Estratos (D12 / D16)

A tabela abaixo reproduz os 18 estratos agregados a partir de `docs/verificacoes/selo_publico_d16_2026-11-10.json`:

| Estrato | População ($N_h$) | Polígonos ($n_h$) | Treino | Held-Out | $\pi_i$ | $w_i$ | $\pi_i \times w_i$ | Área (ha) | Regime |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| `E_1_1_1` | 41 | 4 | 2 | 2 | 0,0976 | 10,2500 | 1,0000 | 20,08 | Amostra ($N_h > 4$) |
| `E_1_1_2` | 6 | 4 | 2 | 2 | 0,6667 | 1,5000 | 1,0000 | 20,08 | Amostra ($N_h > 4$) |
| `E_1_2_1` | 86 | 4 | 2 | 2 | 0,0465 | 21,5000 | 1,0000 | 20,08 | Amostra ($N_h > 4$) |
| `E_1_2_2` | 3 | 3 | 2 | 1 | 1,0000 | 1,0000 | 1,0000 | 15,06 | **Censo Integral** ($N_h = 3 < 4$, sem suplentes) |
| `E_1_3_1` | 91 | 4 | 2 | 2 | 0,0440 | 22,7500 | 1,0000 | 20,08 | Amostra ($N_h > 4$) |
| `E_1_3_2` | 0 | 0 | 0 | 0 | — | — | — | 0,00 | **Estrato Vazio Declarado** ($N_h = 0$) |
| `E_2_1_1` | 43 | 4 | 2 | 2 | 0,0930 | 10,7500 | 1,0000 | 20,08 | Amostra ($N_h > 4$) |
| `E_2_1_2` | 6 | 4 | 2 | 2 | 0,6667 | 1,5000 | 1,0000 | 20,08 | Amostra ($N_h > 4$) |
| `E_2_2_1` | 80 | 4 | 2 | 2 | 0,0500 | 20,0000 | 1,0000 | 20,08 | Amostra ($N_h > 4$) |
| `E_2_2_2` | 4 | 4 | 2 | 2 | 1,0000 | 1,0000 | 1,0000 | 20,08 | **Censo Limite** ($N_h = 4$, sem suplentes) |
| `E_2_3_1` | 88 | 4 | 2 | 2 | 0,0455 | 22,0000 | 1,0000 | 20,08 | Amostra ($N_h > 4$) |
| `E_2_3_2` | 4 | 4 | 2 | 2 | 1,0000 | 1,0000 | 1,0000 | 20,08 | **Censo Limite** ($N_h = 4$, sem suplentes) |
| `E_3_1_1` | 79 | 4 | 2 | 2 | 0,0506 | 19,7500 | 1,0000 | 20,08 | Amostra ($N_h > 4$) |
| `E_3_1_2` | 51 | 4 | 2 | 2 | 0,0784 | 12,7500 | 1,0000 | 20,08 | Amostra ($N_h > 4$) |
| `E_3_2_1` | 50 | 4 | 2 | 2 | 0,0800 | 12,5000 | 1,0000 | 20,08 | Amostra ($N_h > 4$) |
| `E_3_2_2` | 4 | 4 | 2 | 2 | 1,0000 | 1,0000 | 1,0000 | 20,08 | **Censo Limite** ($N_h = 4$, sem suplentes) |
| `E_3_3_1` | 35 | 4 | 2 | 2 | 0,1143 | 8,7500 | 1,0000 | 20,08 | Amostra ($N_h > 4$) |
| `E_3_3_2` | 6 | 4 | 2 | 2 | 0,6667 | 1,5000 | 1,0000 | 20,08 | Amostra ($N_h > 4$) |
| **Total** | **677** | **67** | **34** | **33** | — | — | — | **336,34** | **34 Treino / 33 Held-Out / 336,34 ha** |

---

## 4. Prova de Versionabilidade Git (`git check-ignore`)

A conformidade do destino frente ao `.gitignore` foi comprovada por execução do comando:
```bash
git check-ignore -v docs/verificacoes/selo_publico_d16_2026-11-10.json
```
- **Saída:** Nenhuma (código de saída 1).
- **Conclusão:** O arquivo **NÃO** está ignorado pelo Git e é 100% versionável, residindo fora da pasta protegida `docs/verificacoes/sorteio/`.
- Registro arquivado em `docs/verificacoes/execucao/2026-11-11l/check_ignore_selo_publico.txt`.

---

## 5. Resultados das Travas Automatizadas (`src/lib/seguranca/seloPublicoD16.test.ts`)

A suíte de testes dedicados foi executada e obteve 100% de aprovação (10 testes aprovados):

1. **Trava 1 — Lista de Proibidos Recursiva (Executa sempre em qualquer clone):**
   - Varreu o arquivo JSON em todas as profundidades. Nenhuma chave proibida (`idPoligono`, `codigoOpacoVant`, etc.) foi encontrada.
   - Nenhuma string contém prefixos `VANT-BLIND-`, `cand-` ou IDs de polígono.
   - Declaração formal de natureza validada textualmente.
   - Status: **APROVADO**.
2. **Trava 2 — Nenhuma Coordenada Geográfica (Executa sempre em qualquer clone):**
   - Varreu todos os números presentes no JSON. Nenhum valor numérico recai no intervalo $[-26, -23]$ (latitude da BP3) ou $[-55, -53]$ (longitude da BP3).
   - Status: **APROVADO**.
3. **Trava 3 — Equivalência Estrita de Totais (Executa onde o selo completo existe; pula em clone limpo):**
   - No ambiente atual, o selo completo existe. Todos os totais globais e as somas por estrato ($N_h$, $n_h$, treino, held-out, hectares) coincidem bit-a-bit com o selo completo.
   - Em clones limpos de auditoria sem o selo completo, o teste é pulado automaticamente com aviso explicativo, em conformidade com o padrão `*.vivo.test.ts`.
   - Status: **APROVADO**.
4. **Trava 4 — Vínculo Íntegro de SHA-256 (Executa onde o selo completo existe; pula em clone limpo):**
   - O campo `sha256SeloCompleto` do selo público foi recalculado diretamente sobre os bytes do arquivo em disco (`ee1a8d82dbdbe4ae604817b65012771a983042a4ee764032e30bfe5154ab0f3c`).
   - Status: **APROVADO**.
5. **Trava 5 — Idempotência Estrita (Executa onde o selo completo existe; pula em clone limpo):**
   - Gerações sucessivas produzem arquivos idênticos bit-a-bit (`JSON.stringify(s1) === JSON.stringify(s2)`).
   - Status: **APROVADO**.

---

## 6. Integridade do Repositório e Invariância da Guarda K2

- O selo completo `docs/verificacoes/sorteio/sorteio_d16_2026-11-10.json` permaneceu **inalterado** (SHA-256 idêntico ao medido antes e após a geração do público).
- O arquivo `.gitignore` permaneceu **inalterado**, mantendo o isolamento K2 sobre `docs/verificacoes/sorteio/`.
- Nenhum sorteio foi reexecutado e nenhuma semente foi alterada (D23 estritamente preservado).
