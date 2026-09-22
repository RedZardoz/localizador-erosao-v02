---
marp: true
theme: default
paginate: true
header: "PPGTCA 2026 • Pesquisa de Mestrado — Sistema SAREL v2.0"
footer: "Universidade Tecnológica Federal do Paraná (UTFPR) • Campus Medianeira"
style: |
  section {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #1e293b;
    background-color: #f8fafc;
  }
  h1 {
    color: #0f172a;
  }
  h2 {
    color: #065f46;
  }
  code {
    background-color: #e2e8f0;
    color: #0f172a;
    border-radius: 4px;
    padding: 2px 6px;
  }
  .highlight {
    background-color: #ecfdf5;
    border-left: 4px solid #10b981;
    padding: 8px 14px;
    margin: 8px 0;
  }
  .box-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .card {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 12px;
  }
---

# SAREL: Sistema de Amostragem e Rotulagem para Erosão Laminar
### Validação e Predição de Erosão Laminar Utilizando Sensoriamento Remoto Multitemporal e Gradient Boosting (XGBoost)

**Pesquisador:** Luis Alfredo  
**Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA - 2026)**  
**Instituição:** Universidade Tecnológica Federal do Paraná (UTFPR) — Campus Medianeira  
**Área de Estudo:** Bacia Hidrográfica do Paraná 3 (BP3), Paraná, Brasil  

---

## 1. O Desafio Científico e a Lacuna Metodológica

* **O Fenômeno:** A erosão laminar é uma perda difusa e imperceptível dos horizontes superficiais do solo por impacto de gotas (*splash*) e escoamento superficial laminar.
* **A Falácia Espectral Direta (Vrieling, 2006):** Sensores orbitais de média resolução (Sentinel-2, 10 m) **não enxergam a lâmina erodida diretamente**, mas sim *proxies* (solo exposto, palhada, atrofia de biomassa, empobrecimento em matéria orgânica).
* **Vazamento Temporal (*Data Leakage* - Kaufman et al., 2012):** Treinar modelos com dados contemporâneos ao dano causa vazamento de informação, impedindo o prognóstico preditivo real.
* **Autocorrelação Espacial (Roberts et al., 2017):** Amostragem aleatória simples (k-fold padrão) infla artificialmente métricas de acurácia devido à redundância espacial.
* **Objetivo do SAREL:** Fornecer um arcabouço computacional estrito que garanta integridade de dados, elimine circularidade de rótulos e estruture uma matriz preditiva robusta para o XGBoost.

---

## 2. Arquitetura em Camadas e Divisão de Cálculos

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 1. NUVEM / GOOGLE EARTH ENGINE (GEE)                                            │
│    • Ingestão orbital Sentinel-2 L2A (2016-2026), Copernicus DEM 30m, CHIRPS/IMERG│
│    • Máscara de nuvem/sombra (QA60/SCL) e redução zonal espacial                    │
└──────────────────────────────────────┬──────────────────────────────────────────┘
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 2. MOTOR LOCAL DO SAREL (TypeScript / Node.js)                                  │
│    • Estratificação (18 estratos: S^ x E^ x K^) e Spatial Thinning geodésico (1 km)│
│    • Decomposição harmônica OLS, persistência CCDC e Linha de Base RUSLE (A=R·K·LS·C·P)│
│    • Cruzamento fundiário offline SQLite (SICAR, SIGEF, SNCR) e Invariantes      │
└──────────────────┬───────────────────────────────────────────┬──────────────────┘
                   ▼                                           ▼
┌──────────────────────────────────────┐     ┌────────────────────────────────────┐
│ 3. ALTA RESOLUÇÃO (PlanetScope API)  │     │ 4. AUDITORIA COGNITIVA (Jev AI)    │
│    • Recortes 3m (T-, T0, T+)        │     │    • System One / TypeSafe AI      │
│    • Fotointerpretação cega Fase A   │     │    • Degradação graciosa p/ RUSLE  │
│    • Concordância Kappa (k >= 0.60)  │     │    • NUNCA define rótulo de treino │
└──────────────────┬───────────────────┘     └────────────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 5. MODELAGEM SUPERVISIONADA EXTERNA (Python / XGBoost / SHAP)                   │
│    • Spatial Block CV com buffer de isolamento (Roberts et al., 2017)           │
│    • Janela de guarda temporal de 24 meses (Modelo P - Decisão D04)              │
│    • Importância e explicabilidade biofísica via valores SHAP                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Onde os Cálculos são Executados?

