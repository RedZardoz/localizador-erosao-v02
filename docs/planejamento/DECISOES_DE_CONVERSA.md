# Registro de Decisões de Conversa — SAREL

Este arquivo registra decisões tomadas em diálogo com o pesquisador; `src/config/decisoes.ts` continua sendo a fonte canônica de parâmetros metodológicos; e este arquivo existe para que decisões de conversa não se percam entre sessões.

---

## Estrutura de Cada Entrada

## <ID sequencial> — <título curto>
- Data:
- Texto literal da decisão:
- Consequência implementada / pendente:
- Onde está no código:
- Supera ou emenda:

## 01 — Fator C: Durigon et al. (2014) puro

- Data: 2026-11-06
- Texto literal da decisão: "Vamos manter Durigon, manter NDVI e BSI separados ao
  XGBoost e ele constrói o produto se ele existir"
- Consequência implementada / pendente: IMPLEMENTADA. `calcularFatorC(ndvi)` com
  um argumento obrigatório; fórmula `(1 - NDVI) / 2`; consulta
  `exigirDecisao(DECISOES.D01)` como portão; variante com BSI renomeada para
  `calcularFatorCSensibilidadeBsi`, fora do caminho analítico, com teste de
  inalcançabilidade; exceção `EXC-LIB-RUSLE-FATORC-BSINUM` removida do varredor.
- Onde está no código: `src/lib/rusle/fatorC.ts:52-60` e `:105-131`;
  `src/lib/rusle/rusle.test.ts:80` e `:130-159`; commit `992cec0`.
- Supera ou emenda: supera a fórmula híbrida `((1-NDVI)/2)×(1+BSI)` que vigorava
  no código contra D01. A segunda metade desta decisão — "NDVI e BSI separados
  ao XGBoost" — foi superada pela decisão 05.

## 02 — Regra 4 estrita: triagem é triagem, rótulo é humano

- Data: 2026-11-06
- Texto literal da decisão: "Vamos com a Regra 4 estrita: triagem é triagem,
  rótulo é humano"
- Consequência implementada / pendente: PENDENTE. D02 continua `decidida` com o
  valor "Classe 1 (Erosão: BSI > 0.10 e NDVI < 0.40) vs Classe 0 (Controle/SPD:
  BSI < 0.00 e NDVI > 0.65)" — regra espectral no campo de um critério
  observacional humano. Falta: devolver D02 a `pendente` com a trava original
  (ficha KoboToolbox); mover o par de limiares para parâmetro operacional de
  triagem; separar de D10 o limiar de Ê do corte de triagem; e meta-teste que
  falhe se `classificarPontoEspectral` alcançar o rótulo.
- Onde está no código: `src/config/decisoes.ts:79-90` (não alterado);
  `src/lib/gee/amostragemBiofisica.ts:57-64` (afirma a demarcação em docstring,
  sem trava). Proteção parcial e indireta existe no avaliador:
  `PREFIXOS_PROIBIDOS = ("Rotulo_",)`.
- Supera ou emenda: contradiz o valor atualmente gravado em D02, que precisa ser
  emendado pelo pesquisador.

## 03 — RUSLE_Fator_LS sai da matriz de treino

- Data: 2026-11-06
- Texto literal da decisão: "LS sai da matriz, alvo canônico é Fracao_Erodida"
- Consequência implementada / pendente: IMPLEMENTADA. `RUSLE_Fator_LS` removido
  de `matriz-treino` e `matriz-heldout`; preservado em `planilha` e em
  `linha-de-base-rusle`. O cálculo de LS não foi tocado: continua sendo um dos
  cinco fatores do Invariante 1.
- Onde está no código: `src/lib/matriz/perfis.ts` (perfis de matriz);
  `src/lib/rusle/fatorLS.ts` e `linhaDeBase.ts` inalterados; commits `2444c75`
  a `ca8ed77`.
- Supera ou emenda: alinha o perfil ao campo `excluidos` de
  `scripts/d25/config_pre_registro_PROPOSTA.json`, que já declarava "LS como
  preditor (colinear com declividade; entra só na linha de base RUSLE)".

## 04 — Alvo canônico é Fracao_Erodida

