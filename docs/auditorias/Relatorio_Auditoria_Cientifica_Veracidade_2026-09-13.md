# Relatório de Auditoria Integral de Veracidade e Rigor Científico (PPGTCA 2026)

**Data da Auditoria:** 13 de Setembro de 2026  
**Auditor:** Antigravity (Advanced Agentic Pair Programmer)  
**Objeto de Análise:** Plataforma SAREL v2, Scripts de Modelagem Espacial, Bancos de Dados Fundiários e Algoritmos Físico-Matemáticos  
**Finalidade:** Garantia incondicional de integridade, veracidade empírica e blindagem perante a banca examinadora do Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA / UEL-UEM-UFPR).

---

## 1. Veredito Executivo e Declaração de Sinceridade

> [!CAUTION]
> ### DESCOBERTA CRÍTICA DA AUDITORIA: "O ELEFANTE NA SALA"
> **A Acurácia Global de 100% e ROC-AUC 1.0000 obtidas no Passo 2 pelo XGBoost LOCO ($K=5$) NÃO refletem um modelo preditivo infalível, mas sim um ARTEFATO DE SEPARAÇÃO ARTIFICIAL.**
> 
> A investigação ponta a ponta revelou que o script [`scripts/treinar_xgboost_loco.py`](file:///c:/Users/lalfr/Docs%20Fora%20do%20Ar/LUIS%20ALFREDO/01%20-%20MESTRADO%20PPGTCA%202026/02%20-%20PESQUISA%20EROS%C3%83O%20LAMINAR/geolocalizacao-erosao-propriedade/scripts/treinar_xgboost_loco.py) foi alimentado com a planilha legada `Tabela_Consolidada_Parana_Todo_o_Estado_150focos_2026-09-04.xlsx`, onde os atributos físicos estavam congelados com valores repetidos, e os 150 pontos de controle tiveram suas variáveis biofísicas geradas via `np.random.uniform`. 
> 
> **Apresentar esse número (100% de acurácia) perante uma banca de mestrado causaria a desqualificação imediata do experimento.** Abaixo detalhamos a prova pericial, a raiz do problema no código e o plano de saneamento imediato.

---

## 2. Mapa Geral de Auditoria dos Componentes

| Módulo / Camada | Componente | Status de Veracidade | Avaliação de Rigor Científico |
| :--- | :--- | :---: | :--- |
| **Bancos Fundiários** | `data/fundiario_brasil.db` (1.67 GB) | 🟢 **100% Real** | 559.899 propriedades do CAR no PR com polígonos, centróides e registros oficiais do SICAR/SNCR. |
| **Sítios Padrão-Ouro** | `sitiosReferencia.ts` (Céu Azul & Medianeira) | 🟢 **100% Real** | 4 polígonos contínuos (10 a 50 ha) extraídos de perímetros oficiais SICAR do Paraná. |
| **Matriz Pixel-a-Pixel** | `validacaoMatricial.ts` | 🟢 **100% Íntegro** | Fórmulas clássicas de matriz de confusão, Kappa de Cohen ($\kappa$), Jaccard ($IoU$) e escala sub-métrica corretas. |
| **Cliente Pedológico** | `embrapaSoilClient.ts` | 🟢 **100% Íntegro** | Consultas WMS OGC reais ao GeoServer oficial da Embrapa Solos. Zero mock em produção. |
| **Fator C Híbrido** | `fatorC.ts` | 🟢 **100% Íntegro** | Equação $C = ((1 - \text{NDVI})/2) \times (1 + \text{BSI})$ estritamente tipada, com checagem de domínio $[-1, 1]$. |
| **API GEE** | `src/app/api/gee/select-candidates/route.ts` | 🟡 **Honesto, mas Incompleto** | Autentica OAuth2 e filtra CAR real, mas marca satélite/terreno como `indisponivel` (ainda sem redução `reduceRegion`). |
| **Varredor Anti-Mock** | `src/lib/seguranca/padroesProibidos.test.ts` | 🟡 **Escopo Restrito** | Varre com excelência o TypeScript em `src/lib/`, mas ignorava scripts em Python (`scripts/`). |
| **Dataset de Treino** | `Tabela_Consolidada_..._150focos_2026-09-04.xlsx` | 🔴 **Inválido / Espúrio** | Planilha legada com `Declividade = 16.0%`, `BSI = 0.45`, `NDVI = 0.32` congelados em 100% das linhas. |
| **Script XGBoost LOCO** | `scripts/treinar_xgboost_loco.py` | 🔴 **Contaminado no Balanceamento** | Gerava atributos da Classe 0 (Controle) com `np.random.uniform`, provocando separação espúria perfeita. |

---

## 3. Evidências Periciais Detalhadas

### 3.1 Prova Pericial da Planilha de Entrada (`150focos_2026-09-04.xlsx`)
Ao analisar estatisticamente o arquivo `Tabela_Consolidada_Parana_Todo_o_Estado_150focos_2026-09-04.xlsx`, utilizado como fonte padrão pelo script de modelagem:
- **Coordenadas Geográficas:** Reais e distribuídas por todo o Paraná (Latitudes: $-26.57$ a $-22.75$; Longitudes: $-54.22$ a $-48.47$; Altitudes reais: $14$ a $1287$ metros).
- **Atributos Biofísicos e RUSLE:**
  ```text
  Declividade_Pct:      150/150 registros trazem 16.00% (Desvio Padrão = 0.00)
  BSI_Solo_Exposto:     150/150 registros trazem 0.450  (Desvio Padrão = 0.00)
  NDVI_Vigor_Vegetal:   150/150 registros trazem 0.320  (Desvio Padrão = 0.00)
  Perda_Solo_t_ha_ano:  150/150 registros trazem 35.20  (Desvio Padrão = 0.00)
  ```
- **Conexão Histórica:** Esta planilha foi originada por uma importação de GeoJSON do sistema legado anterior e já havia sido declarada formalmente como **"inválida como resultado"** na auditoria de 2026-09-08 (`docs/planejamento/implementation_plan_v3.md`, linha 1042). Contudo, o script de modelagem acabou puxando-a como default.

### 3.2 Prova Pericial do Script Python (`treinar_xgboost_loco.py`)
No trecho entre as linhas 194 e 209 de `scripts/treinar_xgboost_loco.py`:
```python
# Valores característicos de Sistema Plantio Direto (Classe 0 do método: BSI < 0.0 e NDVI > 0.65)
bsi_spd = float(np.random.uniform(-0.25, -0.02))
ndvi_spd = float(np.random.uniform(0.68, 0.88))
decliv = float(np.random.uniform(3.0, 14.0))
elev = float(np.random.uniform(350, 750))
perda_solo_spd = float(np.random.uniform(0.5, 4.5))
```
**Mecanismo do Erro Científico:**
1. Os 150 pontos da Classe 1 (Erosão) tinham todos `declividade_pct == 16.0`.
2. Os 150 pontos da Classe 0 (Controle) tiveram a `declividade_pct` sorteada aleatoriamente no intervalo $[3.0, 14.0]$.
3. **O XGBoost não precisou de inteligência geoespacial:** bastou uma regra única na raiz da árvore:
   $$\text{Se } \text{Declividade} > 14.5 \implies \text{Erosão (1)}; \quad \text{Senão } \implies \text{Controle (0)}$$
4. Essa separação trivial gerou os gráficos perfeitos:
   - Acurácia: $100\%$
   - ROC-AUC: $1.0000$ em todos os 5 folds LOCO
   - SHAP: Impacto da Declividade $= 4.919$ e Impacto das demais variáveis $\approx 0.000$.

---

## 4. O que Está Genuinamente Íntegro e Pronto para a Dissertação

1. **A Arquitetura de Software e a Lei Fundamental:**
   - O código TypeScript em `src/` obedece à filosofia "Dado Real ou Ausência Declarada".
   - Não há máscaras numéricas, nem coalescências com falsos números (`?? 16`).
   - A segregação *Held-Out* das amostras de drone em relação ao treino orbital é garantida por tipo estrito e testes automatizados.
2. **O Protocolo de Validação Matricial Padrão-Ouro (Passo 3):**
   - Os 4 perímetros de Céu Azul e Medianeira são extraídos das bases do SICAR/CAR.
   - O cálculo das matrizes de contingência e do Kappa de Cohen segue rigorosamente a literatura pericial de sensoriamento remoto.
3. **A Base Territorial Paranaense:**
   - A base SQLite local contém 559.899 imóveis reais do CAR, permitindo consultas geodésicas instantâneas sem risco de amostragem no oceano ou fora do Paraná.

---

## 5. Plano de Saneamento Científico Imediato (Roadmap Anti-Mock)

Para que a pesquisa atinja o nível de blindagem e respeitabilidade exigido para uma publicação internacional (ex.: *Catena*, *Geoderma* ou *Remote Sensing of Environment*):

### Ação 1: Sanear o Script de Treinamento (`treinar_xgboost_loco.py`)
- Banir qualquer chamada a `np.random.uniform` para geração de atributos biofísicos.
- Declarar o resultado anterior como **"Dry-Run de Infraestrutura de Pipeline"** nos relatórios.
- Exigir que as amostras de controle venham de extrações reais ou amostradas de áreas com confirmação espectral histórica.

### Ação 2: Conectar a Redução Real do Earth Engine (`select-candidates/route.ts`)
- Implementar a extração real de bandas e índices Sentinel-2 (`B2, B4, B8, B12, NDVI, BSI`) e elevação/declividade Copernicus DEM (30m -> 10m com interpolação bilinear) através da chamada REST/GEE.
- Gerar o dataset oficial com $N \ge 300$ pontos que apresentem **distribuições gaussianas reais**, ruído natural de sensor e variações biofísicas de campo.

### Ação 3: Reexecutar o Modelo XGBoost LOCO com Dados 100% Empíricos
- O resultado científico genuíno em sensoriamento remoto orbital normalmente apresenta:
  - **Acurácia Real Esperada:** entre $84\%$ e $93\%$ (e **não** $100\%$).
  - **ROC-AUC Real:** entre $0.88$ e $0.96$.
  - **SHAP Real:** Uma distribuição equilibrada entre Fator C (NDVI/BSI), Declividade (LS) e Erodibilidade (K).
- Este sim será um resultado crível e publicável com louvor na dissertação de mestrado.

---

## 6. Conclusão da Auditoria

O projeto SAREL possui uma base técnica, cartográfica e arquitetural de nível profissional. As fundações físicas e os princípios de não-contaminação são sólidos. 

A identificação tempestiva do vício na planilha de entrada e no balanceamento artificial do script Python demonstra a importância desta auditoria: **evitou-se que um resultado espúrio fosse consolidado como verdade científica na dissertação.**
