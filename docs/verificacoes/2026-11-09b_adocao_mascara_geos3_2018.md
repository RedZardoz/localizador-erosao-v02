# Evidência de Implementação: Adoção da Máscara GEOS3 de Demattê et al. (2018) em Ê

**Data da implementação:** 09/11/2026  
**Identificador metodológico:** `2026-11-09b_adocao_mascara_geos3_2018`  
**Decisões vinculadas:** D10 (Solo Descoberto do Preditor Ê), D11 (Métricas Temporais), D12 (Estratificação Amostral)  
**Normas cumpridas:** `docs/DESENVOLVIMENTO.md` (Regras 1 a 9), `docs/metodologia/NORMA_LASTRO_CIENTIFICO.md` (R-L1 a R-L5), Protocolo Anti-Fabricação (R1 a R5).

---

## 1. Decisão Metodológica Tomada e Motivação da Opção 2

Em 09/11/2026, diante do acionamento legítimo do Ponto de Parada da Norma de Lastro Científico (§1.6), o pesquisador deliberou pela **Opção 2**: adoção estrita da formulação original da máscara de solo exposto do sistema GEOS3 estabelecida por **Demattê et al. (2018)** (*Remote Sensing of Environment*, 212:161-175, DOI: `10.1016/j.rse.2018.04.047`).

### Comparação com as Alternativas Rejeitadas:
- **Contra a Opção 1 (Retorno a NDVI isolado <= 0.25):** Rejeitada porque o corte unidimensional por NDVI é físico e empiricamente incapaz de separar solo mineral exposto de resíduos secos de palhada sob Sistema Plantio Direto (SPD), conforme documentado na literatura de resíduos culturais (Daughtry et al., 2001; 2004; Hively et al., 2021). Manter NDVI isolado perpetuaria falsos positivos severos sobre palhada dessecada no Paraná.
- **Contra a Opção 3 (Adoção da Máscara de Demattê et al., 2020):** Rejeitada nesta etapa porque a obra de 2020 (*Scientific Reports* 10:4461) — que introduziu o índice linear VNSIR <= 0.90 e faixas negativas estendidas — ainda não passou pelo rito formal de extração e conferência no primário exigido pela Norma R-L1. Adotá-la violaria a integridade processual do lastro antes da conferência.
- **Vantagem da Opção 2:** A obra de Demattê et al. (2018) já era a citação canônica de D10, foi plenamente conferida no primário (`docs/verificacoes/fontes/dematte2018/conferencia_dematte_2018.md`) e introduz a separação física por SWIR (NBR2) sem depender de termos aditivos com sensibilidade a escala de refletância.

---

## 2. Detecção do Erro pelo Rito da Norma de Lastro Científico

A especificação preliminar do Prompt A continha uma falha formulada pelo planejador: propunha uma máscara com `NDVI ∈ [−0,25; 0,25]`, `NBR2 ∈ [−0,30; 0,10]` e `VNSIR ≤ 0,90`, atribuindo-a a Demattê et al. (2018).

O rito de conferência no primário operou com sucesso:
1. A extração mecânica do PDF (`saida_extracao_dematte_2018.txt`) revelou **zero ocorrências** do termo "VNSIR" e comprovou que a obra de 2018 nunca formulou tal índice.
2. Demonstrou-se que a formulação com VNSIR pertence a Demattê et al. (2020), obra posterior e distinta.
3. O executor parou o trabalho, reportou a divergência conforme o rito (§1.6), evitou a contaminação do código e permitiu ao pesquisador escolher deliberadamente o lastro canônico.

---

## 3. Os Cinco Testes Implementados e Transposição Espectral

A máscara GEOS3 de Demattê et al. (2018) opera como uma conjunção estrita de cinco testes espectrais, com todos os operadores sendo **inclusivos** conforme o texto da obra primária (*"range between 0 and 0.25"*, *"negative values were flagged as NA"*):