- Data: 2026-11-06
- Texto literal da decisão: "LS sai da matriz, alvo canônico é Fracao_Erodida"
- Consequência implementada / pendente: IMPLEMENTADA na forma definida pela
  decisão 07. `Fracao_Erodida` declarada alvo primário (D26);
  `Classe_Alvo_Binaria` como desfecho secundário (D03); `Rotulo_Classe` como
  escala ordinal de origem (D03); `Alvo_Binario_25` removida dos perfis de
  matriz e do contrato de esquema, por ser função determinística de
  `Fracao_Erodida` recalculável pelo avaliador (`LIMIAR_BINARIO = 0.25`).
- Onde está no código: `DECLARACAO_ALVOS_MATRIZ` em `src/lib/matriz/perfis.ts`;
  `COLUNAS_CONTRATO` em `src/lib/matriz/esquema.ts` (sem `Alvo_Binario_25`);
  teste invertido em `esquema.test.ts` nomeando a decisão e a data.
- Supera ou emenda: emendado pela decisão 07, que trocou remoção em bloco por
  declaração mais trava.

## 05 — Manter a exclusão do pré-registro: bandas e índices de data única fora da matriz

- Data: 2026-11-06
- Texto literal da decisão: "Concordo, mantenha a exclusão e acrescente a tarefa 5"
- Consequência implementada / pendente: IMPLEMENTADA. Removidas de
  `matriz-treino` e `matriz-heldout`: `Banda_B2`, `Banda_B4`, `Banda_B8`,
  `Banda_B12`, `NDVI`, `BSI`. Mantidas as métricas de série declaradas no
  pré-registro: `Frequencia_Solo_Nu`, `Composto_Solo_Nu_B12`,
  `Composto_Solo_Nu_Razao_B4_B2`, `Taxa_Degradacao_SWIR_Anual` e a coluna de
  vigor de pico.
- Onde está no código: `src/lib/matriz/perfis.ts`; teste de regressão por grupo
  em `src/lib/matriz/perfisIntegridade.test.ts`.
- Supera ou emenda: SUPERA a segunda metade da decisão 01. O pré-registro exclui
  NDVI e BSI por colinearidade com as bandas e por confundirem fase da safra; o
  planejador havia recomendado o contrário sem conhecer o arquivo de
  pré-registro, e retificou.

## 06 — NDVI e BSI entram no perfil planilha, para auditoria

- Data: 2026-11-06
- Texto literal da decisão: "NDVI e BSI entram no perfil planilha para auditoria"
- Consequência implementada / pendente: IMPLEMENTADA. Quatro colunas, em pares
  adjacentes conforme §15: `NDVI`, `NDVI_Origem`, `BSI`, `BSI_Origem`. Valores e
  origem derivados de `Proveniencia<number>` real, não de string fixa.
  Invariante 3 estendido para incluir os dois no censo de `Campos_Estimados`.
- Onde está no código: `src/lib/export/planilha.ts:117-120`;
  `src/types/ponto.ts:77-79` (campo `espectral`);
  `src/lib/matriz/invariantes.ts` (censo e pares `_Origem`).
- Supera ou emenda: complementa a decisão 05 — fora da matriz, dentro da
  planilha.

## 07 — Declaração mais trava, em vez de remoção em bloco das colunas de alvo

- Data: 2026-11-06
- Texto literal da decisão: "Vamos com a quarta opção"
- Consequência implementada / pendente: IMPLEMENTADA. Alvos e chaves declarados
  explicitamente em `perfis.ts`, com `papel` e `decisaoId` por coluna; trava
  espelhada TypeScript contra Python com cinco verificações (a) a (e), cada uma
  com meta-teste de divergência plantada; apenas `Alvo_Binario_25` removida;
  `Classe_Alvo_Binaria` e `Rotulo_Classe` preservadas, porque D03 pré-registra
  análise de sensibilidade sobre a escala ordinal de quatro níveis.
- Onde está no código: `DECLARACAO_ALVOS_MATRIZ` e `DECLARACAO_CHAVES_MATRIZ` em
  `src/lib/matriz/perfis.ts`; `src/lib/matriz/travaAlvosPreRegistro.test.ts`;
  linha nova do RESUMO em `scripts/auditoria/mapear_matriz_vs_prerregistro.mjs`.
