# Proveniência de Assistência por Inteligência Artificial — SAREL v2

**Sistema de Amostragem e Rotulagem para Erosão Laminar (SAREL)**
**Programa de Pós-Graduação em Tecnologias Computacionais para o Agronegócio (PPGTCA 2026)**
**Pesquisador responsável:** Luís Alfredo Ferreira da Silva (`RedZardoz`)
**Última atualização:** 30 de setembro de 2026
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
| 23 | `3bfaa4f` | 2026-09-28 | Execução de U1–U3 (`docs/planejamento/PROMPT_SELECAO_FEICAO_REMEDICAO_E_K_NUMERICO_2026-09-28.md`): seleção da feição com solo mapeado em fronteira pedológica (`pontoEmFronteiraPedologica`, `totalFeicoesSoloRetornadas`, `indiceFeicaoSoloEscolhida`, `feicaoSoloEscolhidaId`) em `src/lib/embrapa/embrapaSoilClient.ts` e `src/lib/embrapa/embrapaSoilClient.test.ts`, remedição ao vivo da correspondência pós-U1 nas mesmas 20 coordenadas rurais + 2 controles em `docs/verificacoes/fontes/wfs_erodibilidade/remedir_correspondencia_pos_u1_2026-09-28.py` gerando `docs/verificacoes/fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_u1_2026-09-28.json`, `docs/verificacoes/fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_u1_2026-09-28.txt` e `docs/verificacoes/fontes/wfs_erodibilidade/getfeatureinfo_3camadas_r13_fronteira_bp3.json` (sem sobrescrever `docs/verificacoes/fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_2026-09-28.json`), e operacionalização da emenda de `D14` (`147a42e`) com leitura de `k_solos` tabelado (`k_solos > 0`) e bloqueio estrito de `k_solos = 0` (`indisponivel("fora-do-dominio")`) em `src/lib/rusle/fatorK.ts`, `src/lib/rusle/fatorK.test.ts`, `src/lib/rusle/linhaDeBase.ts`, `src/types/ponto.ts`, `src/lib/matriz/invariantes.ts`, `src/app/api/gee/select-candidates/route.ts` e `src/lib/export/pacoteReprodutibilidade.ts` | Antigravity (Google DeepMind) |
| 24 | `eba6d7e` | 2026-09-28 | Execução de V1–V4 (atribuição por ponto-em-polígono via WFS 1.1.0 `GetFeature` `INTERSECTS(geometry, POINT(<lat> <lon>))` em `buildGetFeaturePointInPolygonUrl` e `queryEmbrapaSoil` em `src/lib/embrapa/embrapaSoilClient.ts`, marcador `pontoEmFronteiraPedologica: Proveniencia<boolean>` via `diagnosticarFronteiraPedologicaBbox` e `diagnosticarFronteiraPoligonosSorteadosD16` em `src/lib/gee/sorteioPoligonos.ts` e `src/app/api/gee/select-candidates/route.ts`, travas de ordem dos eixos em `docs/verificacoes/fontes/wfs_erodibilidade/conferir_eixos_wfs_110_ao_vivo.py`, `docs/verificacoes/fontes/wfs_erodibilidade/getfeature_pip_3camadas_r13_bp3.json` e `verificarSanidadeZeroFeicoesLoteEmbrapa`, e terceira remedição ao vivo da correspondência em `docs/verificacoes/fontes/wfs_erodibilidade/remedir_correspondencia_pos_v1_pip_2026-09-28.py` gerando `docs/verificacoes/fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_v1_pip_2026-09-28.json` e `docs/verificacoes/fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_v1_pip_2026-09-28.txt` sem sobrescrever `docs/verificacoes/fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_2026-09-28.json` nem `docs/verificacoes/fontes/wfs_erodibilidade/relatorio_correspondencia_bp3_pos_u1_2026-09-28.json`) | Antigravity (Google DeepMind) |
| 29 | `3953871` | 2026-09-28 | Execução de W1–W3 (`docs/planejamento/PROMPT_OPCAO_A_K_DA_CARTA_2024_2026-09-28.md` — Opção A, emendas de `D08` e `D12` em `f629451`): implementação de `kAmbiguoAssociacao` em dois ramos da fonte oficial (`avaliarAmbiguidadeKAssociacaoD08`: Ramo (a) `true`/`false` via `erod_c1..erod_c4`; Ramo (b) `"indisponivel"` / `indisponivel("insuficiente")` quando 1 componente em 2024 com `tipo_unida = 'associacao'` no PR) e aposentadoria/remoção de `classificarNivelEstratoKComponente` em `src/lib/embrapa/embrapaSoilClient.ts` e `src/lib/embrapa/embrapaSoilClient.test.ts`; derivação de `nivelK: 1 | 2` da carta de 2024 (`derivarNivelKDaCarta2024`) com registro de `cod_um`/`cod_um2` e `ogc_fid` (`unidadeDeterminanteK2024`) e persistência/exportação ternária de `kAmbiguoAssociacao` (`true | false | "indisponivel"`) em `src/types/ponto.ts`, `src/lib/matriz/invariantes.ts`, `src/lib/matriz/perfis.ts`, `src/lib/gee/sorteioPoligonos.ts`, `src/lib/gee/sorteioPoligonos.test.ts`, `src/app/api/gee/select-candidates/route.ts`, `src/components/decisoes/PainelSorteioD16.tsx`, `src/lib/export/planilha.ts`, `src/lib/export/pacoteReprodutibilidade.ts` e `src/lib/export/pacoteReprodutibilidade.test.ts`; e medição empírica W2 sobre os candidatos reais da BP3 em `docs/verificacoes/fontes/wfs_erodibilidade/medir_w2_candidatos_bp3_2026-09-28.ts`, `docs/verificacoes/fontes/wfs_erodibilidade/medicao_w2_candidatos_bp3_2026-09-28.json` e `docs/verificacoes/fontes/wfs_erodibilidade/medicao_w2_candidatos_bp3_2026-09-28.md` | Antigravity (Google DeepMind) |
| 30 | `2165853` | 2026-09-29 | Execução de Y1–Y6 (exportação de planos de voo NControl e emenda de `D16` em `f5be525`): implementação do gerador de transectos QGroundControl `.plan` v1 para câmera **Micasense Altum** (`gerarSurveyMicasenseAltum`) com teste de aceitação falsificável contra `docs/Plano de voo exemplo/MissaoCalculoMica.plan` (`survey` #2, `angle: 66`, 62 `Items` = 48 `command: 16` + 14 `command: 206`, `AdjustedFootprintFrontal = 10.652403 m`, 48 `VisualTransectPoints`, erro geodésico máximo `< 0,01 m`), acompanhamento de terreno resolvido na altitude relativa de cada waypoint (`params[6]`) a partir do Copernicus DEM GLO-30 para `GSD = 4,0 cm` (`AGL_desejada = 92,7640 m`) com emissão de ambas as variantes `_terrainfollow.plan` (`FollowTerrain: true`) e `_altfixa.plan` (`FollowTerrain: false`), cálculo do ângulo de faixa pelo aspecto médio GLO-30 (`calcularAspectoMedioGLO30Graus`, `construirVerticesPoligono502Ha`), agrupamento dos 72 polígonos de 5,02 ha em 12 jornadas (`exportarCampanhaVooNControl`) com roteiro CSV/PDF e tabela de autorização de proprietários (`Y6`), segregação estrita sob protocolo cego entre `exportacaoPiloto` e `exportacaoInterprete` (`validarIsolamentoCegoInterprete`, `Y5`) em `src/lib/drone/planoVooNControl.ts` e `src/lib/drone/planoVooNControl.test.ts`, suporte a 72 polígonos de 5,02 ha (`construirPoligono502Ha`, `sortear72PoligonosD16`) em `src/lib/gee/sorteioPoligonos.ts` e `src/lib/gee/sorteioPoligonos.test.ts`, e artefatos de verificação em `docs/verificacoes/voo_ncontrol/relatorio_aceitacao_y1_y6_2026-09-29.json`, `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_jornada_01_terrainfollow.plan` e `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_jornada_01_altfixa.plan` | Antigravity (Google DeepMind) |
| 31 | `4f4881e` | 2026-09-30 | Correções periciais de segurança dos planos de voo, terreno real e cegamento (Z1–Z6 sob `docs/planejamento/PROMPT_CORRECAO_PLANOS_DE_VOO_SEGURANCA_E_CEGAMENTO_2026-09-30.md`): amostragem de altitudes reais do DEM Copernicus GLO-30 (`amostrar_altitudes_copernicus` / `AmostradorElevacaoGLO30` / `criarAmostradorCopernicusGLO30Real`) via `scripts/reduzir_terreno_copernicus.py` com isolamento PROJ_LIB e rejeição estrita P12 (`ErroTerrenoForaDeCoberturaGLO30`) conferida contra benchmark ROTAER do Aeroporto Municipal de Toledo (SBTD) e lavoura em Cascavel; renomeação de fixtures sintéticas para `amostradorSinteticoParaTeste` (Z2); guarda pericial de segurança `ErroEmissaoPlanoSinteticoRecusada` (Z3) bloqueando emissão de `.plan` voável com terreno sintético/não-certificado salvo sob `permitirPlanoSinteticoDemonstracao: true` com prefixo `SINTETICO_NAO_VOAR_`; renomeação dos planos sintéticos comitados para `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_jornada_01_terrainfollow.plan` e `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_jornada_01_altfixa.plan` ao lado de `docs/verificacoes/voo_ncontrol/LEIA-ME_NAO_VOAR.md` (Z4); abandono de chave secreta fixa em `gerarCodigoOpacoInterprete` garantindo não-reprodutibilidade e sigilo absoluto sem o selo do pesquisador (Z5); orientação dos transectos de voo em curva de nível (perpendicular ao aspecto médio GLO-30: `anguloFaixasGraus = (orientacaoPoligonoGraus + 90) % 360`) com o lado maior de 5,02 ha preservado ao longo do declive/catena e registro segregado de `aspectoMedidoGraus`, `orientacaoPoligonoGraus` e `anguloFaixasGraus` no itinerário, CSV e PDF (Z6) em `src/lib/drone/planoVooNControl.ts`, `src/lib/drone/planoVooNControl.test.ts` e `scripts/reduzir_terreno_copernicus.py` | Antigravity (Google DeepMind) |
| 32 | `8e10661` | 2026-09-30 | Correções W1–W5 sob `docs/planejamento/PROMPT_CORRECAO_W1_W5_E_RELATORIO_GERADO_2026-09-30.md`: timeout localizado de 35s no teste Z1 (W1); remoção de `codigoOpacoInterprete` do roteiro de voo do piloto e implementação de teste automatizado anti-vazamento `src/lib/seguranca/cegamentoArtefatos.test.ts` (W2); guarda matemática de borda física raster e bloqueio de NoData `0.0 m` em `scripts/reduzir_terreno_copernicus.py` (W3); download do 4º tile DEM da BP3 (`data/dem_cache/Copernicus_DSM_COG_10_S26_00_W055_00_DEM.tif`), retificação da cobertura para 4 tiles e verificação geométrica com aborto prévio por cálculo (W4); e implementação do gerador mecânico de relatórios `scripts/gerar_relatorio_fase.ts` com execução real de Vitest/tsc, cálculo de SHA-256 e extração direta de artefatos em `docs/verificacoes/2026-09-30_relatorio_fase_gerado.md` (W5) | Antigravity (Google DeepMind) |
| 33 | `1162d19` | 2026-10-01 | Execução do Pipeline Amostral (X0 a X5) e Remedição BP3 sob D16 emendada: correção de pré-condição no sorteio determinístico (`< 4`, renomeado para `minimo_4_candidatos_por_estrato`, guarda no sorteio, asserção $0 < \pi_i \le 1$ e testes em `src/lib/gee/sorteioPoligonos.ts` e `src/lib/gee/sorteioPoligonos.test.ts`, X0); unificação do leitor de terreno DEM GLO-30 local offline em `src/lib/drone/planoVooNControl.ts` e `src/lib/gee/copernicusGeeClient.ts`; relaxamento determinístico de thinning até o piso `exigirDecisao(PARAMETROS.P02)` de 1.000 m buscando meta de pool pós-filtros de 648 candidatos para atingir $\ge 36$ em $\hat{K}=2$ (X1); teto operacional de chamadas GEE aplicado após o filtro de declividade D07 [3%, 20%] (X2); seleção estocástica de ponto na porção elegível do imóvel rural sob auditoria estrita anticircularidade em `src/lib/fundiario/selecaoPontoElegivel.ts`, `src/lib/fundiario/selecaoPontoElegivel.test.ts` e `src/app/api/gee/select-candidates/route.ts` (X3); remedição pericial completa na BP3 com DEM GLO-30 e WFS Embrapa com 84 candidatos em $\hat{K}=2$ (84 $\ge$ 36) e balanço fiel por tercil relatado em `docs/verificacoes/remedicao_candidatos_bp3_d16_2026-09-30.json` e `docs/verificacoes/2026-09-30_remedicao_candidatos_bp3_d16.md`; calculadora de desenho amostral (X5) exploratória com salvaguardas invioláveis em `src/lib/fundiario/calculadoraDesenho.ts`, `src/lib/fundiario/calculadoraDesenho.test.ts`, `src/components/decisoes/CalculadoraDesenhoAmostral.tsx`, `src/components/decisoes/PainelSorteioD16.tsx` e artefato `docs/verificacoes/calculadora/2026-09-30_simulacao_desenho_d16_224m.md` | Antigravity (Google DeepMind) |
| 34 | `b7d5c59` | 2026-10-01 | Execução das Diretrizes C1, C2 e C3 (Segurança de Credenciais, Governança de APIs do Painel e Amostragem GEE em Lote): guarda canônica C1 com recusa compulsória de arquivos de credenciais dentro da raiz do projeto (`src/lib/seguranca/credenciaisSeguras.ts`, `src/lib/seguranca/credenciaisSeguras.test.ts` e padrões proibidos estendidos em `src/lib/seguranca/padroesProibidos.test.ts`); governança C2 de serviços no painel com papel declarado para cada provedor, expurgo de Embrapa AgroAPI sem consumidor e conexão ativa de basemap Mapbox Satellite HD e CARTO (`src/components/config/ApiTokensManager.tsx`, `src/components/map/MapViewer.tsx`, `src/lib/matriz/invariantes.ts` com Planet banido da matriz); amostragem de frequência de solo nu (Ê) em lote C3 via GEE REST `value:compute` com `Image.reduceRegions` em blocos de até 100 pontos | Antigravity (Google DeepMind) |
| 35 | *(este commit)* | 2026-10-01 | Correção Pericial F1–F5 (Eliminação da Fabricação de Ê e Guardas Estruturais): purga dos fallbacks numéricos (F1: remoção de gerador estocástico e de fallback 0,15, adoção de `frequenciaSoloNu: Proveniencia<number>`, retorno obrigatório de `indisponivel` sem credenciais verificado por teste); expurgo definitivo do cache sintético (F2: `git rm docs/verificacoes/cache_frequencia_solo_nu_bp3.json` e auditoria de autenticidade WFS em `docs/verificacoes/cache_pedologia_bp3.json`); retificação dos artefatos de remedição (F3: remoção da tabela de 9 células de K̂=2, declaração explícita de Ê não medido e bloqueio do sorteio conforme P12); auditoria das 14 anotações de exceção no repositório (F4); implementação das guardas estruturais F5 (Diário de Requisições Obrigatório em `src/lib/seguranca/diarioRequisicoes.ts` e Detector de Sequência Monotônica em `src/lib/seguranca/detectorSequencia.ts` integrado a `src/lib/seguranca/padroesProibidos.test.ts`); e geração mecânica de relatório de fase com status SUCESSO (52 arquivos de teste, 388 testes verdes) | Antigravity (Google DeepMind) |

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