<div class="box-grid">
  <div class="card">
    <h3>Google Earth Engine (Nuvem)</h3>
    <ul>
      <li>Filtragem de qualidade e máscaras de nuvem/sombra Sentinel-2.</li>
      <li>Mosaicos multianuais e extração de séries de reflectância espectral.</li>
      <li>Extração de variáveis topográficas do Copernicus DEM GLO-30.</li>
      <li>Consultas de grades pluviométricas CHIRPS diário e IMERG GPM.</li>
      <li>Recortes por máscara de uso agrícola (ESA WorldCover).</li>
    </ul>
  </div>
  <div class="card">
    <h3>Motor Local do SAREL (Edge / On-Premise)</h3>
    <ul>
      <li>Estratificação 3D e thinning geodésico de 1.0 km (Fisher-Yates).</li>
      <li>Ajuste harmônico OLS e persistência de solo nu (NDVI <= 0.25).</li>
      <li>Cálculo da RUSLE: Fator C (Durigon), Fator K (Embrapa Doc. 246).</li>
      <li>Auditoria determinística e verificação dos 7 Invariantes.</li>
      <li>Pareamento fundiário em banco vetorial local (SICAR/SIGEF).</li>
      <li>Cálculo do Kappa de Cohen inter-intérpretes.</li>
    </ul>
  </div>
</div>

---

## 4. O Uso do Jev (System One / TypeSafe AI)

* **O que é o Jev?**
  Um subsistema cognitivo baseado em Inteligência Artificial Tipo-Segura (*TypeSafe AI*), com saída estruturada estritamente validada em tempo de compilação/execução:
  1. `Noul`: Julgamento booleano calibrado (presença/ausência com probabilidade).
  2. `Choice`: Classificação sobre taxonomia fechada de uso/manejo.
  3. `Score`: Grau ordinal estruturado de suscetibilidade (0 a 4).

* **Quando é Utilizado (Opção do Pesquisador)?**
  O Jev é ativado **exclusivamente como um auditor analítico e de triagem rápida** para inspecionar pontos suspeitos, detectar anomalias nos dados espectrais e auxiliar na priorização de rotas de campo.

* **Degradação Graciosa (*Dual-Engine*):**
  Se a chave do Jev não for informada, a rede cair ou a cota esgotar, o SAREL comuta **automaticamente e sem interrupções** para o `MOTOR_LOCAL_RUSLE`, garantindo autonomia operacional 100% determinística.

* **Regra Inviolável 4:** O julgamento do Jev **JAMAIS se torna rótulo na matriz de treino**! O rótulo supervisor pertence unicamente a observadores humanos (campo, drone ou interpretação cega).

---

## 5. Workflow do Aplicativo — Passos 1 a 3: Seleção e Amostragem

* **Passo 1: Delimitação da AOI e Elegibilidade Agrícola**
  - Definição da bacia hidrográfica (Paraná 3).
  - Máscara de uso da terra ESA WorldCover: classes agrícolas 30 (lavouras), 40 (mosaicos) e 60 (pastagens).
  - Zonas de exclusão espacial: buffers de 30 m para corpos d'água e 150 m para áreas urbanas.

* **Passo 2: Estratificação Geoespacial Multivariada (18 Estratos)**
  - Combinação ortogonal de 3 eixos biofísicos disjuntos:
    - $\hat{S}$ (Declividade em 3 tercis: plano/suave, ondulado, forte).
    - $\hat{E}$ (Exposição multianual de solo nu em 3 tercis).
    - $\hat{K}$ (Erodibilidade pedológica: Nível 1 $\le 0{,}0285$; Nível 2 $\ge 0{,}0300$ — Decisão D09).

* **Passo 3: Rarefação Espacial Geodésica (*Spatial Thinning*)**
  - Algoritmo determinístico de Fisher-Yates com semente pseudoaleatória registrada (P07).
  - Distância mínima de **1,0 km** entre pontos para romper a autocorrelação espacial redundante.