- Supera ou emenda: emenda a decisão 04. Motivo registrado: o avaliador
  pré-registrado já barra as quatro colunas como preditor
  (`PROIBIDOS_ALVO_E_CHAVES` e `PREFIXOS_PROIBIDOS`), de modo que a remoção em
  bloco destruiria duas análises pré-registradas sem ganho de proteção.

## 08 — Estimador de vigor de pico: mediana dos máximos por safra

- Data: 2026-11-08
- Texto literal da decisão: "Vamos com a mediana dos máximos por safra"
- Consequência implementada / pendente: PENDENTE. `persistenciaTemporal.ts:163-164`
  ainda calcula o percentil 90 da série inteira, num campo chamado
  `ndviMaximoMediano` cujo nome já prometia o estimador por safra. A coluna
  ainda se chama `NDVI_P90_Serie` nos perfis, e o pré-registro declara
  `NDVI_Maximo_Mediano` — divergência que esta decisão fecha quando implementada.
  BLOQUEIO: "máximo por safra" exige fronteira de safra, e NÃO existe decisão nem
  parâmetro que a defina. O parâmetro precisa ser proposto com alternativas e
  números medidos, e aprovado pelo pesquisador, antes da implementação.
- Onde está no código: `src/lib/gee/persistenciaTemporal.ts:42, 163-164`;
  `src/types/ponto.ts:34` (`ndviP90Serie`); `src/lib/matriz/perfis.ts`
  (`NDVI_P90_Serie`); `scripts/d25/config_pre_registro_PROPOSTA.json`
  (`NDVI_Maximo_Mediano`).
- Supera ou emenda: resolve, a favor do nome, a incoerência entre o nome do campo
  e o que o código calcula.

## 09 — Credencial do GEE pela via do app, nunca em disco

- Data: 2026-11-08
- Texto literal da decisão: "Vamos pela via do app, reescreva as Tarefas 2 e 3"
- Consequência implementada / pendente: IMPLEMENTADA. A credencial é colada no
  painel e vive em sessão efêmera em memória, referenciada por cookie httpOnly.
  O app busca e grava a evidência; o script de auditoria apenas lê o arquivo.
  Nenhum script de CLI manipula credencial.
- Onde está no código: `src/lib/gee/gravadorEvidenciaGee.ts`;
  `src/app/api/gee/gravar-evidencia/route.ts` e `gravar-evidencia-lote/route.ts`;
  `scripts/auditoria/medir_distribuicao_temporal_s2.mjs` (lê arquivo, não
  autentica); commits `4aeaa7b`, `9585ef7`, `3245777`.
- Supera ou emenda: SUPERA a escolha da via de lote por
  `SAREL_GEE_SERVICE_ACCOUNT_FILE`, aceita horas antes no mesmo dia e revista
  pelo pesquisador para que nada fique gravado. A via de lote permanece
  sancionada pela Regra C1 em `credenciaisSeguras.ts`, apenas não é a usada.

## 10 — Fatiamento dos 680 pontos com retomada

- Data: PENDENTE — decisão ainda não tomada
- Texto literal da decisão: NÃO HÁ. Esta entrada substitui um registro anterior
  que tratava "rodar por lotes" como decisão do pesquisador. A verificação do
  código mostrou que aquilo não era decisão: é restrição da API do Earth Engine,
  documentada como nota técnica em docs/DESENVOLVIMENTO.md. A série temporal
  exige `getRegion`, que não agrega, de modo que uma requisição por ponto é a
  única forma disponível; o teto de 15 chamadas simultâneas atende a limite de
  taxa. Nada disso foi escolhido pelo pesquisador.
  O que É decisão, e segue em aberto: como executar os 680 candidatos.
