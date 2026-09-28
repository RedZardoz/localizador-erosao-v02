# Proveniência de Assistência por Inteligência Artificial — SAREL v2

**Sistema de Amostragem e Rotulagem para Erosão Laminar (SAREL)**
**Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA 2026)**
**Pesquisador responsável:** Luís Alfredo Ferreira da Silva (`RedZardoz`)
**Última atualização:** 28 de setembro de 2026
**Branch documentada:** `sarel/v2`

---

## 1. Finalidade deste documento

Este registro existe por decisão do pesquisador de **declarar o uso de ferramentas de inteligência artificial** no desenvolvimento do instrumento computacional da dissertação, por questão de honestidade científica.

Ele existe também para corrigir uma imprecisão: até 27/09/2026, dezessete commits desta branch traziam a linha `Co-Authored-By: Claude Opus 5`, **inclusive quinze cujo código foi escrito por outro agente**. A causa foi de especificação: os prompts executivos redigidos pelo agente de auditoria instruíam o agente executor a assinar com a identidade do primeiro. A instrução foi corrigida nos quatro prompts em `docs/planejamento/` (ver §5), e este documento passa a ser a fonte autoritativa de proveniência por commit.

**O histórico Git não foi reescrito.** Os documentos de verificação em `docs/verificacoes/` e os prompts em `docs/planejamento/` citam hashes nominalmente, e reescrevê-los romperia a rastreabilidade que a **Regra 9** do próprio sistema protege. Trocar um registro impreciso por um registro rompido seria pior. A correção é aditiva: esta tabela prevalece sobre os *trailers* de commit onde houver divergência.

---

## 2. Papéis

| Papel | Quem | O que fez |
|---|---|---|
| **Pesquisador responsável** | Luís Alfredo Ferreira da Silva (`RedZardoz`) | Todas as decisões metodológicas (D01 a D20, P01 a P07), concepção da pesquisa, autoria e responsabilidade integral pelo conteúdo científico. Autor de todos os commits não listados na §3. É o `author` de **todos** os commits da branch. |
| **Agente de auditoria e especificação** | Claude Opus 5 (Anthropic), via Claude Code | Auditoria de coerência e efetividade científica, redação dos prompts executivos, verificação independente dos relatórios de execução (reexecutando testes, `tsc` e `build`), e registro das decisões que o pesquisador confirmou. Não escreveu o código das fases de implementação. |
| **Agente executor** | Antigravity (Advanced Agentic Pair Programmer) | Implementação do código sob os prompts especificados, incluindo testes, documentos de verificação da Regra 8 e os commits correspondentes. |

Nenhum agente tomou decisão metodológica. As decisões registradas em `src/config/decisoes.ts` com `decididoPor: "pesquisador"` foram confirmadas pelo pesquisador antes de qualquer registro, e os prompts executivos proíbem explicitamente que o agente executor as edite.

---

## 3. Commits com assistência de IA

### 3.1 Executados por **Antigravity**, sob especificação do agente de auditoria

Os quinze commits abaixo trazem no corpo da mensagem a linha `Co-Authored-By: Claude Opus 5`, **que está incorreta**: o código foi escrito por Antigravity. Esta tabela é a fonte autoritativa.