1. **Faixa de NDVI:** $\text{NDVI} \ge 0,00 \land \text{NDVI} \le 0,25$ (exclui corpos d'água, sombras e nuvens residuais no piso; vegetação fotossinteticamente ativa no teto).
2. **Faixa de NBR2:** $\text{NBR2} \ge 0,00 \land \text{NBR2} \le 0,075$ (componente discriminador no SWIR que exclui palhada celulósica de SPD).
3. **Inclinação no Visível B4-B3:** $(B4 - B3) \ge 0$ (gradiente de ascensão espectral entre verde e vermelho, transposto de B3-B2 do Landsat 5 TM).
4. **Inclinação no Visível B3-B2:** $(B3 - B2) \ge 0$ (gradiente de ascensão espectral entre azul e verde, transposto de B2-B1 do Landsat 5 TM).
5. **Máscara de Qualidade Radiométrica:** pixel classificado como válido livre de nuvem e sombra (SCL 4 ou 5 no Sentinel-2 MSI).

### Tabela de Transposição de Sensores (Landsat 5 TM $\rightarrow$ Sentinel-2 MSI L2A):

| Papel Espectral | Landsat 5 TM | Sentinel-2 MSI | Resolução | Justificativa Espectral |
|---|---|---|---|---|
| Blue | B1 (450–520 nm) | **B2** (458–523 nm) | 10 m | Cobertura espectral homóloga no azul |
| Green | B2 (520–600 nm) | **B3** (543–578 nm) | 10 m | Cobertura espectral homóloga no verde |
| Red | B3 (630–690 nm) | **B4** (650–680 nm) | 10 m | Cobertura espectral homóloga no vermelho |
| NIR Amplo | B4 (760–900 nm) | **B8** (785–900 nm) | 10 m | Faixa ampla em 10 m (B8A cobre apenas 855–875 nm em 20 m; Q4) |
| SWIR-1 | B5 (1550–1750 nm) | **B11** (1565–1655 nm) | 20 m | Banda de absorção de celulose e umidade |
| SWIR-2 | B7 (2080–2350 nm) | **B12** (2100–2280 nm) | 20 m | Banda de minerais de argila e óxidos |

---

## 4. Invariância Rigorosa de Escala Espectral

Diferentemente do índice VNSIR de 2020 — cuja equação linear possui termos aditivos escalares constantes como `1 - [...]` e ponderadores `2·Red` e `3·(SWIR2 - NIR)` que geram resultados desastrosos se aplicados sobre DN (0–10000) sem conversão para reflectância física (0–1) — **a máscara GEOS3 de 2018 é intrinsecamente invariante à escala**:

- $\text{NDVI} = \frac{B8 - B4}{B8 + B4}$ é uma razão normalizada adimensional: dividir ou multiplicar ambas as bandas por 10.000 preserva o valor exato.
- $\text{NBR2} = \frac{B11 - B12}{B11 + B12}$ é igualmente uma razão normalizada adimensional.
- $(B4 - B3) \ge 0$ e $(B3 - B2) \ge 0$ são testes de sinal de diferenças lineares: se $x - y \ge 0$, então $10000x - 10000y = 10000(x - y) \ge 0$.

O teste unitário dedicado em `src/lib/gee/mascaraSoloNuGeos3.test.ts` (Trava 3) valida matematicamente que cenas em reflectância física e em DN inteiro produzem vereditos booleanos rigorosamente idênticos sem exigir nenhuma divisão ou normalização ad-hoc.

---

## 5. Unificação Arquitetural dos Quatro Chamadores de Ê

A lógica da máscara foi centralizada em `src/lib/gee/mascaraSoloNuGeos3.ts` na função `ehSoloExpostoGeos3` e aplicada harmoniosamente nos quatro pontos de consumo do sistema:
1. `src/lib/gee/amostragemSoloNuLote.ts`: Caminho de produção no Google Earth Engine REST API (`Image.reduceRegions`), traduzido estruturalmente como Grafo de Expressão AST com `Image.and`, `Image.gte` e `Image.lte`.
2. `src/lib/gee/compostoSoloNu.ts`: Extração local de composto espectral e frequência fenológica de solo nu a partir de séries temporais observadas.
3. `src/lib/gee/persistenciaTemporal.ts`: Motor de persistência temporal (discriminação entre pousio cíclico de SPD e degradação crônica ativa).
4. `src/lib/matriz/montagemTemporal.ts`: Empilhamento multitemporal e cálculo da proporção binomial de solo exposto sob regime padrão (D11.2) e regime de fallback sazonal.

Em todos os caminhos locais, a Regra 1 / Invariante 5 foi respeitada: a falta de qualquer uma das seis bandas gera veredito `null` (indisponível), sendo excluída do denominador de cálculo da frequência Ê e declarada explicitamente no metadado de `modelo` da `Proveniencia`.

---

## 6. Pendências Científicas Abertas e Instrumentação da Varredura Regional

Ficam formalmente registradas as seguintes pendências metodológicas:
1. **Demattê et al. (2020):** Permanece no acervo local como obra de interesse secundário, pendente de rito formal de extração e conferência no primário. Não constitui lastro ativo.
2. **Transposição Espectral Landsat 5 TM $\rightarrow$ Sentinel-2 MSI:** Declarada e fundamentada pelas características nominais de largura de banda e resposta espectral (especialmente B8 vs B8A), mas ainda não validada radiometricamente contra alvos de calibração terrestres no Paraná.
3. **Regionalização do Limiar de NBR2 (0,075):** O artigo de 2018 determinou 0,075 como ótimo empírico para solos do Estado de São Paulo sob Landsat 5 TM. Para o Paraná, a instrumentação criada em `scripts/auditoria/varrer_faixas_nbr2.mjs` permitirá replicar a varredura nas 6 faixas `[0.025, 0.075, 0.150, 0.225, 0.300, 0.350]` assim que a ingestão de séries estiver concluída.

---

## 7. Avaliação de Impacto e Invariantes

- **Métrica `candidatosComSoloNuMedido`:** Segue exatamente em **0** (nenhuma amostragem REST de produção foi disparada).
- **Integridade de Evidências:** Nenhuma medição prévia foi invalidada.
- **Suíte de Testes:** Aprovada integralmente (880+ testes verdes em 100% dos arquivos de teste unitário).
