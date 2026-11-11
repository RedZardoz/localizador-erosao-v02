# Relatório de Verificação — Apresentação (PPTX) e Documento (DOCX) Didáticos

**Data:** 2026-11-11  
**Referência:** Prompt S — Executor SAREL (`media_1794405119921_e105f712.md`)  
**Branch:** `correcoes/contencao-2026-11-02`  
**Status da Suíte Vitest:** 114/114 arquivos de teste aprovados (1.007 testes passando, 3 pulados, 0 falhas)  
**TypeScript (`tsc --noEmit`):** 0 erros  
**Auditoria de Estado (`npm run estado:verificar`):** OK (sincronizado)  

---

## 1. Contexto e Objetivos da Intervenção

Os scripts `scripts/gerar_apresentacao_pptx.py` e `scripts/gerar_docx_metodologia_integrada.py` haviam sido editados pela última vez em 31/10/2026, antes de todo o avanço metodológico, filológico e experimental executado entre 09/11 e 11/11/2026. A varredura prévia (gravada em `01_varredura_previa_pptx.txt` e `02_varredura_previa_docx.txt`) constatou:
1. Menções a limiar univariado e isolado de `NDVI <= 0.25` para solo nu (anterior à auditoria primária da máscara GEOS3);
2. Ausência do índice `NBR2` e da fundamentação física de separação de palhada de solo no infravermelho de ondas curtas (SWIR);
3. Ausência das medições empíricas decenais sobre a Bacia do Paraná 3 (677 candidatos espectrais e 148 a 1.011 observações orbitais por ponto);
4. Ausência do resultado do sorteio pré-registrado de D16 (67 polígonos sorteados frente aos 72 nominais, com 34 para treino e 33 para held-out);
5. Falta de explicação didática do estrato vazio $\hat{S}_1 \times \hat{E}_3 \times \hat{K}_2$ ($N_h = 0$) como um achado biofísico autêntico da paisagem agrícola regional;
6. Ocorrência de fórmula errônea ou híbrida para o Fator C da RUSLE ($C = [(1 - \text{NDVI})/2]^{(1 + \text{NDVI})}$ ou modulação BSI tratada como ativa, quando o analítico canônico é estritamente $C = (1 - \text{NDVI})/2$ de Durigon et al., 2014, IJRS).

Nesta rodada de execução urgente para a apresentação acadêmica, ambos os geradores foram totalmente atualizados, alinhados à Norma de Lastro, conferidos contra as fontes versionadas e inspecionados visualmente.

---

## 2. Tabela de Números Utilizados e Suas Fontes Autoritativas

Em estrito cumprimento ao protocolo ("nenhum número vem de memória; tudo sai de artefato versionado"), todos os parâmetros quantitativos empregados na apresentação (PPTX) e no documento (DOCX) foram rastreados e validados contra fontes formais:

