# Registro de Decisões Metodológicas — SAREL

**Espelho legível e auditável de `src/config/decisoes.ts`.**  
Última atualização: 2026-09-23.

> **Regra 9 do SAREL (Governança Metodológica):**  
> Todo parâmetro metodológico tem dono e registro. Decisão pendente gera estado `indisponivel` com causa `"decisao-pendente"` e o respectivo ID. **Somente o pesquisador tem autoridade para mudar uma decisão para `"decidida"`.**

---

## 1. Quadro Resumo de Decisões Metodológicas

| ID | Título da Decisão | Estado | Valor / Diretriz Adotada | Decidido Em |
|:---|:---|:---:|:---|:---:|
| **D01** | Fórmula do Fator C | ✅ Decidida | $C = (1 - \text{NDVI}) / 2$ (Durigon et al., 2014) | 2026-09-08 |
| **D02** | Critérios observacionais presente/ausente | ✅ Decidida | Amostragem estratificada pura: Classe 1 (Erosão: BSI > 0,10 e NDVI < 0,40) vs Classe 0 (Controle/SPD: BSI < 0,00 e NDVI > 0,65) | 2026-09-13 |
| **D03** | Escala do rótulo | ✅ Decidida | Binária estrita (0: Controle/Não-Erosão em SPD; 1: Erosão Laminar Ativa) | 2026-09-13 |
| **D04** | Modelos D e P e Guarda Temporal | ✅ Decidida | Modelo D (detecção $t_0$) e Modelo P (predição com guarda temporal de 24 meses / bienal) | 2026-09-22 |
| **D05** | Extensão da série temporal | 🛑 Proposta Madura | Série Sentinel-2 MSI (2016–2026) a 10 m; Landsat restrito a contextualização histórica | Proposta |
| **D06** | Unidade de predição e calibração VANT | ✅ Decidida | Pixel Sentinel-2 de 10 m calibrado por VANT Spectral 2 (5 bandas, PPK/RTK, GSD 3–7,5 cm) em 4 sítios contínuos | 2026-09-22 |
| **D07** | Domínio de validade | 🛑 Proposta Madura | Declividade 3% a 20% (relevo suave ondulado a ondulado) e uso agrícola de grãos/pastagem cultivada | Proposta |
| **D08** | Tratamento de associação pedológica | 🛑 Proposta Madura | Componente dominante `ordem_1` com propagação de confiança pedológica `"media"` | Proposta |
| **D09** | Classes de erodibilidade e corte em 2 níveis | ✅ Decidida | Domínio agrícola [1..5] Embrapa Solos (Doc. 246/2024); Corte $\hat{K}$: Nível 1 ($\le 0,0285$) e Nível 2 ($\ge 0,0300$) | 2026-09-22 |
| **D10** | Limiar de NDVI para solo descoberto | ✅ Decidida | $\text{NDVI} \le 0,25$ combinado com $\text{BSI} > 0,10$ (GEOS3 / Demattê et al., 2018) | 2026-09-22 |
| **D11** | Cobertura temporal mínima de observações | ✅ Decidida | Mínimo de 6 observações orbitais válidas (livres de nuvem/sombra) por ponto/janela | 2026-09-13 |
| **D12** | Dimensões da estratificação amostral | 🛑 Proposta Madura | 18 estratos canônicos ($3\hat{S} \times 3\hat{E} \times 2\hat{K}$) com ocupação equilibrada e *thinning* | Proposta |
| **D13** | Formulação do Fator R (Erosividade) | 🛑 Proposta Madura | Equação de erosividade regional do Paraná (Waltrick et al., 2015 / Oliveira et al., 2013) baseada em série de precipitação | Proposta |
| **D14** | Fator K numérico para linha de base | ✅ Decidida | Tabela 5 Embrapa Solos (Doc. 246/2024) fundamentada em Mannigel et al. (2002) | 2026-09-22 |
| **D15** | Fator LS (Topografia RUSLE) | 🛑 Proposta Madura | Algoritmo Desmet & Govers (1996) e McCool et al. (1989) projetado estritamente em EPSG:31982 | Proposta |
| **D16** | Estratégia de campo e voos VANT | ✅ Decidida | 4 sítios contínuos de 10 a 50 ha (*held-out* inviolável) + 120 a 180 pontos de inspeção KoboCollect sob protocolo cego | 2026-09-22 |
| **D17** | Ciclo da cota PlanetScope | 🛑 Proposta Madura | Quota de pesquisa acadêmica em volume de área acumulada total (não renovável mensalmente) | Proposta |
| **D18** | Buffer do recorte PlanetScope | 🛑 Proposta Madura | Raio de buffer de 250 m ao redor do centróide (cobre $\approx 19,6$ ha, compatível com a escala do talhão) | Proposta |
| **D19** | Quantidade de pontos com pares de evento | 🛑 Proposta Madura | Subconjunto de 40 a 60 pontos amostrais pareados pré/pós evento erosivo pluviométrico | Proposta |

