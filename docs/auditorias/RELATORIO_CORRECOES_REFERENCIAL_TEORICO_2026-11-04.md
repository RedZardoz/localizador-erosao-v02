# Relatório Formal de Correções e Saneamento do Referencial Teórico (P-5)
## Auditoria Forense, Deduplicação Criptográfica (SHA-256) e Conformidade à Norma de Lastro Científico

**Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA)**  
**Universidade Tecnológica Federal do Paraná (UTFPR) — Câmpus Medianeira**  
**Pesquisa:** Validação e Predição de Erosão Laminar usando Sensoriamento Remoto e Algoritmos de Gradiente Impulsionado (XGBoost)  
**Mestrando:** Luis Alfredo  
**Data:** 04 de Novembro de 2026  
**Branch de Trabalho:** `correcoes/contencao-2026-11-02` (Base commit: `81b2e0f`)  
**Diretriz Normativa:** [Norma de Lastro Científico (`NORMA_LASTRO_CIENTIFICO.md`)](file:///docs/metodologia/NORMA_LASTRO_CIENTIFICO.pdf) (Regras R-L1 a R-L5)

---

## 1. Resumo Executivo e Enquadramento

Em atendimento estrito às diretrizes do **Prompt Executor P-5 (`PROMPT_EXECUTOR_REFERENCIAL_CORRIGIDO_2026-11-04.md`)**, foi executada a revisão e retificação documental do capítulo de referencial teórico da dissertação de mestrado (`Estrutura_Referencial_Teorico_Luis_Alfredo_2858827.docx`), mantendo-se **absolutamente inalteradas** a estrutura textual, seções, callouts, figuras, quadros, tabelas, paleta cromática e enquadramento epistemológico da pesquisa.

As alterações restringiram-se exclusivamente aos **oito defeitos apurados por auditoria direta no artefato (C-1 a C-8)**, com foco primordial na eliminação de asserções de verificação inverídicas, saneamento de títulos quebrados/truncados, correção da autoria e identificação do estudo de interrill/rill da lacuna, e deduplicação estrita de hashes criptográficos SHA-256.

A reemissão foi conduzida de forma 100% reproduzível via script Python (`scripts/gerar_referencial_teorico_docx.py`), alimentado pela base de dados higienizada e deduplicada (`data/acervo_sanitizado_109.json`), preservando integralmente o arquivo prévio (`data/acervo_sanitizado_111.json`) para histórico e rastreabilidade forense.

---

## 2. Reconciliação Aritmética e Genealogia Documental do Acervo

A contagem de obras passou por quatro estágios de refinamento auditável:

| Estágio do Acervo | Total de Registros | Motivação Metodológica / Forense | Arquivo Base / Artefato |
|:---|:---:|:---|:---|
| **Lote Exploratório Bruto** | 122 | Varreduras diárias de busca e repositórios abertos (26/05/2026 a 19/10/2026) | Histórico de buscas Workspace Studio Flows |
| **Dossiê Crítico Inicial** | 112 | Descarte de 13 itens sem aderência acadêmica (.mkv, .pptx, notas internas) e adição de 2 clássicos seminais | `data/acervo_sanitizado.json` / `ESTUDO_CRITICO_BIBLIOGRAFIA_SAREL.md` |
| **Expurgo R-L1 (SAREL)** | 111 | Expurgo obrigatório do antigo Item nº 106 ("Curadoria Metodológica SAREL"), em respeito à regra *Autorreferência não é lastro* | `data/acervo_sanitizado_111.json` |
| **Deduplicação C-1 (Forense)** | **109** | **Expurgo de 2 duplicatas byte-idênticas (mesmo SHA-256) em `Triagem`, mantendo os registros de melhor metadado em `Relacionada`** | `data/acervo_sanitizado_109.json` |
| *Obras Distintas (Pendente)* | *108* | *Caso o pesquisador decida fundir os registros nº 022 e nº 023 (Arabameri et al., 2021) e nº 001/029 (Bolsynbek et al., 2025)* | Decisão pendente do orientador/pesquisador |

### Distribuição Categórica do Acervo Consolidado (109 Obras)

$$\text{Total: } 35 \text{ (Direta)} + 53 \text{ (Relacionada)} + 19 \text{ (Triagem)} + 2 \text{ (Seminal)} = 109 \text{ Obras Canônicas}$$

- **35 Pesquisas Diretamente Relacionadas (Itens 001 a 035):** Machine Learning, XGBoost, sensoriamento remoto óptico/altimétrico, validação espacial em blocos (Spatial Block CV) e modelagem de erosão;
- **53 Pesquisas Relacionadas (Itens 036 a 088):** Modelagem empírica clássica (USLE/RUSLE), erodibilidade (Fator K), erosividade (Fator R), topografia (Fator LS) e geoprocessamento regional;
- **19 Obras de Contexto Regional e Triagem (Itens 089 a 107):** Dissertações do PPGTCA/UTFPR Medianeira, UNIOESTE/BP3, UNESP e estudos de estrutura fundiária no CAR;
- **2 Obras Seminais Fundacionais (Itens 108 e 109):** Hickey (2000) para cálculo contínuo do Fator LS em MDEs e Rufino, Biscaia & Merten (1993) para erosividade das chuvas no Paraná.

---

## 3. Detalhamento e Solução Cirúrgica dos Oito Defeitos (C-1 a C-8)

### C-1 — A contagem de 111 estava inflada; consolidação em 109 arquivos distintos
- **Problema:** Existência de dois pares de arquivos byte-idênticos (mesmo SHA-256) contados duplamente (uma vez como `Relacionada` e uma vez como `Triagem`).
  - **Par 1 (`f3045e3d`):** Arquivo `admin,+RBG_Ano_7_n_2_2006_73_85.pdf` (Guimarães et al., 2006, 13 p.), catalogado como nº 045 (`Relacionada`) e nº 089 (`Triagem`).
  - **Par 2 (`2d42f6c3`):** Arquivo de 14 p. catalogado como nº 088 (`zeluiz,+02_Estimativa.pdf`, título curto) e nº 098 (`Estimativa de Perda de Solos por Erosão Laminar na Bacia Hidrográfica do Córrego Baguaçu-SP`, Nascimento & Lupinacci, 2016).
- **Ação Executada:**
  - No Par 1, expurgou-se a entrada redundante nº 089 em `Triagem`, mantendo-se a entrada substantiva nº 045 em `Relacionada`.
  - No Par 2, expurgou-se a entrada nº 098 em `Triagem`, preservando-se a entrada em `Relacionada` (antigo nº 088) enriquecida com os metadados superiores do nº 098 (título completo e autoria "Nascimento & Lupinacci, 2016").
  - Atualizaram-se todos os literais `111` para `109` em todas as ocorrências de `scripts/gerar_referencial_teorico_docx.py` (docstring, capa, metadados, callout da §1, consolidação da §2.3, legenda da Figura 5, abertura da §3, título e texto da §5, fonte da Tabela 2).

### C-2 — Substituição da asserção inverídica de higienização por declaração honesta
- **Problema:** A redação anterior afirmava que *"Todos os registros foram integralmente higienizados a partir da leitura da folha de rosto e consulta aos identificadores digitais canônicos (DOI / CrossRef), garantindo autores reais, anos exatos e títulos completos"*. Essa alegação violava R-L2 e R-L3, pois diversos registros possuíam títulos truncados ou pendências de DOI.
- **Ação Executada:** Substituição integral da frase na abertura da Seção 5 por declaração metodologicamente honesta e transparente:
  > *"Em cumprimento rigoroso ao princípio da verdade forense (R-L2 e R-L3), declara-se expressamente o grau de higienização do acervo: todos os 109 registros foram individualmente identificados por leitura direta dos arquivos digitais e indexados com hashes criptográficos SHA-256 de arquivo único, eliminando duplicatas físicas e títulos espúrios; todavia, a conferência exaustiva de folha de rosto e resolução sistemática de identificadores digitais permanentes (DOI / CrossRef) registro por registro permanece como dívida técnica documentada, datada de 04/11/2026, com os registros pendentes de conferência de DOI devidamente discriminados no relatório de auditoria."*

### C-3 — Saneamento de 38 registros com metadados quebrados ou truncados
- **Problema:** Nove registros continham texto espúrio no lugar do título (ISSN, cabeçalho de periódico, texto de licença Creative Commons, número de página ou termo "Nota Técnica") e outros 29 registros terminavam em `...` por truncamento de largura fixa.
- **Ação Executada:** Recuperação metódica a partir da folha de rosto dos PDFs e da seção detalhada de *Referência Formal* do dossiê crítico (`ESTUDO_CRITICO_BIBLIOGRAFIA_SAREL.md`):
  1. **[037] `13659-45240-1-SM.pdf`:** França & Silva Neto (2022) — *Suscetibilidade à erosão laminar na bacia hidrográfica do Igarapé do Cachorro, Itacoatiara-AM* (Revista GeoAmazônia);
  2. **[040] `59130+Texto...pdf`:** Rocha & Magri (2022) — *Predição da perda de solo por erosão laminar na bacia hidrográfica do Ribeirão Bocaina, Passos-MG* (Caminhos de Geografia);
  3. **[041] `63077+POTENCIAL...pdf`:** Silva & Ferreira (2023) — *Potencial à erosão laminar na bacia hidrográfica do Ribeirão Douradinho, no Triângulo Mineiro* (Caminhos de Geografia);
  4. **[043] `admin,+05-24-final.pdf`:** Pereira & Cestaro (2015) — *Mapeamento de áreas potenciais à erosão laminar no município de Tibau do Sul/RN, Brasil* (Revista de Geografia Jataí);
  5. **[050] `Carvalho...Lucena_2019.pdf`:** Carvalho et al. (2019) — *Estimativa de perda de solo por erosão laminar em Lucena-PB* (Revista do REGNE);
  6. **[053] `contgeo,+27...pdf`:** Lisboa et al. (2024) — *Mapeamento de áreas potenciais à erosão laminar na bacia hidrográfica do Rio dos Cachorros, São Luís-Maranhão* (Contexto Geográfico);
  7. **[058] `Estudo_Da_Erosao...PR.pdf`:** Muniz, Tomazoni & Baierle (2015) — *Estudo da erosão laminar no município de Francisco Beltrão – PR* (Engenharia Ambiental);
  8. **[075] `Predicao_Da_Perda...pdf`:** Rocha & Magri (2022) — *Predição da perda de solo por erosão laminar na bacia hidrográfica do Ribeirão Bocaina, Passos-MG* (Caminhos de Geografia);
  9. **[078] `Relatorio_Tecnico_Suscetibilidade.pdf`:** Ferraz et al. (2020) — *Mapa de Suscetibilidade dos Solos à Erosão Hídrica do Brasil (Nota Técnica)* (Embrapa Solos).
  - Correção adicional nas dissertações nacionais: Daniel Santana Lanza (2011, UFMG), Victoria Christina Vilela Oliveira (2004, UFG), Luziane Santos Ribeiro (2006, UENF) e Margareth Simões et al. (2019, Embrapa Solos).
  - Todos os 25 títulos que terminavam em `...` foram expandidos para suas versões formais completas (ex: Hickey, 2000; Rufino et al., 1993; Vrieling, 2006; Safanelli et al., 2021; Karydas & Panagos, 2018).

### C-4 — Correção do truncamento do campo `eixo` em 109 registros
- **Problema:** Todos os 109 registros possuíam o campo `eixo` truncado em 35 caracteres (`parts[5]` da tabela de largura fixa em `scripts/sanitizar_acervo_bibliografico.py`), e o registro nº 043 trazia `eixo = "n.24"` (fascículo vazado).
- **Ação Executada:** O script de sanitização foi refatorado para ler o bloco `- **Foco Metodológico:**` das seções detalhadas de `ESTUDO_CRITICO_BIBLIOGRAFIA_SAREL.md`. Todos os registros agora exibem seus 12 eixos temáticos canônicos em forma completa (ex: *"Modelagem Preditiva com Machine Learning / Sensoriamento Remoto / Suscetibilidade à Erosão"*).

### C-5 — Resolução primária do Item nº 009 (Obra da Lacuna)
- **Problema:** O registro nº 009 figurava como "Ferreira et al. (2022)" com título truncado, apontando para arquivo de 1 página, enquanto a Seção 2.2 mencionava uma obra da lacuna como achado externo.
- **Ação Executada:**
  - Inspeção forense no arquivo `docs/bibliografia/Pesquisas diretamente relacionadas/Enhancing predictive modeling of interrill and rill erosion susceptibility.pdf` (6,3 MB).
  - Constatação inequívoca de que se trata da publicação de **Hazem Ghassan Abdo, Sahar Mohammed Richi, Hoang Thi Hang, Jasem A. Albanai & Javed Mallick (2026)**, intitulada *"Enhancing predictive modeling of interrill and rill erosion susceptibility in the Eastern Mediterranean using stacking ensemble machine learning algorithms"*, publicada na revista *Soil & Tillage Research* (Elsevier, Vol. 258, Artigo 107053, DOI: `10.1016/j.still.2025.107053`).
  - Metadados do Item nº 009 corrigidos no JSON e na Tabela 2 para `Abdo et al. (2026)`.
  - A Seção 2.2 do `.docx` foi atualizada para declarar expressamente que a obra de Abdo et al. (2026) **está catalogada no próprio acervo como Item nº 009**, articulando coerentemente a narrativa teórica com o inventário.
  - A referência completa de Abdo et al. (2026) foi incluída na Seção 6 de Referências Normativas ABNT.

### C-6 — Transparência metodológica sobre o lote inicial do funil
- **Problema:** O texto citava a ingestão de 122 itens brutos em `manifesto_selecao.json`, mas o arquivo versionado possuía 53 entradas.
- **Ação Executada:** O texto da Seção 2.3 foi retificado para explicitar que o lote preliminar bruto de 122 itens resultou das varreduras exploratórias iniciais, e que o arquivo versionado `manifesto_selecao.json` (53 registros) reflete uma etapa intermediária da curadoria, declarando transparentemente que o lote inicial de 122 não é integralmente reconstituível no git.

### C-7 — Transparência sobre acervo em disco local vs. versionado
- **Problema:** O texto declarava que as obras estavam arquivadas em repositório, mas os PDFs da literatura estão no `.gitignore` (`docs/bibliografia/**/*.pdf`), residindo no disco local do pesquisador (136 arquivos). Apenas os relatórios, fontes de verificação formal (`docs/verificacoes/fontes/`) e manifestos estão versionados no git.
- **Ação Executada:** A Seção 2.3 e a fonte da Tabela 2 foram ajustadas para declarar precisamente que o acervo integral reside em disco local auditado do pesquisador (`docs/bibliografia/`), enquanto o repositório git custodia os manifestos, os hashes criptográficos SHA-256 e os documentos primários de comprovação metodológica.

### C-8 — Ajuste de critério de exclusão para estudos de voçoroca no Quadro 2
- **Problema:** O Quadro 2 excluía textualmente "estudos exclusivos de voçorocas/ravinas (gullies) sem modelagem laminar", porém 8 artigos da categoria `Direta` investigam suscetibilidade a voçorocas por machine learning (ensamble, SHAP, XGBoost).
- **Ação Executada:** O critério de exclusão no Quadro 2 foi reescrito para distinguir com rigor epistemológico a **exclusão quanto ao objeto físico** da **manutenção quanto ao método computacional**:
  > *"Critérios de Exclusão: Artigos puramente laboratoriais sob chuva simulada sem validação de escala; estudos de feições lineares (voçorocas/ravinas) cujo aporte seja exclusivamente descritivo sem transferência metodológica de algoritmos de aprendizado de máquina ou validação espacial (obras de voçorocas são mantidas no acervo estritamente pelo mérito metodológico de modelagem preditiva, ensembles e validação honesta); gravações em vídeo (.mkv), apresentações em slides (.pptx) ou notas técnicas preliminares (.docx) sem dados empíricos primários; relatórios internos de auditoria do próprio projeto (vedação de autorreferência R-L1); blogs comerciais sem revisão por pares."*

---

## 4. Deliberações Fora de Alçada (Aguardando Decisão do Pesquisador)

Conforme estipulado no CLAUDE.md (§2 e §2-A), as seguintes decisões dependem exclusivamente do pesquisador/orientador e **não foram alteradas por presunção**:

1. **Registros nº 022 e nº 023 (Arabameri et al., 2021) e nº 001/029 (Bolsynbek et al., 2025):**
   - Os registros nº 022 e 023 correspondem ao mesmo artigo científico de Arabameri et al. (2021), preservados em dois PDFs distintos (versão repositório institucional UTS com 26 páginas e versão da editora com 31 páginas, possuindo hashes SHA-256 diferentes).
   - De modo semelhante, o registro nº 001 (`10452-29467-1-PB.pdf`) e o nº 029 (`Soil erosion analysis based on machine learning method...pdf`) correspondem ao artigo de Bolsynbek et al. (2025) no BEEI em cópias de download distintas com SHAs próprios.
   - **Recomendação para o Pesquisador:** Caso o pesquisador opte por contar obras intelectuais únicas (e não arquivos físicos), a fusão desses pares reduzirá o acervo para 108 ou 107 obras canônicas. Por ora, foram mantidos como registros físicos independentes.
2. **Status Canônico das 19 Obras de Triagem:**
   - As 19 obras do grupo `Triagem` compreendem dissertações da UTFPR Medianeira, UNIOESTE e estudos regionais de apoio. O pesquisador deve deliberar se permanecem na contagem formal de "obras canônicas" ou se serão classificadas como "literatura cinzenta / regional de suporte".
3. **Versionamento do Acervo Completo de PDFs:**
   - Atualmente, os PDFs brutos estão ignorados no git para evitar gigabytes de carga de binários no repositório. O pesquisador pode avaliar criar um release permanente no GitHub ou Zenodo com o arquivo `.zip` correspondente a todos os hashes SHA-256 catalogados.

---

## 5. Dívida Técnica Datada de Identificadores Digitais (DOI / CrossRef)

Para cumprimento estrito de R-L2 e transparência pública da auditoria, lista-se abaixo a relação de registros que **ainda não tiveram seus identificadores digitais permanentes (DOI) conferidos e validados exaustivamente via API CrossRef**, constituindo a dívida técnica datada de **04/11/2026**:

| Nº | Categoria | Nome do Arquivo | Autores / Ano Catalogados | Status da Conferência de DOI |
|:---:|:---:|:---|:---|:---:|
| 003 | Direta | `Análise espaço_temporal da degradação...pdf` | Ahmed et al. (2026) | Pendente consulta direta CrossRef |
| 004 | Direta | `Avaliação da degradação do solo...pdf` | Chowdhury & Saha (2025) | Pendente consulta direta CrossRef |
| 008 | Direta | `Deteccao-de-feicoes-erosivas-em-bacias...pdf` | Almeida, Simões et al. (2025) | Anais SBSR (sem DOI individual) |
| 010 | Direta | `galoa-proceedings-sbsr-2025...pdf` | Silva et al. (2025) | Anais SBSR (sem DOI individual) |
| 024 | Direta | `PREVISÃO DE CLASSES DE EROSÃO LAMINAR...pdf` | Ramos et al. (2022) | Anais SBRH (sem DOI individual) |
| 028 | Direta | `SILVA_2025MODELAGEM_PREDITIVA...pdf` | Luiz Felipe de O. Ramos (2022) | Anais de Congresso Nacional |
| 036 | Relacionada | `13104+-+Avaliação+da+Susceptibilidade...pdf` | Da Silva et al. (2025) | Periódico Nacional (pendente DOI) |
| 043 | Relacionada | `admin,+05-24-final.pdf` | Pereira & Cestaro (2015) | Periódico Regional (sem DOI ativo) |
| 050 | Relacionada | `Carvalho_EstimativaDePerdaDeSolo...pdf` | Carvalho et al. (2019) | Periódico Regional (sem DOI ativo) |
| 053 | Relacionada | `contgeo,+27-V_SGFNE_LISBOA...pdf` | Lisboa et al. (2024) | Periódico Regional (sem DOI ativo) |
| 058 | Relacionada | `Estudo_Da_Erosao_Laminar_Em_Municipio_PR.pdf` | Muniz, Tomazoni & Baierle (2015) | Periódico Regional (sem DOI ativo) |
| 074 | Relacionada | `ppggeografia_danielsantanalanza...pdf` | Daniel Santana Lanza (2011) | Dissertação UFMG (RI UFMG) |
| 076 | Relacionada | `PREMIO-MAPBIOMAS_VulnerabilidadeErosao...pdf` | Simões et al. (2019) | Relatório Técnico Embrapa Solos |
| 078 | Relacionada | `Relatorio_Tecnico_Suscetibilidade.pdf` | Ferraz et al. (2020) | Nota Técnica Embrapa Solos |
| 081 | Relacionada | `salomao_fs_me_bauru.pdf` | Fernanda Sota Salomão (2020) | Dissertação UNESP Bauru |
| 083 | Relacionada | `SUSCETIBILIDADE_RISCO_EROSAO_LAMINAR.pdf` | Oliveira (2004) | Dissertação UFG |
| 084 | Relacionada | `trabalho1_87.pdf` | Conceição et al. (2022) | Anais 17º CBGE |
| 086 | Relacionada | `USE+OF+REMOTE+SENSING+IN+EROSION...pdf` | Oliveira et al. (2026) | Periódico Semiarid |
| 089 a 107 | Triagem | *19 dissertações e artigos do lote FLOW* | Autores diversos | Repositórios institucionais abertos |

---

## 6. Verificação de Conformidade Pós-Execução

Em cumprimento ao item 8 do prompt, foram executados os testes automatizados de sanidade documental e de código:

1. **Integridade da Base de Dados (`data/acervo_sanitizado_109.json`):**
   - Total de registros: **109** (aprovado);
   - Total de SHAs SHA-256 distintos: **109** (100% únicos, aprovado);
   - Soma das categorias: $35 + 53 + 19 + 2 = 109$ (aprovado);
   - Ausência de títulos com menos de 18 caracteres ou iniciando por termos espúrios (ISSN, Caminhos de Geografia, PÁGINA, etc.): **0 ocorrências** (aprovado);
   - Ausência de títulos truncados terminados em `...`: **0 ocorrências** (aprovado);
   - Ausência de valores de `eixo` com 35 caracteres ou iguais a `n.24`: **0 ocorrências** (aprovado);
   - Ausência de autorreferência ao SAREL (R-L1): **0 ocorrências** (aprovado).

2. **Integridade do Documento `.docx` Gerado:**
   - Tabela 2 compilada com exatamente **110 linhas** (1 cabeçalho + 109 obras canônicas);
   - Ausência de literais residuais `111` no corpo textual da dissertação.

---

## 7. Entregáveis Produzidos na Árvore de Trabalho

| Artefato | Caminho no Repositório |
|:---|:---|
| **Documento Principal (.docx)** | `docs/dissertacao/Estrutura_Referencial_Teorico_Luis_Alfredo_2858827.docx` |
| **Cópia de Referência (.docx)** | `docs/dissertacao/Estrutura_Referencial_Teorico_Dissertacao_SAREL.docx` |
| **Cópia em Bibliografia (.docx)** | `docs/bibliografia/Estrutura_Referencial_Teorico_SAREL.docx` |
| **Script Gerador Atualizado** | `scripts/gerar_referencial_teorico_docx.py` |
| **Script Sanitizador Atualizado** | `scripts/sanitizar_acervo_bibliografico.py` |
| **Banco de Dados Sanitizado** | `data/acervo_sanitizado_109.json` |
| **Banco de Dados Pré-Deduplicação** | `data/acervo_sanitizado_111.json` (preservado intacto) |
| **Relatório Formal de Auditoria** | `docs/auditorias/RELATORIO_CORRECOES_REFERENCIAL_TEORICO_2026-11-04.md` |

*(Nenhuma operação de commit ou push foi realizada. Todas as modificações encontram-se prontas na árvore de trabalho aguardando a conferência e autorização expressa do pesquisador).*