| Parâmetro Quantitativo | Valor Utilizado | Significado Metodológico | Fonte Autoritativa Versionada |
| :--- | :---: | :--- | :--- |
| **Universo de Candidatos** | `677` | Total de sítios espectrais válidos na BP3 após filtros territoriais | `docs/verificacoes/selo_publico_d16_2026-11-10.json` / `cache_frequencia_solo_nu_bp3.json` |
| **Densidade Temporal Orbital** | `148 a 1.011` | Intervalo de cenas válidas limpas por candidato (Sentinel-2 2016–2026) | `docs/verificacoes/cache_frequencia_solo_nu_bp3.json` |
| **Tercil 1 de Declividade ($t_1$)** | `5,12%` | Limiar superior da classe de relevo suave ($\hat{S}_1 \in [3,00\%, 5,12\%]$) | `docs/verificacoes/selo_publico_d16_2026-11-10.json` (`limiaresS.t1`) |
| **Tercil 2 de Declividade ($t_2$)** | `8,46%` | Limiar superior do relevo moderado ($\hat{S}_2 \in (5,12\%, 8,46\%]$; $\hat{S}_3 > 8,46\%$) | `docs/verificacoes/selo_publico_d16_2026-11-10.json` (`limiaresS.t2`) |
| **Tercil 1 de Solo Nu ($t_1$)** | `0,0116` | Limiar da frequência de solo nu baixa ($\hat{E}_1 \le 1,16\%$ das datas) | `docs/verificacoes/selo_publico_d16_2026-11-10.json` (`limiaresE.t1`) |
| **Tercil 2 de Solo Nu ($t_2$)** | `0,0490` | Limiar da frequência média ($\hat{E}_2 \in (1,16\%, 4,90\%]$; $\hat{E}_3 > 4,90\%$) | `docs/verificacoes/selo_publico_d16_2026-11-10.json` (`limiaresE.t2`) |
| **Corte Pedológico $\hat{K}_1$** | `≤ 0,0285` | Nível 1: Latossolos/Nitossolos estáveis ($82,4\%$ da bacia, $76,3\%$ candidatos) | `src/config/decisoes.ts` (D09) / Tabela 5 Embrapa Solos (Doc. 246/2024) |
| **Corte Pedológico $\hat{K}_2$** | `≥ 0,0300` | Nível 2: Neossolos/Argissolos frágeis ($17,6\%$ da bacia, $23,7\%$ elegíveis) | `src/config/decisoes.ts` (D09) / Tabela 5 Embrapa Solos (Doc. 246/2024) |
| **Total de Estratos Biofísicos** | `18` | Partição fatorial tridimensional: $3 \times 3 \times 2 = 18$ estratos | `src/config/decisoes.ts` (D12) / `selo_publico_d16_2026-11-10.json` |
| **Polígonos Sorteados Reais** | `67` | Total de sítios amostrais alocados (meta nominal era de 72) | `docs/verificacoes/selo_publico_d16_2026-11-10.json` (`totalPoligonosSorteados`) |
| **Partição Treino / Held-Out** | `34 / 33` | 34 sítios para ajuste e 33 mantidos selados para teste cego único | `docs/verificacoes/selo_publico_d16_2026-11-10.json` (`totalTreino`, `totalHeldOut`) |
| **Área Total Amostrada** | `336,34 ha` | Área territorial total coberta pelos 67 polígonos ($67 \times 5,02$ ha) | `docs/verificacoes/selo_publico_d16_2026-11-10.json` (`areaTotalHectares`) |
| **Raio do Polígono Amostral** | `126,4 m` | Suporte geométrico nativo do plano de voo padrão de VANT ($5,02$ ha) | `src/config/decisoes.ts` (D16) |
| **Estratos em Censo Exaustivo** | `4` | `E_1_2_2` ($N_h=3$), `E_2_2_2` ($N_h=4$), `E_2_3_2` ($N_h=4$), `E_3_2_2` ($N_h=4$) | `docs/verificacoes/selo_publico_d16_2026-11-10.json` (`estratosCenso`) |
| **Estratos Vazios Declarados** | `1` | `E_1_3_2` ($N_h=0$, 9 candidatos na BP3 com $\hat{S}_1 \hat{K}_2$, $\max \hat{E}=0,0331 < 0,0490$) | `docs/verificacoes/selo_publico_d16_2026-11-10.json` (`estratosVazios`) |
| **Semente Criptográfica** | `20261110` | Semente pública pré-registrada em ata na data do sorteio | `docs/verificacoes/selo_publico_d16_2026-11-10.json` (`semente`) |
| **Invariantes do Selo Verificados**| `8` | `INV_1` a `INV_8` aprovados sem violações matemáticas | `docs/verificacoes/selo_publico_d16_2026-11-10.json` (`invariantesVerificados`) |
| **Guarda Temporal Mínima** | `n ≥ 12` | Proibição de classificar candidatos com histórico curto (D11.2) | `src/config/decisoes.ts` (D11) |
| **Teto de Preditores na Matriz** | `14` | Espectro-temporal $\le 8$, Terreno $\le 4$, Solo $= 1$, Chuva $= 1$ (D24) | `src/config/decisoes.ts` (D24) |

---

## 3. Conformidade com as Seis Proibições Estritas (Tarefa 4)