| # | Commit | Data | Objeto | Prompt que o especificou |
|---|---|---|---|---|
| 1 | `53693a8` | 2026-09-26 | Elimina fabricação dos fatores RUSLE no Arquivo 01 e imputação por zero no Arquivo 05 | `docs/planejamento/PROMPT_CORRECAO_FABRICACAO_RUSLE_2026-09-26.md` |
| 2 | `2774932` | 2026-09-26 | Fecha lacuna do varredor para numerais entre aspas; remove datas padrão em planilha | idem |
| 3 | `46bf35f` | 2026-09-26 | Card da Linha de Base RUSLE no Inspetor; verificação formal da Regra 8 | idem |
| 4 | `4ae6d3c` | 2026-09-26 | Deriva alvo supervisionado do Arquivo 01 da rotulagem humana canônica | `docs/planejamento/PROMPT_CORRECAO_ROTULO_ARQUIVO01_2026-09-26.md` |
| 5 | `e66d3a9` | 2026-09-26 | Endurece validação cruzada espacial; descarte proporcional de `Bloco_Espacial` | idem |
| 6 | `7e42014` | 2026-09-26 | Prova formal da eliminação do alvo fabricado no Arquivo 01 | idem |
| 7 | `396c50e` | 2026-09-26 | Alinha contagem de amostras entre Arquivo 01 e Arquivo 04 | `docs/planejamento/PROMPT_CORRECAO_ALVO_TREINO_E_FILA_2026-09-26.md` |
| 8 | `207dca2` | 2026-09-26 | Elimina alvo circular por `classeAmostral` e heurística de `Tipologia_Feicao` | idem |
| 9 | `82bd7e7` | 2026-09-26 | Remove literal fabricado de bacia no LOCO; descarte proporcional com aborto | idem |
| 10 | `903805a` | 2026-09-26 | Elimina imputação de `Classe_Alvo_Binaria` por `fillna` | idem |
| 11 | `4383d76` | 2026-09-26 | Delega perfil `matriz-treino` a `montarMatrizTreino`; exige `rotulosConsolidados` | idem |
| 12 | `bb7e192` | 2026-09-26 | Remove fallback de rótulo no Inspetor; amplia varredor; descarta candidato incompleto | idem |
| 13 | `28b78e5` | 2026-09-26 | Remove pré-preenchimento de classe no template Kobo; rejeita submissão sem classe | idem |
| 14 | `4ea31ba` | 2026-09-26 | Prova formal da eliminação do alvo circular no treino | idem |
| 15 | `b83c5b7` | 2026-09-27 | FASE 0: separa B11/B12, valida domínio do Fator C, elimina `adquiridoEm` literal, guardas D11 e P02, isola `PROJ_LIB` | `docs/planejamento/PROMPT_OPERACIONALIZACAO_INTEGRAL_SAREL_2026-09-26.md` |

### 3.2 Executado pelo **agente de auditoria** (Claude Opus 5)

| # | Commit | Data | Objeto |
|---|---|---|---|
| 16 | `7c60756` | 2026-09-27 | Registro de P02 (piso de thinning em 1.000 m) e D20 (Fator C híbrido SPD) como decididas, após confirmação expressa do pesquisador; e substituição de contagem literal por invariante de partição em `src/config/decisoes.test.ts` |
| 19 | `a34c86a` | 2026-09-28 | Corrige a citação do Documentos 246 em D08, D09 e D14 em `src/config/decisoes.ts`, conferida na fonte (`Coelho et al., 2024, 40 p.`), e adiciona recomputação da tabela de distorção em `docs/verificacoes/projecao/verifica_tabela_recalculada_2026-09-28.py` |
| 20 | `184dfd8` | 2026-09-28 | Registra `docs/planejamento/PROMPT_CORRECAO_RELATO_FASE_A0_A1_2026-09-28.md` |

Nestes commits a linha `Co-Authored-By: Claude Opus 5` **está correta**.

### 3.3 Commit anterior a esta sequência

| Commit | Data | Objeto | Observação |
|---|---|---|---|
| `772e60c` | 2026-09-03 | Corrige erro de sintaxe que impedia o app de iniciar | Traz a linha `Co-Authored-By: Claude Opus 5`, de sessão anterior de assistência não documentada por este registro. O pesquisador declara-se autor do commit. Esta sessão não dispõe de elementos para detalhar o escopo da assistência então prestada, e por isso não o afirma. |

### 3.4 Demais commits da branch

Dos 115 commits da branch `sarel/v2` anteriores a 28/09/2026, 17 trazem linha de co-autoria (os 16 das §3.1 e §3.2 mais o `772e60c` da §3.3). Os **98 restantes** não trazem qualquer linha de co-autoria e são de autoria do pesquisador, conforme sua declaração de 27/09/2026.

