# Conferência no Primário — Rikimaru, Roy & Miyatake (2002)

**Data da conferência:** 09/11/2026  
**Identificador do acervo:** `rikimaru2002`  
**Documento primário inspecionado:** `docs/bibliografia/01_pesquisas_diretamente_relacionadas/Tropical forest cover density mapping - International Society for ....pdf`  
**Referência canônica:** Rikimaru, A., Roy, P. S., & Miyatake, S. (2002). *Tropical forest cover density mapping*. Tropical Ecology, 43(1), 39–47. ISSN 0564-3295.  
**SHA-256 do arquivo local:** `80e9e9fe884282860c1be461d08017515da18130d08531268b0d6c054b71885f`  
**Procedência do arquivo:** Cópia obtida de repositório re-hospedado de terceiros (Yumpu / International Society for Tropical Ecology), não o PDF direto do portal original da editora.  
**Política de arquivamento:** Padrão `doc246` (extração `extrair_rikimaru_2002.py` + saída crua `saida_extracao_rikimaru_2002.txt` + esta nota de conferência). PDF não versionado no repositório Git devido a status incerto de licença de redistribuição da cópia re-hospedada.

---

## 1. Respostas Objetivas às Perguntas da Norma

### Q5 — Autoria e Veículo
> **Pergunta:** A autoria é `A. Rikimaru, P. S. Roy, S. Miyatake` e o veículo `Tropical Ecology 43(1):39-47`? Transcreva da folha de rosto.

**Resposta:** **SIM, CONFERIDO INTEGRALMENTE NO PRIMÁRIO.**

Transcrição literal da folha de rosto (p. 39 do periódico / p. 1 do PDF):
> *"Tropical Ecology 43(1): 39-47, 2002 ISSN 0564-3295*  
> *© International Society for Tropical Ecology*  
>  
> *Tropical forest cover density mapping*  
>  
> *A. RIKIMARU¹, P. S. ROY² & S. MIYATAKE³*  
>  
> *¹Nagaoka University of Technology; ²Indian Institute of Remote Sensing (NRSA), Dehradun, India; ³Japan Overseas Forestry Consultants Association, Tokyo, Japan"*

*Correção bibliográfica:* A autoria no registro anterior do projeto grafava erroneamente `"Rikimaru, T."` e creditava o veículo como `*New Phytologist* / FCD Mapper`. A conferência no primário retifica o primeiro autor para **A. Rikimaru** (Atsushi Rikimaru) e o veículo para **Tropical Ecology 43(1): 39–47**.

---

### Q6 — Cortes Numéricos de BSI e NDVI
> **Pergunta:** A obra enuncia **qualquer** corte numérico de BSI ou de NDVI? Se sim, qual e para quê?

**Resposta:** **NÃO CONSTA NO PRIMÁRIO.**

A obra:
1. **Não menciona** nem prescreve os cortes numéricos `BSI > 0,10`, `NDVI < 0,40`, `BSI < 0,00` ou `NDVI > 0,65`.
2. Não estabelece limiares fixos de corte manual para classificação de solo ou vegetação. O modelo FCD (Forest Canopy Density) combina quatro fatores biofísicos contínuos (AVI, BI, SI, TI) sintetizados via análise de componentes principais (PCA) e modelagem dimensional, sem cortes discretos de limiar.
3. A única menção ao NDVI ocorre na p. 41 para justificar por que o NDVI não foi adotado como índice principal do modelo:
   > *"Vegetation index reflects the amount of vegetation. But it is not linear with the total bio-mass, regardless of the density of the trees or forest. In this model, Advanced Vegetation Index (AVI) is adopted rather than NDVI."*

Os cortes numéricos `0,10 / 0,40 / 0,00 / 0,65` associados à decisão D02 são convenção operacional autônoma deste projeto de pesquisa e não possuem nenhum lastro em Rikimaru et al. (2002).

---

### Q7 — Fórmula do BSI vs `calcularBsi`
> **Pergunta:** A fórmula do BSI na obra é a mesma de `calcularBsi` em `compostoSoloNu.ts`?

**Resposta:** **SIM quanto à estrutura adimensional normalizada dos canais espectrais, com ressalva de escala de exibição.**

Na obra (p. 42), o índice é grafado como `BI` (*Bare Soil Index*):
$$\text{BI} = \frac{(B5 + B3) - (B4 + B1)}{(B5 + B3) + (B4 + B1)} \times 100 + 100 \quad (0 < \text{BI} < 200)$$
Onde, para o Landsat TM:
- $B5$ = SWIR1 (1550–1750 nm)
- $B3$ = Red (630–690 nm)
- $B4$ = NIR (760–900 nm)
- $B1$ = Blue (450–520 nm)

Na implementação do SAREL (`src/lib/gee/serieTemporal.ts:67-88` e `compostoSoloNu.ts`):
- $B11$ (Sentinel-2 SWIR1) corresponde a $B5$ (Landsat TM)
- $B4$ (Sentinel-2 Red) corresponde a $B3$ (Landsat TM)
- $B8$ (Sentinel-2 NIR) corresponde a $B4$ (Landsat TM)
- $B2$ (Sentinel-2 Blue) corresponde a $B1$ (Landsat TM)

A fórmula em código calcula a razão normalizada canônica $[-1, 1]$:
$$\text{BSI} = \frac{(B11 + B4) - (B8 + B2)}{(B11 + B4) + (B8 + B2)}$$
A transposição de bandas entre Landsat TM e Sentinel-2 MSI é espectralmente equivalente. A escala $\times 100 + 100$ do artigo original era um artifício de translação linear para empacotamento em imagens inteiras de 8 bits (0–255), enquanto a computação científica moderna preserva a razão normalizada em ponto flutuante.

---

## 2. O Que Esta Obra NÃO Sustenta

1. **Cortes numéricos de BSI e NDVI:** A obra não sustenta nenhum dos limiares de D02 (`BSI > 0,10`, `NDVI < 0,40`, `BSI < 0,00`, `NDVI > 0,65`).
2. **Erosão Laminar:** O estudo trata de dossel florestal tropical e planejamento de reabilitação silvicultural na Ásia/Pacífico via projeto ITTO PD32/93Rev2(F). Não aborda processos erosivos nem conservação de solo agrícola.
3. **Sensores Modernos:** A obra é restrita a imagens históricas Landsat 5 TM.