| Item | Proibição | Status no PPTX e DOCX | Evidência de Conformidade |
| :---: | :--- | :---: | :--- |
| **1** | Nenhuma alegação de predição prospectiva | **Conforme** | O trabalho afirma categoricamente **Detecção Contemporânea** (Modelo D). A predição prospectiva com corte temporal de 24 meses (Modelo P) está explicitamente declarada como pausada pela Emenda formal D04. |
| **2** | Nenhum "NDVI $\le 0,25$" isolado como critério de solo nu | **Conforme** | O solo exposto é definido como a **conjunção estrita de 5 testes** biofísicos de Demattê et al. (2018): NDVI $\in [0,00; 0,25]$, NBR2 $\in [0,00; 0,075]$, $B_4-B_3 \ge 0$, $B_3-B_2 \ge 0$ e máscara SCL. |
| **3** | Nenhum Fator C híbrido como fórmula vigente | **Conforme** | O Fator C analítico canônico ativo da RUSLE é estritamente $C = (1 - \text{NDVI})/2$ (Durigon et al., 2014, IJRS; Decisão D01). A Decisão D20 (modulação BSI) é classificada formalmente como análise de sensibilidade metodológica pré-registrada. |
| **4** | "Classe 1" e "Classe 0" não são rótulos | **Conforme** | Tratadas com fidelidade terminológica como **candidatos espectrais** preliminares a feições de erosão e controle para triagem observacional (Decisão D02), jamais como verdade de campo de treino. |
| **5** | Nenhum dado de campo nem resultado de modelo | **Conforme** | Não há dados de campo ou matrizes de confusão nos documentos, pois a campanha de sobrevoo de VANT e o treinamento supervisionado ainda serão executados. Declarar o que falta foi enfatizado como força e transparência. |
| **6** | Nada identificando polígono, proprietário ou estrato individual | **Conforme** | **Nenhum mapa plota polígonos individuais.** O cegamento por distribuição (D16 Opções B+D) foi mantido intacto. Menções espaciais restringem-se ao recorte macroscópico da Bacia do Paraná 3 e aos totais agregados por estrato. |

---

## 4. Estrutura Didática da Apresentação (PPTX — 14 Slides)

A apresentação foi gerada em formato widescreen (16:9, 13,333 × 7,5 polegadas) em `docs/apresentacoes/Apresentacao_SAREL_PPGTCA_2026.pptx` e estruturada nos 9 blocos canônicos:

1. **Slide 1 — Capa Institucional (Bloco 1):** PPGTCA/UTFPR Medianeira, título, subtítulo sobre detecção contemporânea e metadados formais.
2. **Slide 2 — O Problema Científico (Bloco 1):** Fenômeno difuso, ausência de cicatrizes imediatas, subdetecção crônica, mosaico pedológico da BP3 e impacto de sedimentos no Reservatório de Itaipu.
3. **Slide 3 — Por Que o SAREL Existe (Bloco 2):** Pergunta de pesquisa e solução para as três lacunas da literatura (amostra probabilística, rótulo independente com VANT centimétrico e avaliação única em held-out selado).
4. **Slide 4 — O Método em Quatro Passos (Bloco 3):** Delimitar (WorldCover + declividade 3% a 20%), medir 3 dimensões ($S, E, K$), estratificar e sortear selado, coletar em campo e validar.
5. **Slide 5 — A Máscara de Solo Exposto (Bloco 4):** Conjunção de 5 testes de Demattê et al. (2018) transpostos para Sentinel-2 MSI, com nota de lastro (o que sustenta e não sustenta).
6. **Slide 6 — O Slide Mais Didático: Por Que o NBR2 Importa? (Bloco 4 cont.):** Confronto entre a falácia do NDVI isolado (que confunde palhada seca com solo exposto) e a resposta biofísica no SWIR (onde celulose e lignina absorvem em 2.100–2.300 nm, elevando o NBR2 acima de 0,075 e blindando o SPD).
7. **Slide 7 — O Que Foi Medido (Bloco 5):** 677 candidatos, densidade decenal (148 a 1.011 observações/ponto), cumprimento de D11.2, tercis empíricos de declividade e solo nu, e os 18 estratos biofísicos.
8. **Slide 8 — O Desenho Amostral (Bloco 6):** 67 polígonos sorteados (336,34 ha), segregação 34 treino e 33 held-out, os 4 estratos em censo exaustivo e a garantia de Horvitz-Thompson ($\pi_i \times w_i = 1$).
9. **Slide 9 — O Slide Revelador: O Estrato Vazio como Achado Biofísico (Bloco 6 cont.):** Explicação do estrato $E\_1\_3\_2$ ($N_h = 0$, $n_h = 0$). Na BP3, há apenas 9 candidatos em relevo plano com solo frágil, e o $\hat{E}$ máximo foi de 0,0331 < 0,0490. Sob SPD consolidado, esse solo não fica exposto; o SAREL detectou e declarou um fato biofísico real em vez de forçar dados sintéticos.
10. **Slide 10 — Governança e Blindagem (Bloco 7):** Semente pré-registrada (`20261110`), 8 invariantes do selo, cegamento por distribuição (D16 Opções B+D), held-out selado e reprodutibilidade em clone limpo.
11. **Slide 11 — Transparência Científica (Bloco 8):** O que está concluído vs o que ainda falta (campo, fotointerpretação pericial, treino e teste; Modelo P pausado por D04).
12. **Slide 12 — Síntese das Formulações Matemáticas Canônicas:** Quadro gráfico consolidado com as fórmulas atualizadas (NDVI, BSI, OLS, máscara de solo exposto de 5 testes, Fator C canônico de Durigon, Fator K oficial, RUSLE, G2, XGBoost, Split Gain, Kappa e SHAP).
13. **Slide 13 — Referências Bibliográficas Canônicas (Bloco 9):** Obras primárias em normas ABNT NBR 6023:2018 (Chen & Guestrin, Cochran, Daughtry et al., Demattê et al., Durigon et al., Embrapa Solos Doc. 246, Hively et al., Horvitz & Thompson, Lundberg & Lee, Mannigel et al., Renard et al.).
14. **Slide 14 — Encerramento e Contato:** Finalização institucional com dados de contato do mestrando e orientador.

