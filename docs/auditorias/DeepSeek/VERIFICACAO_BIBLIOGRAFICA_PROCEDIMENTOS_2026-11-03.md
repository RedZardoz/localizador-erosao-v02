# Verificação bibliográfica dos procedimentos — SAREL v2

**Data:** 3 de novembro de 2026
**Commit:** 3a9828e (branch correcoes/contencao-2026-11-02)
**Objeto:** verificar, procedimento por procedimento, se cada etapa está embasada em trabalho científico, se a fonte está arquivada e se ela sustenta a afirmação.
**Natureza:** auditoria independente, somente leitura.

> Critério: não basta citar. A norma R-L1 a R-L5 exige obra externa, conferência no primário, arquivo em docs/verificacoes/fontes/ e declaração do que a fonte sustenta e do que NÃO sustenta. Citação que não sustenta o número é pior que a ausência.

**Legenda:** V = fonte primária arquivada e conferida; P = citação externa plausível, sem primário arquivado/conferido; C = convenção operacional; D = dívida declarada; X = a fonte não sustenta a afirmação.

---

## 1. Sumário

Há citação externa para quase todas as 26 decisões e 16 parâmetros, mas **bibliografia citada não é bibliografia verificada**.

- **5 procedimentos com fonte primária arquivada e conferida:** D09, D14, D15 (com ressalva de OCR), D13 (com ressalva do 9,81), D08 (fonte oficial/WFS).
- **1 com PDF no acervo, mas sem nota de conferência:** D01 (Durigon; a fórmula é sustentada, o rito não foi cumprido).
- **3 dívidas explícitas:** D02, P02 e P05.
- **4 dívidas declaradas de outra natureza:** D03, D18, P07 e D17.
- **7 propostas/pendentes sem norma bibliográfica:** P06, P08, P09, P11, P20, P21 e P23.
- **O restante:** citação externa sem primário, convenção não declarada ou citação que não sustenta o número.

**Casos mais graves:** D02 (Rikimaru não sustenta os cortes), P02 (Roberts não prescreve 1 km), D20 (o termo (1+BSI) não está em nenhuma fonte citada), D22 (tabela de P veio de IA e não foi conferida), D24 (200 EPV é critério de desfecho dicotômico para alvo contínuo) e D10 (0,25 não é prescrito por Demattê/Safanelli).

---

## 2. Decisões (D01–D26)