---

## 6. Workflow do Aplicativo — Passos 4 a 6: Séries e Biofísica

* **Passo 4: Agrupamento em Blocos Espaciais (*Spatial Blocks*)**
  - Criação de clusters espaciais com aresta típica de 20 km (baseada no semivariograma empírico) para a validação cruzada independente (Roberts et al., 2017).

* **Passo 5: Extração Multitemporal e Índices Espectrais**
  - Séries orbitais Sentinel-2 L2A (2016–2026) sem nuvem/sombra.
  - Bandas B2 (Azul), B4 (Vermelho), B8 (NIR), B11 (SWIR-1) e B12 (SWIR-2).
  - Cálculo de índices: NDVI e BSI (Bare Soil Index).

* **Passo 6: Decomposição Harmônica e Persistência Temporal**
  - Regressão OLS multivariada com 1 e 2 ciclos anuais (Zhu & Woodcock, 2014 / CCDC).
  - Tendência linear de longo prazo no SWIR B12 (indicativo de exposição de horizontes subsuperficiais ricos em ferro).
  - Cálculo da frequência de solo nu $\hat{E}$ com o limiar estrito **$\text{NDVI} \le 0{,}25$** (GEOS3 — Demattê et al., 2018; Safanelli et al., 2021 — Decisão D10).

---

## 7. Workflow do Aplicativo — Passos 7 a 8: RUSLE e Rotulagem

* **Passo 7: Estimativa da Linha de Base RUSLE ($A = R \cdot K \cdot LS \cdot C \cdot P$)**
  - **Fator C:** Modelo regional tropical de Durigon et al. (2014) baseado em NDVI.
  - **Fator K:** Conversão oficial da Tabela 5 da Embrapa Solos (Doc. 246/2024 / Mannigel et al., 2002 — Decisão D14).
  - **Fator P:** Práticas conservacionistas (Renard et al., 1997; $P = 1{,}0$ conservador).
  - **Invariante 1:** Perda de solo só é calculada se os 5 fatores estiverem preenchidos numericamente; pendências metodológicas são registradas de forma transparente.

* **Passo 8: Protocolos Cegos de Coleta e Curadoria de Rótulos**
  - **Fase A (PlanetScope 3m):** 2 fotointérpretes humanos independentes; pares antes/depois de chuva; validação via Kappa de Cohen ($\kappa \ge 0{,}60$).
  - **Fase B (Auditoria em Campo):** Ficha padronizada KoboToolbox com roteamento logístico e sobreposição fundiária (SIGEF/SICAR).
  - **Fase D (Ortomosaicos de Drone):** Resolução centimétrica (2 cm/pixel) isolada como conjunto *held-out* puro (nunca entra no treinamento).

---

## 8. Workflow do Aplicativo — Passos 9 a 10: IA e Validação

* **Passo 9: Modelagem Preditiva com Gradient Boosting (XGBoost)**
  - Treinamento supervisionado a partir da matriz tabular limpa (sem coordenadas geográficas, impedindo aprendizado de localização espúria).
  - Otimização da função objetivo com regularização L1 ($\alpha$) e L2 ($\lambda$) e penalidade de complexidade de folhas ($\gamma$).
  - Tratamento de desbalanceamento severo de classes via `scale_pos_weight`.

* **Passo 10: Avaliação Espaço-Temporal e Explicabilidade SHAP**
  - **Modelo D (Detecção):** Avalia a presença da feição contemporânea no momento $t_0$.
  - **Modelo P (Prognóstico Antecipado):** Aplicação de **janela de guarda temporal de 24 meses (2 anos)** antes do evento pericial, eliminando qualquer vazamento de dados (*data leakage* — Kaufman et al., 2012 — Decisão D04).
  - Validação Cruzada Espacial em Blocos com zona de amortecimento (*buffer* de 1 km).
  - Atribuição de importância física dos preditores via valores SHAP (Lundberg & Lee, 2017).

---

## 9. Formulações Matemáticas Fundamentais — Parte 1: Índices e Fenologia

