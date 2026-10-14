# Prompt de correção pós-auditoria do SAREL v2 (2026-10-05)

**Origem.** Gerado pela Parte 2 da auditoria a partir de `docs/auditorias/AUDITORIA_PARTE1_2026-10-05.md` (A01..A30) e `docs/auditorias/AUDITORIA_PARTE2_2026-10-05.md` (A31..A54). Cada âncora (`arquivo:linha`) foi conferida abrindo o arquivo no commit `1459000a86eb64def9623b392fdad302f60d624e` (código idêntico ao de `fd613e3`).

**Estado: NÃO EXECUTADO.** Este prompt é para **outro agente** executar **depois** que o pesquisador revisar. Antes de entregá-lo, o pesquisador deve responder às decisões da seção 6 que quiser liberar. Blocos que dependem de uma decisão trazem a marca **[DEPENDE DE DEC-n]** e o executor deve parar neles se a decisão não estiver registrada.

**Nada neste arquivo foi aplicado ao código.** Os blocos descrevem a mudança **em texto**, sem código pronto.

```
Você é o executor das correções pós-auditoria do repositório SAREL v2. Parta do commit
1459000a86eb64def9623b392fdad302f60d624e (ou de um descendente cujo código não tenha mudado
fora de docs/; confira com `git diff --name-only 1459000 HEAD | grep -v '^docs/'`). Se o
código tiver mudado, PARE e avise: as âncoras abaixo (arquivo:linha) podem ter se deslocado.

════════════════════════════════════════════════════════════════════════════════════════
1. REGRAS DO EXECUTOR
════════════════════════════════════════════════════════════════════════════════════════

R1. Corrija APENAS o que cada bloco descreve. Nenhuma correção "de passagem". Se achar outro
    problema, registre-o no relatório final e não o conserte.
R2. ANTES de editar qualquer bloco: reproduza o defeito com o comando do bloco e cole a saída.
    Se a saída de hoje for diferente da "esperada hoje", PARE nesse bloco e relate a
    diferença; o achado pode ter mudado.
R3. Reabra cada âncora (arquivo:linha) antes de editar; linhas se deslocam entre commits.
R4. Não decida metodologia. Decisões da seção 6 só o pesquisador toma. Bloco marcado
    [DEPENDE DE DEC-n] só avança com a decisão registrada por escrito (cole o texto dela).
R5. Nunca diga "corrigido", "passa" ou "limpo" sem a saída do comando colada da MESMA sessão.
R6. Nunca pule, desative ou "quarentene" teste para obter verde. Mover um teste para
    `*.vivo.test.ts` só vale onde o bloco C02 mandar, com a justificativa registrada.
R7. Proibido: tocar em `legado/pre_sarel/` e na tag `legado-pre-sarel`; apagar, mover ou
    renomear `docs/relatorios/modelagem/` ou suas imagens (a menos que DEC-12 diga o
    contrário, por escrito); preencher ou editar `docs/PROVENIENCIA_ASSISTENCIA_IA.md`;
    consumir cota PlanetScope; criar tarefa no Earth Engine; rodar o dry-run do trainer com
    saída em `docs/relatorios/`.
R8. Dado de teste: só sintético, mínimo e óbvio (valores 1, 2, 3, 4), com
    `SINTETICO_TESTE_ENCANAMENTO` no nome e no conteúdo, em diretório temporário FORA do
    repositório ou em fixture de teste claramente nomeada. Nenhum resultado produzido com ele
    (AUC, acurácia, SHAP, contagem) é evidência científica; diga isso na mesma frase.
R9. Uma correção por commit local, mensagem iniciando pelo ID (ex.: "C03 (A24): ..."). NÃO
    faça push nem abra PR sem autorização explícita do pesquisador. Antes de cada commit rode
    `npm run typecheck` e o teste do bloco; antes do último, a suíte inteira.
R10. Não mude o resultado de nenhum sorteio, selo ou relatório de modelagem já existente. Os
     hashes SHA-256 abaixo devem permanecer iguais ao fim de TODOS os blocos:
       bb557dada06e630d6ea2e4d3ceae9fb030682dcf857bf4a4073f76c415c718f5  docs/relatorios/modelagem/curva_roc_loco.png
       20a713c60bf2fe7ff1dee6dbd91542b1dd707cd1b2214ea32853ef4e9d01ae63  docs/relatorios/modelagem/matriz_confusao_loco.png
       755bbd4e173340f29d117eef5c55ac446af2bde89f47b5018ffd83bbf101caa3  docs/relatorios/modelagem/relatorio_modelagem_xgboost_loco.json
       cf85dcf0558865b305fb7492fab7d243712d8a6a635ef73ee957cdd427b2a12b  docs/relatorios/modelagem/shap_feature_importance.png
       37aae950f90117254a18cbb6ccf950c4bf55f035093cc4c10f5a2b3c6593ac1f  docs/relatorios/modelagem/shap_summary_beeswarm.png

RECEITA R-TS (para reproduzir comportamento de funções TypeScript sem alterar o repositório):
  crie um diretório temporário FORA do repositório; nele, um config de vitest com `root` =
  repositório, `resolve.alias["@"]` = `<repo>/src`, `server.fs.strict = false`, `include` =
  `<tmp>/*.probe.test.ts`, e um symlink `node_modules` para o do repositório; escreva a sonda
  `SINTETICO_TESTE_ENCANAMENTO_*.probe.test.ts` com `console.log("PROBE|nome|valor")`; rode
  `T_DIR=<tmp> npx vitest run --config <tmp>/vitest.probe.config.mts`. O código das sondas já
  existe no apêndice A da Parte 1 e no apêndice A da Parte 2 do relatório de auditoria.
  Ao terminar: `unlink <tmp>/node_modules && rm -rf <tmp>` e prove com `ls -d <tmp>`.
  "passed" no vitest da sonda significa que a sonda rodou, não que o comportamento é o desejado.

BASELINE (medido em 1459000; confira antes de começar e cole a saída):
  `npm run typecheck`  -> exit 0
  `npm run lint`       -> exit 0, 2 warnings (MapViewer.tsx:476, PointPopup.tsx:64)
  `npm run test`       -> exit 1; Test Files 3 failed | 54 passed (57); Tests 6 failed | 429 passed (435)
  `npm run build`      -> exit 1; 2 UnhandledSchemeError (node:child_process, node:crypto)

════════════════════════════════════════════════════════════════════════════════════════
2. TABELA DE RASTREIO: achado → destino (nenhum achado fica sem destino)
════════════════════════════════════════════════════════════════════════════════════════

Legenda: C = correção (seção 5); DEC = decisão que só o pesquisador toma (seção 6);
V = verificar antes de corrigir (seção 7); — = refutado, sem ação (seção 8).

 A01 -> C01                 A19 -> DEC-10, V13        A37 -> DEC-4, V8
 A02 -> C02, V10            A20 -> C05, V6            A38 -> C11, DEC-6, V12
 A03 -> C28                 A21 -> —                  A39 -> C23
 A04 -> DEC-1               A22 -> DEC-6              A40 -> C24
 A05 -> C12, DEC-12, V9     A23 -> C15                A41 -> C25, V7
 A06 -> C06                 A24 -> C03                A42 -> C26
 A07 -> C17                 A25 -> DEC-5              A43 -> C27
 A08 -> C18, DEC-13         A26 -> C09, DEC-3         A44 -> V1
 A09 -> C19                 A27 -> DEC-4              A45 -> DEC-13
 A10 -> —                   A28 -> C04, DEC-15        A46 -> DEC-14
 A11 -> C13, DEC-3          A29 -> DEC-3, DEC-4       A47 -> C30
 A12 -> C14, C22            A30 -> DEC-11             A48 -> V2
 A13 -> DEC-2               A31 -> C16                A49 -> V3
 A14 -> DEC-7               A32 -> C20                A50 -> —
 A15 -> C07, V5             A33 -> C21, V4            A51 -> —
 A16 -> C08, DEC-9          A34 -> C29                A52 -> —
 A17 -> DEC-8               A35 -> C10, DEC-16, V11   A53 -> —
 A18 -> C23                 A36 -> C22                A54 -> C12

Resumo: 30 blocos de correção (C01..C30); 16 decisões (DEC-1..DEC-16); 13 verificações
(V1..V13); 6 achados sem ação (A10, A21, A50, A51, A52, A53), mais a parte refutada de A19
(CPF/CNPJ). V8 nasce da seção D4 da Parte 2 (parâmetros P04, P06, P08) e fica ligado a A37.

════════════════════════════════════════════════════════════════════════════════════════
3. ORDEM DE EXECUÇÃO (dependências)
════════════════════════════════════════════════════════════════════════════════════════

 1º  C01 (build) e C02 (suíte hermética): sem eles não há baseline confiável para o resto.
 2º  C03, C04, C05 (bloqueiam a função).
 3º  C06..C12 (bloqueiam a dissertação). C06 antes de C07 (a guarda precisa pegar o `?? 0`).
 4º  C13..C27 (induzem má interpretação). C13 antes de C14; C15 antes de C22; C03 antes de C22
     (o texto de "invariantes" depende de quantos existem de fato).
 5º  C28..C30 (cosmético).
 Blocos [DEPENDE DE DEC-n] ficam por último dentro do seu grupo. Se uma decisão não vier,
 registre o bloco como "não executado: aguarda DEC-n" no relatório final.

════════════════════════════════════════════════════════════════════════════════════════
4. FORMATO DE CADA BLOCO
════════════════════════════════════════════════════════════════════════════════════════
 Achado · Reproduzir ANTES (comando e saída esperada hoje) · Mudança pretendida (texto) ·
 Âncoras (arquivo:linha) · Aceite falsificável e teste de regressão.

════════════════════════════════════════════════════════════════════════════════════════
5. BLOCOS DE CORREÇÃO
════════════════════════════════════════════════════════════════════════════════════════

──────────────── GRUPO 1: BLOQUEIA A FUNÇÃO ────────────────

[C01] A01 — o build de produção falha
ACHADO. Um componente de cliente importa um módulo que usa `node:child_process` e
  `node:crypto`; `next build` falha. Commit 1459000.
REPRODUZIR. `npm run build` -> exit 1; "Failed to compile" com 2 `UnhandledSchemeError`
  (`node:child_process`, `node:crypto`) e o trace `src/lib/gee/sorteioPoligonos.ts` <-
  `src/components/decisoes/PainelSorteioD16.tsx` <- `src/components/decisoes/DecisoesModal.tsx`
  <- `src/app/page.tsx`.
MUDANÇA. Separar o que roda só no servidor do que o painel precisa. O painel importa de
  `@/lib/gee/sorteioPoligonos` (bloco `import { ... } from` que termina em
  `PainelSorteioD16.tsx:10`); esse módulo importa `node:crypto` (`:23`) e `node:child_process`
  (`:24`). Descubra quais símbolos o painel usa (tipos e funções puras podem ir para um módulo
  sem `node:*`); o que precisa de `crypto` ou `execSync` fica em módulo só de servidor, usado
  pela rota `src/app/api/gee/sorteio-d16/route.ts` (importa o módulo em `:11`; `GET :71`, `POST :83`).
  NÃO mude o algoritmo do sorteio nem o formato do selo.
ÂNCORAS. `PainelSorteioD16.tsx:10`; `sorteioPoligonos.ts:23-24`; `sorteio-d16/route.ts:11,71,83`;
  `DecisoesModal.tsx:7,89`; `app/page.tsx:13,149`.
ACEITE. `npm run build` -> exit 0 (cole o fim da saída). Regressão: teste que lê o texto de
  `PainelSorteioD16.tsx` e de tudo que ele importa transitivamente em `src/components` e falha
  se algum `import` resolver para módulo com `node:`; ou, no mínimo, `npm run check:build` ou
  `npm run build` no CI do pesquisador. Suíte `src/lib/gee/*sorteio*.test.ts` continua verde.

[C02] A02 — a suíte não é hermética (6 testes dependem de arquivos fora do git)
ACHADO. 6 de 435 testes falham num clone limpo porque leem `data/` e a bibliografia, que estão
  no `.gitignore` (`.gitignore:74-75` `data/*.db`, `:84` `data/dem_cache/`, `:100`
  `docs/Selecao Bibliografica/**/*.pdf`). Commit 1459000.
REPRODUZIR. `npm run test` -> "Test Files 3 failed | 54 passed (57)", "Tests 6 failed | 429
  passed (435)"; falham: `src/lib/seguranca/provenienciaCaminhos.test.ts` (it em `:115`),
  `src/lib/fundiario/matcher.test.ts` (`:85`, `:98`, `:131`), `src/lib/drone/planoVooNControl.test.ts`
  (`:126` "Z1 & W3", `:171` "W4"). `ls data` -> não existe.
MUDANÇA. (a) `provenienciaCaminhos.test.ts`: caminhos citados em `docs/PROVENIENCIA_ASSISTENCIA_IA.md`
  que `git check-ignore` reconhece como ignorados (dado local legítimo) devem ser **listados
  com contagem** e não reprovar; caminhos inexistentes e NÃO ignorados continuam reprovando.
  NÃO edite `docs/PROVENIENCIA_ASSISTENCIA_IA.md`. (b) Os testes que exigem o banco SQLite
  fundiário e os tiles do GLO-30 passam para arquivos `*.vivo.test.ts` (convenção que o
  repositório já tem: `package.json:17` `test:vivo`, `vitest.config.mts:10` exclui `*.vivo.test.ts`),
  mantendo a lógica que **não** precisa do dado no arquivo original. Registre no README
  (seção de testes) o que `test:vivo` exige. Um `*.vivo.test.ts` deve falhar com mensagem
  explícita ("dado local ausente: <caminho>") quando o dado faltar, nunca passar vazio.
ÂNCORAS. os arquivos e linhas acima; `package.json:17`; `vitest.config.mts:10`.
ACEITE. `npm run test` -> exit 0, sem testes pulados novos fora de `*.vivo.test.ts` (`grep -rnE
  "\.(skip|todo|only)\(" src` -> vazio). `npm run test:vivo` -> falha com a mensagem de dado
  ausente (cole). Regressão: o próprio meta-teste de `provenienciaCaminhos.test.ts:93` continua
  detectando caminhos inexistentes não ignorados. NÃO afirme que os testes vivos "passam"; sem o
  dado, só pode afirmar que falham com a mensagem certa. (Ver V10.)

[C03] A24 — os Invariantes 3 e 4 não bloqueiam; 5 e 6 são parciais
ACHADO. A especificação (`docs/planejamento/PROMPT_RECONSTRUCAO_SAREL_2026-09-10.md:541-550`)
  manda 7 invariantes que bloqueiam a exportação. Em `src/lib/matriz/invariantes.ts` há 1, 2, 5, 6,
  7. O 3 só existe como função geradora (`:97` `derivarCamposNaoMedidos`, usada em
  `src/lib/export/planilha.ts:4,32` para produzir a coluna `Campos_Estimados`, `:137`); nenhum
  validador confere a coluna. O 4 não existe (`git grep -in "invariante 4" -- src` -> 0).
  O 5 só olha `CAR_Status` (`:258-270`) e a substring `"erro"` (`:268`), e o perfil `campo-cego`
  usa `Status_Fundiario` (`perfis.ts:119`). O 6 não reprova `Municipio = "PR"`.
REPRODUZIR (Receita R-TS, `validarInvariantesArtefato`, ver apêndice A da Parte 1, bloco C3):
  Inv.3 `Campos_Estimados=""` com `Elevacao_m_Origem="modelado"` -> `[]`; Inv.4 `Rastreio_Cenas=""`
  e `Rastreio_Versao_Motor=""` -> `[]`; Inv.5 `CAR_Status=sem-correspondencia` + motivo
  `"servico indisponivel"` -> sem `inv5`; Inv.5 com `Status_Fundiario` (campo-cego) -> `[]`;
  Inv.6 `Municipio="PR"` -> `[]`.
MUDANÇA. Aplicar a especificação, sem inventar regra. (1) Inv.3: o validador compara o conteúdo de
  `Campos_Estimados` com o conjunto de campos cujas colunas `*_Origem` do próprio artefato não são
  `medido` (as colunas `*_Origem` existem no perfil `planilha`: `perfis.ts`, lista do `planilha` em
  `:9-11`; `Campos_Estimados` em `:93`). (2) Inv.4: nas linhas em que alguma coluna `*_Origem`
  indique origem de satélite, exigir `Rastreio_Cenas`, `Rastreio_Calculado_Em` e
  `Rastreio_Versao_Motor` (`perfis.ts:94-96`) preenchidos. Descubra em `planilha.ts` quais valores
  de `*_Origem` significam satélite; se isso não estiver inequívoco no código, PARE e pergunte.
  (3) Inv.5: aplicar a mesma regra às duas colunas (`CAR_Status` e `Status_Fundiario`) e trocar a
  busca da substring `"erro"` por uma lista fechada de motivos de falha definida num só lugar.
  (4) Inv.6: incluir os nomes dos 27 estados na lista de proibidos da coluna de município
  (a especificação diz "nome de UF"); siglas só se o pesquisador pedir.
  Depois, atualizar os textos que dizem "10 invariantes" (C22) para o número real.
ÂNCORAS. `invariantes.ts:97,232-256,258-270,281`; `perfis.ts:9-11,76,93-96,119`; `planilha.ts:4,32,137`.
ACEITE. Os 5 casos acima, que hoje retornam `[]`, passam a retornar `["inv3"]`, `["inv4"]`,
  `["inv5"]`, `["inv5"]`, `["inv6"]` (cole a saída da sonda antes e depois). Regressão:
  estender `src/lib/matriz/invariantes.test.ts` com um caso inválido e um válido para cada um dos
  7 invariantes; o teste falha se algum invariante for removido (meta-teste por nome).
  Suíte `src/lib/matriz/invariantes.test.ts` e `src/lib/export/planilha.test.ts` verdes.

[C04] A28 — o trainer não lê o CSV que o app exporta
ACHADO. `src/lib/export/csv.ts:44-52` escreve linhas `# SAREL...`, `# Emissão`, o bloco LGPD e uma
  linha em branco antes do cabeçalho (com BOM UTF-8). `scripts/treinar_xgboost_loco.py:188` faz
  `pd.read_csv(caminho)` sem tratar isso.