| ID | Procedimento | Fonte | Diagnóstico | Ação |
|---|---|---|---|---|
| D01 | C = (1 − NDVI)/2 | Durigon (2014) | P — Eq. 3 do PDF é Cr = (−NDVI+1)/2; não há nota em fontes/ | Arquivar com extração e declarar o que não sustenta |
| D02 | Cortes BSI/NDVI | Rikimaru (2002) | X/D — FCD/LANDSAT sustenta o BSI, não os cortes | Declarar cortes como convenção |
| D03 | Escala ordinal | Metodologia interna | C/D — convenção | Manter dívida e sensibilidade |
| D04 | Guarda de 24 meses | Kaufman (2012); Franchini (2011) | P — Kaufman sustenta leakage; duração é decisão | Declarar calibração; arquivar |
| D05 | Sentinel-2 exclusivo | Drusch (2012) | P — constelação sim; exclusão de Landsat é regra do projeto | Declarar a regra |
| D06 | Unidade de 10 m | Nuvem UAV (2024) | C/P — especificação instrumental | Tratar como operacional |
| D07 | 3–20%; WorldCover 30/40 | Zanaga; SiBCS (2018) | P — faixa 3–20 é operacional; classes são do produto | Declarar a faixa; arquivar manuais |
| D08 | K por unidade oficial | Doc. 246; WFS | V/P — camada e Doc. 246 arquivados; amostra interna | Declarar limitação de Neossolo |
| D09 | Duas classes de K | Doc. 246 | V — tabela conferida | Corrigir Mannigel suspensa |
| D10 | NDVI ≤ 0,25 | Demattê (2018); Safanelli (2021) | X/P — GEOS3 não prescreve 0,25; campo de referência copiou texto de D09 | Declarar 0,25 como convenção e limpar referência |
| D11 | n ≥ 12/SE ≤ 0,144; n ≥ 9; n ≥ 12 | Zhu; Hyndman; Agresti; Brown | P — Zhu/Hyndman arquivados; Agresti/Brown não; código usa 6 | Arquivar; implementar D11.2 |
| D12 | 18 estratos | Cochran; Doc. 246; Agresti/Brown | P/D — Cochran é síntese; 18/2 é operacional | Arquivar Cochran; decidir G-01 |
| D13 | R por Rufino sobre CHIRPS | Rufino; Waltrick; Renard; Funk; Huffman | V/P — Rufino/Waltrick/Renard arquivados; CHIRPS/IMERG não; 9,81 é calibração | Arquivar; declarar 9,81 |
| D14 | K numérico | Doc. 246 | V — tabelas 4 e 5 conferidas | Manter |
| D15 | LS | Desmet; Renard; McCool | V/P — Desmet/Renard com OCR; McCool não arquivado | Arquivar McCool; consolidar OCR |
| D16 | 72 polígonos; 2+2 | van der Ploeg (2014) | C/P — 72/5,02/2+2 são calibração; EPV não é desenho | Declarar calibração; decidir G-01 |
| D17 | Cota Planet | Contrato 798565 | C — contratual | Manter |
| D18 | Buffer 250 m | Planejamento interno | C/D — operacional | Manter dívida |
| D19 | Pares de evento | Huffman (2020) | P — IMERG detecta chuva; desenho é exploratório | Arquivar; declarar secundário |
| D20 | C = base × (1+BSI) | Durigon; Rikimaru; Renard | X — nenhuma contém o termo (1+BSI) | Declarar modelo próprio |
| D21 | MDE/curvaturas/TWI | Copernicus; Zevenbergen; Beven; Desmet | P — produto e fórmulas não arquivados | Arquivar fórmulas |
| D22 | P por tabela de campo | Wischmeier; Bertoni/Lombardi | X/D — tabela de IA não conferida; código usa P=1,0 | Verificar ou manter P=1,0 com limitação |
| D23 | pi_i estratificado | King & Zeng; Olofsson; Cochran | P — nenhuma arquivada; Cochran é síntese | Arquivar; declarar área vs polígono |
| D24 | 200 EPV / tetos | van der Ploeg; Riley | X/P — EPV é dicotômico; Riley Parte I é a fonte correta; inventário cita Parte II | Usar Riley Parte I; declarar transposição |
| D25 | Piso 0,40; margem 0,10 | Nosek; Cameron; Hanley; DeLong; Roberts | P/C — métodos sustentados; valores são convenção | Declarar convenção |
| D26 | Fração; binário 25% | Altman & Royston; van der Ploeg | P/C — Altman sustenta não dicotomizar; corte é convenção | Declarar corte |

---

## 3. Parâmetros (P01–P24)

| ID | Procedimento | Fonte | Diagnóstico | Ação |
|---|---|---|---|---|
| P01 | Aresta ~20 km | Roberts | C/P — Roberts orienta blocos, não 20 km | Decidir; derivar do variograma |
| P02 | Thinning 1 km | Roberts; legado | X/D — Roberts não prescreve 1 km | Declarar calibração; obter Cochran |
| P03 | 30 m/estrato/GNSS 5-10 | Congalton; LUCAS | P/C — Congalton sustenta acurácia, não limiares | Declarar calibração |
| P04 | Buffers 30/150/10% | Pekel; Lei 12.651; SiBCS | P/C — 30 m APP é legal; 150 m urbano não vem de Pekel | Declarar 150 m operacional |
| P05 | WorldCover 30/40 | Zanaga | D — v100/v200 exigem citações distintas | Arquivar e corrigir |
| P06 | UDM2 mínimo | sem fonte | D — pendente | Decidir |
| P07 | Semente registrada | sem fonte | C/D — protocolo | Manter dívida |
| P08 | Alerta de variância | heurística | C/D | Declarar |
| P09 | QA60/SCL | ESA Guide | P — guia não arquivado | Arquivar |
| P10 | Grade Tweedie | Tweedie; Jørgensen; Dunn & Smyth | P/C — família sim; grade é escolha | Arquivar; declarar grade |
| P11 | Cobertura 0,95 | sem fonte | C/D | Declarar dívida |
| P20 | Janela S2 30 d | sem fonte | C/D | Declarar dívida |
| P21 | Janela Planet 45 d | sem fonte | C/D | Declarar dívida |
| P22 | Off-nadir 75° | Planet (2022) | P — especificação | Arquivar |
| P23 | Área limpa 0,95 | sem fonte | C/D | Declarar dívida |
| P24 | Série R 23 anos | Waltrick | P — código usa 20 | Alinhar P24 e código |

