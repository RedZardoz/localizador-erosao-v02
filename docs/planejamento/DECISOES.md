# Registro de Decisões Metodológicas — SAREL

**Espelho legível de `src/config/decisoes.ts`.**  
Última atualização: 2026-09-22.

> **Regra 9.** Todo parâmetro metodológico tem dono e registro. Decisão pendente → `indisponivel` com `causa: "decisao-pendente"` e o ID. Somente o pesquisador muda uma decisão para `"decidida"`.

---

## Decisões Tomadas ✅

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

### D04 — Modelo D (detecção) e Modelo P (predição) e intervalo de guarda temporal

| Campo | Valor |
|---|---|
| **Estado** | ✅ **Decidida** |
| **Valor** | Ambos os modelos integrados: Modelo D para detecção contemporânea de feições ativas (t0) e Modelo P para predição prospectiva de risco com intervalo de guarda temporal estrito de 2 anos (24 meses) encerrado antes da data do evento. |
| **Referência** | Kaufman, S., Rosset, S., Perlich, C., & Stitelman, O. (2012). Leakage in data mining: Formulation, detection, and avoidance. *ACM Transactions on Knowledge Discovery from Data (TKDD)*, 6(4), 15; Embrapa Soja (Sistemas de Produção: Rotação Bienal de Culturas no Paraná; Franchini et al., 2011). |
| **Justificativa** | O intervalo de guarda de 2 anos obedece ao princípio de 'learn-predict separation' de Kaufman et al. (2012), eliminando o vazamento de dados temporal (*data leakage*). Agronomicamente, corresponde ao ciclo fenológico bienal completo do Sistema Plantio Direto paranaense (Soja no verão / Milho safrinha e Trigo no inverno). Amostragens orbitais com intervalo inferior a 24 meses amostram a mesma fase do manejo cultural e o mesmo resíduo, gerando dependência espúria e overfitting temporal no XGBoost. |
| **Decidido por** | Pesquisador |
| **Decidido em** | 2026-09-22 |

---

### D09 — Mapa ordinal das classes de erodibilidade e corte em 2 níveis de K̂

| Campo | Valor |
|---|---|
| **Estado** | ✅ **Decidida** |
| **Valor** | Domínio agrícola estrito [1..5] conforme escala Embrapa Solos. Classes 1 a 5 mapeadas ordinalmente (1: 'Muito baixa', 2: 'Baixa', 3: 'Média', 4: 'Alta', 5: 'Muito alta'). Classes não-agrícolas (6: 'Fase erodida', 7: 'Dunas', 8: 'Afloramentos de rochas', 9: 'Corpos d\'água') excluídas por máscara ou marcadas como `indisponivel` (`causa: "fora-do-dominio"`).<br/>**Corte K̂ para estratificação amostral:** Nível 1 = Baixa/Média erodibilidade (classes 1 a 3, correspondendo a K ≤ 0,0285 t·h·MJ⁻¹·mm⁻¹); Nível 2 = Alta/Muito alta erodibilidade (classes 4 e 5, correspondendo a K ≥ 0,0300 t·h·MJ⁻¹·mm⁻¹). |
| **Referência** | Coelho, M.R. et al. (2024). *Erodibilidade dos solos do Brasil*. Documentos 246, Embrapa Solos, Rio de Janeiro, 38 p. (Tabela 5, páginas 13 a 15). Disponível em: http://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/1170044; Mannigel, E. et al. (2002). Fator erodibilidade de solos do estado de São Paulo. *Revista Brasileira de Ciência do Solo*, 26:1039–1049. |
| **Justificativa** | Adoção da Proposta A com respaldo normativo oficial da Embrapa Solos (Doc. 246/2024) e validação pedológica de Mannigel et al. (2002), garantindo que a estratificação amostral K̂ reflita as descontinuidades reais de erodibilidade dos solos agrícolas brasileiros. |
| **Decidido por** | Pesquisador |
| **Decidido em** | 2026-09-22 |

---

### D10 — Limiar de NDVI para solo descoberto

| Campo | Valor |
|---|---|
| **Estado** | ✅ **Decidida** |
| **Valor** | NDVI ≤ 0,25 (combinado com BSI > 0,10 quando aplicável na assinatura espectral) |
| **Referência** | Demattê, J.A.M., Fongaro, C.T., Rizzo, R., Safanelli, J.L. (2018). Geospatial Soil Sensing System (GEOS3): A powerful data mining procedure to retrieve soil spectral reflectance from satellite images. *Remote Sensing of Environment*, 212, 161–175; Safanelli, J.L., Demattê, J.A.M. et al. (2021). Fine-scale soil mapping with Earth Observation data: a multiple geographic level comparison. *Revista Brasileira de Ciência do Solo*, 45:e0210080. |
| **Justificativa** | Calibrado no sistema GEOS3 (GeoCiS/ESALQ-USP) para solos brasileiros sob imagens orbitais (Landsat e Sentinel-2). O limiar estrito de NDVI ≤ 0,25 garante a discriminação precisa entre solo exposto/descoberto sujeito a impacto direto de gotas (*splash*) e superfícies protegidas por palhada densa de Plantio Direto ou cobertura vegetal viva, mitigando falsos positivos na frequência de solo descoberto (Ê). |
| **Decidido por** | Pesquisador |
| **Decidido em** | 2026-09-22 |

---

### D14 — Fator K numérico para a linha de base RUSLE

