# Prompt do agente executor — SAREL v2 (2026-10-06)

**Para quem é.** Um agente executor (modelo de custo menor) que aplica, em ordem e com portões verificáveis, (1) as correções da auditoria de 05/10/2026, (2) o alinhamento do código às decisões **já decididas** D16, D24, D25 e D26, e (3) os ajustes de front-end medidos em 06/10/2026.

**Estado: NÃO EXECUTADO.** Nada aqui foi aplicado ao código. Os anexos (`ANEXOS_PROMPT_EXECUTOR_2026-10-06/`) foram testados por quem escreveu este prompt: 35 testes Python passam (saída da execução registrada no relatório de entrega) e o script de UI reprova 21 itens no estado atual (isso é o esperado: é o critério de aceite do front-end).

## O que o pesquisador precisa fazer ANTES de entregar este arquivo ao executor

1. Ler a **seção 3 (tabela de decisões)** do prompt. Cada linha traz um **padrão proposto**. Onde a decisão já está registrada em `src/config/decisoes.ts` (D16, D24, D25, D26, D20, D03), o padrão apenas obedece ao registro. Onde **não** está (DEC-5, 6, 7, 9, 16 etc.), o padrão é uma **proposta conservadora de quem redigiu o prompt**, não decisão sua. **Se você entregar o arquivo sem editar a coluna "Padrão", está aprovando-a.** Edite o que discordar.
2. Ler as **sete ressalvas científicas e documentais** abaixo; nenhuma foi corrigida pelo executor (só você altera decisões `decidida`).
3. Conferir que o `HEAD` do repositório é o descendente esperado de `4834cf0` e que os anexos estão versionados (o executor confere os SHA-256).

### Ressalvas científicas que o executor NÃO resolve (só relata)

- **R-A. D25 tem texto residual inconsistente.** O `valor` diz "18 AGRUPAMENTOS, não por 918 unidades" no meio do texto e "36 agrupamentos / 936" no começo e na justificativa. D24 diz 936 de held-out; `CalculadoraDesenhoAmostral.tsx:252` mostra 922; a fórmula do próprio D24 (área ÷ π(50/2)²) dá ≈ 920. Reconciliar é decisão sua.
- **R-B. D25 tem uma lacuna.** Se rho_XGBoost ≥ 0,40, ≥ rho_RUSLE, mas a margem é < 0,10, nenhum dos três desfechos se aplica. O código de referência devolve `NAO_PREVISTO_EM_D25` em vez de inventar uma regra. D25 também não diz se AUC ≥ 0,70 e ΔAUC ≥ 0,05 (secundárias) condicionam o desfecho; o código só as reporta. E "RUSLE limiarizado" não altera a AUC (a AUC só depende da ordenação do escore contínuo).
- **R-C. A citação "Mannigel et al. (2002), RBCS 26:1039-1049"** (D09, D10) **não bate** com o que a busca encontrou: Mannigel, Carvalho, Moreti & Medeiros (2002), *Acta Scientiarum* 24(5):1335-1340, sobre solos do Estado de **São Paulo**. Confira a fonte antes de citar na dissertação.
- **R-D. D02 (limiares BSI/NDVI para "Classe 1/0") × Regra 4** (nada calculado vira rótulo). O padrão do prompt trata D02 como critério de **estrato/candidato**, não de rótulo (DEC-2a). A redação de D02 em `decisoes.ts` continua dizendo "Classe 1 / Classe 0": só você pode reescrevê-la.
- **R-F. A cifra "~78 % de acerto de atribuição com CE90 1,47 m" (D06, D16) não se reproduz.** Com erro gaussiano isotrópico e o ponto verdadeiro uniforme na célula de 10 m, a probabilidade de cair na célula certa é 57,9 % (σ=3 m), 37,2 % (σ=5 m) e 19,6 % (σ=8 m) — **estes três batem exatamente com P03** — mas CE90 = 1,47 m equivale a σ = 1,47/2,146 = 0,685 m por eixo e dá **89,4 %**; os 78 % só aparecem se 1,47 for tomado como σ (σ = 1,46 m). Ou 78 % é uma cifra conservadora que embute erro extra (≈ 1,3 m de σ), ou há confusão entre CE90 e σ. Além disso, o modelo ignora o erro de georreferenciamento do próprio Sentinel-2 e o de delineação. O texto de D06/D16 e a UI repetem 78 %/37 %.
- **R-G. Documentação interna contraditória.** `docs/FICHA_TECNICA_SAREL.md` §7.1–7.2 numera as 9 regras e os 7 invariantes de modo diferente da especificação (`PROMPT_RECONSTRUCAO_SAREL_2026-09-10.md`, seções "Regra 1..9" e §17) e seu "Invariante 4" ("VANT sempre held-out, proibido misturar nas dobras de treino") contradiz D16 (VANT = treino e teste por polígono). O executor só lista essas frases (N05/F2); a escolha da redação vigente é sua.
- **R-E. Embrapa Documentos 246:** a ficha da Embrapa (infoteca) indica 38 páginas; `decisoes.ts` registra 40. Confira no PDF.

## O prompt (copie o bloco inteiro)