---

## 4. Os casos que exigem ação imediata

### 4.1 D02 — Rikimaru não sustenta os cortes

A obra é de Forest Canopy Density sobre LANDSAT TM; sustenta o índice BSI, não BSI > 0,10, NDVI < 0,40, BSI < 0,00 e NDVI > 0,65. O LASTRO_NAO_CONFERIDO já registra. Os cortes são convenção do projeto e devem ser declarados como tal.

### 4.2 P02 — Roberts não prescreve 1 km

Roberts (2017) trata de validação cruzada com estrutura espacial; não prescreve espaçamento amostral. O thinning de 1 km é calibração do projeto e, pela tabela de ocupação, é o que torna E_1_2_2 inviável e remove a reserva de E_1_3_2. Um parâmetro que remove um estrato não pode repousar em citação não conferida.

### 4.3 D20 — a fórmula híbrida não é publicada

Durigon sustenta a base; Rikimaru sustenta o BSI; Renard sustenta o domínio do C. Nenhuma contém o termo multiplicativo (1+BSI). D20 é construto do projeto e deve ser apresentado como modelo próprio.

### 4.4 D22 — a tabela de P veio de IA e não foi conferida

O próprio registro declara a tabela como saída de IA, atribuída a Bertoni & Lombardi Neto e Wischmeier & Smith, não conferida no primário. O código usa P = 1,0. Implementar antes da conferência transformaria débito em número de sistema.

### 4.5 D24 — 200 EPV é critério de desfecho dicotômico

van der Ploeg (2014) tem no título “predicting dichotomous endpoints”; o alvo de D26 é fração contínua. O critério de 200 EPV não se aplica diretamente. A fonte correta é Riley (2019, Parte I, DOI 10.1002/sim.7992); o inventário cita a Parte II (10.1002/sim.7993). É transposição metodológica, não erro menor.

### 4.6 D10 — 0,25 não é prescrito por Demattê/Safanelli

As obras são GEOS3/mapeamento de solo; não prescrevem NDVI ≤ 0,25. O campo de referência de D10 ainda contém texto da emenda de Mannigel de D09. O limiar é convenção e precisa ser declarado.

### 4.7 D01 — a fonte sustenta, mas o rito não foi cumprido

A Eq. 3 de Durigon é Cr = (−NDVI+1)/2, equivalente a (1−NDVI)/2. A fonte sustenta a fórmula, mas não há nota de conferência em docs/verificacoes/fontes/; o PDF está em docs/bibliografia. Falta arquivar com extração e declarar o que a obra não sustenta.

---

## 5. O que a trava de lastro verifica

A trava lastroCientifico.test.ts reconhece como lastro externo qualquer texto com (2014), et al., DOI ou volume(n):página. Não verifica se a obra existe, está arquivada ou sustenta a afirmação. A lista LASTRO_NAO_CONFERIDO cobre apenas D02, P05 e P02; as demais passam pelo filtro sintático.

A trava inventarioBibliografico.test.ts melhorou ao verificar caminhos e obras arquivadas, mas a matriz de cobertura ainda tem caminhos antigos (docs/Selecao Bibliografica) e afirma suportes não conferidos; D24/Riley Parte II é exemplo.

