# Conferência no Primário — Safanelli et al. (2021)

**Data da conferência:** 09/11/2026  
**Identificador do acervo:** `safanelli2021`  
**Documento primário inspecionado:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Safanelli 2021.pdf`  
**Cópia arquivada no acervo:** `docs/verificacoes/fontes/safanelli2021/safanelli_2021_rbcs.pdf`  
**Referência canônica:** Safanelli, J. L., Demattê, J. A. M., Santos, N. V., Rosas, J. T. F., Silvero, N. E. Q., Bonfatti, B. R., & Mendes, W. S. (2021). *Fine-scale soil mapping with Earth Observation data: a multiple geographic level comparison*. Revista Brasileira de Ciência do Solo, 45, e0210080. DOI: [10.36783/18069657rbcs20210080](https://doi.org/10.36783/18069657rbcs20210080).  
**SHA-256 do arquivo:** `1f05f84f32e3114a6cf3e1729396f9f08e8952c3c5fd01e2f3358982dfd93715`  
**Licença comprovada e transcrita:**
> *"Copyright: This is an open-access article distributed under the terms of the Creative Commons Attribution License, which permits unrestricted use, distribution, and reproduction in any medium, provided that the original author and source are credited."* (Creative Commons CC BY).  
> Por permitir redistribuição irrestrita com atribuição, o PDF integral foi arquivado diretamente em `docs/verificacoes/fontes/safanelli2021/` junto aos scripts e notas, seguindo o padrão de `renard1997` e `zhu2013`.

---

## 1. Respostas Objetivas às Perguntas da Norma

### Q8 — Prescrição de limiar de NDVI
> **Pergunta:** A obra enuncia **qualquer** limiar numérico de NDVI? Especificamente `0,25`?

**Resposta:** **NÃO SUSTENTA o limiar de 0,25.**

A obra é um estudo pedométrico de predição de propriedades do solo (argila, ferro, saturação por bases) e não de calibração experimental de limiares de solo exposto.  
A faixa de NDVI adotada pelos autores para mascaramento regional no Estado de São Paulo foi de **$-0,05$ a $0,30$** (p. 4), e não de 0,25 isolado.

---

### Q9 — Definição terminológica de BSI
> **Pergunta:** A obra define `BSI` como *"bare soil image"*? Transcreva a definição.

**Resposta:** **SIM, CONFERIDO LITERALMENTE.**

Transcrição literal do Abstract (p. 1):
> *"This study aimed to produce a bare soil image (BSI) for the São Paulo State (Brazil) to perform a pedometric analysis for different geographical levels."*

E no corpo do texto (p. 2 e 4):
> *"Our hypothesis is that a bare soil image derived from multitemporal collections..."* (p. 2)  
> *"The algorithm Geospatial Soil Sensing System - GEOS3 (Demattê et al., 2018) - developed inside the Google Earth Engine, was used to generate the multispectral bare soil composite from 1982 to 2018 using the Landsat collections..."* (p. 4)

**Aviso terminológico crítico:** No escopo de Safanelli et al. (2021), a sigla `BSI` designa a imagem sintética/composta de solo nu (*bare soil image*), equivalente ao produto SYSI/TESS. Ela **NÃO** deve ser confundida com o índice biofísico espectral *Bare Soil Index* (BSI/BI) de Rikimaru et al. (2002) utilizado em D02/D20.

---

### Q10 — Descrição da máscara de solo exposto
> **Pergunta:** A obra descreve a máscara de solo exposto que usou? Com quais limiares e citando quem?

**Resposta:** **SIM, com parametrização própria para São Paulo e citação a Demattê et al. (2018, 2020).**

Transcrição literal (p. 4, Seção *Bare soil reflectance and terrain attributes*):
> *"A set of rules was used to identify bare soil pixels in satellite images, based on spectral indices coupled with quality assessment bands to remove cloud, cloud shadow, inland water, snow, photosynthetic vegetation and non-photosynthetic vegetation (crop residues). Bare soils were flagged when the pixel value had the Normalized Difference Vegetation Index (NDVI) values falling between the range of −0.05 and 0.30 (masking out green vegetation), and Normalized Burn Ratio 2 index (NBR2) values between the range of −0.15 and 0.15 (masking outcrop residues). The pixels identified as bare soil were marked as valid for aggregating the multitemporal collection by their median value. ... Detailed information about GEOS3 and SYSI, as well as spectral indices and sensitivity analysis, can be found in previous studies (Demattê et al., 2018, 2020; Fongaro et al., 2018; Gallo et al., 2018)."*

*Observação metodológica:* A variação dos intervalos entre as publicações da equipe do GEOS3 demonstra que os limiares de corte (como NDVI e NBR2) são ajustados por bioma e escala:
- Demattê et al. (2018, RSE): NDVI $[0; 0,25]$, NBR2 $[0; 0,075]$, Landsat 5 TM em SP.
- Demattê et al. (2020, Sci Rep): NDVI $[−0,25; 0,25]$, NBR2 $[−0,30; 0,10]$, VNSIR $< 0,90$, Landsat 4/5/7/8 global/Cerrado.
- Safanelli et al. (2021, RBCS): NDVI $[−0,05; 0,30]$, NBR2 $[−0,15; 0,15]$, Landsat 1982–2018 em SP.

---

### Q11 — Verificação da citação, autores e DOI
> **Pergunta:** Confere a citação: `Rev Bras Cienc Solo 45:e0210080`, DOI `10.36783/18069657rbcs20210080`, e os sete autores?

**Resposta:** **SIM, CONFERIDO INTEGRALMENTE NO PRIMÁRIO.**

- **Autores (7):** José Lucas Safanelli, José Alexandre Melo Demattê, Natasha Valadares dos Santos, Jorge Tadeu Fim Rosas, Nélida Elizabet Quiñonez Silvero, Benito Roberto Bonfatti, Wanderson de Sousa Mendes.
- **Veículo:** *Revista Brasileira de Ciência do Solo* (Rev Bras Cienc Solo), 2021, volume 45, artigo e0210080.
- **DOI exato:** `10.36783/18069657rbcs20210080` (o inventário anterior grafava erroneamente `rbcs20200080`, ano do submissão ou erro de digitação, corrigido no primário).

---

## 2. O Que Esta Obra NÃO Sustenta

1. **Limiar de NDVI $\le 0,25$:** A obra não valida nem prescreve o limiar de 0,25 como fronteira de solo exposto (utilizou faixa de $-0,05$ a $0,30$).
2. **Erosão Laminar:** O trabalho tem foco estrito em mapeamento digital de solos (pedometria), não investigando fatores erosivos ou dinâmica hídrica de encostas.
3. **Área Geográfica:** O escopo geográfico é circunscrito ao Estado de São Paulo.
4. **Índice BSI:** A obra não sustenta o índice espectral de Rikimaru; sua menção a BSI é unicamente como abreviação de *bare soil image*.
