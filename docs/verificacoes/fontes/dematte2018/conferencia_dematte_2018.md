# Conferência no Primário — Demattê et al. (2018)

**Data da conferência:** 09/11/2026  
**Identificador do acervo:** `dematte2018`  
**Documento primário inspecionado:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/1-s2.0-S0034425718302049-main.pdf`  
**Referência canônica:** Demattê, J. A. M., Fongaro, C. T., Rizzo, R., & Safanelli, J. L. (2018). *A powerful data mining procedure to retrieve soil spectral reflectance from satellite images*. Remote Sensing of Environment, 212, 161–175. DOI: [10.1016/j.rse.2018.04.047](https://doi.org/10.1016/j.rse.2018.04.047).  
**SHA-256 do arquivo local:** `f6dc34d82c5bcd9165c78f32fe6efd2926275d1d5f81f4e037e43e4f4185ab87`  
**Política de arquivamento:** Padrão `doc246` (extração `extrair_dematte_2018.py` + saída crua `saida_extracao_dematte_2018.txt` + esta nota de conferência). O arquivo PDF integral não é versionado no Git por se tratar de publicação comercial proprietária da Elsevier B.V. (ScienceDirect), sob reserva de direitos autorais.

---

## 1. Respostas Objetivas às Perguntas da Norma

### Q1 — Limites da máscara de solo exposto
> **Pergunta:** Os limites da máscara de solo exposto são `NDVI ∈ [−0,25; 0,25]`, `NBR2 ∈ [−0,30; 0,10]` e `VNSIR ≤ 0,90`? Transcreva a passagem.

**Resposta:** **NÃO CONSTA NO PRIMÁRIO** quanto ao índice VNSIR e quanto aos limites negativos `[−0,25; 0,25]` e `[−0,30; 0,10]`.

No texto primário de Demattê et al. (2018), os limites formulados para a máscara GEOS3 são:
1. **NDVI:** faixa de **0 a 0,25** (p. 7, Seção 2.5):
   > *"We have considered the range between 0 and 0.25 for NDVI, and values outside this range were also flagged as NA."*
2. **NBR2:** faixa de **0 a 0,075** (p. 7 e 8, Seções 2.5 e 3.1):
   > *"Regarding the use of NBR2, six threshold ranges were tested: 0 to 0.025, 0 to 0.075, 0 to 0.150, 0 to 0.225, 0 to 0.300 and 0 to 0.350, and values outside the previous ranges were also flagged as NA."* (p. 7)  
   > *"Despite there being small differences between canonical correlations among the thresholds, we believe that 0.075 NBR2 was the optimal choice, since it reduced the presence of artifacts in the image with the 0.075 NBR2 threshold."* (p. 8)
3. **Canais Visuais:** gradientes espectrais positivos no visível (p. 7, Seção 2.5):
   > *"The difference between B3 and B2, as well as between B2 and B1 were also calculated to improve soil masking... The negative values of B3-B2 and B2-B1 were flagged as NA."*
4. **VNSIR:** **NÃO EXISTE** em Demattê et al. (2018) (zero ocorrências no texto integral extraído).

*Nota científica crucial:* A conjunção com `NDVI ∈ [−0,25; 0,25]`, `NBR2 ∈ [−0,30; 0,10]` e `VNSIR < 0,90` foi formulada na evolução subsequente do sistema GEOS3, publicada em **Demattê et al. (2020)** (*Scientific Reports* 10:4461, DOI: 10.1038/s41598-020-61408-1, p. 8, Equações 1 a 3), também presente no acervo local (`docs/bibliografia/01_pesquisas_diretamente_relacionadas/41598_2020_Article_61408.pdf`).

---

### Q2 — Operador de VNSIR e inclusividade de limites
> **Pergunta:** O operador do VNSIR é `< 0,9` ou `≤ 0,9`? E os do NDVI e do NBR2 são inclusivos?

**Resposta:**
- **VNSIR:** **NÃO CONSTA NO PRIMÁRIO** de 2018. (Em Demattê et al., 2020, p. 8, o operador formulado é estritamente menor: *"and the VNSIR was lower than 0.9"*).
- **NDVI e NBR2:** No primário de 2018 (p. 7), a formulação é por faixas (*"range between 0 and 0.25 for NDVI"*, *"six threshold ranges were tested: 0 to 0.025, 0 to 0.075..."*), indicando que valores estritamente fora da faixa (*"values outside the previous ranges were also flagged as NA"*) são eliminados.

---

### Q3 — Fórmula do VNSIR e escala de refletância
> **Pergunta:** A fórmula é exatamente `VNSIR = 1 − [(2·Red − Green − Blue) + 3·(SWIR2 − NIR)]`? Em que escala de refletância (0–1, 0–10000, outra)?

**Resposta:** **NÃO CONSTA NO PRIMÁRIO** de Demattê et al. (2018).

O artigo seminal de 2018 utiliza a inclinação do visível ($B3 - B2 > 0$ e $B2 - B1 > 0$) diretamente em vez de uma combinação linear indexada.  
A fórmula citada pertence a Demattê et al. (2020), p. 8, Eq. (3):
$$\text{VNSIR} = 1 - [ (2\cdot\text{Red} - \text{Green} - \text{Blue}) + 3\cdot(\text{SWIR2} - \text{NIR}) ]$$
A escala utilizada no processamento é de **refletância de superfície física entre 0 e 1** (produtos LEDAPS e LaSRC processados no Google Earth Engine com bandas harmonizadas).

---

### Q4 — Banda NIR e sensor Landsat
> **Pergunta:** Qual banda de NIR, e de qual sensor Landsat? (decide B8 vs B8A no Sentinel-2)

**Resposta:**
- O sensor exclusivo analisado em Demattê et al. (2018) é o **Landsat 5 TM (Thematic Mapper)** (série temporal 1985–2005 em São Paulo).
- A banda NIR é a **Banda 4 (B4)** do Landsat 5 TM, com intervalo de comprimento de onda nominal de **760–900 nm** (p. 5, Seção 2.4: *"higher reflection in B4 (760–900 nm) can also be observed due to leaf structure"*).
- **Transposição para Sentinel-2:** A banda **B8 (NIR ampla)** do Sentinel-2 MSI cobre o intervalo de 785–900 nm com 10 m de resolução espacial, correspondendo diretamente à largura da banda B4 do Landsat 5 TM (760–900 nm). A banda B8A (855–875 nm) é uma banda espectral estreita (20 m) concebida para correções atmosféricas e índices de vegetação de borda vermelha. A transposição física da B4 do TM para MSI em 10 m requer a banda **B8**.

---

## 2. O Que Esta Obra NÃO Sustenta

1. **Erosão Laminar:** A obra não investiga perda de solo, desagregação hídrica, erosão laminar ou fatores da RUSLE. Seu objetivo é exclusivamente a recuperação de espectros de solo para pedologia e mapeamento pedométrico.
2. **Sentinel-2 MSI:** A obra não faz calibração sobre imagens do satélite Sentinel-2. O estudo foi desenvolvido estritamente sobre a série histórica do Landsat 5 TM. A transposição das bandas e limiares para o sensor MSI é responsabilidade do projeto SAREL.
3. **Índice VNSIR:** A obra de 2018 não formula o VNSIR nem o limite de 0,90.
4. **Limites negativos estendidos:** A obra não adota limites inferiores negativos estendidos como $-0,25$ para NDVI ou $-0,30$ para NBR2; os limites calibrados em 2018 foram $[0; 0,25]$ e $[0; 0,075]$.