Conclusão: a trava detecta ausência de citação, não ausência de suporte. É uma trava de forma, não de conteúdo.

---

## 6. Prioridades

### P0 — antes de qualquer resultado

1. D02: declarar cortes como convenção; restringir Rikimaru ao BSI.
2. P02: declarar 1 km como calibração ou revisar; obter Cochran; decidir G-01.
3. D20: declarar (1+BSI) como construto do projeto.
4. D22: verificar Bertoni/Lombardi ou manter P=1,0 com limitação.
5. D24: usar Riley Parte I para alvo contínuo; corrigir inventário.
6. D10: declarar 0,25 como convenção e limpar referência.

### P1 — antes da campanha

7. Arquivar Durigon com extração da Eq. 3.
8. Arquivar King & Zeng, Olofsson, Nosek, Cameron, DeLong e Altman/Royston.
9. Arquivar Agresti/Brown para D11.2.
10. Arquivar Zanaga v100/v200, Pekel, Congalton e especificação Planet.
11. Alinhar P24 (23 vs 20) e D16 (72/5,02) com o texto.

### P2 — antes da defesa

12. Reconstruir a matriz de cobertura com caminho existente, DOI e status.
13. Fortalecer a trava para exigir arquivo e nota de suporte.
14. Declarar no texto o que é fonte, o que é calibração e o que é convenção.

---

## 7. Limitações

- Não abri todos os PDFs; onde a fonte não está arquivada, a conclusão é “não há evidência no repositório”, não “a citação é falsa”.
- Não executei o pipeline; não há dado de desfecho.
- A rede do ambiente bloqueia vários repositórios; a obtenção de primários depende do pesquisador.
- Não decido se uma convenção deve ser mantida, alterada ou promovida.

---

## 8. Referências

- Durigon et al. (2014), International Journal of Remote Sensing 35(2):441–453. DOI 10.1080/01431161.2013.871081.
- Rikimaru et al. (2002), Tropical forest cover density mapping.
- Cochran (1977), Sampling Techniques, 3rd ed. ISBN 0-471-16240-X.
- Olofsson et al. (2014), Remote Sensing of Environment 148:42–57. DOI 10.1016/j.rse.2014.02.015.
- King & Zeng (2001), Political Analysis 9(2):137–163. DOI 10.1093/oxfordjournals.pan.a004868.
- van der Ploeg et al. (2014), BMC Medical Research Methodology 14:137. DOI 10.1186/1471-2288-14-137.
- Riley et al. (2019), Statistics in Medicine 38(7):1262–1275 (Parte I). DOI 10.1002/sim.7992.
- Riley et al. (2019), Statistics in Medicine 38(7):1276–1296 (Parte II). DOI 10.1002/sim.7993.
- Roberts et al. (2017), Ecography 40(8):913–929. DOI 10.1111/ecog.02881.
- Nosek et al. (2018), PNAS 115(11):2600–2606. DOI 10.1073/pnas.1708274114.
- Cameron et al. (2008), Review of Economics and Statistics 90(3):414–427. DOI 10.1162/rest.90.3.414.
- Altman & Royston (2006), BMJ 332(7549):1080. DOI 10.1136/bmj.332.7549.1080.
- Congalton & Green (2019), Assessing the Accuracy of Remotely Sensed Data, 3rd ed. DOI 10.1201/9780429052729.
- Pekel et al. (2016), Nature 540:418–422. DOI 10.1038/nature20584.
- Zanaga et al. (2022), ESA WorldCover 10 m 2021 v200. DOI 10.5281/zenodo.5571936.
- Coelho et al. (2024), Embrapa Solos, Documentos 246.
- Desmet & Govers (1996), Journal of Soil and Water Conservation 51(5):427–433.
- Renard et al. (1997), USDA Agriculture Handbook 703.
- Rufino et al. (1993), Revista Brasileira de Ciência do Solo 17:439–444.

---

**Fim do relatório.** Nenhum código, decisão ou parâmetro foi alterado por esta auditoria.