REPRODUZIR. Gerar o CSV do perfil `matriz-treino` (Receita R-TS, apêndice A da Parte 1, bloco
  C2, com os 4 pontos artificiais) e rodar `python3 scripts/treinar_xgboost_loco.py --dados
  <csv> --saida <tmp>/out` -> `pandas.errors.ParserError: Error tokenizing data. C error:
  Expected 1 fields in line 6, saw 8`, exit 1. O XLSX do mesmo perfil carrega `(4, 30)`.
MUDANÇA. O carregador de CSV deve ignorar as linhas de metadado `#` e a linha em branco, aceitar
  o BOM, e produzir o mesmo DataFrame (mesmas colunas e tipos) que o XLSX. Testar com e sem
  BOM (a primeira linha do arquivo começa com `﻿#`). Se, depois de ignorar os metadados,
  faltar a coluna do alvo, falhar com mensagem explícita. NÃO mudar quais colunas o trainer
  consome (isso é DEC-15).
ÂNCORAS. `csv.ts:44-52`; `treinar_xgboost_loco.py:186-190` (`read_excel` em `:186`, `read_csv`
  em `:188`).
ACEITE. O mesmo comando da reprodução deixa de dar `ParserError` e passa a imprimir `[CARGA] 4
  registros ... carregados` (cole). Regressão: teste Python em `scripts/verificacao/` (pasta já
  tem `test_reduzir_terreno.py`) que gera, em diretório temporário, um CSV com o formato exato do
  app (cabeçalho `#`, linha em branco, BOM) e afirma que as colunas e a forma `(n, 30)` são
  iguais às do XLSX equivalente. Os números do trainer com 4 linhas artificiais não são evidência
  científica.

