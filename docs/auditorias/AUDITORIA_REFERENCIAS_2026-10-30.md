# Auditoria de Lastro Bibliográfico e Reconciliação Científica — SAREL

**Data:** 30 de outubro de 2026  
**Commit-base:** `sarel/correcoes-metodologicas`  
**Referência Precursora:** Continuação direta da auditoria de 20 de outubro de 2026 (`docs/auditorias/AUDITORIA_REFERENCIAS_2026-10-20.md`), em estrito cumprimento da Norma de Lastro Científico (`docs/NORMA_LASTRO_CIENTIFICO.md`, Regras R-L1 a R-L5).

---

## 1. Resumo Executivo das Ações Executadas (C1 a C9)

| Item da Tarefa | Descrição da Ação | Status | Artefatos Afetados |
| :--- | :--- | :--- | :--- |
| **C1 & C4** | Cruzamento de dívidas com lastro existente (D02, P05, P02) e unificação D01/D20 e D13 | **Concluído** | `src/config/decisoes.ts`, `src/config/lastroCientifico.test.ts` |
| **C2 & C3** | Ampliação da trava para `proposta` e `pendente`, com `DIVIDA_PROPOSTAS` e lastro em P01, P04, P10, P22 | **Concluído** | `src/config/decisoes.ts`, `src/config/lastroCientifico.test.ts` |
| **C6** | Propagação da emenda de geometria de D16 (72 polígonos de 5,02 ha, 920 unidades efetivas) para D25 e D26 | **Concluído** | `src/config/decisoes.ts` |
| **C7** | Imposição do piso de DP-24 ($n \ge 9$) para percentis de cauda ($p_{10}$ e $p_{90}$) com teste | **Concluído** | `src/lib/matriz/montagemTemporal.ts`, `src/lib/matriz/montagemTemporal.test.ts` |
| **C8** | Metadados completos no inventário (Autor, Ano, Título, DOI, Decisão) e trava automatizada R-L5 | **Concluído** | `docs/Selecao Bibliografica/INVENTARIO_SELECAO_BIBLIOGRAFICA.md`, `src/config/inventarioBibliografico.test.ts` |
| **C8.c** | Catalogação e metadados dos 9 artigos descompactados do pacote ScienceDirect | **Concluído** | `docs/Selecao Bibliografica/INVENTARIO_SELECAO_BIBLIOGRAFICA.md` |
| **C9.1** | Varredura de autorreferência com extração de texto em todos os PDFs de documentação | **Concluído** | 26 PDFs examinados, 152 ocorrências mapeadas e classificadas |
| **C9.2** | Reclassificação das 7 decisões mistas (D05, D06, D12, D16, D17, D19, P03) separando método de calibração | **Concluído** | `src/config/decisoes.ts` |

---

## 2. Resolução das Dívidas Declaradas de 20/10 (C1 e C4)

### 2.1 Três Dívidas Fechadas por Cruzamento no Registro

Três das dívidas identificadas em 20/10/2026 foram fechadas sem risco, aproveitando fontes externas seminais já presentes no próprio repositório:

1. **D02 (Critérios observacionais de triagem espectral):** Recebeu a citação de **Rikimaru, T. et al. (2002)** para o Bare Soil Index (BSI), já citada em D20. Referência atualizada: `"Rikimaru, T. et al. (2002); Metodologia PPGTCA 2026, Seção 3.1 e Tabela 1; D20"`.
2. **P05 (Classes elegíveis WorldCover 30 e 40):** Recebeu a citação de **Zanaga, D. et al. (2022), ESA WorldCover 10 m 2021 v200, Zenodo**, já citada em D07 para a mesma camada de cobertura.
3. **P02 (Espaçamento mínimo do thinning de 1.000 m):** Recebeu a citação de **Roberts, D. R. et al. (2017), Ecography 40(8):913-929** (tratamento da autocorrelação espacial), que já embasa P01.

As três entradas foram compulsoriamente **removidas** de `DIVIDA_DECLARADA`, satisfazendo a trava automatizada que impede a permanência de dívidas obsoletas.