| Campo | Valor |
|---|---|
| **Estado** | ✅ **Decidida** |
| **Valor** | Conversão tabular oficial da Tabela 5 da Embrapa Solos (Documentos 246/2024) fundamentada em Mannigel et al. (2002) e IBGE (2018):<br/>• **Muito baixa (1,0 a 1,4):** K = 0,0020 a 0,0084 t·h·MJ⁻¹·mm⁻¹ (média ~0,0052)<br/>• **Baixa (1,5 a 2,4):** K = 0,0090 a 0,0144 t·h·MJ⁻¹·mm⁻¹ (média ~0,0117)<br/>• **Média (2,5 a 3,4):** K = 0,0150 a 0,0285 t·h·MJ⁻¹·mm⁻¹ (média ~0,0218)<br/>• **Alta (3,5 a 4,4):** K = 0,0300 a 0,0420 t·h·MJ⁻¹·mm⁻¹ (média ~0,0360)<br/>• **Muito alta (4,5 a 5,4):** K = 0,0450 a 0,0585 t·h·MJ⁻¹·mm⁻¹ (média ~0,0518) |
| **Referência** | Coelho, M.R. et al. (2024). *Erodibilidade dos solos do Brasil*. Documentos 246, Embrapa Solos, Rio de Janeiro, 38 p. (Tabela 5, páginas 13 a 15). Disponível em: http://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/1170044; Mannigel, E. et al. (2002). Fator erodibilidade de solos do estado de São Paulo. *Revista Brasileira de Ciência do Solo*, 26:1039–1049; IBGE (2018). *Manual Técnico de Pedologia*. |
| **Justificativa** | Resolve a incompatibilidade entre a carta da Embrapa Solos (que fornece classes ordinais qualitativas) e a equação da RUSLE (que exige valores numéricos contínuos de K). A conversão padronizada pela Embrapa elimina estimativas arbitrárias e ancora a linha de base empírica da pesquisa na literatura pedológica brasileira consolidada. |
| **Decidido por** | Pesquisador |
| **Decidido em** | 2026-09-22 |

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

### D05 — Extensão da série: Sentinel-2 (~2017+) ou inclui Landsat (1984+)

| Campo | Valor |
|---|---|
| **Estado** | 🔴 Pendente |
| **Trava** | Fase 3 |
| **O agente entrega** | Contagem de observações válidas por ponto em cada opção, numa AOI real |

---

### D06 — Unidade de predição: pixel 10 m calibrado por VANT Multiespectral

| Campo | Valor |
|---|---|
| **Estado** | 🟢 Decidida (2026-09-22) |
| **Valor Adotado** | Pixel Sentinel-2 de 10 m com calibração sub-métrica e confronto radiométrico pelo VANT Multiespectral Spectral 2 (Nuvem UAV) — 5 bandas calibradas (Azul, Verde, Vermelho, RedEdge, NIR), PPK/RTK centimétrico e GSD 3 a 7,5 cm — em 4 polígonos contínuos de 10 a 50 ha (Céu Azul e Medianeira) |
| **Justificativa** | Elimina a subjetividade de vetorização manual de microparcelas, viabiliza o confronto radiométrico direto (Pearson $r$) entre satélite e drone, e captura o gradiente topo-sequencial completo da catena agrícola (topo, encosta e baixada). |
| **Referência** | Metodologia PPGTCA 2026, Seções 3.1 e 3.2; Nuvem UAV (2024) |

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
| **Estado** | 🟡 Proposta detalhada |
| **Trava** | Fase 2 |
| **O agente entrega** | Regra implementada em `embrapaSoilClient.ts`: componente dominante `ordem_1` utilizado como valor pedológico base, atribuindo `confiancaPedologica = "media"` quando `tipoUnidade = "associacao"`, e `"alta"` quando `tipoUnidade = "simples"`. Preserva a integralidade científica sem inventar resolução espacial inexistente na carta. |
| **Proposta planejamento v3** | Usar `ordem_1` e propagar `tipo_unida` como confiança média |

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
| **Estado** | 🟢 Decidida (2026-09-22) |
| **Valor Adotado** | 4 sítios contínuos de referência territorial (10 a 50 ha cada) em Céu Azul e Medianeira voados com o VANT Multiespectral Spectral 2 (Nuvem UAV, 5 bandas, PPK/RTK) mantidos estritamente como held-out, combinados com 120 a 180 pontos de inspeção presencial via formulário KoboCollect sob protocolo cego. |
| **Justificativa** | Garante cobertura exaustiva da variabilidade pedológica e topográfica da Bacia do Paraná 3, respeitando as restrições logísticas de campo e preservando a segregação cega de dados. |
| **Referência** | Metodologia PPGTCA 2026, Seções 3.2 e 3.3 |

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
| P03 | Raio de casamento geodésico Kobo | 15 m nominal (tolerância até 25 m sob aviso; rejeição estrita se > 25 m) | 🟢 Decidida | Congalton & Green (2019); LUCAS (2022) |
| P04 | Buffers de exclusão (água / urbano) | 30 m / 150 m / 10% | Proposta | Localizador `eligibilityConstants.ts` |
| P05 | Classes elegíveis ESA WorldCover | 30, 40, 60 | Proposta | Planejamento v3 §7.1 |
| P06 | Fração limpa mínima (UDM2) | A definir | Pendente | Fase 5 |
| P07 | Semente aleatória | Registrada a cada execução | Obrigatório | Reprodutibilidade |
| P08 | Limiar do alerta de baixa variância | A propor | Pendente | Fase 1 |
| P09 | Método de máscara de nuvem Sentinel-2 | A formalizar | Proposta | Fase 3 |