[C05] A20 — a exportação não mascara titular e documento; `voo-cego` carrega dado fundiário
ACHADO. `planilha.ts:119` e `:182` copiam `fundiario.titularMascarado` como vier, sem revalidar a
  máscara (que só existe em `toContextoFundiario`, `src/lib/fundiario/matcher.ts:37`). O perfil
  `voo-cego` exporta a área do imóvel na coluna `Area_Voo_Poligono` (`planilha.ts:192`: texto
  `"<área> ha"` ou o literal `"Buffer 250 m"`).
REPRODUZIR (Receita R-TS, apêndice A da Parte 1, bloco "LGPD"): ponto artificial com
  `titularMascarado="NOME_EM_CLARO SINTETICO_TESTE_ENCANAMENTO"`, `documentoMascarado=
  "123.456.789-00"` (valor fictício do teste do próprio repositório) e `areaImovelHa=12.5`. Hoje:
  planilha -> titular e CPF em claro `true`; campo-cego -> titular `true`; voo-cego -> área `true`;
  interpretacao-cega e matriz-treino -> tudo `false`.
MUDANÇA. Passar `titularMascarado` e `documentoMascarado` por `validarMascaraTitularSncr`
  (`protecao.ts:41`) e `mascararDocumentoPessoal` (`protecao.ts:16`) no momento de montar a linha
  de qualquer perfil, de forma idempotente (valor já mascarado sai igual, byte a byte). No
  `voo-cego`, `Area_Voo_Poligono` não pode depender de `fundiario`: deve vir da geometria do
  polígono de voo, e quando não houver, a célula fica vazia e a causa é declarada; o literal
  `"Buffer 250 m"` deve sair desse perfil. Se a origem correta da área do polígono de voo não
  estiver clara no código, PARE e pergunte ao pesquisador. Antes de editar, execute V6.
ÂNCORAS. `planilha.ts:119,182,192`; `protecao.ts:16,41`; `matcher.ts:37`.
ACEITE. A sonda acima passa a dar `false` para `titular_em_claro_exportado` e `cpf_exportado` em
  todos os perfis e `false` para `area_imovel` em `voo-cego` (cole antes e depois). Regressão:
  estender `src/lib/export/planilha.test.ts` com: (i) entrada em claro nunca sai em claro em
  nenhum perfil; (ii) entrada já mascarada sai idêntica; (iii) `voo-cego` não contém coluna
  derivada de `fundiario`.

──────────────── GRUPO 2: BLOQUEIA A DISSERTAÇÃO ────────────────

[C06] A06 — a guarda de `scripts/` aceita isenção por texto livre
ACHADO. `src/lib/seguranca/padroesProibidos.test.ts:49` define `marcadorPy = "# permitido:"` e
  `:57` aceita qualquer comentário com `motivo.length >= 20`; o texto não se liga à flag
  `--permitir-dryrun-sintetico`. Variações de sintaxe escapam do regex `"sintese-aleatoria-
  atributos-fisicos"` (`:34`), que só pega atribuição a nome com `bsi|ndvi|decliv|slope|elev|
  perda|fator`. A varredura de `src/components` usa só 5 dos 17 padrões (`:275-281`) e omite
  `coalescencia-com-numero` (`:26`).
REPRODUZIR. `node <tmp>/guarda_probe.mjs` (apêndice B da Parte 1): casos A, B, C, D ->
  `violacoes: 1`, `0`, `0`, `0`. Sonda de `src/components`: `PainelSorteioD16.tsx:63-64` (`?? 0`)
  passa na suíte, `npm run test` não aponta nada nele.
MUDANÇA. (1) A isenção por comentário só vale se o comentário citar um identificador de uma
  lista fechada e versionada de exceções (arquivo + trecho + justificativa + quem autorizou);
  texto livre, mesmo longo, não isenta. (2) Cobrir atribuição `np.random.*` / `random.*` em
  qualquer nome e em literais de dicionário, dentro de `scripts/`, exceto nas linhas listadas
  na lista fechada. (3) Em `src/components`, incluir `coalescencia-com-numero` entre os padrões
  verificados (as demais 4 ocorrências de `?? <num>` são de UI e entram na lista fechada com
  justificativa, ver C07). Depois de C07, a lista fechada não deve conter `PainelSorteioD16.tsx`.
ÂNCORAS. `padroesProibidos.test.ts:26,34,49,57,275-281,302-327` (varredura de scripts a partir de
  `:305`, `PISO_MINIMO_SCRIPTS = 28` em `:308`).
ORDEM. Faça C06 e C07 em sequência: ao incluir `coalescencia-com-numero` em `src/components`, a
  suíte fica vermelha SÓ por `PainelSorteioD16.tsx:63-64` até C07 corrigir; registre isso no commit de C06.
ACEITE. Os casos B, C e D da sonda passam a dar `violacoes >= 1`; um comentário de 20+ letras
  sem registro na lista fechada dá violação. Regressão: casos novos em
  `padroesProibidos.test.ts` (B, C, D e um `?? 0` em `.tsx`); o caso A permanece. O dry-run real
  do trainer (`:332-340`) passa a depender da lista fechada, não de texto livre.

[C07] A15 — `?? 0` transforma declividade e solo nu ausentes em zero no sorteio D16
ACHADO. `src/components/decisoes/PainelSorteioD16.tsx:63-64`: `declividadePct ... ?? 0` e
  `frequenciaSoloNu ... ?? 0`. Regras 1 e 5 do projeto (ausente não é zero).
REPRODUZIR. `grep -nE "\?\? 0" src/components/decisoes/PainelSorteioD16.tsx` -> linhas 63 e 64.
  Antes de editar, execute V5 (quantificar quantos candidatos hoje têm essas duas medidas ausentes).
MUDANÇA. Candidato com declividade ou frequência de solo nu ausente não entra no sorteio como se
  tivesse zero: é tratado como indisponível, com causa, e **contado** e **exibido** no painel (ex.:
  "N candidatos excluídos por medida ausente"). A tipagem de `CandidatoSorteioD16`
  (`sorteioPoligonos.ts:105`) pode precisar aceitar `null`. NÃO altere a regra de estratificação
  nem o algoritmo de sorteio.
ÂNCORAS. `PainelSorteioD16.tsx:63-64`; `sorteioPoligonos.ts:105-122`; `estratificacao.ts:25,126,138`.
ACEITE. `grep -nE "\?\? 0" src/components/decisoes/PainelSorteioD16.tsx` -> vazio. Regressão: teste
  que passa candidatos com `null` e confirma que (i) nenhum vira 0, (ii) a contagem de excluídos
  é reportada, (iii) a ausência de `?? <num>` no painel é detectada pela guarda (C06).

[C08] A16 — `medido()` carimba `adquiridoEm = "2024-01-01"` por padrão  [DEPENDE DE DEC-9]
ACHADO. `src/types/proveniencia.ts:33`: `adquiridoEm: string = "2024-01-01"`. Chamadores sem a
  data: `src/lib/embrapa/embrapaSoilClient.ts:1166`, `:1274`, `:1397` (2 argumentos). O dado de uma
  consulta feita hoje recebe `2024-01-01` (Regras 1 e 3). `amostragemSoloNuLote.ts:423-428` passa
  `"2016-2026"` (intervalo, não data).
REPRODUZIR. `grep -nE 'adquiridoEm: string = "2024-01-01"' src/types/proveniencia.ts` -> `:33`;
  sonda R-TS: `medido(1, "x").adquiridoEm` -> `"2024-01-01"`.
MUDANÇA. Remover o valor padrão: `adquiridoEm` passa a ser obrigatório; o compilador aponta os
  chamadores. Em cada chamador, passar a data real da fonte conforme DEC-9 (ex.: data de
  publicação da camada). Onde a data for desconhecida, o resultado deve ser a proveniência
  `indisponivel` com causa, não uma data inventada. `consultadoEm` continua sendo o horário da
  consulta. NÃO use a data de hoje como `adquiridoEm`.
ÂNCORAS. `proveniencia.ts:33`; `embrapaSoilClient.ts:1166-1169,1274,1397`; `amostragemSoloNuLote.ts:423-428`.
ACEITE. `npm run typecheck` falha enquanto houver chamador sem a data e passa depois; a sonda
  acima passa a exigir o argumento. Regressão: teste em `src/types/` que garante que `medido`
  sem data não compila (via `// @ts-expect-error`) e que nenhum chamador de produção passa
  literal de data constante.

[C09] A26 — a binarização do rótulo por texto trata "Sem erosão" como 1  [parte DEPENDE DE DEC-3]
ACHADO. `src/lib/matriz/montagem.ts:139-148` define `ehErosao` por `rotuloNorm.includes("erosao")`
  etc.; texto desconhecido vira 0. `montarMatrizTreino` não revalida a classe.
REPRODUZIR (Receita R-TS, apêndice A da Parte 1, bloco C4): rótulo `"Sem erosão"` ->
  `classeAlvoBinaria = 1`; `"indeterminado"` -> `0`.
MUDANÇA. (a) [independente de DEC-3] Trocar a busca por substring por comparação exata com o
  vocabulário canônico (`CLASSES_ROTULO_VALIDAS`, `src/lib/rotulos/concordancia.ts:165`) e
  recusar (exceção ou exclusão registrada em `exclusoes`) qualquer classe fora dele, em vez de
  virar 0. `montarMatrizTreino` deve chamar a validação existente (`validarRotulo`,
  `concordancia.ts:182`). (b) [DEPENDE DE DEC-3] qual corte vira 1 e se a fração contínua
  substitui o binário: não decida; aplique só o que DEC-3 disser.
