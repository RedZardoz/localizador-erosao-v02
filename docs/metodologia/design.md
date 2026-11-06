# Documento de Design e Arquitetura — SAREL

**Sistema de Amostragem e Rotulagem para Erosão Laminar**  
**Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA - 2026)**  
*Pesquisa de Mestrado — Estado do Paraná*  
**Versão:** 2.0 (10/09/2026)

---

## 1. Princípios Norteadores e a Lei Fundamental

O SAREL foi projetado para eliminar qualquer risco de viés de modelagem, vazamento de rótulo ou fabricação de parâmetros. Toda a arquitetura do sistema é governada pelas **9 Regras Invioláveis da Lei Fundamental**, definidas na íntegra em [`docs/planejamento/PROMPT_RECONSTRUCAO_SAREL_2026-09-10.md`](../planejamento/PROMPT_RECONSTRUCAO_SAREL_2026-09-10.md) (Parte II).

---

## 2. Mapa Conceitual dos Módulos e Cálculos

| Variável / Módulo | Base / Fonte | Fórmula / Método | Decisão Metodológica |
|---|---|---|---|
| **Estratificação** | Copernicus DEM GLO-30, Sentinel-2 L2A, Embrapa | 18 estratos multivariados: $\hat{S}$ (terços declividade) $\times \hat{E}$ (terços exposição) $\times \hat{K}$ (erodibilidade) | D12, P04, P05 |
| **Thinning Espacial** | Geodésia elipsoidal WGS84 | Fisher-Yates determinístico com raio $\ge 1{,}0\text{ km}$ e semente registrada | P02, P07 |
| **Blocos Espaciais** | Coordenadas do desenho amostral | Variograma empírico da distância entre pares; contingência com aresta de 20 km | P01 |
| **Harmônicos Temporais** | Bandas B11, B12, NDVI (Sentinel-2) | OLS multivariado (1 e 2 harmônicos) com métricas $R^2$, SE e guarda para $n < 12$ obs | D11 |
| **Frequência Solo Nu ($\hat{E}$)** | Sentinel-2 L2A | Razão $n_{\text{exposto}} / n_{\text{válido}}$, maior sequência contígua e mês modal | D10 |
| **Pares de Eventos** | PlanetScope (PSScene) e Sentinel-1 | Trios ($T_-, T_0, T_+$) com $\Delta\text{zenital} \le 10^\circ$, $\Delta t \le 20\text{d}$, corte 250m e radar C | D17, D18, D19 |
| **Fator C RUSLE** | NDVI Sentinel-2 L2A | Regional tropical Durigon et al. (2014): $C = (1 - \text{NDVI})/2$; sensibilidade van der Knijff (2000) | D01 |
| **Fator P RUSLE** | Prática conservacionista | Renard et al. (1997): $P = 1{,}0$ tabelado na ausência de observação de manejo | — |
| **Fatores R, K, LS** | CHIRPS, IMERG, Embrapa, MDE | Retidos com causa `"decisao-pendente"` até definição metodológica do pesquisador | D13, D14, D15 |
| **Perda de Solo RUSLE** | Invariante 1 | $A = R \cdot K \cdot LS \cdot C \cdot P$; só existe se os 5 fatores e a memória existirem simultaneamente | Invariante 1 |
| **Concordância Inter-intérpretes**| Fotointerpretação | Kappa de Cohen matricial; alerta bloqueante para $\kappa < 0{,}60$; divergências para desempate | P08 |
| **Conjunto Held-Out** | Voo de drone | Segregação obrigatória e isolamento em arquivo independente; nunca entra no treino | Regra 6 |

---

## 3. Fluxo de Dados e Perfis de Exportação

```mermaid
graph TD
    A["Universo Amostral / AOI"] --> B["Filtro de Elegibilidade (ESA WorldCover)"]
    B --> C["Estratificação Multivariada (18 Estratos)"]
    C --> D["Thinning Geodésico Determinístico (1.0 km)"]
    D --> E["Blocos Espaciais (Variograma Empírico)"]
    E --> F["Extração Biofísica (Sentinel-2, DEM, Embrapa, Chuva)"]
    F --> G["Inspeção e Painel de Campanha"]
    
    G --> H1["Perfil 'interpretacao-cega' (PlanetScope)"]
    G --> H2["Perfil 'campo-cego' (Acesso Fundiário + Rota)"]
    G --> H3["Perfil 'voo-cego' (Polígono Drone)"]
    
    H1 --> I["Ingestão de Rótulos (2 Intérpretes + Kappa)"]
    H2 --> I
    H3 --> J["Segregação 'held-out' (Validação Independente)"]
    
    I --> K["Matriz de Treino Consolidada (Sem Coordenadas)"]
    K --> L["Modelagem Externa Supervisionada (XGBoost / Random Forest)"]
```

---

## 4. Invariantes do Sistema

Antes da persistência ou exportação de qualquer tabela, o módulo `src/lib/matriz/invariantes.ts` valida os **Sete Invariantes de Integridade**:
1. **Invariante 1:** Coerência RUSLE: $\text{perdaSolo} \iff 5\text{ fatores presentes} \iff \text{memória de cálculo presente}$.
2. **Invariante 2:** Lista de Permissão Estrita do Perfil de Exportação (bloqueia vazamento de variáveis internas como $\Phi_{\text{diag}}$ ou coordenadas).
3. **Invariante 3:** Derivação exata de `Campos_Estimados` a partir de variáveis com estado diferente de `"medido"`.
4. **Invariante 4:** Rastreabilidade de Satélite: dados orbitais exigem lista de `PRODUCT_ID`, versão do motor e timestamp.
5. **Invariante 5:** Afirmação Negativa Fundiária: declaração de `"sem-correspondencia"` exige histórico de consulta válida sem match geográfico.
6. **Invariante 6:** Proibição de Literais Geográficos Espúrios (`"Custom"`, `"Bacia Local"`, nome de UF no município).
7. **Invariante 7:** Detector de Constante Disfarçada: recusa exportação se qualquer coluna numérica possuir valor idêntico em todas as linhas válidas para $n \ge 21$.