1. **Índice de Vegetação por Diferença Normalizada (NDVI - Rouse et al., 1974):**
   $$\text{NDVI} = \frac{\rho_{\text{NIR}} - \rho_{\text{RED}}}{\rho_{\text{NIR}} + \rho_{\text{RED}}} = \frac{B8 - B4}{B8 + B4}$$

2. **Índice de Solo Exposto (*Bare Soil Index* - BSI - Rikimaru et al., 2002):**
   $$\text{BSI} = \frac{(B11 + B4) - (B8 + B2)}{(B11 + B4) + (B8 + B2)}$$

3. **Decomposição Harmônica OLS (CCDC - Zhu & Woodcock, 2014):**
   $$\hat{y}(t) = c_0 + c_1 t + \sum_{k=1}^m \left[ a_k \cos\left(\frac{2\pi k t}{T}\right) + b_k \sin\left(\frac{2\pi k t}{T}\right) \right]$$

4. **Frequência Multianual de Solo Exposto ($\hat{E}$ - Decisão D10 / GEOS3):**
   $$\hat{E} = \frac{1}{N_{\text{válido}}} \sum_{i=1}^{N_{\text{válido}}} \mathbb{I}(\text{NDVI}_i \le 0{,}25)$$

---

## 10. Formulações Matemáticas Fundamentais — Parte 2: RUSLE e Mecanismo

5. **Fator C da RUSLE Regional Tropical (Durigon et al., 2014 — Decisão D01):**
   $$C = \left( \frac{1 - \text{NDVI}}{2} \right)^{(1 + \text{NDVI})}$$

6. **Fator K Numérico Oficial (Embrapa Solos Doc. 246/2024 / Mannigel et al., 2002 — Decisão D14):**
   * $\text{Muito baixa (Classe 1): } K = 0{,}0052 \text{ t}\cdot\text{h}\cdot\text{MJ}^{-1}\cdot\text{mm}^{-1} \quad (0{,}0020 - 0{,}0084) \to \hat{K} = 1$
   * $\text{Baixa (Classe 2): } K = 0{,}0117 \text{ t}\cdot\text{h}\cdot\text{MJ}^{-1}\cdot\text{mm}^{-1} \quad (0{,}0090 - 0{,}0144) \to \hat{K} = 1$
   * $\text{Média (Classe 3): } K = 0{,}0218 \text{ t}\cdot\text{h}\cdot\text{MJ}^{-1}\cdot\text{mm}^{-1} \quad (0{,}0150 - 0{,}0285) \to \hat{K} = 1$
   * $\text{Alta (Classe 4): } K = 0{,}0360 \text{ t}\cdot\text{h}\cdot\text{MJ}^{-1}\cdot\text{mm}^{-1} \quad (0{,}0300 - 0{,}0420) \to \hat{K} = 2$
   * $\text{Muito alta (Classe 5): } K = 0{,}0518 \text{ t}\cdot\text{h}\cdot\text{MJ}^{-1}\cdot\text{mm}^{-1} \quad (0{,}0450 - 0{,}0585) \to \hat{K} = 2$

7. **Equação Universal de Perda de Solo Revisada (RUSLE - Renard et al., 1997):**
   $$A = R \times K \times LS \times C \times P$$

8. **Índice de Mecanismo Dinâmico Chuva-Solo Nu (Modelo G2 - Karydas & Panagos, 2018):**
   $$I_{\text{mecanismo}} = \sum_{t=1}^T \left( R_t \times \mathbb{I}(\text{NDVI}_t \le 0{,}25) \right)$$

---

## 11. Formulações Matemáticas Fundamentais — Parte 3: IA e Explicabilidade

9. **Função Objetivo e Otimização do XGBoost (Chen & Guestrin, 2016):**
   $$\mathcal{L}^{(t)} \approx \sum_{i=1}^n \left[ g_i f_t(x_i) + \frac{1}{2} h_i f_t^2(x_i) \right] + \gamma T + \frac{1}{2} \lambda \sum_{j=1}^T w_j^2$$
   *onde $g_i = \partial_{\hat{y}^{(t-1)}} l(y_i, \hat{y}^{(t-1)})$ e $h_i = \partial^2_{\hat{y}^{(t-1)}} l(y_i, \hat{y}^{(t-1)})$.*