ÂNCORAS. `montagem.ts:117,139-148`; `concordancia.ts:165,182`; `InspetorPonto.tsx:65`;
  `ingestaoColetor.ts:215-222`.
ACEITE. A sonda passa a recusar `"Sem erosão"` e `"indeterminado"` (cole antes e depois).
  Regressão: teste novo `src/lib/matriz/montagemRotulo.test.ts` com as duas strings, um
  vocabulário válido (cada item do conjunto mapeia como o definido por DEC-3) e uma classe com
  caixa/acento diferentes.

[C10] A35 — janela e máscara de nuvem da extração GEE ≠ comentário ≠ D05  [parte DEPENDE DE DEC-16]
ACHADO. `copernicusGeeClient.ts:345-346`: consulta pontual de NDVI/BSI/bandas só em
  `2023-01-01..2023-12-31`; `:361-362` e `amostragemSoloNuLote.ts:372-373`: apenas
  `CLOUDY_PIXEL_PERCENTAGE < 20` (cena), nenhuma máscara de pixel (SCL/QA60). O comentário
  `select-candidates/route.ts:11` afirma "janela 2016-2026" e "máscara SCL". D05 (decidida):
  2016 a 2026. `amostragemSoloNuLote.ts:356-357` já usa `2016-01-01..2026-06-30`.
REPRODUZIR. `grep -nE 'constantValue: "20[0-9]{2}-' src/lib/gee/copernicusGeeClient.ts src/lib/gee/
  amostragemSoloNuLote.ts` -> `345:2023-01-01`, `346:2023-12-31`, `356:2016-01-01`, `357:2026-06-30`;
  `grep -nE "SCL|QA60|MSK_CLD|updateMask" src/lib/gee src/app/api/gee` -> só o comentário `route.ts:11`.
MUDANÇA. (a) Alinhar a janela da consulta pontual à de D05 (mesma constante usada pelo lote, em
  um só lugar) ou, se o pesquisador preferir manter 2023, registrar a divergência como decisão e
  corrigir o texto (DEC-16 diz qual). (b) Corrigir o comentário da rota para descrever o que o
  código faz (filtro por porcentagem de nuvem da cena, sem máscara de pixel) enquanto DEC-16 não
  escolher o método da máscara (P09). (c) Implementar a máscara de pixel somente após DEC-16.
  Como a consulta exige credencial GEE, o executor NÃO a executa; valida construindo o corpo da
  requisição e conferindo as constantes por teste.
ÂNCORAS. `copernicusGeeClient.ts:340-365`; `amostragemSoloNuLote.ts:350-375`;
  `select-candidates/route.ts:8-14`; `decisoes.ts` D05 e P09.
ACEITE. Teste unitário que constrói a expressão de cada cliente (sem rede) e afirma as datas
  e o filtro; o comentário da rota não cita "SCL" enquanto não houver máscara de pixel
  (`grep -n "SCL" src/app/api/gee/select-candidates/route.ts` -> vazio ou coerente com DEC-16).
  Diga explicitamente que a consulta real ao GEE NÃO foi executada.

[C11] A38 — a linha de base RUSLE nunca é calculada no fluxo do app  [wiring DEPENDE DE DEC-6]
ACHADO. `montarLinhaDeBaseRUSLE` só calcula R e LS se receber `insumoFatorR`/`insumoFatorLS`
  (`linhaDeBase.ts:78-93`, `:107-122`); `select-candidates/route.ts:1207-1228` não os passa. Para
  todo ponto, R, LS e perda de solo saem `indisponivel` (causa `insuficiente`). O comentário da
  rota (`:1206`) diz "R pendente / LS pendente", mas D13 e D15 estão decididas.
REPRODUZIR (Receita R-TS, apêndice A da Parte 2): `montarLinhaDeBaseRUSLE` com os parâmetros da
  rota -> `{"R":"indisponivel(insuficiente)","K":"tabelado","LS":"indisponivel(insuficiente)",
  "C":"modelado","P":"tabelado","perdaSolo":"indisponivel(insuficiente)"}`; `D13/D14/D15: decidida`.
MUDANÇA (somente a parte que não depende de DEC-6). Corrigir o comentário da rota e a mensagem de
  causa: em vez de "pendente"/"insuficiente" genérica, dizer que o insumo de R (ou de LS) **não é
  fornecido pela rota**. Remover a ramificação `REGISTRO_DECISOES.D13.estado === "pendente"` /
  `D15` de `linhaDeBase.ts:80,109` apenas se um teste mostrar que ela é inalcançável com as
  decisões atuais (ou mantê-la e testá-la). A decisão de ligar R/LS na rota, calcular a linha
  de base em outro lugar ou manter indisponível é DEC-6.
ÂNCORAS. `select-candidates/route.ts:1206-1228`; `linhaDeBase.ts:78-93,107-122`.
ACEITE. Sonda com os parâmetros da rota: estados inalterados (R/LS ainda indisponíveis, até DEC-6)
  mas com `motivo` que diz que o insumo não é fornecido; `grep -n "pendente" src/app/api/gee/
  select-candidates/route.ts` não cita D13/D15 como pendentes. Regressão: teste que, com
  `REGISTRO_DECISOES.D13.estado = "decidida"`, a causa de `indisponivel` nunca é `decisao-pendente`.

[C12] A05 + A54 — o dry-run e o dado padrão do trainer
ACHADO. (A05) `--saida` padrão é `docs/relatorios/modelagem` (`treinar_xgboost_loco.py:885`):
  um dry-run novo cairia na pasta de resultados, e os nomes dos arquivos não indicam dry-run.
  (A54) `--dados` padrão (`:879`) é `legado/pre_sarel/Tabela_Consolidada_Parana_Todo_o_Estado_150focos_
  2026-09-04.xlsx`, que a auditoria interna do projeto classifica como "Inválido / Espúrio"
  (`docs/auditorias/Relatorio_Auditoria_Cientifica_Veracidade_2026-09-13.md:33,40-48`: 150/150
  linhas com valores constantes). O JSON do relatório não registra o caminho de `--dados`.
REPRODUZIR. `grep -nE "default=os.path.join\(\"(legado|docs)\"" scripts/treinar_xgboost_loco.py`
  -> `:879` e `:885`; `python3 scripts/treinar_xgboost_loco.py --help` mostra os padrões. NÃO rode
  o dry-run completo.
MUDANÇA. (1) `--dados` passa a ser obrigatório (sem default); sem ele, o script termina com
  mensagem pedindo o caminho. (2) Quando `eh_dryrun` for verdadeiro, o script grava em um
  subdiretório `DRYRUN_SINTETICO/` dentro de `--saida` (ou em diretório temporário) e prefixa os
  nomes dos arquivos com `DRYRUN_SINTETICO_`; o diretório padrão `docs/relatorios/modelagem` fica
  reservado a execução `PROBATORIO_CIENTIFICO`. (3) O JSON passa a registrar `origem_dados`
  (caminho e SHA-256 do arquivo de entrada) e a flag de dry-run no próprio nome. NÃO mexa nos
  arquivos existentes de `docs/relatorios/modelagem/` (o destino deles é DEC-12).
ÂNCORAS. `treinar_xgboost_loco.py:879,885,892,901-908,910-928,930-932` (`eh_dryrun` é devolvido em `:892`;
  `relatorio_final` em `:910`; escrita do JSON em `:930-932`).
ACEITE. `python3 scripts/treinar_xgboost_loco.py` sem argumentos -> exit != 0 com mensagem; um
  dry-run de 4 linhas artificiais com saída em diretório temporário gera arquivos com o prefixo
  `DRYRUN_SINTETICO_` e o JSON com `origem_dados`. Hashes da seção 1 (R10) iguais. Regressão: teste
  Python em `scripts/verificacao/`. Os números do dry-run artificial NÃO são evidência.

──────────────── GRUPO 3: INDUZ MÁ INTERPRETAÇÃO ────────────────

[C13] A11 — `DECISOES.md` diverge de `decisoes.ts`
ACHADO. 9 decisões com estado diferente (D05, D07, D08, D12, D13, D15, D17, D18, D19: `proposta` no
  `.md`, `decidida` no `.ts`); D20..D26 ausentes do `.md`; D03 com conteúdo diferente
  (`DECISOES.md:67` "Binária estrita" × `decisoes.ts:51` ordinal + binarização).
REPRODUZIR. O parser do apêndice C da Parte 2 -> `divergentes ['D05','D07','D08','D12','D13','D15',
  'D17','D18','D19'] | so no TS ['D20'..'D26']`.
MUDANÇA. O `.md` é "espelho legível" do `.ts`; atualizar o `.md` a partir do `.ts` (estado, valor,
  data, quem decidiu) para D01..D26 e P01..P09, sem alterar o `.ts` e sem mudar o estado de
  nenhuma decisão. Preferir gerar o `.md` por script versionado. Se o `.ts` e o `.md` divergirem em
  conteúdo de uma decisão, o `.ts` prevalece; registre as divergências de conteúdo (ex.: D03) no
  relatório para o pesquisador (DEC-3). Adicionar teste que compara os estados.
ÂNCORAS. `docs/planejamento/DECISOES.md:67`; `src/config/decisoes.ts:41,51,169,208,311,324,337`.
ACEITE. O parser acima -> `divergentes [] | so no TS []`. Regressão: teste em `src/config/` que
  lê os dois arquivos e falha em qualquer divergência de id ou de estado.

[C14] A12 — README defasado
ACHADO. `README.md:35` (D13/D14/D15 "pendentes"), `:39` ("Invariantes 1 a 7 verificados"), `:100`
  (`git checkout legado-pre-sarel`, tag inexistente; destino em DEC-11).
REPRODUZIR. `sed -n '35p;39p;100p' README.md`; `git tag | wc -l` -> 0.
MUDANÇA. Corrigir só o que é verificável: D13/D14/D15 constam como decididas; a frase sobre
  invariantes deve refletir o resultado de C03 (quantos e quais bloqueiam); a menção à tag segue
  DEC-11. NÃO reescrever a descrição de rótulos/drone (depende de DEC-3 e DEC-4).