---

## 2. Decisões Tomadas ✅ (Formalizadas pelo Pesquisador)

### D01 — Fórmula do Fator C: Durigon et al. (2014)

| Campo | Valor |
|---|---|
| **Estado** | ✅ **Decidida** |
| **Valor Adotado** | $C = \frac{1 - \text{NDVI}}{2}$ |
| **Referência** | Durigon, V.T. et al. (2014). NDVI time series for monitoring RUSLE cover management factor in a tropical watershed. *International Journal of Remote Sensing*, 35(2), 441–453. |
| **Justificativa** | Validade regional comprovada para bacias agrícolas tropicais e subtropicais brasileiras; concebida nativamente para séries temporais de sensoriamento remoto; sem parâmetros livres ou empíricos adicionais; mapeamento contínuo estrito $C \in [0, 1]$ para $\text{NDVI} \in [-1, 1]$ sem truncamento artificial; proveniência computacional rastreável. |
| **Decidido por** | Pesquisador |
| **Decidido em** | 2026-09-08 |

*Limitação metodológica declarada:* Resposta linear e saturação do NDVI sob biomassa vegetal densa comprimem a diferenciação de $C$ em estágios avançados de lavoura. Análise de sensibilidade comparativa contra van der Knijff et al. (2000) prevista na Fase 8.

---

### D02 — Critérios observacionais de presente/ausente e negativo explícito

| Campo | Valor |
|---|---|
| **Estado** | ✅ **Decidida** |
| **Valor Adotado** | Amostragem estratificada pura ancorada em contrastes biofísicos objetivos e reprodutíveis:<br/>• **Classe 1 (Erosão Laminar Ativa):** $\text{BSI} > 0,10$ e $\text{NDVI} < 0,40$, presença de selamento superficial e descontinuidade de horizontes pedológicos.<br/>• **Classe 0 (Controle / Plantio Direto Estável):** $\text{BSI} < 0,00$ e $\text{NDVI} > 0,65$, com presença contínua de palhada/cobertura vegetal viva sem sinais de arraste laminar de sedimentos. |
| **Referência** | Metodologia PPGTCA 2026, Seções 3.1 e 3.3; Dieckow et al. (2009); Embrapa Soja (Franchini et al., 2011). |
| **Justificativa** | A classificação supervisionada requer contraste biofísico nítido e verificável entre a feição degradada e o estado de conservação do solo. A adoção de limiares espectrais corroborados por evidências de campo elimina ambiguidades e previne contaminação entre classes. |
| **Decidido por** | Pesquisador |
| **Decidido em** | 2026-09-13 |

---

### D03 — Escala do rótulo: Binária estrita

