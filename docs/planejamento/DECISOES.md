# Registro de Decisões Metodológicas — SAREL

**Espelho legível de `src/config/decisoes.ts`.**
Última atualização: 2026-09-10 (Fase −1).

> **Regra 9.** Todo parâmetro metodológico tem dono e registro. Decisão pendente → `indisponivel` com `causa: "decisao-pendente"` e o ID. Somente o pesquisador muda uma decisão para `"decidida"`.

---

## Decisão Tomada

### D01 — Fórmula do Fator C: Durigon et al. (2014)

| Campo | Valor |
|---|---|
| **Estado** | ✅ **Decidida** |
| **Valor** | C = (1 − NDVI) / 2 |
| **Referência** | Durigon, V.T. et al. (2014). NDVI time series for monitoring RUSLE cover management factor in a tropical watershed. *International Journal of Remote Sensing*, 35(2), 441–453. |
| **Justificativa** | Validade regional (bacia tropical brasileira); concebida para série temporal; sem parâmetros livres; sem truncamento (C ∈ [0,1] para NDVI ∈ [−1,1]); proveniência limpa (sem extensão por BSI). |
| **Decidido por** | Pesquisador |
| **Decidido em** | 2026-09-08 |

**Limitação declarada:** resposta linear em NDVI e saturação do NDVI sob biomassa densa comprimem a faixa de C em dossel fechado. Prevista análise de sensibilidade com van der Knijff (Fase 8).

---

## Decisões Pendentes 🛑

### D02 — Critérios observacionais de presente/ausente

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Fase 0 e tudo que depende do rótulo |
| **O agente entrega** | Apoio à redação da ficha KoboToolbox |

---

### D03 — Escala do rótulo (binária vs ordinal)

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Enum `ClasseRotulo`, ficha Kobo |
| **O agente entrega** | Apoio técnico |
| **Nota** | `ausente / incipiente / moderada / severa` é provisória |

---

### D04 — Modelo D (detecção) e/ou Modelo P (predição) e intervalo de guarda

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Janela da série (Fase 3) e montagem da matriz (Fase 6) |
| **O agente entrega** | Demonstração da diferença de janela em um ponto real |
| **Sugestão planejamento v3** | Intervalo de guarda de 2 anos para Modelo P |

---

### D05 — Extensão da série: Sentinel-2 (~2017+) ou inclui Landsat (1984+)

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Fase 3 |
| **O agente entrega** | Contagem de observações válidas por ponto em cada opção, numa AOI real |

---

### D06 — Unidade de predição: pixel 10 m, 30 m ou talhão

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Fases 3, 4 e 6 |
| **O agente entrega** | Análise de viabilidade |

---

### D07 — Domínio de validade (declividade, uso do solo)

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Elegibilidade (Fase 4) e redação |
| **O agente entrega** | Fração da AOI excluída por cada critério |

---

### D08 — Tratamento de associação pedológica

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Fase 2 |
| **O agente entrega** | Fração de pontos em associação numa AOI real |
| **Proposta planejamento v3** | Usar `ordem_1` e propagar `tipo_unida` como confiança média |

---

### D09 — Mapa ordinal das classes de erodibilidade e corte em 2 níveis de K̂

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Fase 2 (mapa) e Fase 4 (K̂) |
| **O agente entrega** | Enumeração do domínio completo com evidência e ao menos 2 propostas de mapa |
| **Nota** | codnum NÃO é ordinal — contém "Área urbana" (codnum 9) |

---

### D10 — Limiar de NDVI para "solo descoberto"

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Fases 3 e 4 |
| **O agente entrega** | Valores da literatura com citação conferida na fonte e sensibilidade de Ê a ±0,05 |

---

### D11 — Cobertura temporal mínima (nº mínimo de observações válidas)

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Elegibilidade (Fase 4) |
| **O agente entrega** | Distribuição do nº de observações válidas numa AOI real; relação com nº de parâmetros do modelo harmônico |

---

### D12 — Dimensões da estratificação

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Fase 4 |
| **O agente entrega** | Ocupação dos estratos em cada opção, numa AOI real |
| **Base** | Ŝ × Ê × K̂ (18 estratos); planejamento v3 §7.2 sugere ampliar com erosividade e/ou uso |

---

### D13 — Formulação do Fator R (critério de evento, energia cinética, agregação)

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Fase 8 e feature de mecanismo |
| **O agente entrega** | Alternativas da literatura com referência conferida (Brown & Foster 1987; Waltrick et al. 2015) |

---

### D14 — Fator K numérico para a linha de base RUSLE

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Fase 8 |
| **O agente entrega** | Origem documental possível de valores de K e o que cada uma exige |
| **Nota** | A carta da Embrapa dá classe; a RUSLE exige número |

---

### D15 — Fator LS: método de acúmulo e expoentes m e n

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Fase 8 |
| **O agente entrega** | Alternativas (Moore & Burch 1986; Desmet & Govers 1996) e sensibilidade |

---

### D16 — Quantidade viável de pontos de campo e voos de drone

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Tamanho amostral, Fases 4 e 6 |
| **O agente entrega** | Dimensionamento logístico |

---

### D17 — Ciclo da cota Planet (mensal ou total)

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Fase 5 |
| **O agente entrega** | Evidência da verificação via API |
| **Nota** | Se o ciclo é total (não mensal), o orçamento muda por fator de 24× |

---

### D18 — Buffer do recorte Planet

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Fase 5 |
| **O agente entrega** | Tabela de consumo por buffer |
| **Sugestão** | 250 m |

---

### D19 — Quantidade de pontos com pares de evento

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Fase 5 |
| **O agente entrega** | Resultado do script de viabilidade |
| **Dependências** | D17 e D18 |

---

## Parâmetros Operacionais

| ID | Parâmetro | Valor | Estado | Origem |
|---|---|---|---|---|
| P01 | Aresta do bloco espacial | Derivada do variograma; fallback 20 km | Proposta | Roberts et al. (2017) — fallback provisório |
| P02 | Espaçamento mínimo do *thinning* | 1 km | Proposta | Localizador `spatialThinning` |
| P03 | Raio de casamento Kobo | 150 m | Proposta | Localizador `koboParser.ts` |
| P04 | Buffers de exclusão (água / urbano) | 30 m / 150 m / 10% | Proposta | Localizador `eligibilityConstants.ts` |
| P05 | Classes elegíveis ESA WorldCover | 30, 40, 60 | Proposta | Planejamento v3 §7.1 |
| P06 | Fração limpa mínima (UDM2) | A definir | Pendente | Fase 5 |
| P07 | Semente aleatória | Registrada a cada execução | Obrigatório | Reprodutibilidade |
| P08 | Limiar do alerta de baixa variância | A propor | Pendente | Fase 1 |
| P09 | Método de máscara de nuvem Sentinel-2 | A formalizar | Proposta | Fase 3 |