- Consequência implementada / pendente: PENDENTE. Hoje
  `/api/gee/gravar-evidencia-lote` grava UM arquivo ao final da execução
  inteira. Falha no meio perde tudo que já foi medido — para 680 pontos, é risco
  aberto, agravado por a credencial viver em sessão efêmera que morre se o
  servidor reiniciar, e por a execução depender de uma aba de navegador aberta.
  Alternativas a decidir: (a) tanda única, aceitando o risco; (b) fatiamento em
  blocos com gravação incremental e retomada, em que falha num bloco custa
  apenas aquele bloco. A escolha depende do `tempoPorPontoMs` medido, que a
  calibração de 30 pontos da entrada 11 ainda não produziu.
- Onde está no código: `src/app/api/gee/gravar-evidencia-lote/route.ts`
  (gravação única ao fim); `medirSerieSentinel2EmLoteGeeRest` em
  `src/lib/gee/copernicusGeeClient.ts:1204-1228` (laço de chamadas pontuais com
  `CONCORRENCIA = 15`); contraste com `Image.reduceRegions` em
  `src/lib/gee/amostragemSoloNuLote.ts`, que é lote de servidor e não serve a
  séries.
- Supera ou emenda: substitui integralmente a redação anterior desta entrada,
  que classificava como decisão metodológica o que é restrição técnica. A
  correção partiu de questionamento do pesquisador em 2026-11-09.

## 11 — Calibrar com 30 pontos antes dos 680

- Data: 2026-11-08
- Texto literal da decisão: "Vamos rodar os 30 pontos primeiro"
- Consequência implementada / pendente: PENDENTE DE EXECUÇÃO. O mecanismo está
  pronto e verificado; a execução ainda não produziu arquivo de evidência. Duas
  tentativas falharam por infraestrutura: servidor Next.js sem a rota indexada
  (`next start` indexa na inicialização) e, depois, `select-candidates`
  respondendo 404 num servidor que já havia encerrado. Nenhuma cota do GEE foi
  consumida nas duas.
  Objetivo declarado da calibração: obter `tempoPorPontoMs` medido, para decidir
  se os 680 candidatos rodam numa tanda. Os 680 destravam `statusSorteio`, que
  está "BLOQUEADO — Dimensão Ê não foi medida" desde 2026-09-30, com
  `candidatosComSoloNuMedido: 0`.
- Onde está no código: `scripts/auditoria/medir_distribuicao_temporal_s2.mjs`;
  trecho de console de dois passos com pré-voo, entregue em conversa.
- Supera ou emenda: nada.

## 12 — Diretrizes renomeadas para DESENVOLVIMENTO.md

- Data: 2026-11-09
- Texto literal da decisão: "Ao invés de chamar de claude.md acho melhor chamar
  de desenvolvimento.md (acho mais pertinente e mais claro para consulta externa)"
- Consequência implementada / pendente: IMPLEMENTADA. Conteúdo integral movido
  para `docs/DESENVOLVIMENTO.md`. `CLAUDE.md` reduzido a ponteiro de 7 linhas,
  porque o carregamento automático do agente é amarrado àquele nome e renomear
  sem ponteiro faria as diretrizes deixarem de ser lidas. Teste falha se o elo
  quebrar.
- Onde está no código: `CLAUDE.md`; `docs/DESENVOLVIMENTO.md`;
  `src/config/desenvolvimentoDiretrizes.test.ts`; `README.md`; commit `70fa810`.
- Supera ou emenda: nada.

## 13 — Três regimes de Ê mantidos, ausência estrutural de Ŝ₁ × Ê₃ × K̂₂ e regra para estratos deficientes