| Campo | Valor |
|---|---|
| **Estado** | ✅ **Decidida** |
| **Valor Adotado** | Escala Binária Estrita: `0` = Controle / Ausência de Erosão em SPD; `1` = Presença de Erosão Laminar Ativa. |
| **Referência** | Metodologia PPGTCA 2026, Seções 3.1 e 5; Chen & Guestrin (2016) — XGBoost `binary:logistic`. |
| **Justificativa** | A escala ordinal preliminar (`ausente / incipiente / moderada / severa`) introduz alta subjetividade na estimativa visual de campo (variabilidade interobservador). A escala binária maximiza o rigor de separabilidade biofísica, ancora-se diretamente no algoritmo XGBoost com função de perda logística e viabiliza validação direta de alta resolução via ortomosaicos VANT. |
| **Decidido por** | Pesquisador |
| **Decidido em** | 2026-09-13 |

---

### D04 — Modelo D (detecção), Modelo P (predição) e intervalo de guarda temporal

| Campo | Valor |
|---|---|
| **Estado** | ✅ **Decidida** |
| **Valor Adotado** | Arquitetura dual integrada:<br/>• **Modelo D (Detecção):** Identificação contemporânea de feições ativas no instante $t_0$.<br/>• **Modelo P (Predição Prospectiva de Risco):** Predição de suscetibilidade futura impondo intervalo de guarda temporal (*embargo*) estrito de 2 anos (24 meses) encerrado antes da data do evento. |
| **Referência** | Kaufman, S., Rosset, S., Perlich, C., & Stitelman, O. (2012). Leakage in data mining: Formulation, detection, and avoidance. *ACM TKDD*, 6(4), 15; Embrapa Soja (Franchini et al., 2011). |
| **Justificativa** | Obedece rigorosamente ao princípio de *learn-predict separation* de Kaufman et al. (2012), eliminando o vazamento de dados temporal (*data leakage*). Agronomicamente, coincide com a rotação bienal completa do Sistema Plantio Direto paranaense (Soja no verão / Milho safrinha e Trigo no inverno). Amostragens com intervalo inferior a 24 meses amostram a mesma fase de manejo cultural e mesmo resíduo, induzindo autocorrelação espúria no gradiente descendente do XGBoost. |
| **Decidido por** | Pesquisador |
| **Decidido em** | 2026-09-22 |

---

### D06 — Unidade de predição: pixel 10 m calibrado por VANT Multiespectral

| Campo | Valor |
|---|---|
| **Estado** | ✅ **Decidida** |
| **Valor Adotado** | Pixel Sentinel-2 de 10 m com calibração sub-métrica e confronto radiométrico direto pelo VANT Multiespectral Spectral 2 (Nuvem UAV) — 5 bandas calibradas (Azul, Verde, Vermelho, RedEdge, NIR), sensor de irradiância solar DLS, georreferenciamento PPK/RTK centimétrico e GSD de 3 a 7,5 cm — em 4 polígonos contínuos de 10 a 50 ha (Céu Azul e Medianeira). |
| **Referência** | Metodologia PPGTCA 2026, Seções 3.1 e 3.2; Nuvem UAV (2024); Congalton & Green (2019). |
| **Justificativa** | Elimina a subjetividade e os erros de borda da vetorização manual de microparcelas isoladas; viabiliza o confronto radiométrico direto (correlação de Pearson $r$) entre a reflectância de satélite e a do drone; captura o gradiente toposequencial completo da catena agrícola (topo, meia-encosta e sopé). |
| **Decidido por** | Pesquisador |
| **Decidido em** | 2026-09-22 |

---

### D09 — Mapa ordinal das classes de erodibilidade e corte em 2 níveis de K̂