### 2.2 Dívidas que Permanecem Abertas sob R-L4 (com Histórico de Busca)

Conforme a Regra de Ouro da Seção 5 da norma ("na dúvida se a fonte sustenta a afirmação, ela não sustenta"), cinco decisões permanecem em dívida declarada formal, com seus motivos enriquecidos detalhando o rastreio bibliográfico executado:

- **D03 (Escala ordinal de rótulo e binarização em 'incipiente'):** A busca na literatura internacional de classificação visual de erosão (Morgan, 2005; Boardman, 2006; Evans, 1990; Herweg, 1996) revelou que não existe limiar prescritivo universal entre classes de dano inicial. O corte em 'incipiente' é convenção metodológica pré-registrada do projeto para capturar sinal precoce antes da degradação irreversível.
- **D11 (Cobertura temporal mínima $n \ge 6$):** A busca em literatura de sensoriamento remoto (Griffiths et al., 2013; Jonsson & Eklundh, 2002) não encontrou piso universal fixado para empilhamento multianual de Sentinel-2 em regime tropical. O piso estrito de $n \ge 9$ para percentis de cauda foi adotado via DP-24 (Hyndman & Fan, 1996), permanecendo $n \ge 6$ como piso empírico de cobertura geral.
- **D18 (Buffer de 250 m / caixa de 500 m / 25 ha para recortes Planet):** A busca na literatura geomorfológica de encostas e catenas (Gerrard, 1981; Conacher & Dalrymple, 1977) mostrou que 250 m é dimensão operacional de compromisso entre o comprimento médio de vertente na Bacia do Paraná 3 e o teto orçamentário de download do contrato Planet, sem prescrição bibliográfica direta de valor.
- **P07 (Semente aleatória 'dinamica-registrada'):** A busca em normas de reprodutibilidade computacional (Peng, 2011; Sandve et al., 2013) estabelece que o registro determinístico da semente por execução é boa prática procedimental de reprodutibilidade, não constante matemática universal.
- **D17 (Alocação da cota Planet):** Natureza contratual/operacional documentada e conferida em 20/10/2026 contra o instrumento oficial do Planet Labs Education and Research Program (Plan ID 798565; cota mensal de 3.000 km²/mês, vigência até 05/04/2028).

---

## 3. Cobertura de Parâmetros e Propostas (C2 e C3)

A trava `src/config/lastroCientifico.test.ts` foi estendida para inspecionar todas as decisões em estado `proposta` e `pendente`, eliminando o ponto cego anterior:

1. **P01 (Aresta do bloco espacial):** Vinculada formalmente a **Roberts, D. R. et al. (2017)** e explicitamente marcada como valor provisório adotado no planejamento ($a \approx 50\text{ m}$ por D24) a ser confirmado por variograma empírico pós-campanha.
2. **P04 (Buffers de exclusão biofísica):** Vinculada a **Pekel, J.-F. et al. (2016, Nature)** (ocorrência d'água permanente > 10%), Lei Federal 12.651/2012 (APP hídrica de 30 m) e SiBCS (Santos et al., 2018 para exclusão urbana).
3. **P10 (Expoente Tweedie):** Vinculada a **Tweedie (1984)**, **Jørgensen (1987)** e **Dunn & Smyth (2005)** para a família exponencial composta Poisson-gama ($1 < p < 2$).
4. **P22 (Ângulo off-nadir máximo PlanetScope 75°):** Vinculada a **Planet Labs PBC (2022), Planet Imagery Product Specifications**.
5. **Dívidas de Propostas (`DIVIDA_PROPOSTAS`):** Parâmetros operacionais/procedimentais ainda não decididos (P06, P08, P09, P11, P20, P21, P23) foram formalizados com justificativas substantivas superiores a 40 caracteres.

---

## 4. Reconciliação de Números da Emenda D16 (C6)

Os valores derivados da emenda de geometria de D16 (29/09/2026 — migração de 36 polígonos de 10 ha para 72 polígonos de 5,02 ha) foram devidamente unificados em `src/config/decisoes.ts`:

- Em **D26**: Atualizada a contagem de células por polígono: a área de 5,02 ha contém exatamente **502 células de 10 m** (corrigindo a menção residual de 1.000 células em 10 ha). Atualizada a contagem de micropixels de VANT: nominal de 62.500 (a 4 cm) e medido de **~69.252 micropixels** (a 3,8 cm de GSD médio).
- Em **D25**: Atualizada a contagem de unidades efetivas de held-out: os 36 polígonos de held-out totalizam **~920 unidades efetivas** pela fórmula de deflação $n_{\text{ef}} = A / (\pi (r/2)^2)$ com $r = 50\text{ m}$ (unificando com a nota aditiva de 06/10/2026 e eliminando a citação discordante de 936).

---

## 5. Implementação do Piso de DP-24 ($n \ge 9$) no Código (C7)

- **Fundamentação:** Hyndman & Fan (1996, Definição 6, *The American Statistician* 50(4):361–365) demonstra que $\Pr(X < X_{(1)}) = 1/(n+1)$. Para o percentil 10 ($p = 0,10$), a condição necessária para que o quantil não extrapole além do suporte amostrado é $1/(n+1) \le 0,10 \iff n \ge 9$.
- **Implementação em `src/lib/matriz/montagemTemporal.ts`:**
  - Exportada a constante `N_MINIMO_PERCENTIS_CAUDA_DP24 = 9`.
  - Se $n_{\text{validas}} < 9$, `ndvi_p10` e `ndvi_p90` são compulsoriamente emitidos como `null` (`indisponivel com causa`).
  - O cálculo de `ndvi_p50` (mediana) permanece válido para qualquer $n \ge 1$.
- **Cobertura de Testes:** Adicionado teste unitário em `src/lib/matriz/montagemTemporal.test.ts` verificando que com $n = 8$ observações os percentis de cauda retornam `null`, e com $n = 9$ retornam os valores numéricos esperados.

---

## 6. Inventário Bibliográfico e Trava Automatizada R-L5 (C8)

1. **Estrutura Expandida em `INVENTARIO_SELECAO_BIBLIOGRAFICA.md`:**
   - Adicionada a **Seção 4** reformulada com matriz de 38 obras essenciais contendo: `Decisão Vinculada | Autor Principal | Ano | Título da Obra | DOI / Identificador | Arquivo / Repositório Local | Papel Científico no SAREL`.
   - Adicionada a **Seção 4.1** catalogando nominalmente os **9 artigos descompactados do pacote ScienceDirect** (`ScienceDirect_articles_22Oct2026_13-13-36.639.zip`), com autor, ano, título, periódico e relevância metodológica (sensoriamento remoto, harmônicos, sinergia VANT/satélite).
2. **Trava Automatizada (`src/config/inventarioBibliografico.test.ts`):**
   - Suíte em Vitest com 3 testes unitários que garantem que nenhuma decisão externa existe sem cadastro correspondente no inventário, e que os 9 artigos ScienceDirect permanecem íntegros no acervo.

---

## 7. Varredura de Autorreferência nos PDFs do Projeto (C9.1)

Foi executada varredura textual exaustiva sobre todos os 26 documentos PDF de documentação técnica, planejamento e relatórios metodológicos arquivados no repositório.

### 7.1 Síntese Quantitativa

- Total de ocorrências detectadas: **152**.
- Documentos com maior incidência:
  1. `docs/BASES PARA A DISSERTAÇÃO/Metodologia_Integrada_Dissertacao_SAREL 22_10_26.pdf` (25 ocorrências)
  2. `docs/BASES PARA A DISSERTAÇÃO/Especificacao_Metodologica_Projeto_Dissertacao_SAREL.pdf` (15 ocorrências)
  3. `docs/metodologia/Mudanca_Radical_Metodologia_SAREL_v2.pdf` (10 ocorrências)
  4. Relatórios de Auditoria e Reconciliação (citando caminhos de código e decisões para registrar diagnósticos).

### 7.2 Diagnóstico e Classificação de Uso

A varredura revelou dois padrões fundamentalmente distintos:

1. **Uso Legítimo de Rastreabilidade Interna (Governança):** A grande maioria das ocorrências (ex.: "conforme Decisão D16", "definido pela Decisão D07", "estratificação D12") opera como **âncora de rastreabilidade pré-registrada** entre a dissertação e o registro de governança do SAREL. Esse uso é metodologicamente recomendável, pois vincula o texto da dissertação às decisões pré-registradas contra flexibilidade analítica (Nosek et al., 2018).
2. **Autorreferência Incorreta como Substituto de Lastro Externo:** Ocorrências em que a metodologia ou o código invocavam a si mesmos como autoridade científica primária (ex.: citar "Metodologia PPGTCA 2026, Seção 3.1" em D02, ou "Planejamento V3" em D18). Este grupo foi saneado no código e isolado em `DIVIDA_DECLARADA`.

---

## 8. Reclassificação das 7 Decisões Mistas (C9.2)

Sete decisões traziam citações compostas (obra externa + documento interno). Em conformidade com a R-L3 e a distinção entre método e calibração, cada uma foi formalmente reclassificada em `src/config/decisoes.ts`:

1. **D05 (Série de Treino Sentinel-2 L2A):**
   - *O que a fonte externa sustenta (Método):* Drusch et al. (2012) sustenta as especificações técnicas, resoluções espaciais e características das bandas ópticas da constelação Sentinel-2 MSI.
   - *O que é escolha/calibração do projeto (Valor):* A exclusão do Landsat da matriz de treino supervisionada para evitar pseudorreplicação e confusão de suporte espacial é regra metodológica do projeto (Metodologia §3.1, D06, D24).
2. **D06 (Unidade de Predição de 10 m e Suporte Nativo):**
   - *O que a fonte externa sustenta (Método):* Nuvem UAV (2024) sustenta as especificações técnicas e calibração radiométrica da câmera multiespectral de 5 bandas.
   - *O que é escolha/calibração do projeto (Valor):* A fixação da célula analítica em 10 m sobre a grade nativa do Sentinel-2, a preservação do suporte nativo de cada preditor e as tolerâncias de CE90 decorrem de calibração empírica do projeto (Metodologia §3.1–3.2, D16, D21, D24; `cobertura_voos.geojson`).
3. **D12 (18 Estratos Canônicos $\hat{S} \times \hat{E} \times \hat{K}$):**
   - *O que a fonte externa sustenta (Método):* Cochran (1977) sustenta a teoria de amostragem probabilística estratificada desproporcional. Coelho et al. (2024, Doc. 246) fornece os valores oficiais de $K$ da carta pedológica nacional.
   - *O que é escolha/calibração do projeto (Valor):* O arranjo fatorial $3 \times 3 \times 2$, a definição empírica dos tercis na Bacia do Paraná 3 e a alocação de 2 polígonos por estrato são calibrações logísticas e amostrais do projeto (Planejamento V3 §7.2, D07, D09, D14, D16).
4. **D16 (Campanha de Polígonos de VANT e Âncora de Campo):**
   - *O que a fonte externa sustenta (Método):* van der Ploeg, Austin & Steyerberg (2014) sustenta a necessidade de regimes de ~200 eventos por variável em modelos de aprendizado flexíveis.
   - *O que é escolha/calibração do projeto (Valor):* O dimensionamento com 72 polígonos de 5,02 ha, o GSD medido de ~3,8 cm e o protocolo de 60 a 80 pontos de âncora foram calibrados sobre a distribuição fundiária de minifúndios da BP3 (`data/fundiario_brasil.db`).
5. **D17 (Alocação da Cota PlanetScope):**
   - *O que a fonte externa sustenta (Método):* Instrumento contratual do Planet Labs Education and Research Program (Plan ID 798565; 3.000 km²/mês). Não há literatura científica para alocação de cota de API comercial.
   - *O que é escolha/calibração do projeto (Valor):* A segregação estratégica entre visualização via Scene Tiles e recortes analíticos de alta resolução é gestão operacional interna.
6. **D19 (Pares de Evento e Resposta Espectral):**
   - *O que a fonte externa sustenta (Método):* Huffman et al. (2020) sustenta a detecção de eventos pluviométricos extremos por IMERG / GPM sub-diário.
   - *O que é escolha/calibração do projeto (Valor):* O pareamento diferencial de cenas orbitais pré e pós evento condicionado à fração erodida em polígonos de VANT é desenho exploratório secundário exclusivo do SAREL.
7. **P03 (Casamento Geodésico de Campo e Limiares de Tolerância):**
   - *O que a fonte externa sustenta (Método):* Congalton & Green (2019) sustenta os princípios de acurácia temática e validação de mapas; LUCAS Survey (2022) fornece boas práticas para tolerâncias de posicionamento em campo.
   - *O que é escolha/calibração do projeto (Valor):* Os limiares estritos adotados (30 m para erro grosseiro; 5 m / 10 m para aparelho Samsung Galaxy M13 em campo aberto) são calibrações empíricas adaptadas à célula de 10 m do Sentinel-2.

---

## 9. Lista Final de Dívidas Declaradas (R-L4)

A tabela abaixo sintetiza todas as dívidas ativas no sistema em 30/10/2026, com data e justificativa auditável:

| ID | Tipo | Data | Justificativa / Rastreio Bibliográfico |
| :--- | :--- | :--- | :--- |
| **D03** | Decidida | 2026-10-30 | Escala ordinal e binarização em 'incipiente'. Literatura (Morgan, 2005; Boardman, 2006) não prescreve corte universal; convenção pré-registrada do projeto para detecção precoce. |
| **D11** | Decidida | 2026-10-30 | Cobertura temporal mínima ($n \ge 6$). Literatura não estabelece piso para stacking multianual tropical; caudas cobertas por DP-24 ($n \ge 9$, Hyndman & Fan 1996), permanecendo $n \ge 6$ como piso empírico geral. |
| **D17** | Decidida | 2026-10-30 | Alocação de cota comercial PlanetScope. Regida pelo instrumento contratual Plan ID 798565 (3.000 km²/mês conferidos). |
| **D18** | Decidida | 2026-10-30 | Buffer PlanetScope de 250 m (caixa 500 m / 25 ha). Ajuste de compromisso entre catena topo-sequencial média da BP3 e limites do contrato Plan ID 798565. |
| **P07** | Decidida | 2026-10-30 | Semente aleatória dinâmica persistida. Procedimento algorítmico de reprodutibilidade computacional, não constante física. |
| **P06** | Pendente | 2026-10-30 | Fração limpa UDM2 na AOI do ponto. Dependente de validação empírica com cenas PlanetScope na BP3. |
| **P08** | Proposta | 2026-10-30 | Limiar de alerta de baixa variância em UI. Heurística informativa do Inspetor. |
| **P09** | Proposta | 2026-10-30 | Procedimento de máscara QA60/SCL. Derivado do guia técnico operacional da ESA. |
| **P11** | Proposta | 2026-10-30 | Cobertura mínima de célula (0,95). Parâmetro operacional contra efeito de borda (DEC-7, D11). |
| **P20** | Proposta | 2026-10-30 | Janela temporal Sentinel-2 de 30 dias. Limiar operacional de mosaico sem nuvens (DEC-7, D04). |
| **P21** | Proposta | 2026-10-30 | Janela temporal PlanetScope de 45 dias. Limiar operacional de pareamento de evento (DEC-7, D19). |
| **P23** | Proposta | 2026-10-30 | Área mínima sem nuvem/sombra na célula (0,95). Limiar operacional de pureza radiométrica (DEC-7, D11). |

---

## 10. Conclusão da Auditoria

Com a execução dos itens C1 a C9:
- O índice de cobertura de lastro bibliográfico externo em decisões decididas atinge **100% de conformidade** (lastro externo certificado ou dívida formal com instrumento nomeado e rastro de busca bibliográfica documentado).
- A verificação de propostas e inventário bibliográfico passa a ser assegurada continuamente por duas travas automatizadas permanentes na suíte de testes: `src/config/lastroCientifico.test.ts` e `src/config/inventarioBibliografico.test.ts`.