10. **Critério de Ganho de Divisão em Árvore (*Gain Split*):**
    $$\mathcal{L}_{\text{split}} = \frac{1}{2} \left[ \frac{(\sum_{i \in I_L} g_i)^2}{\sum_{i \in I_L} h_i + \lambda} + \frac{(\sum_{i \in I_R} g_i)^2}{\sum_{i \in I_R} h_i + \lambda} - \frac{(\sum_{i \in I} g_i)^2}{\sum_{i \in I} h_i + \lambda} \right] - \gamma$$

11. **Concordância Inter-intérpretes (Kappa de Cohen - Landis & Koch, 1977):**
    $$\kappa = \frac{P_o - P_e}{1 - P_e}$$

12. **Valores SHAP para Explicabilidade Aditiva (Lundberg & Lee, 2017):**
    $$\phi_i(f, x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|! (|F| - |S| - 1)!}{|F|!} \left[ f_x(S \cup \{i\}) - f_x(S) \right]$$

---

## 12. Blindagem de Integridade: As 9 Regras Invioláveis do SAREL

1. **Regra 1 — Sem Valores Fabricados:** Variáveis sem resposta da fonte permanecem `indisponivel` acompanhadas de motivo formal.
2. **Regra 2 — Sem Cortes Silenciosos:** Proibição de pisos ou limites artificiais (`Math.max`, `Math.min`). Valores fora do domínio disparam `fora-do-dominio`.
3. **Regra 3 — Rastreabilidade e Proveniência:** Todas as grandezas são encapsuladas em `Proveniencia<T>` (`medido`, `modelado`, `tabelado`, `indisponivel`).
4. **Regra 4 — Nada Calculado Vira Rótulo:** Modelos matemáticos ou IA jamais atuam como gabarito. O rótulo provém unicamente da observação primária humana.
5. **Regra 5 — Guarda Antissintética Universal:** Proibição de pontos com `origemSintetica: true`.
6. **Regra 6 — Segregação Cega de Exportação:** Coordenadas não entram na matriz de treino tabular, impedindo o aprendizado de viés espacial.
7. **Regra 7 — Preservação de Máscaras:** Nuvens e sombras são preservadas como lacunas reais.
8. **Regra 8 — Evidência de Verificação:** Asserções de teste exigem registros auditáveis.
9. **Regra 9 — Preservação Histórica:** Versionamento contínuo em Git (`sarel/v2`).

---

## 13. Comparativo Metodológico: Modelo D vs. Modelo P

| Dimensão Metodológica | Modelo D (Detecção Contemporânea) | Modelo P (Prognóstico Preditivo) |
|---|---|---|
| **Objetivo Operacional** | Mapear onde a erosão laminar *já ocorreu* (diagnóstico pericial). | Prever a *suscetibilidade futura* antes que o dano ocorra. |
| **Janela Temporal Utilizada** | Série temporal contínua até a data do evento pericial ($t_0$). | Série temporal encerrada com **guarda de 24 meses (2 anos)** antes de $t_0$. |
| **Proteção contra *Leakage*** | Risco baixo para detecção; inaceitável para previsão. | **Isolamento estrito** fundamentado em Kaufman et al. (2012). |
| **Assinatura Predominante** | Reflectância do horizonte B exposto, BSI $> 0{,}10$, perda de biomassa. | Fraquezas históricas de manejo, baixa rotação, frequência de solo exposto anterior. |
| **Utilidade Agroambiental** | Autuação pericial, quantificação de passivos, fiscalização. | Planejamento conservacionista preventivo, crédito verde, seguro rural. |
| **Decisão Homologada** | Decisão D04 (Detecção contemporânea até $t_0$). | **Decisão D04 (Guarda temporal bienal de 24 meses)**. |

---

## 14. Principais Diferenciais e Contribuição Científica

* **Superação do Viés de Autocorrelação Espacial:**
  Diferente da maioria dos trabalhos da literatura que aplicam k-fold aleatório (produzindo métricas otimistas e falsas), o SAREL adota *Spatial Block Cross-Validation* (Roberts et al., 2017).

