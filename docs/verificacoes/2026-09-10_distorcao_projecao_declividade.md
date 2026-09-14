# Demonstração Numérica da Distorção de Escala: EPSG:3857 vs EPSG:31982 na Declividade

**Data:** 10/09/2026  
**Contexto:** SAREL — Reconstrução e Auditoria Metodológica (PPGTCA 2026)  
**Assunto:** Impacto da escolha da projeção cartográfica no cálculo da declividade do terreno a partir de Modelos Digitais de Elevação (DEM SRTM / NASADEM).

---

## 1. Fundamento Cartográfico e Geodésico

A projeção **EPSG:3857 (WGS 84 / Pseudo-Mercator)** é uma projeção conforme cilíndrica formulada para visualização em navegadores web. O fator de escala linear $k$ em Mercator depende diretamente da latitude $\phi$:

$$k = \sec(\phi) = \frac{1}{\cos(\phi)}$$

No Estado do Paraná, localizado na faixa de latitude central $\phi \approx -25^\circ$:

$$\cos(-25^\circ) \approx 0.906307787$$
$$k = \frac{1}{0.906307787} \approx 1.103378$$

Isto significa que **1 metro real no terreno no Paraná é projetado em EPSG:3857 como ~1,1034 metros projetados**, gerando uma dilatação métrica de **+10,34% no plano horizontal**.

Em contrapartida, o sistema **EPSG:31982 (SIRGAS 2000 / UTM zone 22S)** é o sistema de projeção geodésica oficial para mapeamento topográfico do Paraná (meridiano central 51°W, abrangendo 54°W a 48°W). O fator de escala no meridiano central é $k_0 = 0.9996$, e na borda do fuso varia entre $0.9996$ e $1.0008$, mantendo a distorção métrica horizontal **abaixo de 0.08% em todo o Estado**.

---

## 2. Impacto no Cálculo de Declividade e RUSLE

A declividade topográfica ($\text{slope}$) é a derivada direcional da elevação ($z$, em metros) em relação à distância horizontal ($s$, em metros):

$$\tan(\beta) = \frac{\Delta z}{\Delta s}$$

Se o cálculo de vizinhança diferencial (ex.: filtro de Horn/Sobel) for executado na grade deformada de EPSG:3857 sem correção do fator de escala métrico:

$$\Delta s_{3857} = k \cdot \Delta s_{\text{real}} \approx 1.1034 \cdot \Delta s_{\text{real}}$$

Portanto, a declividade aparente calculada será:

$$\tan(\beta_{\text{aparente}}) = \frac{\Delta z}{\Delta s_{3857}} = \frac{\Delta z}{1.1034 \cdot \Delta s_{\text{real}}} = \frac{1}{1.1034} \cdot \tan(\beta_{\text{real}}) \approx 0.9063 \cdot \tan(\beta_{\text{real}})$$

### Consequências Práticas:
1. **Subestimação Sistemática de ~9,4% a 10,3%** na declividade calculada se operado em EPSG:3857.
2. Como o fator topográfico $LS$ da Equação Universal de Perdas de Solo (RUSLE) depende exponencialmente da declividade ($S \propto \sin(\beta)^{1.3}$ para encostas íngremes), uma subestimação de 10% na declividade causa uma **subestimação de 13% a 18% na perda de solo calculada pelo modelo RUSLE**.
3. Pior ainda: se o DEM estiver em coordenadas geográficas brutas (EPSG:4326, graus decimais) e o algoritmo calcular $\Delta z / \Delta \text{graus}$ (onde 1° $\approx$ 111.000 m), $\Delta z$ (em metros) dividido por $\Delta s$ (em frações minúsculas de grau) produz declividades espúrias de **89.9° a 90° (~5.700.000%)**.

---

## 3. Decisão de Projeto do SAREL

1. **Reprojeção Mandatória:** Todo cálculo de declividade no Earth Engine e em bibliotecas locais DEVE reamostrar explicitamente o DEM para `EPSG:31982` na resolução nominal de 30 metros antes da extração de derivadas de terreno:
   ```javascript
   var demUtm = ee.Image("USGS/SRTMGL1_003").reproject({
     crs: "EPSG:31982",
     scale: 30
   });
   var slopeUtm = ee.Terrain.slope(demUtm);
   ```
2. **Guarda de Plausibilidade Física:** Toda declividade continental terrestre deve satisfazer $[0^\circ, 75^\circ]$.
3. **Consistência Trigonométrica (Invariante 2):**
   $$\text{declividadePct} = \tan\left(\frac{\text{declividadeGraus} \times \pi}{180}\right) \times 100$$
4. **Tratamento de Topographic Wetness Index (TWI):**
   $$\text{TWI} = \ln\left(\frac{a}{\tan(\beta)}\right)$$
   Quando $\beta = 0^\circ$ ($\tan(\beta) = 0$), o TWI é matematicamente indefinido ($\ln(\infty)$). Nesses casos, o SAREL retorna rigorosamente `indisponivel` com causa `"fora-do-dominio"`, NUNCA substituindo por 0 ou constante arbitrária.