| Campo | Valor |
|---|---|
| **Estado** | ✅ **Decidida** |
| **Valor Adotado** | Domínio agrícola estrito [1..5] conforme escala Embrapa Solos. Classes ordinais de 1 a 5 mapeadas diretamente:<br/>1: 'Muito baixa', 2: 'Baixa', 3: 'Média', 4: 'Alta', 5: 'Muito alta'.<br/>Classes não-agrícolas (6 a 9: afloramentos, dunas, corpos d'água) são excluídas por máscara ou marcadas como `indisponivel` (`causa: "fora-do-dominio"`).<br/>**Corte K̂ para estratificação amostral:** Nível 1 = Baixa/Média erodibilidade (classes 1 a 3, $K \le 0,0285\ \text{t}\cdot\text{h}\cdot\text{MJ}^{-1}\cdot\text{mm}^{-1}$); Nível 2 = Alta/Muito alta erodibilidade (classes 4 e 5, $K \ge 0,0300\ \text{t}\cdot\text{h}\cdot\text{MJ}^{-1}\cdot\text{mm}^{-1}$). |
| **Referência** | Coelho, M.R. et al. (2024). *Erodibilidade dos solos do Brasil*. Documentos 246, Embrapa Solos, Rio de Janeiro, 38 p. (Tabela 5, p. 13–15); Mannigel, E. et al. (2002). *RBCS*, 26:1039–1049. |
| **Justificativa** | Respaldo normativo oficial da Embrapa Solos (Doc. 246/2024), garantindo que os limites da estratificação amostral reflitam descontinuidades pedológicas reais da paisagem agrícola brasileira. |
| **Decidido por** | Pesquisador |
| **Decidido em** | 2026-09-22 |

---

### D10 — Limiar de NDVI para solo descoberto

| Campo | Valor |
|---|---|
| **Estado** | ✅ **Decidida** |
| **Valor Adotado** | $\text{NDVI} \le 0,25$ (combinado com $\text{BSI} > 0,10$ na identificação espectral de superfície). |
| **Referência** | Demattê, J.A.M. et al. (2018). Geospatial Soil Sensing System (GEOS3). *Remote Sensing of Environment*, 212:161–175; Safanelli, J.L. et al. (2021). *Revista Brasileira de Ciência do Solo*, 45:e0210080. |
| **Justificativa** | Calibrado no sistema GEOS3 (GeoCiS/ESALQ-USP) para solos tropicais sob imagens orbitais (Landsat e Sentinel-2). O limiar estrito $\text{NDVI} \le 0,25$ discrimina com precisão o solo exposto suscetível a salpicamento (*splash*) de áreas com palhada remanescente de Plantio Direto ou rebrota vegetal, eliminando falsos positivos na frequência de exposição ($\hat{E}$). |
| **Decidido por** | Pesquisador |
| **Decidido em** | 2026-09-22 |

---

### D11 — Cobertura temporal mínima de observações orbitais

| Campo | Valor |
|---|---|
| **Estado** | ✅ **Decidida** |
| **Valor Adotado** | Mínimo de 6 observações orbitais válidas (livres de nuvens e sombras pela máscara SCL) por ponto/janela temporal para aceitação na amostragem e análise de persistência temporal. |
| **Referência** | Metodologia PPGTCA 2026, Seção 6.1. |
| **Justificativa** | Exigência biofísica mínima para assegurar significância estatística na estimativa de tendências lineares no infravermelho SWIR (B12), na avaliação da recomposição da cobertura vegetal e no cálculo da frequência anual de solo descoberto. |
| **Decidido por** | Pesquisador |
| **Decidido em** | 2026-09-13 |

---

### D14 — Fator K numérico para a linha de base RUSLE

| Campo | Valor |
|---|---|
| **Estado** | ✅ **Decidida** |
| **Valor Adotado** | Conversão tabular oficial da Tabela 5 da Embrapa Solos (Documentos 246/2024), fundamentada em Mannigel et al. (2002):<br/>• **Muito baixa (1,0 a 1,4):** $K = 0,0020 \text{ a } 0,0084\ \text{t}\cdot\text{h}\cdot\text{MJ}^{-1}\cdot\text{mm}^{-1}$ (média $\approx 0,0052$)<br/>• **Baixa (1,5 a 2,4):** $K = 0,0090 \text{ a } 0,0144\ \text{t}\cdot\text{h}\cdot\text{MJ}^{-1}\cdot\text{mm}^{-1}$ (média $\approx 0,0117$)<br/>• **Média (2,5 a 3,4):** $K = 0,0150 \text{ a } 0,0285\ \text{t}\cdot\text{h}\cdot\text{MJ}^{-1}\cdot\text{mm}^{-1}$ (média $\approx 0,0218$)<br/>• **Alta (3,5 a 4,4):** $K = 0,0300 \text{ a } 0,0420\ \text{t}\cdot\text{h}\cdot\text{MJ}^{-1}\cdot\text{mm}^{-1}$ (média $\approx 0,0360$)<br/>• **Muito alta (4,5 a 5,4):** $K = 0,0450 \text{ a } 0,0585\ \text{t}\cdot\text{h}\cdot\text{MJ}^{-1}\cdot\text{mm}^{-1}$ (média $\approx 0,0518$) |
| **Referência** | Coelho, M.R. et al. (2024). *Erodibilidade dos solos do Brasil*. Documentos 246, Embrapa Solos, Rio de Janeiro, 38 p. (Tabela 5); Mannigel, E. et al. (2002). *RBCS*, 26:1039–1049. |
| **Justificativa** | Resolve a incompatibilidade entre as cartas pedológicas regionais (que fornecem classes ordinais qualitativas) e a formulação da RUSLE (que requer valores contínuos de $K$). Ancoragem estrita na literatura agronômica nacional oficial sem estimativas ad-hoc. |
| **Decidido por** | Pesquisador |
| **Decidido em** | 2026-09-22 |

---

### D16 — Campanha de campo e voos de drone de alta resolução

| Campo | Valor |
|---|---|
| **Estado** | ✅ **Decidida** |
| **Valor Adotado** | 4 sítios contínuos de referência territorial (10 a 50 ha cada) em Céu Azul e Medianeira, sobrevoados com VANT Multiespectral Spectral 2 (Nuvem UAV, 5 bandas calibradas, PPK/RTK centimétrico), mantidos estritamente como partição *held-out* inviolável, combinados com 120 a 180 pontos de inspeção presencial via formulário digital KoboCollect executado sob protocolo cego. |
| **Referência** | Metodologia PPGTCA 2026, Seções 3.2 e 3.3; Nuvem UAV (2024). |
| **Justificativa** | Assegura representatividade exaustiva da catena pedológica e geomorfológica da Bacia do Paraná 3, respeitando o cronograma operacional de campo e assegurando a blindagem contra vazamento de dados (*data leakage*). |
| **Decidido por** | Pesquisador |
| **Decidido em** | 2026-09-22 |

---

## 3. Parâmetros Operacionais Decididos ✅

### P03 — Tolerância Geodésica de Casamento Kobo vs Ponto Planejado
- **Estado:** ✅ **Decidida (2026-09-22, Pesquisador)**
- **Valor:** **15 m nominal** (com tolerância estendida de até 25 m sob aviso de qualidade; rejeição estrita e descarte para desvios $> 25\ \text{m}$).
- **Justificativa:** Readequado do raio preliminar de 150 m para 15 m (1,5 pixel do Sentinel-2), compatibilizando o modelo com a acurácia submétrica do GPS/GNSS de navegação (3 a 8 m) e o pixel de 10 m do Sentinel-2. O intervalo de 15 a 25 m acomoda desvios operacionais causados por obstáculos físicos em campo (valas, cercas, terraços agrícolas), enquanto desvios superiores a 25 m são sumariamente rejeitados para evitar contaminação do rótulo por pixels vizinhos.
- **Referência:** Congalton & Green (2019); LUCAS Survey (2022); Metodologia PPGTCA 2026, Seção 3.3.

### P07 — Semente Aleatória da Amostragem
- **Estado:** ✅ **Decidida (2026-09-08, Pesquisador)**
- **Valor:** `dinamica-registrada` (armazenada nos metadados de cada lote amostral para assegurar reprodutibilidade computacional exata).

---

## 4. Decisões em Aberto com Propostas Metodológicas Estruturadas 🛑

Para agilizar as decisões do pesquisador, as propostas abaixo foram integralmente estruturadas com respaldo técnico e bibliográfico.

### D05 — Extensão da série temporal: Sentinel-2 MSI vs Landsat
- **Estado Atual:** 🛑 Proposta Metodológica Formal
- **Proposta Recomendada:** **Adotar exclusivamente a série Sentinel-2 MSI (2016–2026, 10 m e 20 m)** para todo o treinamento supervisionado, cálculo harmônico e persistência biofísica. Restringir o Landsat (30 m) estritamente a análises contextuais qualitativas pré-2016 se necessário na introdução da dissertação.
- **Justificativa Técnica:** O Sentinel-2 oferece resolução espacial de 10 m e revisita de 5 dias (constelação 2A/2B), perfeitamente compatível com o pixel centimétrico do drone Spectral 2 (3–7,5 cm) e com a escala de feições de erosão laminar. Mesclar dados Landsat (30 m) introduziria um salto de agregação espacial de 9 vezes na área do pixel ($900\ \text{m}^2 \text{ vs } 100\ \text{m}^2$), criando descontinuidades radiométricas e artefatos de escala na modelagem XGBoost.
- **O Agente Entrega:** Relatório comparativo de contagem de observações livres de nuvens por ponto na Bacia do Paraná 3.

---

### D07 — Domínio de Validade da Modelagem
- **Estado Atual:** 🛑 Proposta Metodológica Formal
- **Proposta Recomendada:** **Declividade de 3% a 20%** e **Uso do Solo Agrícola** (Classes 30 e 40 do ESA WorldCover / MapBiomas lavouras temporárias e pastagem cultivada).
- **Justificativa Técnica:** Relevos com declividade $< 3\%$ possuem baixíssima energia cinética de deflúvio, estando sujeitos primariamente a sedimentação e encharcamento. Relevos $> 20\%$ são classificados como forte ondulados a montanhosos pelo SiBCS, onde o Sistema Plantio Direto mecanizado de grãos é restrito e predominam voçorocas lineares ou cobertura florestal. A faixa de 3% a 20% concentra $> 90\%$ das lavouras sob risco de perda laminar na Bacia do Paraná 3.

---

### D08 — Tratamento de Associações Pedológicas
- **Estado Atual:** 🛑 Proposta Metodológica Formal
- **Proposta Recomendada:** Utilizar o componente dominante (`ordem_1`) da associação cartográfica como valor pedológico base, atribuindo `confiancaPedologica = "media"` quando a unidade for do tipo `"associacao"`, e `"alta"` quando for unidade `"simples"`.
- **Justificativa Técnica:** A escala 1:250.000 da carta pedológica não possui resolução para segregar os limites espaciais exatos de associações complexas. A regra preserva a integridade científica sem inventar dados espaciais inexistentes na fonte primária.

---

### D12 — Dimensões da Estratificação Amostral
- **Estado Atual:** 🛑 Proposta Metodológica Formal
- **Proposta Recomendada:** Estrutura tridimensional canônica $3(\hat{S}) \times 3(\hat{E}) \times 2(\hat{K}) = 18$ estratos biofísicos:
  - $\hat{S}$ (Declividade): Baixa ($3–8\%$), Média ($8–14\%$), Alta ($14–20\%$);
  - $\hat{E}$ (Frequência de Solo Nu): Rara ($< 15\%$), Moderada ($15–30\%$), Frequente ($> 30\%$);
  - $\hat{K}$ (Erodibilidade Embrapa): Nível 1 (Baixa/Média) e Nível 2 (Alta/Muito Alta).
- **Justificativa Técnica:** Garante distribuição ortogonal balanceada entre fatores topográficos, dinâmicos de manejo e intrínsecos do solo, evitando viés de concentração amostral.

---

### D13 — Formulação do Fator R (Erosividade da Chuva)
- **Estado Atual:** 🛑 Proposta Metodológica Formal
- **Proposta Recomendada:** Equação de erosividade regional de Waltrick et al. (2015) para o Estado do Paraná:
  $$EI_{30} = 67,355 \cdot \left(\frac{p^2}{P}\right)^{0,85}$$
  calculada a partir da precipitação mensal ($p$) e anual ($P$) obtida de estações meteorológicas oficiais do SIMEPAR/INMET ou grade CHIRPS/ERA5-Land calibrada.
- **Justificativa Técnica:** Validada empiricamente para o regime pluviométrico do Estado do Paraná, com excelente correlação com medições de energia cinética de chuvas erosivas.

---

### D15 — Fator Topográfico LS na Equação RUSLE
- **Estado Atual:** 🛑 Proposta Metodológica Formal
- **Proposta Recomendada:** Algoritmo bidimensional de Desmet & Govers (1996) acoplado aos expoentes de inclinação de McCool et al. (1989):
  $$LS = \frac{A_{i,j-in}^{m+1} - A_{i,j-out}^{m+1}}{D \cdot x^m \cdot (22,13)^m} \cdot S$$
  executado em projeção conforme métrica estrita SIRGAS 2000 / UTM fuso 22S (EPSG:31982).
- **Justificativa Técnica:** Modela adequadamente o acúmulo de deflúvio em encostas convergentes e divergentes da catena agrícola, superando as limitações da fórmula unidimensional de Wischmeier & Smith (1978).

---

### D17, D18 e D19 — Protocolo de Sensoriamento de Alta Resolução PlanetScope
- **D17 (Cota Planet):** Adotar modelo de cota total de pesquisa (volume fixo de quilômetros quadrados alocados ao projeto acadêmico).
- **D18 (Buffer de Recorte):** Raio de 250 m ao redor de cada centróide amostral ($\approx 19,6\ \text{ha}$ por ponto), cobrindo integralmente o talhão agrícola circundante.
- **D19 (Pares de Evento):** Subconjunto focado de 40 a 60 pontos pareados antes e depois de eventos de precipitação extrema ($> 50\ \text{mm}$ em 24h).

---

## 5. Parâmetros Operacionais em Proposta 🟡

| ID | Parâmetro | Valor Proposto | Origem | Justificativa |
|:---|:---|:---:|:---|:---|
| **P01** | Aresta do Bloco Espacial | 20 km (ou variograma) | Roberts et al. (2017) | Tamanho mínimo para bloquear autocorrelação espacial no LOCO |
| **P02** | Espaçamento de *Thinning* | 1,0 km a 5,0 km | Metodologia PPGTCA 2026 | Descorrelação geodésica entre amostras de treinamento |
| **P04** | Buffers de Exclusão Física | Água: 30 m; Urbano: 150 m | Legislação Florestal / Cartografia | Elimina contaminação espectral de corpos d'água e malha urbana |
| **P05** | Classes Elegíveis ESA WorldCover | 30 (Lavouras) e 40 (Campos) | ESA WorldCover 2021 | Delimitação estrita do domínio agropecuário |
| **P06** | Fração Limpa Mínima (UDM2) | $\ge 80\%$ na AOI do ponto | PlanetScope Quality Mask | Garante visualização nítida sem névoa ou artefatos de nuvem |
| **P08** | Limiar de Alerta de Baixa Variância | Desvio Padrão $< 10^{-4}$ | Auditoria Pericial | Alerta imediato contra preditores estáticos ou corrompidos |
| **P09** | Máscara de Nuvens Sentinel-2 | SCL (Scene Classification) | Copernicus ESA | Classes 3 (sombra), 8 (nuvem média), 9 (nuvem alta) e 10 (cirrus) mascaradas |