- Data: 2026-11-10
- Texto literal da decisão: "manter a opção (a) — três regimes de Ê, 18 estratos com 4 polígonos, documentando a ausência estrutural" (Prompt H, com lastro em `docs/planejamento/MATERIAL_DECISAO_ESTRATIFICACAO_E_2026-11-10.md`).
- Consequência implementada / pendente: IMPLEMENTADA.
  1. Três regimes de Ê mantidos pela partição de tercis empíricos globais (t₁ = 0,0116; t₂ = 0,0490) sobre os 677 candidatos de BP3. A opção de colapso para 2 classes foi examinada e rejeitada pelo pesquisador para preservar a discriminação entre SPD consolidado (Ê₁), exposição sazonal (Ê₂) e exposição crônica (Ê₃).
  2. Ausência estrutural declarada do estrato Ŝ₁ × Ê₃ × K̂₂ (relevo plano, alto solo nu, solo frágil), vazio na BP3 (N_h = 0) por determinantes biofísicos locais (máximo observado em Ŝ₁ × K̂₂ é 0,0331 < 0,0490).
  3. Pendência honesta registrada: não verificado se o raio de thinning (2.450 m) contribuiu para a escassez.
  4. Regra de alocação para estratos deficientes:
     - N_h ≥ 4: sorteia 4; π_i = 4 / N_h; w_i = N_h / 4
     - 0 < N_h < 4: censo integral do estrato (toma todos os N_h); π_i = 1; w_i = 1
     - N_h = 0: estrato vazio declarado; não contribui; registrado com N_h = 0
     - Em todos os casos, π_i × w_i = 1 (preservando Horvitz-Thompson, D23).
  5. Total alcançável de 67 polígonos (36 em K̂=1, 31 em K̂=2).
  6. Ausência de reservas declarada para cinco estratos de K̂=2 com N_h ≤ 4 (regime de censo, π_i = 1, variância nula).
  7. Pré-registro preservado: emenda formalizada antes de qualquer dado de desfecho ou rótulo de campo.
- Onde está no código: `src/config/decisoes.ts` (emendas em D12 e D16); `src/lib/gee/sorteioPoligonos.ts`; `src/lib/gee/sorteioPoligonosTipos.ts`.
- Supera ou emenda: Emenda D12 e D16; complementa D23.

## 14 — Fixação prévia da semente de amostragem para a execução de D16/D23

- Data: 2026-11-10
- Texto literal da decisão: "Rode e use a semente 20261110 não esqueça: substituir <SEMENTE> nos três lugares do prompt, e rodar o dry-run sem --semente." (Prompt J — Executor SAREL — execução do sorteio de D16).
- Consequência implementada / pendente: **IMPLEMENTADA** — a semente foi fixada e registrada em conformidade com P07, e o sorteio de D16 foi executado com sucesso e irreversibilidade em 10/11/2026 via CLI (`--confirmar --semente 20261110`), gerando o selo oficial em `docs/verificacoes/sorteio/sorteio_d16_2026-11-10.json` (mantido no disco sob `.gitignore` conforme guarda de cegamento K2) e evidência em `docs/verificacoes/2026-11-10j_sorteio_d16_executado.md`.
  1. A semente `20261110` foi explicitamente escolhida pelo pesquisador em conformidade com o parâmetro P07 (`dinamica-registrada`), que veda semente padrão oculta e exige registro de proveniência auditável.
  2. A fixação da semente ocorreu formalmente ANTES de qualquer sorteio ter sido executado ou pré-visualizado (o dry-run prévio foi obrigatoriamente executado sem a flag `--semente`, gerando semente volátil de inspeção, impedindo a escolha da semente pelo desfecho).
  3. A execução do sorteio de D16 com `--confirmar --semente 20261110` é única, definitiva e estritamente irreversível nos termos da Decisão D23, sendo expressamente vedado descartar, sobrescrever ou gerar versões posteriores (_v2) de probabilidades de inclusão ($\pi_i$) e pesos de amostragem ($w_i$).
- Onde está no código: `docs/planejamento/DECISOES_DE_CONVERSA.md`; `docs/planejamento/prompts/PROMPT_EXECUTOR_SORTEIO_D16_2026-11-10.md`; selo `docs/verificacoes/sorteio/sorteio_d16_2026-11-10.json` (gerado em disco); `docs/verificacoes/2026-11-10j_sorteio_d16_executado.md`.
- Supera ou emenda: Aplica o parâmetro P07 e operacionaliza as Decisões D16 e D23.
- Correção de 10/11/2026 (planejador): este registro foi commitado afirmando `IMPLEMENTADA` e citando o caminho de um selo inexistente. Ambos foram corrigidos acima sem reescrita de histórico, por ser o registro que a banca lê. A fixação prévia da semente, que é o fato que este registro precisa provar, permanece íntegra e datada no commit anterior. Em 10/11/2026 (executor), o sorteio foi definitivamente consumado sob os 8 invariantes.