```
Você é o EXECUTOR do repositório SAREL v2 (PPGTCA 2026). Trabalhe SOMENTE no que está escrito.
Quando faltar informação, PARE e relate; nunca preencha lacuna com suposição. Este prompt é
longo de propósito: siga a ordem, cole a saída de cada comando e não pule portões.

════════════════════════════════════════════════════════════════════════════════════════
1. REGRAS INVIOLÁVEIS
════════════════════════════════════════════════════════════════════════════════════════
R1.  Faça apenas o que o bloco descreve. Achou outro problema: registre no relatório, não conserte.
R2.  Antes de editar um bloco: rode o comando "REPRODUZIR" e cole a saída. Se diferir do
     "esperado hoje", PARE nesse bloco e relate.
R3.  Reabra cada âncora (arquivo:linha) antes de editar; linhas se deslocam.
R4.  Você NÃO decide metodologia. As decisões estão na seção 3. Fora dela, PARE e pergunte.
R5.  Nunca escreva "corrigido", "passa" ou "limpo" sem a saída do comando, da MESMA sessão.
R6.  Proibido pular, desativar, quarentenar ou apagar teste para obter verde. Teste que
     contradiz uma decisão registrada (ex.: "drone é sempre held-out" × D16) pode ser
     REESCRITO só nos blocos que o autorizam (N02), com a lista antes/depois no relatório.
R7.  Proibido: tocar em `legado/pre_sarel/`; apagar/mover/renomear `docs/relatorios/modelagem/`;
     editar `docs/PROVENIENCIA_ASSISTENCIA_IA.md`; consumir cota PlanetScope; criar tarefa no
     Earth Engine; rodar qualquer coisa com credencial real; executar `Instalador_SAREL.exe`;
     fazer push, abrir PR, criar tag; editar o texto de `valor`/`justificativa`/`estado` de
     qualquer decisão existente em `src/config/decisoes.ts`; marcar algo como "decidida".
R8.  Dado de teste: só sintético, óbvio, com `SINTETICO_TESTE_ENCANAMENTO` no nome e no
     conteúdo, em diretório temporário FORA do repositório (ou fixture de teste nomeada).
     Nenhum número produzido com ele (AUC, rho, SHAP, contagens) é evidência científica; diga
     isso na mesma frase em que citá-lo.
R9.  Um commit LOCAL por bloco, mensagem iniciando pelo ID ("C03 (A24): ..."). Branch de
     trabalho: `sarel/executor-2026-10-06`, criada a partir do HEAD verificado. Antes de cada
     commit: `npm run typecheck` e os testes do bloco; antes do último: a suíte inteira.
R10. Estes SHA-256 devem permanecer idênticos ao fim de TODOS os blocos (confira com
     `sha256sum -c`; arquivo de conferência em /tmp, fora do repositório):
       bb557dada06e630d6ea2e4d3ceae9fb030682dcf857bf4a4073f76c415c718f5  docs/relatorios/modelagem/curva_roc_loco.png
       20a713c60bf2fe7ff1dee6dbd91542b1dd707cd1b2214ea32853ef4e9d01ae63  docs/relatorios/modelagem/matriz_confusao_loco.png
       755bbd4e173340f29d117eef5c55ac446af2bde89f47b5018ffd83bbf101caa3  docs/relatorios/modelagem/relatorio_modelagem_xgboost_loco.json
       cf85dcf0558865b305fb7492fab7d243712d8a6a635ef73ee957cdd427b2a12b  docs/relatorios/modelagem/shap_feature_importance.png
       37aae950f90117254a18cbb6ccf950c4bf55f035093cc4c10f5a2b3c6593ac1f  docs/relatorios/modelagem/shap_summary_beeswarm.png
R11. Os ANEXOS são código de referência testado. Copie-os BYTE A BYTE (confira SHA-256);
     se um teste de anexo falhar no seu ambiente, PARE e relate; NÃO edite o anexo.
R12. Limite de estrago: se um bloco exigir alterar mais de 6 testes existentes além dos
     listados no próprio bloco, ou mais de 15 arquivos de `src/`, PARE e relate.
R13. Honestidade de saída: relate o que NÃO rodou (GEE, Planet, dados locais ausentes) e por quê.
R14. Se um comando travar por mais de 10 minutos, interrompa, registre e siga para o próximo bloco
     independente.

════════════════════════════════════════════════════════════════════════════════════════
2. PRÉ-VOO (Fase 0) — nada é editado antes de todos os itens passarem
════════════════════════════════════════════════════════════════════════════════════════
P0.1 `git rev-parse HEAD` e `git log --oneline -3`. O HEAD deve ser 4834cf0 ou descendente
     cujo diff, fora de `docs/`, seja vazio: `git diff --name-only 4834cf0 HEAD | grep -v '^docs/'`
     -> vazio. Se não for, PARE.
P0.2 `git status --porcelain` -> vazio, exceto (opcionalmente) a pasta de anexos e este prompt.
P0.3 `git checkout -b sarel/executor-2026-10-06`.
P0.4 Ferramentas: `node -v` (>=18.17), `npm -v`, `python3 --version`. Instale dependências JS
     com `npm ci` (não `npm install`). Python (somente para os anexos e testes): numpy, pandas,
     scipy, scikit-learn, xgboost, shapely, pyproj (testado com numpy 2.4.6, pandas 3.0.6,
     scipy 1.17.1, scikit-learn 1.9.1, xgboost 3.2.0, shapely 2.1.2, pyproj 3.7.2). Se faltar uma,
     instale em venv FORA do repositório; relate versões.
P0.5 Baseline (cole as saídas; devem coincidir com o esperado):
       npm run typecheck -> exit 0
       npm run lint      -> exit 0, 2 warnings (MapViewer.tsx:476, PointPopup.tsx:64)
       npm run test      -> exit 1; "Test Files 3 failed | 54 passed (57)"; "Tests 6 failed | 429 passed (435)"
       npm run build     -> exit 1; 2 UnhandledSchemeError (node:child_process, node:crypto)
       curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ (com `npm run dev`) -> 500
     Se qualquer número diferir, PARE e relate o novo valor (o repositório mudou).
P0.6 SHA-256 do prompt de correção e dos anexos (devem coincidir):
       b9484ae62b3ab16fe9ba5b13eea4cd26e1bbd276bbc63d86f28f8cf3c6f96de7  docs/planejamento/PROMPT_CORRECAO_POS_AUDITORIA_2026-10-05.md
     Anexos: os SHA-256 estão em `docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/SHA256SUMS.txt`;
     rode `cd docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06 && sha256sum -c SHA256SUMS.txt`.
P0.7 Rode os testes dos anexos e cole a saída (devem dar "OK"; 35 testes no total):
       cd docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06
       python3 -m unittest test_avaliacao_d25_referencia test_fracao_erodida_celulas_referencia
     (a linha "error: the following arguments are required: --dados" no stderr é esperada: é o
     teste que prova que o CLI não tem dado padrão.) Apague `__pycache__` depois.
P0.8 Leia INTEGRALMENTE `docs/planejamento/PROMPT_CORRECAO_POS_AUDITORIA_2026-10-05.md`
     (blocos C01..C30, V1..V13, receita R-TS e baseline). Os blocos C01..C30 são NORMATIVOS neste
     prompt, com duas substituições: (i) a SEÇÃO 6 daquele arquivo (DEC-1..16) é substituída pela
     seção 3 deste; (ii) as ERRATA da seção 4 deste prompt prevalecem sobre qualquer texto dele.

════════════════════════════════════════════════════════════════════════════════════════
3. DECISÕES (substituem a seção 6 do prompt de correção)
════════════════════════════════════════════════════════════════════════════════════════
Coluna "Base": REGISTRADA = já consta como decidida em `src/config/decisoes.ts`; PROPOSTA =
padrão conservador do redator, vale como decisão do pesquisador somente se este arquivo for
entregue sem edição. O executor aplica a coluna "Padrão" e NÃO a reinterpreta.

 DEC-1  RUSLE como preditor   Padrão: K (`RUSLE_Fator_K`) e R (`RUSLE_Fator_R`) entram como preditores
        (blocos solo e chuva de D24); LS no bloco terreno; C, P, perda de solo e `RUSLE_A` NUNCA entram.
        A linha de base RUSLE (A=R·K·LS·C·P) é o competidor 1 e é calculada fora da matriz de
        predição. Base: REGISTRADA (D24 blocos; D25).
 DEC-2  O que D02 define      Padrão: critério de ESTRATO/CANDIDATO. Rótulo vem só de observação
        humana. Nenhuma tela chama o resultado de limiar de "classe" ou "rótulo". Base: PROPOSTA
        (Regra 4). Não edite D02.
 DEC-3  Alvo/binarização      Padrão: (c) D26 primário (`Fracao_Erodida`, [0,1]); binário derivado
        `>= 0,25` para VANT; D03 governa rótulos ordinais de campo (ausente→0; incipiente,
        moderada, severa→1; aliases legados "presente","erosao","erosão","1"→1; qualquer outro
        texto, inclusive "Sem erosão" e "indeterminado" → RECUSADO). UMA função única. Base: REGISTRADA.
 DEC-4  Papel do VANT         Padrão: (a) alinhar o código a D16 emendada: o rótulo de VANT alimenta
        treino OU held-out conforme `papelConjunto` do polígono sorteado (2 treino + 2 held-out por
        estrato, 72 polígonos de 5,02 ha); held-out sai em ARQUIVO SEPARADO. Base: REGISTRADA.
 DEC-5  Kappa < 0,60          Padrão: (a) bloquear a exportação do perfil `matriz-treino` se existir
        par com 2 observadores e κ < 0,60. Rótulo de observador único é aceito e marcado
        `Rotulo_N_Observadores = 1`. Base: PROPOSTA (Planejamento v3 §3: κ<0,60 = critério não operacional).
 DEC-6  Módulos sem chamador  Padrão: (b) a linha de base RUSLE é calculada no script de avaliação
        (anexo D25), não no app. No app, R/LS/chuva ficam `indisponivel` com causa honesta
        (C11, C15). NÃO ligue chuva/Planet/harmônicos. Base: PROPOSTA (sem GEE o executor não valida).
 DEC-7  Escolhas do código    Padrão por item: imputação por mediana no CLI legado → aposentada (ver
        DEC-14); AUC=0,5 em falha → NaN com motivo; `KFold(shuffle)` chamado de LOCO → o CLI legado
        passa a recusar modo probatório (DEC-14); clamp [0,1] mantido, com CONTAGEM de valores
        corrigidos exibida; tolerâncias 30 d, 45 d, 75°, 0,95 → registradas como P12..P15 com
        estado "proposta" (sem `valor`), sem mudar comportamento. Base: PROPOSTA.
 DEC-8  Fator C sem BSI       Padrão: D20 já diz: forma pura de D01 COM selo explícito de que não é a
        híbrida. Base: REGISTRADA (D20).
 DEC-9  `adquiridoEm`         Padrão: a data vem de uma constante nomeada com a obra/versão da fonte
        (ex.: Embrapa Documentos 246, 2024); aceite "AAAA" ou "AAAA-MM" quando só isso é conhecido;
        se desconhecida → proveniência `indisponivel` (causa "data-da-fonte-desconhecida"). Nunca a
        data de hoje, nunca "2024-01-01". Base: PROPOSTA.
 DEC-10 CAR/perímetros reais  Padrão: NÃO EXECUTAR. Relate "aguarda DEC-10". Base: —
 DEC-11 Tag `legado-pre-sarel` Padrão: (b) remover do README a instrução `git checkout legado-pre-sarel`
        e apontar para a pasta `legado/` e para o hash do commit onde ela foi criada (descubra com
        `git log --diff-filter=A --format=%h -1 -- legado`). NÃO crie tag. Base: PROPOSTA.
 DEC-12 `docs/relatorios/modelagem/` Padrão: (a) manter onde está. Base: PROPOSTA.
 DEC-13 PDF/PPTX vigentes    Padrão: NÃO mover, apagar ou deduplicar. Em C18, corrija o GERADOR e
        regere SOMENTE a cópia da raiz (`Relatorio_Mudancas_Metodologicas_SAREL_PPGTCA_2026.pdf`),
        se o ambiente tiver as dependências do gerador; senão relate. Base: PROPOSTA.
 DEC-14 Lógica de treino canônica Padrão: (c) a canônica passa a ser `scripts/d25/` (anexos). O CLI
        legado `scripts/treinar_xgboost_loco.py` recebe banner DEPRECATED e RECUSA o modo
        probatório (só dry-run sintético). O pacote ZIP passa a embutir o script novo (bloco N03).
        Base: REGISTRADA (D24/D25/D26 não são cumpridos pelo legado).
 DEC-15 Colunas consumidas    Padrão: (c) teto por bloco de D24 (≤8 espectro-temporal, ≤4 terreno,
        1 solo, 1 chuva), declarados pelo pesquisador em `config_pre_registro` (anexo PROPOSTA).
        O executor NÃO preenche nem congela o pré-registro. Base: REGISTRADA (D24).
 DEC-16 Máscara de nuvem/janela Padrão: (a) máscara de pixel por SCL do Sentinel-2 L2A mantendo as
        classes 4 (vegetação) e 5 (não vegetado), descartando 0,1,2,3,6,7,8,9,10,11 (as classes 4, 5, 8, 9 e 10 foram confirmadas por busca no catálogo do GEE; a conferência das demais contra o catálogo é do pesquisador); janela de D05
        (2016-01-01..2026-06-30, constante única). P09 permanece "proposta" em `decisoes.ts`.
        Sem GEE, valide só a expressão (teste de construção). Base: PROPOSTA (+ D05 REGISTRADA para a janela).

════════════════════════════════════════════════════════════════════════════════════════
4. ERRATA DO PROMPT DE CORREÇÃO (prevalecem sobre ele)
════════════════════════════════════════════════════════════════════════════════════════
E1. C22 (iii) e o Relatório Parte 2 citam `scripts/gerar_manual_pdf.py:282,948`. A linha 282 é
    `plt.tight_layout()`; a frase "35 suites / 231 testes vitest" está APENAS em `:948`.
E2. C20 e C27: a âncora `amostragemBiofisica.ts:62-90` deve ser `:62-89`; reabra o arquivo.
E3. C10: o `grep` de REPRODUZIR precisa de `-r` (`grep -rnE ... src/gee ...`) para varrer diretórios.
E4. C23: o padrão de `grep` do REPRODUZIR é ruidoso. Use, por arquivo e sem `-E` genérico:
    `grep -nE "(area_total|perc_det|mun_ibge|area|mod_fiscal) *= *(0\.0|100\.0|0)\b" <arquivo>`
    e confira linha a linha com as âncoras do bloco.
E5. C02 (aceite): `grep -rnE "\.(skip|todo|only)\(" src` não discrimina. Aceite correto:
    `git diff 4834cf0..HEAD -- 'src/**/*.test.ts' | grep -E '^\+.*\.(skip|todo|only)\('` -> vazio
    (nenhum skip/todo/only ADICIONADO). ATENÇÃO: hoje NÃO existe nenhum arquivo `*.vivo.test.ts`
    (`git ls-files | grep -c vivo.test.ts` -> 0); a convenção só existe em `vitest.config.mts:10`
    (exclude) e `package.json:17` (`test:vivo` = `vitest run --include 'src/**/*.vivo.test.ts'`).
    Como o `exclude` do config pode prevalecer sobre o `--include` da linha de comando, ao criar o
    primeiro `*.vivo.test.ts` PROVE que `npm run test:vivo` o coleta (a saída deve listar o arquivo
    e falhar com a mensagem "dado local ausente: <caminho>"). Se não coletar, crie
    `vitest.vivo.config.mts` (include só `*.vivo.test.ts`, sem exclude) e aponte `test:vivo` para
    ele; relate a mudança.
E6. C16 conflita com `src/lib/drone/planoVooNControl.test.ts:600-655`: o teste REESCREVE em
    `docs/verificacoes/voo_ncontrol/` os arquivos `SINTETICO_NAO_VOAR_*` (nomes fixos, `.plan`,
    CSV, PDF, relatório JSON) a cada execução, e lê os CSV existentes (`:520-535`) para manter os
    códigos opacos estáveis. Execute N01 ANTES de C16. Em C16 use a opção "marcador DENTRO do JSON"
    (campo de topo `"__SAREL_AVISO__": "SINTETICO_NAO_VOAR"` que o QGroundControl ignora) em vez
    de renomear a extensão; se o QGC rejeitar campo desconhecido NÃO é verificável aqui: relate.
E7. C18: não gere o PDF em dois lugares (DEC-13). C17: regerar as 5 figuras exige matplotlib; se
    ausente, relate sem regerar.
E8. C13: o `.md` é espelho; o teste de paridade compara id e estado de D01..D26 e P01..P09. Ao
    acrescentar P12..P15 (DEC-7) e P10/P11 (anexos), regere o `.md` antes do teste.
E9. C09: use o vocabulário canônico para o rótulo ORDINAL e a função única de N02 para o binário.

════════════════════════════════════════════════════════════════════════════════════════
5. FASES E ORDEM
════════════════════════════════════════════════════════════════════════════════════════
Cada fase termina com `npm run typecheck`, `npm run lint` e `npm run test` (cole as saídas) e
com `sha256sum -c` dos 5 hashes de R10.

FASE 1 — baseline confiável:  C01, N01, C02.
FASE 2 — bloqueiam a função:   C03, C04, C05.
FASE 3 — bloqueiam a dissertação: C06, C07, C08, C09 (parte (a) e função única de N02),
          C10 (+ DEC-16), C11, C12.
FASE 4 — contrato de dados D16/D26 (N02) e script D25 (N03).
FASE 5 — interpretação:        C13, C14, C15, C16 (com E6), C17, C18, C19, C20, C21, C22, C23, C24, C25, C26, C27.
FASE 6 — front-end (N04).
FASE 7 — cosmético e fechamento: C28, C29, C30, N05 (conferência final).
Blocos que a seção 3 manda NÃO EXECUTAR: registre "não executado: aguarda DEC-n".
Verificações V1..V13: rode só as que NÃO exigem dado local, credencial ou ação do pesquisador
(V8, V11 e a parte estática de V6); as demais ficam "não rodada" com o motivo.

────────────────────────────────────────────────────────────────────────────────────────
N01 (A55) — o teste de voo reescreve arquivos versionados
────────────────────────────────────────────────────────────────────────────────────────
ACHADO. `src/lib/drone/planoVooNControl.test.ts:600-655` grava, a cada `npm run test`, 7 arquivos
  em `docs/verificacoes/voo_ncontrol/` (dois `.plan`, três CSV, um PDF e o relatório
  `relatorio_aceitacao_y1_y6_2026-09-29.json`). Um teste que altera arquivo versionado torna a
  suíte não hermética e pode mascarar divergência.
REPRODUZIR. `npx vitest run src/lib/drone/planoVooNControl.test.ts; git status --porcelain
  docs/verificacoes/voo_ncontrol; git diff --stat docs/verificacoes/voo_ncontrol`. Cole a saída
  (pode ser vazia se o conteúdo for idêntico: relate isso; o defeito é o ato de escrever).
MUDANÇA. O teste passa a escrever em um diretório temporário (`fs.mkdtempSync(path.join(os.tmpdir(),
  "sarel-voo-"))`) e a COMPARAR com os arquivos versionados (hash), sem sobrescrevê-los. A
  regeneração dos arquivos versionados só ocorre com a variável de ambiente
  `SAREL_REGERAR_VOO=1` (documente no README, seção de testes). A leitura dos CSV existentes
  (`:520-535`) permanece (códigos opacos estáveis). Não mude o conteúdo gerado.
ACEITE. Após `npm run test`, `git status --porcelain docs/verificacoes` -> vazio. Teste novo:
  sem a variável, nenhum arquivo de `docs/verificacoes/voo_ncontrol/` tem mtime alterado.

────────────────────────────────────────────────────────────────────────────────────────
N02 — Contrato de dados D16/D26 no código (DEC-3c, DEC-4a, DEC-1, DEC-5)
────────────────────────────────────────────────────────────────────────────────────────
ACHADO (A27, A29, A37, A26). `src/lib/matriz/montagem.ts:196-197` envia todo rótulo de drone para
  `heldOutDrone`; a matriz de treino é por PONTO, não por célula; `Classe_Alvo_Binaria` é decidida
  por substring; há 4 binarizações divergentes (`montagem.ts:139-148`, `InspetorPonto.tsx:65`,
  `ingestaoColetor.ts:215-222`, trainer); não há arquivo de held-out nem coluna de polígono. D16 e
  D26 (decididas) mandam: rótulo de VANT contínuo por célula de 10 m, treino e held-out por polígono.
PASSO 1 (testes primeiro, devem FALHAR): crie `src/lib/rotulos/binarizacao.test.ts` e
  `src/lib/matriz/montagemD16.test.ts` afirmando o contrato abaixo. Cole a falha.
PASSO 2 (implementação):
  (a) `src/lib/rotulos/binarizacao.ts` — ÚNICA fonte de binarização, exporta:
      `LIMIAR_FRACAO_D26 = 0.25`; `binarizarFracao(f)` (f em [0,1] e finito; `>=` 0.25 → 1; f fora de
      faixa ou NaN → lança erro, NUNCA 0); `binarizarOrdinal(classe)` pelo vocabulário canônico de
      `CLASSES_ROTULO_VALIDAS` (`concordancia.ts:165`): ausente→0; incipiente|moderada|severa→1;
      aliases legados exatos ("presente","erosao","erosão","1")→1 e TAMBÉM aceitos "0"→0 apenas se
      já existirem hoje em `montagem.ts:139-148` (reabra e preserve o que existe); qualquer outro
      texto → lança `ErroRotuloInvalido`. Comparação EXATA após normalizar caixa/acentos/espaços.
      Os 4 pontos antigos passam a chamar estas funções.
  (b) Tipos: `LinhaMatrizTreino` ganha `celulaId`, `poligonoId`, `papelConjunto`
      ("treino"|"held-out"), `estratoId` (SOMENTE na matriz de avaliação, nunca como preditor),
      `fracaoErodida` (number|null), `alvoBinario25` (0|1|null), `rotuloNObservadores` (number|null).
      `estratoId` e `poligonoId` NÃO são preditores: o script D25 só consome as colunas declaradas
      em `blocos`. Atualize `CAMPOS_PROIBIDOS_MATRIZ_TREINO` (invariantes.ts) de modo que
      `Poligono_ID`, `Papel_Conjunto`, `Estrato_ID`, `Celula_ID` sejam permitidos como CHAVES,
      mantendo proibidos: coordenadas, fundiário, `phi*`, perda de solo, `RUSLE_A`, C, P.
  (c) `montarMatrizTreino`: rótulo de modalidade "drone" deixa de ir sempre a held-out: vai para
      `linhas` se `papelConjunto === "treino"` e para `heldOut` se `"held-out"`; `"indisponivel"`
      → EXCLUSÃO REGISTRADA em `exclusoes` com motivo (nunca silencioso). `assegurarSegregacaoTreino`
      passa a garantir que um MESMO `poligonoId` nunca esteja nos dois conjuntos (lança se estiver).
      Rótulos de campo (D03) entram só como âncora/confirmação: modalidade "campo" NUNCA vai ao
      treino do modelo de D26 (D16: campo = âncora de prevalência e confirmação prospectiva).
      Reabra `ingestaoDrone.ts` e `rotulos.test.ts`/`montagem*.test.ts` e liste cada teste que
      assertava "drone sempre held-out" com o novo texto.
  (d) `perfis.ts`: `matriz-treino` ganha `Celula_ID`, `Poligono_ID`, `Papel_Conjunto`,
      `Fracao_Erodida`, `Alvo_Binario_25`, `Rotulo_N_Observadores`, `RUSLE_Fator_LS`; NÃO ganha C, P,
      perda, A. Novo perfil `matriz-heldout` (mesmas colunas; só linhas held-out) exportado em
      arquivo SEPARADO (`ExportModal` e `planilha.ts`/`csv.ts` conforme o padrão dos outros
      perfis). O perfil `matriz-treino` NUNCA contém linha held-out (teste).
  (e) DEC-5: se existir par de rótulos com 2 observadores e κ < 0,60, a exportação de
      `matriz-treino` e `matriz-heldout` é RECUSADA com mensagem que lista os pares; observador
      único é aceito e marcado. A ausência de κ não bloqueia.
  (f) Linha de base: crie `perfil "linha-de-base-rusle"` com `Celula_ID`, R, K, LS, C, P, `RUSLE_A`
      = produto SOMENTE se os 5 fatores estiverem `medido|modelado|tabelado`; qualquer fator
      `indisponivel` → `RUSLE_A` vazio (nunca 0). Hoje R e LS saem indisponíveis (A38): o arquivo
      sai com `RUSLE_A` vazio e o relatório de exportação diz isso.
ACEITE. Os testes do PASSO 1 passam; `grep -rn "includes(\"erosao\")" src/lib/matriz` -> vazio;
  `git grep -nE ">= *0\.25|>= *0,25" -- src ':!*.test.ts'` -> só `binarizacao.ts` (e a UI do
  Inspetor chamando a função); suíte inteira verde exceto os 3 arquivos de dados locais (C02).

────────────────────────────────────────────────────────────────────────────────────────
N03 — Pipeline estatístico D24/D25/D26 (DEC-14c, DEC-15c)
────────────────────────────────────────────────────────────────────────────────────────
PASSO 1. Crie `scripts/d25/` e copie, byte a byte, de `docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/`:
  `avaliacao_d25_referencia.py`, `fracao_erodida_celulas_referencia.py`,
  `test_avaliacao_d25_referencia.py`, `test_fracao_erodida_celulas_referencia.py`,
  `config_pre_registro_PROPOSTA.json`. Confira os SHA-256 com `sha256sum -c`. Crie
  `scripts/d25/requirements.txt` (numpy, pandas, scipy, scikit-learn, xgboost, shapely, pyproj) e
  `scripts/d25/LEIA-ME.md` (3 parágrafos: o que é, que NÃO é evidência com dado sintético, como rodar).
PASSO 2. `cd scripts/d25 && python3 -m unittest discover -s . -p "test_*.py"` -> OK, 35 testes (cole).
PASSO 3. Prova de recusa (cole as saídas, exit != 0):
    python3 scripts/d25/avaliacao_d25_referencia.py --saida /tmp/x                    # sem --dados
    python3 scripts/d25/avaliacao_d25_referencia.py --dados a --config b --saida /tmp/x   # sem modo
PASSO 4 (pacote ZIP, A46). `pacoteReprodutibilidade.ts:679-823` embute um script de treino
  diferente (GroupKFold ≤3). Gere `src/lib/export/scriptAvaliacaoD25.generated.ts` por um script
  versionado `scripts/gerar_script_pacote.mjs` que lê `scripts/d25/avaliacao_d25_referencia.py` e
  exporta `SCRIPT_AVALIACAO_D25` (string) e `SCRIPT_AVALIACAO_D25_SHA256`. O ZIP passa a conter
  `05_avaliacao_d25.py` com esse texto e `requirements.txt`; o manifesto SHA-256 (`06_...`) continua
  sendo gerado pela mesma rotina. Teste: o conteúdo da constante é IGUAL ao arquivo (hash) e o
  ZIP gerado em teste lista `05_avaliacao_d25.py`.
PASSO 5 (legado, DEC-14c/DEC-7). Em `scripts/treinar_xgboost_loco.py`: banner DEPRECATED no
  docstring; recusa de modo probatório (`PROBATORIO_CIENTIFICO` → `sys.exit(2)` com mensagem
  apontando `scripts/d25/`); `auc = 0.5` em falha (`:691-692`) → `float("nan")` + motivo no log.
  Não remova o dry-run. Mantenha C04 e C12 como descritos.
PASSO 6 (guarda). Teste TS/Python que falha se alguém reintroduzir imputação por mediana FORA de
  `scripts/d25/` no caminho probatório (varredura de texto `fillna(` / `median(` em `scripts/*.py`
  fora de `scripts/d25` e do legado deprecado, com lista fechada de exceções).
LIMITES. NÃO rode o avaliador em modo `--probatorio`. NÃO preencha `pre_registro`. NÃO crie nem
  edite `config_pre_registro.json` (o pesquisador o congela). Resultado de `--dryrun-sintetico` é
  só teste de encanamento.
ACEITE. Passos 2 e 3 com saída colada; `git grep -n "KFold(" -- scripts ':!scripts/d25'` mostra
  só o legado deprecado; hashes R10 iguais.

────────────────────────────────────────────────────────────────────────────────────────
N04 — Front-end (medido em 06/10/2026 sobre cópia do app com patch só de build)
────────────────────────────────────────────────────────────────────────────────────────
INSTRUMENTO. `docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/verificar_ui.cjs`
  (Playwright). Depois de C01, rode `npm run dev` (porta 3000) e, com `NODE_PATH` apontando para o
  `node_modules` global do Playwright (ou `npm i -D playwright` FORA do repo, não versionado):
    node docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/verificar_ui.cjs http://127.0.0.1:3000 /tmp/ui_antes.json
  Esperado HOJE (medido na cópia): 21 falhas (lista abaixo). Se `npm run dev` não subir, PARE.
  Falhas medidas: cabeçalho com botões fora da tela em 1440/1280/1024/768/390 px ("Exportar" e
  "Configurações…" ficam fora da tela já em 1440 px); 4–5 alvos < 24×24 px em todas as larguras;
  5 modais sem `role="dialog"`; controles sem nome acessível (Amostragem GEE: 7; Campanha, Matriz,
  Exportar: 1 cada); texto "Calcular Métricas Matriciais" sem selo; "10 invariantes" no modal da Matriz.
U01 Cabeçalho (`src/app/page.tsx` e o componente de cabeçalho): nenhum controle interativo pode
    ficar fora da janela em 390..1440 px e a página não pode ter rolagem horizontal. Implementação
    livre dentro de: quebra de linha OU menu "Mais ações" acessível por teclado (botão com
    `aria-expanded`, `aria-controls`). Em ≤768 px mostre rótulos curtos ou só ícones COM `aria-label`.
U02 Modais (12 arquivos: `presentation/ModalExplicativaMetodologica`, `presentation/ApresentacaoSpotlight`,
    `polygon/DrawingToolbar`, `config/SettingsModal`, `matriz/PainelMatrizModal`,
    `campanha/PainelCampanhaModal`, `export/ExportModal`, `audit/AuditDossierModal`,
    `diagnostics/SystemLogsModal`, `decisoes/DecisoesModal`, `region/CandidateSelectionModal`,
    `region/RegionRequestModal`): contêiner com `role="dialog"`, `aria-modal="true"`,
    `aria-labelledby` apontando para o título; `Escape` fecha; o foco entra no modal ao abrir e
    volta ao botão de origem ao fechar; Tab não escapa do modal. Crie UM hook compartilhado
    (`src/hooks/useModalA11y.ts`) e use-o nos 12; não duplique lógica. (`DrawingToolbar` e
    `ApresentacaoSpotlight` podem não ser modais: abra, confirme, e só marque se forem.)
U03 Rótulos: todo `input/select/textarea` ganha `<label htmlFor>`/`id` ou `aria-label`; botões só
    com ícone ganham `aria-label`. Alvo mínimo 24×24 px (WCAG 2.2, critério 2.5.8).
U04 Textos que contradizem decisões REGISTRADAS (troque por valor derivado de constante ou remova o
    número; não invente): 
      `region/CandidateSelectionModal.tsx:335-341` ("Fase D — VANT/Drone (Held-Out) 4 Sítios (~198,5 ha)
        ... GSD 7,5 cm") → D16: 72 polígonos de 5,02 ha, ~361 ha, 36 treino + 36 held-out, GSD ~4 cm;
      `campanha/PainelCampanha.tsx:373,456` ("GSD ~3,8 cm") e `map/MapViewer.tsx:244,514,709`,
        `map/MapControls.tsx:154` ("Sítios Padrão-Ouro ... 10 a 50 ha") → são as MISSÕES DE AFERIÇÃO
        (D06: GSD medido 3,59 e 3,96 cm); rotule-as como "missões de aferição instrumental", não
        como "padrão-ouro", e use "GSD 3,59–3,96 cm (medido)";
      `decisoes/CalculadoraDesenhoAmostral.tsx:252` ("1.845 (922 held-out)" fixo) → ler do cálculo
        (`saidas.*`), nunca literal; relate a divergência 922/936/920 (ressalva R-A).
    A UI de partição 80/20 (40 pts Fase A / 10 pts Fase B) do `CandidateSelectionModal`: se não
    houver constante de D16 que a sustente (D16 fala em 60–80 pontos de campo e fotointerpretação
    aposentada), marque o bloco como "PARÂMETRO DE TRIAGEM, não é D16" e relate a divergência.
U05 `InspetorPonto.tsx:34`: `fracaoErodidaInput` inicia em 0,0 e permite gravar rótulo "ausente"
    sem ação do perito. Inicie `null`, exija interação explícita e desabilite "Gravar" até haver valor
    e data da observação (C25). Teste de componente/texto.
U06 Legenda do mapa: "Erosão (Classe 1)" / "Controle / SPD (Classe 0)" com limiares → "Candidato
    espectral (BSI/NDVI) — não é rótulo" (C20), inclusive `MapViewer.tsx:351,637` e a legenda.
U07 `PainelCampanha.tsx:267-300,543-581` (C19) — selo DEMONSTRAÇÃO nos cartões e no botão.
U08 `PainelMatrizModal.tsx:25` (C22/C03) — número de invariantes lido do código.
U09 Modo Defesa/Tour: confirme que `Escape` e o botão fecham o Tour e que o foco volta; se o banner
    persistir após fechar, corrija (reproduza antes: a sonda mostrou o banner "MODO DEFESA /
    APRESENTAÇÃO ATIVO" presente em capturas seguintes; confirme com 1 teste antes de editar).
U10 Estados vazios e erros: nenhum painel mostra número ou métrica sem origem; "—" ou texto de
    ausência com causa. Procure `?? 0`, `|| 0`, `.toFixed(` aplicado a valor possivelmente nulo
    em `src/components` (`grep -rnE "\?\? 0|\|\| 0" src/components`) e relate cada ocorrência
    (corrija só as da lista de C06/C07).
ACEITE N04. `node .../verificar_ui.cjs http://127.0.0.1:3000 /tmp/ui_depois.json` -> "UI OK" e exit 0
  (cole o texto e o JSON de medidas). Capturas de tela em 1440 e 390 px de cada modal, salvas em
  `/tmp/ui_shots/` (fora do repo), e descreva em 1 frase o que vê em cada uma. O mapa base pode
  estar em branco sem internet: isso não é falha. Se uma largura não puder passar, PARE e explique.

────────────────────────────────────────────────────────────────────────────────────────
N05 — Conferência final (somente leitura)
────────────────────────────────────────────────────────────────────────────────────────
F1. `docs/planejamento/ANEXOS_PROMPT_EXECUTOR_2026-10-06/` não foi alterada (`sha256sum -c`).
F2. Há no repositório uma apresentação e um manual de procedimentos entregues pelo pesquisador
    (`docs/Apresentacao_Pesquisa_SAREL_2026-10-06.pptx`, `docs/Manual_Procedimentos_SAREL_2026-10-06.pdf`),
    se existirem. NÃO os edite. Extraia deles (pdftotext / python-pptx) cada AFIRMAÇÃO NUMÉRICA
    sobre o código (nº de invariantes, contagem de testes, colunas exportadas, nome de arquivo) e
    liste as que deixaram de ser verdadeiras depois dos seus commits. Só liste.
F3. Liste (sem editar) as frases de `README.md` e `docs/FICHA_TECNICA_SAREL.md` (§7.1–7.2) que contradizem D16/D26 (ex.: "Invariante 4: VANT sempre held-out") ou a lista real de invariantes após C03.
F4. `git diff --stat 4834cf0..HEAD` e `git status --porcelain`.

════════════════════════════════════════════════════════════════════════════════════════
6. CONDIÇÕES DE PARADA (pare e relate, sem improvisar)
════════════════════════════════════════════════════════════════════════════════════════
 S1  Baseline diferente do esperado (P0.5).      S2  Âncora não encontrada ou texto diferente.
 S3  Teste de anexo falha no seu ambiente.       S4  Mais de 6 testes extras a reescrever (R12).
 S5  Bloco exige credencial, rede ou dado local.  S6  Dúvida sobre origem de um valor (data, área,
     fonte): não invente, declare `indisponivel` ou pare.   S7  Decisão fora da seção 3.
 S8  Qualquer hash de R10 mudou.                  S9  Mudança tocaria `decisoes.ts` além de acrescentar P10..P15 "proposta".

════════════════════════════════════════════════════════════════════════════════════════
7. RELATÓRIO FINAL (obrigatório)
════════════════════════════════════════════════════════════════════════════════════════
Entregue em `docs/auditorias/RELATORIO_EXECUCAO_2026-10-06.md` (arquivo novo, não commite se o
pesquisador não autorizou). Conteúdo:
 (1) tabela bloco → executado | parcial | não executado (motivo) | commit local | saídas coladas
     de REPRODUZIR (antes) e ACEITE (depois), da mesma sessão;
 (2) o que NÃO foi feito: blocos sem decisão (DEC-10), V não rodadas, partes que exigem GEE,
     Planet ou dado local (`npm run test:vivo`);
 (3) o que FALHOU: comando, exit code, 30 primeiras linhas;
 (4) o que NÃO VERIFICOU e por quê;
 (5) placar final de typecheck, lint, test, build e de `verificar_ui.cjs`, contra o baseline de P0.5,
     e a confirmação dos 5 hashes de R10 e dos anexos;
 (6) lista dos testes REESCRITOS (R6) com o texto antes/depois;
 (7) as ressalvas R-A..R-G do pesquisador confirmadas ou refutadas pelo que você viu no código;
 (8) `git status --porcelain` e `git log --oneline 4834cf0..HEAD`.
NÃO declare o repositório "pronto". NÃO afirme resultado científico: nenhum dado real foi usado.
NÃO faça push.
```

## Notas de quem redigiu (não fazem parte do prompt)

- O prompt **não** manda o executor rodar o avaliador D25 em modo probatório, preencher o pré-registro, ligar R/LS/chuva ao app, mexer em `decisoes.ts` (além de acrescentar parâmetros `proposta`), apagar arquivos ou fazer push.
- O que o executor **não consegue** validar sem você: GEE (máscara SCL, janela D05), `test:vivo` (dados locais), V4/V5/V7/V9/V10/V12/V13, mover/renomear PDFs (DEC-13), CAR/perímetros reais (DEC-10).
- Custo/risco: N02 é o bloco mais invasivo (contrato de dados). O limite R12 existe para o executor parar em vez de espalhar mudanças.