### 3.5 Executados por **Antigravity** (Google DeepMind) com identificação própria (a partir de 28/09/2026)

| # | Commit | Data | Objeto | Agente executor |
|---|---|---|---|---|
| 17 | `de9e025` | 2026-09-28 | FASE A0: operacionaliza D07/P05 (concordância interanual WorldCover v100∧v200 em `{30,40}`), D08/D09 (`kAmbiguoAssociacao` para UMs associadas com níveis K distintos, fora da matriz de treino) e D15 (projeção EPSG:31982 com distorção máxima `+0,12%` em 2 casas decimais) sob correções C1–C5 | Antigravity (Google DeepMind) |
| 18 | `8bc55a7` | 2026-09-28 | FASE A1: implementa o mecanismo determinístico de sorteio estratificado de 36 polígonos de 10 ha (`D16` e `D23` — 18 treino + 18 held-out pareados por estrato `E_i`), CLI com `--dry-run`, rota local e painel no modal de Decisões Metodológicas, sem executar sorteio real | Antigravity (Google DeepMind) |
| 21 | `0d5014a` | 2026-09-28 | Correção T1–T4 e disciplina R1 (`docs/planejamento/PROMPT_CORRECAO_RELATO_FASE_A0_A1_2026-09-28.md`): extração de `docs/Selecao Bibliografica/Pesquisas diretamente relacionadas/CNPS-DOC-246-2024.pdf` em `docs/verificacoes/fontes/doc246/extrair_cnps_doc_246_2024.py`, desmarcação de WFS `bra_erodibilidade_2024_sirgas2000` em `src/lib/embrapa/embrapaSoilClient.ts` e `src/lib/export/pacoteReprodutibilidade.ts`, testes T3.1 (`hashIntegridade`) e T3.2 (`pi_i * w_i = 1`) em `src/lib/gee/sorteioPoligonos.test.ts`, rótulos `[SINTETICO]` em `scripts/sortear_poligonos_d16.ts`, e verificador `src/lib/seguranca/provenienciaCaminhos.test.ts` | Antigravity (Google DeepMind) |
| 22 | `80f63c9` | 2026-09-28 | Fechamento da dívida do WFS de erodibilidade (`geonode:bra_erodibilidade_2024_sirgas2000`): consulta ao vivo em `docs/verificacoes/fontes/wfs_erodibilidade/consultar_wfs_erodibilidade_2024.py` com esquema XML salvo em `docs/verificacoes/fontes/wfs_erodibilidade/describe_feature_type_bra_erodibilidade_2024.xml`, respostas brutas das 3 camadas em `docs/verificacoes/fontes/wfs_erodibilidade/getfeatureinfo_3camadas_rural_simples_bp3.json` e `docs/verificacoes/fontes/wfs_erodibilidade/getfeatureinfo_3camadas_rural_associacao_bp3.json`, medição de correspondência em 20 pontos rurais da BP3 em `docs/verificacoes/fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_2026-09-28.json`, atualização de `src/lib/embrapa/embrapaSoilClient.ts`, `src/lib/embrapa/embrapaSoilClient.test.ts`, `src/types/proveniencia.ts`, `src/types/ponto.ts`, `src/lib/matriz/invariantes.ts`, `src/app/api/gee/select-candidates/route.ts` e `src/lib/export/pacoteReprodutibilidade.ts` | Antigravity (Google DeepMind) |
| 23 | *(este commit)* | 2026-09-28 | Execução de U1–U3 (`docs/planejamento/PROMPT_SELECAO_FEICAO_REMEDICAO_E_K_NUMERICO_2026-09-28.md`): seleção da feição com solo mapeado em fronteira pedológica (`pontoEmFronteiraPedologica`, `totalFeicoesSoloRetornadas`, `indiceFeicaoSoloEscolhida`, `feicaoSoloEscolhidaId`) em `src/lib/embrapa/embrapaSoilClient.ts` e `src/lib/embrapa/embrapaSoilClient.test.ts`, remedição ao vivo da correspondência pós-U1 nas mesmas 20 coordenadas rurais + 2 controles em `docs/verificacoes/fontes/wfs_erodibilidade/remedir_correspondencia_pos_u1_2026-09-28.py` gerando `docs/verificacoes/fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_u1_2026-09-28.json`, `docs/verificacoes/fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_u1_2026-09-28.txt` e `docs/verificacoes/fontes/wfs_erodibilidade/getfeatureinfo_3camadas_r13_fronteira_bp3.json` (sem sobrescrever `docs/verificacoes/fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_2026-09-28.json`), e operacionalização da emenda de `D14` (`147a42e`) com leitura de `k_solos` tabelado (`k_solos > 0`) e bloqueio estrito de `k_solos = 0` (`indisponivel("fora-do-dominio")`) em `src/lib/rusle/fatorK.ts`, `src/lib/rusle/fatorK.test.ts`, `src/lib/rusle/linhaDeBase.ts`, `src/types/ponto.ts`, `src/lib/matriz/invariantes.ts`, `src/app/api/gee/select-candidates/route.ts` e `src/lib/export/pacoteReprodutibilidade.ts` | Antigravity (Google DeepMind) |