ÂNCORAS. `README.md:35,39,100`.
ACEITE. `sed -n '35p;39p' README.md` com o texto novo; teste que extrai do README as decisões
  citadas como "pendentes" e as confronta com `decisoes.ts`.

[C15] A23 — chuva fixa como "Aguardando D13" com D13 decidida
ACHADO. `select-candidates/route.ts:1177-1202` (marcador em `:1181`): `precipAcum30d`,
  `precipAcum90d`, `i30Max`, `nEventosErosivos`, `indiceMecanismo` = `indisponivel`,
  `causa: "decisao-pendente"`, `motivo: "Aguardando Decisão D13"`, para todo candidato. D13 está
  decidida (`decisoes.ts:169`).
REPRODUZIR. `grep -nE "Aguardando Decisão D13|decisao-pendente" src/app/api/gee/select-candidates/
  route.ts` -> `:1181` e vizinhas.
MUDANÇA. A causa passa a refletir a realidade: `nao-calculado`, com motivo que diz que o módulo de
  chuva não está ligado a esta rota. NÃO ligar a chuva aqui (é DEC-6).
ÂNCORAS. `select-candidates/route.ts:1177-1202`; `types/proveniencia.ts` (`CausaIndisponibilidade`).
ACEITE. `grep -n "Aguardando Decisão D13" src/app/api/gee/select-candidates/route.ts` -> vazio;
  teste que afirma que `causa !== "decisao-pendente"` quando a decisão correspondente está
  `decidida`.

[C16] A31 — os `.plan` sintéticos só têm o aviso no nome  [verificar referências antes]
ACHADO. `docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_jornada_01_altfixa.plan` e
  `..._terrainfollow.plan` são `.plan` válidos do QGroundControl sem nenhum marcador no conteúdo;
  as altitudes vêm de uma função trigonométrica (LEIA-ME_NAO_VOAR.md, seção "As altitudes são
  sintéticas").
REPRODUZIR. `python3 -c "import json;d=json.load(open('docs/verificacoes/voo_ncontrol/SINTETICO_NAO_VOAR_
  jornada_01_altfixa.plan'));print('SINTETICO' in json.dumps(d).upper(), 'NAO_VOAR' in json.dumps(d).upper())"`
  -> `False False`.
MUDANÇA. Impedir que o arquivo seja aberto como plano real: (opção preferida) trocar a extensão
  para uma que o QGC não abra (ex.: `.plan.SINTETICO_NAO_VOAR.txt`) e atualizar todas as referências;
  ou colocar um marcador dentro do JSON que o QGC ignore e que o teste verifique. Atenção:
  `scripts/gerar_relatorio_fase.ts:54-63,221-226` lista esses caminhos e hashes; os relatórios
  `docs/verificacoes/*_relatorio_fase_gerado.md` os citam. NÃO regenere relatórios já gerados;
  atualize só o gerador e registre que os históricos citam o nome antigo.
ÂNCORAS. `scripts/gerar_relatorio_fase.ts:54-63,221-226`; `docs/verificacoes/voo_ncontrol/`.
ACEITE. Teste que varre `docs/verificacoes/voo_ncontrol/` e falha se existir arquivo com
  extensão `.plan` sem marcador de sintético no conteúdo; `git grep -n "jornada_01_altfixa.plan"
  -- src scripts` mostra só o nome novo.

[C17] A07 — as figuras `tela1..5` do manual são esquemáticas e não têm selo
ACHADO. `scripts/gerar_manual_pdf.py:69` as chama "telas demonstrativas esquemáticas"; nenhuma
  traz texto de ilustração; `tela5_xgboost_decisoes.png` mostra "89.3%", "AUC 0.924", barras SHAP e
  `D02 ... Decidida` inventados (`gerar_manual_pdf.py:365-375`, `:423`). O PDF atual do manual usa
  `docs/images/*` (pixel hash: 8 de 8) e não as `tela*`.
REPRODUZIR. `grep -nE "(ax|fig|plt)\.(text|suptitle|title)\(.*(esquem|ilustr|simul|fict)"
  scripts/gerar_manual_pdf.py` -> vazio; `grep -n "ROC-AUC Global: 0.924" scripts/gerar_manual_pdf.py` -> `:366`.
MUDANÇA. No gerador, desenhar em cada figura uma faixa "ILUSTRAÇÃO ESQUEMÁTICA — VALORES FICTÍCIOS,
  NÃO SÃO RESULTADO" e remover da `tela5` qualquer métrica numérica (ou rotular cada número como
  fictício); regerar os 5 PNG em `docs/figuras_manual/`. Se o pesquisador preferir descartar as
  figuras que o manual já não usa, isso é decisão dele (não decida; relate).
ÂNCORAS. `gerar_manual_pdf.py:69,185,198,365-375,423-425`.
ACEITE. Abrir os 5 PNG regerados (descreva o que vê) e `grep -c "FICT" scripts/gerar_manual_pdf.py`;
  teste que lê o gerador e falha se uma função de figura não desenhar o selo.

[C18] A08 — relatório de mudanças afirma "AUC 0,82-0,91" e "35 passed"  [saída DEPENDE DE DEC-13]
ACHADO. `scripts/gerar_relatorio_mudancas_pdf.py:578` ("métricas realistas (AUC 0,82-0,91)"),
  `:613-614` ("35 Arquivos de Teste ... (35 passed)", "235 Asserções ... (235 passed)"). Hoje:
  57 arquivos, 435 testes, 6 falhando. Nenhuma execução registrada produz o intervalo de AUC.
REPRODUZIR. `pdftotext -layout Relatorio_Mudancas_Metodologicas_SAREL_PPGTCA_2026.pdf - | grep -nE
  "AUC 0,82|35 passed"` -> linhas 337 e 362; o de `docs/relatorios/` -> 337 e 363.
MUDANÇA. No gerador, remover o intervalo de AUC (nenhum resultado o sustenta) e substituir as
  contagens de teste por valores lidos da execução, ou por texto sem número com data. Regerar o
  PDF no caminho que DEC-13 escolher; NÃO gerar em dois lugares.
ÂNCORAS. `gerar_relatorio_mudancas_pdf.py:578,613-614`.
ACEITE. O `pdftotext | grep` da reprodução -> vazio no PDF regerado; teste que lê o gerador e
  falha se contiver `AUC 0,` ou `passed)` com número literal.

[C19] A09 — a UI mostra métricas "simuladas" sem selo no cartão
ACHADO. `PainelCampanha.tsx:267-300` (`calcularMetricasDemonstracao`) gera 250 pixels artificiais
  (comentário `:273` "70 TP, 2 FP, 5 FN, 173 TN") e o botão "Calcular Métricas Matriciais"
  (`:543`) exibe acurácia, Kappa, F1, precisão e IoU (`:551-581`) sem a palavra "simulado". O único
  chamador de `executarValidacaoMatricial` é esse demo (`:296`).
REPRODUZIR. `git grep -n "executarValidacaoMatricial" -- src ':!*.test.ts'` -> `PainelCampanha.tsx:8,296`
  e a definição.
MUDANÇA. Cada cartão (e o botão) passa a trazer "DEMONSTRAÇÃO — pixels fictícios, não é validação";
  o texto do botão deixa de dizer "Calcular Métricas". Se o pesquisador quiser remover o demo,
  é decisão dele. NÃO ligar a validação a dado real aqui.
ÂNCORAS. `PainelCampanha.tsx:56,267-300,543-581`.
ACEITE. Teste de componente (ou de texto) que afirma que o marcador "DEMONSTRAÇÃO" aparece junto
  de qualquer cartão de métrica derivado de `calcularMetricasDemonstracao`.

[C20] A32 — `classeAmostral` por limiar é exibida como "Erosão Laminar (Classe 1)"
ACHADO. `classificarPontoEspectral` (`amostragemBiofisica.ts:62`) devolve `"erosao"`/`"controle"`
  só por BSI e NDVI; `PointPopup.tsx:169` mostra "Erosão Laminar (Classe 1)" e
  `MapViewer.tsx:351,637` colore por esse campo.
REPRODUZIR. `grep -nE "Erosão Laminar \(Classe 1\)|Controle / SPD \(Classe 0\)" src/components/map/
  PointPopup.tsx` -> `:169` e vizinha; sonda R-TS: `classificarPontoEspectral(0.2, 0.3)` -> `"erosao"`.
MUDANÇA. Trocar o texto exibido por um que diga que é **candidato por limiar espectral** (ex.:
  "Candidato espectral a erosão (limiar BSI/NDVI) — não é rótulo") e a legenda do mapa idem.
  NÃO renomear o campo `classeAmostral` nem mudar os limiares (D02 é DEC-2).
ÂNCORAS. `PointPopup.tsx:146-175`; `MapViewer.tsx:351,637`; `amostragemBiofisica.ts:62-90`.
ACEITE. `grep -n "Erosão Laminar (Classe 1)" src/components/map/PointPopup.tsx` -> vazio; teste de
  texto que garante a presença de "candidato" ou "não é rótulo".

[C21] A33 — "macrobacia IAT" atribuída por retângulos fora dos polígonos simplificados
ACHADO. `treinar_xgboost_loco.py:123-163`: 6 polígonos de 8 a 12 vértices; fora deles, o
  *fallback* (`:151`) devolve nome de bacia por cortes de latitude e longitude; `"Macrobacia Ivai
  (IAT)"` no `else`. Os nomes alimentam o grupo da validação cruzada e o log `[MACROBACIAS]` (`:600`).
REPRODUZIR (apêndice E da Parte 2): `len(BACIAS_PARANA)` -> 6; vértices `{Tibagi 10, Ivaí 10,
  Paranapanema 10, Iguaçu 12, Piquiri/PR3 8, Litorânea/Ribeira 9}`.