---

## 5. Estrutura do Documento em Prosa (DOCX — 13 Páginas)

O documento em prosa `docs/dissertacao/Metodologia_Integrada_Dissertacao_SAREL.docx` (e correspondente `docs/dissertacao/Metodologia_Integrada_Dissertacao_SAREL.pdf`) foi atualizado para conter:
1. Cabeçalho e metadados formais alinhados à detecção contemporânea e governança do sorteio selado D16.
2. Fundamentação epistemológica completa nos Três Pilares de Replicabilidade e Neutralização de Viés no VANT (VANT como rótulo pericial $Y$, jamais preditor $X$).
3. Especificação metodológica detalhada dos 18 estratos com os tercis empíricos medidos na bacia.
4. Fundamentação física detalhada da máscara de solo exposto com o papel do NBR2 no SWIR (Daughtry et al., 2001, 2004; Hively et al., 2021).
5. **Seção dedicada à Norma de Lastro (Seção 3.8):** Enunciando o que cada fonte primária sustenta **e o que não sustenta** para Demattê et al. (2018), Durigon et al. (2014), Daughtry/Hively, Mannigel/Doc. 246, Renard et al. (1997) e Cochran/Horvitz-Thompson.
6. Remissão formal ao documento complementar de testes `docs/dissertacao/Verificacao_e_Validacao_SAREL_2026-11-11.docx`.
7. **Tabela 1 completa com os 18 estratos:** Identificador, declividade, solo nu, erodibilidade, contagem de candidatos $N_h$, sorteados $n_h$, e indicação dos 4 estratos em censo exaustivo e do estrato vazio declarado $E\_1\_3\_2$.
8. Tabelas 2, 3A, 3B e 4 atualizadas com todas as decisões pré-registradas (D01 a D26), regras e invariantes matemáticos.
9. Referências completas em conformidade com a ABNT NBR 6023.

---

## 6. Inspeção Visual e Registro de Execução

1. **Exportação de Slides para PNG:**
   - Script executado via automação COM (`PowerPoint.Application`) exportou com sucesso 14 imagens PNG de alta resolução (1920 × 1080) em `docs/verificacoes/execucao/2026-11-11s/slides/slide_01.png` a `slide_14.png`.
   - Inspeção visual confirmou: diagramação equilibrada, tipografia sem quebras espúrias, hierarquia cromática (Slate 900, Emerald 600, Sky 700, Amber 700, Rose 700), caixas arredondadas legíveis e ausência de sobreposições ou texto cortado.
2. **Conversão de DOCX para PDF:**
   - Script executado via automação COM (`Word.Application`) converteu o documento em `docs/verificacoes/execucao/2026-11-11s/Metodologia_Integrada_Dissertacao_SAREL.pdf` (e espelho em `docs/dissertacao/`), totalizando exatamente 13 páginas perfeitamente paginadas com tabelas alinhadas e blocos de equações destacados.
3. **Registro dos Arquivos de Execução:**
   - `00_pre_git_branch.txt` (registro do branch prévio);
   - `00_pre_git_status.txt` (estado limpo inicial);
   - `00_pre_estado_verificar.txt` (sincronização prévia);
   - `01_varredura_previa_pptx.txt` (auditoria das 6 ocorrências de 0.25 e desatualizações);
   - `02_varredura_previa_docx.txt` (auditoria dos parâmetros no DOCX);
   - `slides/` (14 lâminas PNG renderizadas);
   - `Metodologia_Integrada_Dissertacao_SAREL.pdf` (cópia de visualização fiel);
   - `03_pos_estado_verificar.txt` (verificação pós-execução);
   - `03_pos_git_status.txt` (arquivos modificados);
   - `03_pos_git_log.txt` (histórico recente).