* **Superação do Vazamento Temporal (*Data Leakage*):**
  Adoção da janela de guarda temporal bienal (24 meses) para o Modelo P, alinhada à rotação de culturas da Embrapa Soja e à metodologia de Kaufman et al. (2012).

* **Calibração Pedológica e Espectral Brasileira:**
  Emprego do limiar de solo exposto calibrado pelo sistema GEOS3 ($\text{NDVI} \le 0{,}25$, Demattê et al., 2018; Safanelli et al., 2021) e da Tabela 5 oficial da Embrapa Solos (Doc. 246/2024 / Mannigel et al., 2002) para o Fator K numérico.

* **Explicabilidade Física com SHAP:**
  Abertura da "caixa-preta" do XGBoost, permitindo confrontar a importância dos preditores com as teorias físicas da RUSLE e da pedologia tropical.

---

## 15. Referências Bibliográficas (Normas ABNT NBR 6023:2018)

* COELHO, M. R. et al. **Erodibilidade dos solos do Brasil**. Rio de Janeiro: Embrapa Solos, 2024. 38 p. (Documentos / Embrapa Solos, n. 246). Disponível em: http://www.infoteca.cnptia.embrapa.br/infoteca/handle/doc/1170044.
* CHEN, T.; GUESTRIN, C. XGBoost: A Scalable Tree Boosting System. In: **ACM SIGKDD International Conference on Knowledge Discovery and Data Mining**, 22., 2016, São Francisco. Proceedings [...]. Nova York: ACM, 2016. p. 785–794.
* DEMATTÊ, J. A. M. et al. Geospatial Soil Sensing System (GEOS3): A powerful data mining procedure to retrieve soil spectral reflectance from satellite images. **Remote Sensing of Environment**, v. 212, p. 161–175, 2018.
* DURIGON, V. L. et al. NDVI-based C-factor estimation for RUSLE in Brazilian watersheds. **Revista Brasileira de Ciência do Solo**, v. 38, n. 3, p. 726–734, 2014.
* KARYDAS, C. G.; PANAGOS, P. The G2 erosion model: month-time step assessments at regional scale. **Environmental Research**, v. 161, p. 115–124, 2018.
* KAUFMAN, S. et al. Leakage in data mining: formulation, detection, and avoidance. **ACM Transactions on Knowledge Discovery from Data (TKDD)**, v. 6, n. 4, p. 1–21, 2012.
* LANDIS, J. R.; KOCH, G. G. The measurement of observer agreement for categorical data. **Biometrics**, v. 33, n. 1, p. 159–174, 1977.

---

## 16. Referências Bibliográficas (Continuação)

* LUNDBERG, S. M.; LEE, S.-I. A Unified Approach to Interpreting Model Predictions. In: **Advances in Neural Information Processing Systems (NeurIPS 2017)**, 30., 2017, Long Beach. Proceedings [...]. Red Hook: Curran Associates, 2017. p. 4765–4774.
* MANNIGEL, E. et al. Fator erodibilidade de solos do estado de São Paulo. **Revista Brasileira de Ciência do Solo**, v. 26, n. 4, p. 1039–1049, 2002.
* RENARD, K. G. et al. **Predicting soil erosion by water: a guide to conservation planning with the Revised Universal Soil Loss Equation (RUSLE)**. Washington, D.C.: United States Department of Agriculture, 1997. 404 p. (Agriculture Handbook, n. 703).
* ROBERTS, D. R. et al. Cross-validation strategies for data with temporal, spatial, or hierarchical structure. **Ecography**, v. 40, n. 8, p. 913–929, 2017.
* SAFANELLI, J. L.; DEMATTÊ, J. A. M. et al. Fine-scale soil mapping with Earth Observation data: a multiple geographic level comparison. **Revista Brasileira de Ciência do Solo**, v. 45, e0210080, p. 1–20, 2021.
* VRIELING, A. Satellite remote sensing for water erosion assessment: A review. **Catena**, v. 65, n. 1, p. 2–18, 2006.
* ZHU, Z.; WOODCOCK, C. E. Continuous change detection and classification of land cover using all available Landsat data. **Remote Sensing of Environment**, v. 144, p. 152–171, 2014.