MUDANÇA. Sem mudar a partição dos blocos (isso é decisão metodológica): (1) os nomes devolvidos
  pelo *fallback* passam a ser distintos (ex.: `"Bloco-quadrante (não-IAT): Iguaçu"`); (2) o
  trainer imprime quantos pontos caíram em polígono e quantos no fallback; (3) o log deixa de
  chamar os grupos de "Bacia do Paraná" quando vierem de `Bloco_Espacial` do app. Antes de editar,
  execute V4.
ÂNCORAS. `treinar_xgboost_loco.py:123-163,581-600`.
ACEITE. Teste Python com 2 pontos artificiais, um dentro de polígono e um fora (fallback): os
  nomes diferem e a contagem aparece no log. Os pontos são `SINTETICO_TESTE_ENCANAMENTO`.

[C22] A36 — textos de interface, manual e comentários defasados  [depois de C03, C15]
ACHADO. (i) `PainelMatrizModal.tsx:25` "verificação dos 10 invariantes" (spec e código: 7); (ii)
  `LEIA-ME_NAO_VOAR.md:29` "Não existe leitor real do GLO-30 no repositório" (existe
  `scripts/reduzir_terreno_copernicus.py`, commit 8e10661, posterior ao LEIA-ME 89cc3af; o aviso
  sobre os `.plan` continua válido); (iii) `scripts/gerar_manual_pdf.py:282,948` "35 suites / 231
  testes vitest"; (iv) `select-candidates/route.ts:1206` "D13 (R pendente) ... D15 (LS pendente)".
REPRODUZIR. `sed -n 25p src/components/matriz/PainelMatrizModal.tsx`; `sed -n 29p docs/verificacoes/
  voo_ncontrol/LEIA-ME_NAO_VOAR.md`; `sed -n '282p;948p' scripts/gerar_manual_pdf.py`; `sed -n 1206p
  src/app/api/gee/select-candidates/route.ts`.
MUDANÇA. Corrigir cada frase para o fato verificável (número de invariantes depois de C03; o
  LEIA-ME deve dizer que **existe** amostrador real do GLO-30 mas que os `.plan` comitados foram
  gerados com a função sintética; contagem de testes sem número fixo ou lida; comentário da rota
  conforme C11). NÃO alterar o resto do LEIA-ME.
ÂNCORAS. as acima.
ACEITE. Os `sed -n` acima mostram o texto novo; teste de texto que confronta o número de invariantes
  citado na UI com o do código.

[C23] A18 + A39 — a ingestão fundiária troca erro e ausência por valor-padrão
ACHADO. `ingest_sncr_official.py:155-157` (`area_total = 0.0`), `:163-167` (`perc_det = 100.0`);
  `ingest_sigef_official.py:181-183` (`mun_ibge = 0`); `ingest_sicar_official.py:207-208` (`area`,
  `mod_fiscal` `0.0`); `query_real_properties.py:109,119`; `get_fontes_dados.py:45-47` (imprime
  `[]` no erro); `ingest_data.py:120-121` (`pass`), `:239-241` e `:398-400` (devolve `None`/`0`).
  Mitigação só para a área na leitura (`matcher.ts:48-49`).
REPRODUZIR. `grep -nE "or 0\.0|or 0\)|= 0\.0$|= 100\.0$|= 0$" scripts/ingest_*.py scripts/
  query_real_properties.py` -> as linhas acima. Antes de editar, confirme se a coluna do SQLite
  aceita `NULL` (V-esquema: `sed -n` do `CREATE TABLE` no próprio script).
MUDANÇA. Valor ausente ou ilegível passa a ser `NULL` (ou à linha rejeitada com contagem), nunca
  `0`, `0.0` ou `100.0`; erro de ingestão devolve falha explícita e contagem de linhas rejeitadas
  com motivo, e `get_fontes_dados.py` devolve estrutura com `erro` em vez de lista vazia. Ajustar
  os leitores para tratar `NULL` como ausente. NÃO reingerir a base inteira.
ÂNCORAS. as acima + `matcher.ts:48-49`.
ACEITE. Teste Python com linhas CSV sintéticas (`SINTETICO_TESTE_ENCANAMENTO`) com campo ausente e
  ilegível: o banco recebe `NULL` e o relatório conta as rejeitadas; `grep -nE "or 0\.0|= 100\.0"
  scripts/ingest_sncr_official.py` -> vazio.

[C24] A40 — `inspect-point` engole falhas e responde `ok: true`
ACHADO. `src/app/api/gee/inspect-point/route.ts:58-70` (`.catch(() => null)` na consulta Embrapa, na
  fundiária e no token GEE); `:322-324` mantém `point.fundiario` se a consulta falhar; resposta
  `{ ok: true, ponto, geeDebug }` (`:328-332`).
REPRODUZIR. `sed -n '58,70p;322,332p' src/app/api/gee/inspect-point/route.ts`.
MUDANÇA. Cada falha de consulta é registrada no ponto como `erro-na-consulta` com causa (para o
  fundiário) ou `servico-indisponivel` (para as demais) e devolvida em uma lista `avisos` na
  resposta; `ok` permanece `true` somente se o ponto foi atualizado sem perda; o estado anterior
  de `fundiario` não é apagado, mas a falha fica visível. Não consuma o serviço real nos testes:
  injete falhas por dublê.
ÂNCORAS. `inspect-point/route.ts:56-70,318-332`.
ACEITE. Teste que injeta falha na consulta fundiária e confirma `avisos` não vazio e status
  `erro-na-consulta`; `grep -n "catch(() => null)" src/app/api/gee/inspect-point/route.ts` -> vazio
  ou acompanhado de registro da falha.

[C25] A41 — metadados do rótulo preenchidos por padrão do sistema  [valores aceitos DEPENDEM de DEC-3]
ACHADO. `InspetorPonto.tsx:49` (`const hoje = new Date().toISOString().split("T")[0]`) e `:71`
  (`observadoEm: hoje`): a data do rótulo é a do clique, em UTC. `ingestaoColetor.ts:225`
  (`observador` ausente vira "Perito SAREL Coletor"), `:226` (`observadoEm` ausente vira a data de
  hoje), `:227-231` (`confianca` ausente ou inválida vira `"alta"`). `ingestaoKobo.ts:119` não
  preenche padrão.
REPRODUZIR. `grep -nE "Perito SAREL Coletor|new Date\(\)\.toISOString|: \"alta\"" src/lib/rotulos/
  ingestaoColetor.ts src/components/inspetor/InspetorPonto.tsx` -> as linhas acima. Antes de
  editar, execute V7.
MUDANÇA. Registros sem observador, data ou confiança passam a ser rejeitados com o motivo, ou
  ficam com o campo ausente e causa declarada, e não recebem valor de sistema. O Inspetor ganha
  um campo explícito "data da observação" (obrigatório, sem valor inicial). Se o pesquisador
  decidir que "data do cadastro" é a semântica pretendida, isso exige um campo próprio, não
  `observadoEm`. Não mude `Rotulo` além do necessário.
ÂNCORAS. `InspetorPonto.tsx:49,71`; `ingestaoColetor.ts:225-231`; `ingestaoKobo.ts:119`;
  `types/rotulo.ts` (`Rotulo.observadoEm`).
ACEITE. Teste de `ingestarSubmissoesSarelColetor` com registro sem os 3 campos: nenhum vira padrão;
  o rótulo do Inspetor sem data não é gravado. `grep -n "Perito SAREL Coletor" src` -> vazio.

[C26] A42 — datas de consulta em UTC (deslocam um dia depois das 21 h em Brasília)
ACHADO. 18 ocorrências de `new Date().toISOString().split("T")[0]` ou `.slice(0, 10)`, entre elas
  `inspect-point/route.ts:50`, `select-candidates/route.ts:284`, `sorteio-d16/route.ts:175`,
  `InspetorPonto.tsx:49`, `chuva/eventos.ts:120`, `fundiario/matcher.ts:55`, `ingestaoColetor.ts:226`.
  Em `chuva/chirps.ts:61` e `chuva/imerg.ts:48` o **padrão** de `adquiridoEm` é a data de hoje.
REPRODUZIR. `TZ=America/Sao_Paulo node -e 'const d=new Date("2026-10-05T23:30:00-03:00");
  console.log(d.toISOString().split("T")[0])'` -> `2026-10-06`; `git grep -nE "toISOString\(\)\.(split|
  slice|substring)" -- src scripts ':!*.test.ts' ':!*.test.tsx' ':!scripts/gerar_*' | wc -l` -> 18.
MUDANÇA. Um único utilitário para "data civil no fuso do pesquisador" (America/Sao_Paulo) e outro
  para "instante UTC" (timestamps de consulta); usar o segundo em `consultadoEm` e o primeiro onde a
  data é civil. Remover o padrão `adquiridoEm = hoje` de `chirps.ts` e `imerg.ts` (tornar
  obrigatório). Não alterar `selos` já gerados.
ÂNCORAS. as 18 linhas listadas pelo `git grep` acima; `chirps.ts:61`; `imerg.ts:48`.
ACEITE. Teste que fixa o relógio em 23:30 (UTC-3) e afirma a data civil `2026-10-05` e o instante
  UTC `2026-10-06T02:30:00Z`; o `git grep` acima -> 0 ocorrências fora do utilitário.

[C27] A43 — NDVI/BSI sem faixa física em `classificarPontoEspectral`
ACHADO. `amostragemBiofisica.ts:62-90` classifica `bsi=5, ndvi=-3` como `"erosao"`. Outras partes
  validam [-1, 1] (`rusle/fatorC.ts:59-62`, `jev/fallbackLocal.ts:38-41`).
REPRODUZIR (Receita R-TS, apêndice A da Parte 2): `classificarPontoEspectral(5,-3)` -> `erosao`;
  `(-5,3)` -> `controle`.