---

## 4. Natureza da assistência, por categoria

Para a declaração acadêmica, convém distinguir o que a assistência produziu:

| Categoria | Houve assistência? | Observação |
|---|---|---|
| Concepção da pesquisa, pergunta científica, recorte | **Não** | Integralmente do pesquisador |
| Decisões metodológicas (D01 a D20, P01 a P07) | **Não** | Registradas com `decididoPor: "pesquisador"`. Agentes recomendaram alternativas quando consultados; a escolha e o registro foram do pesquisador |
| Seleção de referências bibliográficas | Parcial | Referências propostas por agentes foram conferidas contra a fonte; as não conferidas estão declaradas como tal |
| Implementação de código e testes | **Sim** | Antigravity, sob especificação |
| Auditoria de integridade e coerência | **Sim** | Claude Opus 5, com verificação independente por reexecução |
| Redação da dissertação | Fora do escopo deste repositório | |

---

## 5. Correção aplicada na especificação

Em 27/09/2026 os quatro prompts em `docs/planejamento/` passaram a exigir que **cada agente assine com a própria identidade**, com proibição explícita de usar a de outro:

- `docs/planejamento/PROMPT_CORRECAO_FABRICACAO_RUSLE_2026-09-26.md`
- `docs/planejamento/PROMPT_CORRECAO_ROTULO_ARQUIVO01_2026-09-26.md`
- `docs/planejamento/PROMPT_CORRECAO_ALVO_TREINO_E_FILA_2026-09-26.md`
- `docs/planejamento/PROMPT_OPERACIONALIZACAO_INTEGRAL_SAREL_2026-09-26.md` (Proibição P11)

A partir da FASE 1 do programa de operacionalização, os commits de Antigravity passam a trazer a sua própria identificação, e cada fase acrescenta suas linhas à §3 deste documento.

---

## 6. Como citar este registro

Sugestão de formulação para a seção de declaração de ferramentas da dissertação:

> O instrumento computacional foi desenvolvido com assistência de agentes de inteligência artificial em dois papéis distintos e declarados: implementação de código sob especificação (Antigravity, Advanced Agentic Pair Programmer) e auditoria de integridade científica com verificação independente (Claude Opus 5, Anthropic). Todas as decisões metodológicas foram tomadas e registradas pelo pesquisador, sem delegação, conforme o registro formal em `src/config/decisoes.ts`. A proveniência por commit está documentada em `docs/PROVENIENCIA_ASSISTENCIA_IA.md`.

O pesquisador é responsável integral pelo conteúdo científico, pelas decisões metodológicas e pelo resultado.