MUDANÇA. Valor fora de [-1, 1] devolve `"indefinido"` e registra o motivo (fora do domínio). Aplicar a
  mesma validação na entrada dos valores devolvidos pelos clientes GEE antes de gravar a
  proveniência `medido`. NÃO alterar os limiares de D02.
ÂNCORAS. `amostragemBiofisica.ts:62-90`; `copernicusGeeClient.ts` (onde NDVI/BSI viram `medido`).
ACEITE. A sonda passa a devolver `indefinido` para os dois casos fora de faixa; os casos
  `(0.2,0.3)` -> `erosao` e `(0.05,0.5)` -> `indefinido` continuam. Regressão em
  `amostragemBiofisica.test.ts`.

──────────────── GRUPO 4: COSMÉTICO ────────────────

[C28] A03 — dois warnings de `react-hooks/exhaustive-deps`
ACHADO. `MapViewer.tsx:476` (`credenciais.mapboxToken`), `PointPopup.tsx:64`
  (`atualizarPontoIndividual`, `point`). REPRODUZIR. `npm run lint` -> 2 warnings.
MUDANÇA. Incluir as dependências ou justificar a omissão com comentário que explique por que o efeito
  não deve reexecutar, sem criar laço de renderização. ÂNCORAS. as acima.
ACEITE. `npm run lint` -> 0 warnings (cole). Regressão: a própria etapa de lint.

[C29] A34 — a fonte do DEM é rotulada com o CRS de projeção
ACHADO. `scripts/reduzir_terreno_copernicus.py:86`: `FONTE_OFICIAL = "COPERNICUS/DEM/GLO30
  (EPSG:31982)"`; testado em `scripts/verificacao/test_reduzir_terreno.py:107`.
REPRODUZIR. `sed -n 86p scripts/reduzir_terreno_copernicus.py`.
MUDANÇA. Separar "produto" e "CRS de processamento" no texto (ex.: "COPERNICUS/DEM/GLO30; processado
  em EPSG:31982") e atualizar o teste. Confirme em fonte oficial o CRS nativo do produto antes de
  escrever (não afirme de memória). ÂNCORAS. as acima.
ACEITE. `sed -n 86p` com o texto novo; `python3 -m pytest scripts/verificacao/test_reduzir_terreno.py`
  se `pytest` estiver instalado (senão diga que não rodou).

[C30] A47 — funções duplicadas (Kappa ×3, Pearson ×2)
ACHADO. `calcularKappaCohen`: `rotulos/concordancia.ts:59`, `padraoOuro/validacaoMatricial.ts:142`,
  `config/tourMetodologico.ts:375`. `calcularCorrelacaoPearson`: `padraoOuro/validacaoMatricial.ts:165`,
  `seguranca/detectorSequencia.ts:32`.
REPRODUZIR. `git grep -nE "export function (calcularKappaCohen|calcularCorrelacaoPearson)" -- src`
  -> as 5 linhas acima.
MUDANÇA. Manter **o comportamento de cada uma** e eliminar a duplicata de implementação: a versão
  2x2 (`tp, fp, fn, tn`) passa a viver em um só módulo e as outras a reutilizam; a versão de pares
  de rótulos (com IC 95%) permanece com nome distinto (`calcularKappaCohenPares`) para não
  confundir. Não mudar números de saída; testes existentes devem continuar verdes.
ÂNCORAS. as acima.
ACEITE. O `git grep` acima -> 1 definição por assinatura distinta, com nomes distintos; suíte
  `validacaoMatricial.test.ts`, `rotulos.test.ts` e `detectorSequencia.test.ts` verdes (cole).

════════════════════════════════════════════════════════════════════════════════════════
6. DECISÕES QUE SÓ O PESQUISADOR PODE TOMAR (não entram como correção)
════════════════════════════════════════════════════════════════════════════════════════
Cada decisão traz as opções e a consequência de cada uma. O executor NÃO recomenda uma como se
fosse técnica. Em todas, o pesquisador registra a escolha por escrito (e, se for o caso, em
`src/config/decisoes.ts`), e só então os blocos [DEPENDE DE DEC-n] avançam.

DEC-1 (A04) — RUSLE como preditor.
  Fato: o script ainda lista K, R e perda de solo como candidatos (`treinar_xgboost_loco.py:578-580`);
  a matriz do app exporta K e R (`perfis.ts:158-159`) e já não exporta a perda; `montagem.ts:11`
  diz que fatores R, K, LS, C, P e perda são exclusões invioláveis.
  (a) K e R entram, perda fora: coerente com D24 (blocos "solo" e "chuva") e com a matriz atual;
      exige corrigir o cabeçalho de `montagem.ts`, o docstring do trainer e a lista de candidatos.
  (b) Nenhum fator RUSLE entra: a comparação com a linha de base fica mais limpa; o XGBoost perde
      os blocos de solo e chuva que D24 prevê.
  (c) K, R e perda entram: a comparação "XGBoost × RUSLE" (D25) perde o sentido, porque o modelo
      recebe a saída do competidor.

DEC-2 (A13) — o que D02 define: estrato de amostragem ou rótulo.
  Fato: D02 (`decisoes.ts:41`) define Classe 1 por `BSI > 0.10 e NDVI < 0.40` e Classe 0 por
  `BSI < 0.00 e NDVI > 0.65`; a Regra 4 diz que nada calculado vira rótulo.
  (a) Critério de ESTRATO apenas: o rótulo vem só de observação humana; `classeAmostral` é só
      candidato; consequência: C20 já cobre a exibição, e o D02 precisa de redação que diga isso.
  (b) Critério de RÓTULO: contraria a Regra 4 e muda D03/D26; consequência: o desenho deixa de
      ter "observação independente".
  (c) Outra redação: o pesquisador a registra.

DEC-3 (A11 conteúdo de D03; A26b; A29) — alvo e binarização.
  Fato: `decisoes.ts:51` D03 (ordinal de 4 níveis, binário com "incipiente" = 1); `:337` D26 (alvo
  contínuo: fração da célula delineada; binário secundário a 25%); `DECISOES.md:67` ainda diz
  "binária estrita". Existem 4 binarizações no código: `montagem.ts:139-148` (texto),
  `InspetorPonto.tsx:65` (`>= 0.25`), `ingestaoColetor.ts:215-222`, e o trainer (`Classe_Alvo_Binaria`).
  (a) Prevalece D26: a matriz exporta `fracaoErodida` como alvo primário e o binário a 25% como
      secundário; consequência: muda `perfis.ts`, `montagem.ts`, o trainer (`reg:tweedie`) e a UI.
  (b) Prevalece D03 (binário por "incipiente"): consequência: D26 precisa ser reemendada e o alvo
      contínuo deixa de ser usado.
  (c) As duas, com papéis declarados (D26 primário, D03 compatibilidade): consequência: as quatro
      binarizações precisam convergir para uma função única.

DEC-4 (A27, A29, A37) — papel do VANT/drone e arquivos de saída.
  Fato: D16 (`decisoes.ts:208`) diz que o VANT é massa de treino e teste independente (72 polígonos de
  5,02 ha, GSD 4 cm, 36 treino + 36 *held-out*); `PainelCampanha.tsx:377-404` já descreve isso;
  `montagem.ts:196-197` manda todo drone para `heldOutDrone`; `sitiosReferencia.ts` mantém 4
  sítios `held-out` a 7,5 cm; nenhum arquivo de held-out nem de chaves é gerado (`montagem.ts:5-12`).
  (a) Alinhar o código a D16 emendada: o drone alimenta treino e teste por polígono (`papelConjunto`);
      consequência: reescrever `montagem.ts`, o export e o trainer; gerar arquivo separado do held-out.
  (b) Manter o drone só como held-out e emendar D16/D24/D25: consequência: o regime de dados de D24
      deixa de valer.
  (c) Manter os dois e declarar o período de transição: consequência: o app continua discordando
      de si mesmo.

DEC-5 (A25) — o que o Kappa < 0,60 bloqueia.
  Fato: `concordancia.ts:135,148` marca `operacional=false` e monta o texto "ALERTA BLOQUEANTE",
  que ninguém lê; a UI cria rótulos com `kappa: null` e `divergencia: "indisponivel"`.
  (a) Bloquear a exportação `matriz-treino` se existir par com κ < 0,60 entre os que têm 2 observadores.
  (b) Bloquear só a promoção do rótulo a `final` até haver segunda observação.
  (c) Manter como aviso visível e exigir justificativa escrita para exportar.
  Consequência comum: rótulo de um só observador (hoje aceito) passa a ser permitido ou não.

DEC-6 (A22, A38b) — o que fazer com os módulos sem chamador e com R/LS.
  Fato: harmônicos, estatísticas de série, chuva (CHIRPS/IMERG), S1, Planet (pares, pedidos, tiles),
  fotointerpretação e `taxaErro` têm 0 usos fora de testes (Parte 2, 3.3); R e LS nunca recebem insumo
  (A38).
  (a) Ligar o que o método exige (R, LS e chuva para D13/D15; pares e Planet só se D18/D19 valerem);
      consequência: trabalho de integração e de teste por módulo, com credenciais.
  (b) Calcular a linha de base RUSLE fora do app (script do D25) e manter o app sem ela; consequência:
      a coluna `RUSLE_Fator_R` continua vazia no app.
  (c) Arquivar em `legado/` o que não for usado e corrigir README/planejamento; consequência: o método
      declarado encolhe.

DEC-7 (A14) — escolhas metodológicas feitas pelo código.
  Fato: imputação por mediana (`treinar_xgboost_loco.py:676-677,748,788`), AUC=0,5 em falha
  (`:691-692`), `KFold(shuffle=True)` chamado de LOCO (`:638`), `clamp` [0,1]
  (`amostragemSoloNuLote.ts:422`), tolerâncias 30 dias (`chuva/eventos.ts:48`), 45 dias
  (`matriz/montagemTemporal.ts:61`), 75° (`gee/versaoMotor.ts:18`) e 0,95 (`seguranca/detectorSequencia.ts:63`).
  Para cada item: (a) registrar como decisão; (b) trocar pela alternativa do pesquisador;
  (c) remover. Imputar pela mediana altera o que o SHAP explica; chamar de LOCO um `KFold` altera o
  que a validação afirma.

DEC-8 (A17) — fórmula do Fator C quando o BSI falta.
  Fato: `fatorC.ts:67` usa BSI=0 (fórmula de D01) quando o BSI é omitido; D20 define a híbrida.
  (a) Recusar o cálculo e devolver `indisponivel` sem BSI. (b) Aceitar D01 pura com selo explícito
  de que não foi a de D20. (c) Outra regra.

DEC-9 (A16) — que data de aquisição declarar para as camadas Embrapa (WMS/WFS).
  (a) A data de publicação da camada (se constar do nome ou dos metadados). (b) `indisponivel` com
  causa, quando não houver data. (c) Outra convenção.

DEC-10 (A19) — CAR e perímetros reais no código.
  Fato: `sitiosReferencia.ts:101,377,513,629` embute 4 `codigoCar` de 43 caracteres e geometrias
  que batem com as áreas declaradas (V13).
  (a) Manter no repositório e documentar a base legal/anonimização. (b) Mover para fora do git
  (como já é feito com `data/`) e carregar em tempo de execução. (c) Substituir por identificadores
  opacos (o repositório já adotou códigos opacos para o sorteio, `f0b2026`).

DEC-11 (A30) — a tag `legado-pre-sarel`.
  Fato: o README manda `git checkout legado-pre-sarel`; a tag não existe no clone nem no remoto.
  (a) Criar a tag no commit que o pesquisador indicar (criar tag é ação de remoto; exige autorização).
  (b) Remover a menção do README e apontar para `legado/` e para o hash de um commit.

DEC-12 (A05) — destino de `docs/relatorios/modelagem/`.
  (a) Manter onde está (os PNG têm banner; o JSON tem a natureza). (b) Mover para `legado/` ou
  `docs/relatorios/DRYRUN_SINTETICO/` (a recomendação já existe em `PROMPT_EXECUCAO_DESENHO_
  CONSOLIDADO_2026-09-27.md:163`). (c) Renomear com prefixo `DRYRUN_`. Em (b) e (c), os hashes da
  seção 1 (R10) mudam de caminho, não de conteúdo.

DEC-13 (A45, A08) — qual cópia de cada PDF/PPTX é a vigente.
  Fato: `docs/relatorios/Relatorio_Mudancas...pdf` é idêntico (`982912f4d2`) à versão arquivada de
  17/09 em `legado/`; a da raiz é outra (`716d1b32bf`); `Apresentacao_Simposio_7min_SAREL.pptx` difere
  entre raiz e `docs/`. (a) Raiz vigente; `docs/relatorios/` recebe a regerada. (b) `docs/` vigente;
  a raiz sai. (c) Manter só uma e apontar a outra para ela.

DEC-14 (A46) — qual lógica de treino é a canônica.
  Fato: CLI (`KFold` k=5 embaralhado, mediana), pacote ZIP (`GroupKFold` com até 3 dobras, `NaN`
  nativo, `pacoteReprodutibilidade.ts:679-823`), e o dry-run. Nenhuma segue D24/D25/D26.
  (a) O CLI é canônico e o pacote passa a copiá-lo. (b) O pacote é canônico. (c) Reescrever uma
  terceira conforme D24/D25/D26 e aposentar as duas. A escolha determina o que o usuário que baixa o
  ZIP recebe.

DEC-15 (A28b) — quais colunas da matriz o trainer consome.
  Fato: das 30 colunas da matriz, o trainer consome 13; ignora `Declividade_graus` (o mapeamento do
  script tem `Declividade_Graus`, `:431`), `Acumulo_Fluxo`, `Ordem_Solo`, `Subordem_Solo`,
  `Grande_Grupo_Solo`, `Erodibilidade_Classe`, `Frequencia_Solo_Nu`, `Precip_Acum_*`, `I30_Max_mm_h`,
  `N_Eventos_Erosivos`, `Indice_Mecanismo`. (a) Consumir todas as numéricas e codificar as
  categóricas. (b) Manter 13 e declarar o motivo. (c) Seguir o teto por bloco de D24. Cada escolha
  muda o número de preditores por bloco que D24 limita.

DEC-16 (A35b, P09) — método da máscara de nuvem Sentinel-2 e janela da consulta pontual.
  (a) SCL. (b) QA60. (c) Probabilidade de nuvem (MSK_CLDPRB). (d) Nenhuma máscara de pixel,
  declarando apenas o filtro por cena. E a janela da consulta pontual: (e) a de D05 (2016-2026), (f)
  2023 com decisão registrada. A escolha muda o número de observações válidas contra o mínimo de D11.

════════════════════════════════════════════════════════════════════════════════════════
7. VERIFICAR ANTES DE CORRIGIR (achados NÃO VERIFICADOS)
════════════════════════════════════════════════════════════════════════════════════════
Não corrija nada ligado a estes itens antes de executar a verificação e colar a saída.

V1  (A44) CRS fixo EPSG:31982: medir a distorção de projeção em pontos de outras regiões do estado,
    incluindo a faixa a oeste de 54°O (zona 21S). Hoje só consta a medição da BP3
    (`areaInteresse.ts:61`, `docs/verificacoes/projecao/`).
V2  (A48) `Instalador_SAREL.exe` (2.181.120 bytes): confirmar se corresponde ao fonte
    `scripts/installer/InstaladorSAREL.cs` (compilar em ambiente com o SDK e comparar; ou documentar a
    origem). Não execute o `.exe`.
V3  (A49) `docs/Plano de voo exemplo/Coleta 01b.plan` e `MissaoCalculoMica.plan` (home
    `[-25.1387..., -53.8549..., 50]`): perguntar ao pesquisador se são missões reais voáveis ou
    modelos; só então decidir marcar ou mover.
V4  (A33) Com que frequência um ponto real cai no *fallback* por retângulos: contar sobre a planilha
    de entrada real, não sobre dado sintético.
V5  (A15) Antes de C07: contar os candidatos com declividade ou frequência de solo nu ausentes e
    quanto o sorteio mudaria. Não execute o sorteio real sem autorização (ele grava selo).
V6  (A20) Antes de C05: seguir `inspect-point/route.ts:323` e `select-candidates/route.ts:1231` até
    ver se `fundiario` sempre passa por `toContextoFundiario` (`matcher.ts:37`).
V7  (A41) Antes de C25: contar, nos registros reais já ingeridos, quantos chegaram sem
    `observadoEm`, `observador` ou `confianca` e portanto receberam valor-padrão.
V8  (D4) P04 (buffers água/urbano), P06 (UDM2 ≥ 80%, pendente) e P08 (limiar de variância 1e-4): procurar
    por outros formatos de constante; se existirem, abrir achado.
V9  (A05b/A54) Com a planilha `150focos` presente: medir média e desvio padrão de cada preditor e
    comparar com as faixas `uniform` de `treinar_xgboost_loco.py:332-340`. Confirmar que os valores
    constantes batem com o relatório interno de 13/09.
V10 (A02) Com `data/` presente (banco fundiário, tiles do GLO-30, bibliografia): rodar `npm run
    test:vivo` e registrar quais dos 6 testes passam.
V11 (A35) Procurar outra rota de extração Sentinel-2 que mascare por pixel
    (`git grep -nE "SCL|QA60|MSK_CLD|updateMask|CLOUDY_PIXEL" -- src scripts`).
V12 (A38) Rodar a rota `select-candidates` com credencial GEE e um ponto, e confirmar o estado real
    de R, LS e perda (a sonda mostrou o comportamento da função, não da rota em execução).
V13 (A19) Confirmar com a base SICAR se os 4 `codigoCar` e os perímetros de `sitiosReferencia.ts`
    são de imóveis reais.

════════════════════════════════════════════════════════════════════════════════════════
8. SEM AÇÃO (refutados; mantidos aqui para que nenhum achado fique sem destino)
════════════════════════════════════════════════════════════════════════════════════════
A10 (corrupção no JSON: o arquivo é UTF-8 válido), A21 (segredos: nenhum nos padrões buscados),
A19 parte CPF/CNPJ (sem valor real versionado), A50 (testes vazios: 0 em 435 pela heurística),
A51 (a flag de dry-run tem default `False` e o `raise` de `:283` recusa sem ela), A52 (declividade:
unidades consistentes), A53 (selos em `docs/verificacoes/`). Se o executor encontrar evidência nova
contra algum deles, relate; não aja.

════════════════════════════════════════════════════════════════════════════════════════
9. ENCERRAMENTO: o que o executor deve relatar
════════════════════════════════════════════════════════════════════════════════════════
Ao terminar (ou ao parar), entregue um relatório com:
 (1) para cada bloco: executado / não executado (e por quê) / parcialmente; o commit local; a
     saída colada de "reproduzir antes" e de "aceite" da MESMA sessão;
 (2) o que você NÃO fez: blocos [DEPENDE DE DEC-n] sem decisão, verificações V1..V13 não rodadas,
     partes que exigiriam credencial GEE, Planet ou dado local;
 (3) o que FALHOU: comando, código de saída e as primeiras 30 linhas da saída;
 (4) o que NÃO VERIFICOU e por quê;
 (5) o placar final de `npm run typecheck`, `npm run lint`, `npm run test` e `npm run build`, comparado
     com o BASELINE da seção 1, e a confirmação dos 5 hashes da regra R10 com `sha256sum -c`;
 (6) `git status --porcelain` e `git log --oneline` dos seus commits locais.
NÃO afirme "corrigido", "passa" ou "limpo" sem a saída colada. Nenhum dado de teste vale como
evidência científica. Não faça push. Não declare o repositório "pronto".
```
